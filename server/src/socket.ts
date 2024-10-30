import { Server, Socket } from "socket.io";
import { kafkaProduceMessage } from "./helper.js";
import AuthController from "./controllers/AuthControllers.js";
import PrismaUtils from "./utils/PrismaUtils.js";
import { prisma, supabase } from "./config/db.config.js";
import fs from "fs";
import path from "path";

// Types
interface CustomSocket extends Socket {
  room?: string;
  passCode?: string;
  userID?: string;
}

// Logic
export function setupSocket(io: Server) {
  // let onlineUsersID = new Map(); // Store online users
  let onlineUsersIdByRoom = new Map<string, Set<string>>();
  let typingUsersByRoom = new Map<string, Set<string>>();
  ////////////////////////////////////////////////////
  // Middleware to validate the room
  ////////////////////////////////////////////////////
  io.use(async (socket: CustomSocket, next) => {
    try {
      const room = socket.handshake.auth.room || socket.handshake.headers.room;
      const passCode =
        socket.handshake.auth.passCode || socket.handshake.headers.passCode;

      const userID =
        socket.handshake.auth.userID || socket.handshake.headers.userID;

      if (!room || !passCode || !userID) {
        return next(new Error("Room, passCode, and userID are required"));
      }

      const roomLogin = await AuthController.chatRoomLogin(room, passCode);

      if (!roomLogin) {
        return next(new Error("Invalid room or passCode"));
      }
      PrismaUtils.findOne(prisma.groupUsers, { id: userID }).then((user) => {
        if (!user) {
          return next(new Error("Invalid user"));
        }
      });

      socket.passCode = passCode;
      socket.room = room;
      socket.userID = userID;
      next();
    } catch (error) {
      next(new Error("Authentication error"));
    }
  });

  ////////////////////////////////////////////////////
  // Connection event
  ////////////////////////////////////////////////////
  io.on("connection", (socket: CustomSocket) => {
    // Join the room using the room id from the auth
    const room = socket.room as string;
    socket.join(room);

    console.log("########################");
    console.log("Connected: ", socket.id);
    console.log("#########################");

    // Add the user to the online users map for the room
    if (!onlineUsersIdByRoom.has(room)) {
      onlineUsersIdByRoom.set(room, new Set());
    }
    onlineUsersIdByRoom.get(room)?.add(socket.userID as string);

    ////////////////////////////////////////////////////
    // Message event
    ////////////////////////////////////////////////////
    socket.on("message", async (message) => {
      try {
        if (message.image_url) {
          // Extract the base64 image
          const base64Image = message.image_url.split(",")[1];
          const imageBuffer = Buffer.from(base64Image, "base64");

          // Get the content type from the base64 data
          const mimeType = message.image_url.split(";")[0].split(":")[1];
          console.log("MIME Type: ", mimeType);
          const allowedImageTypes = ["image/jpeg", "image/png", "image/jpg"];
          if (!allowedImageTypes.includes(mimeType)) {
            throw new Error(
              "Invalid image type. Only JPEG, PNG and JPG are allowed."
            );
          }

          // Validate the image size
          const allowedSize = 3 * 1024 * 1024; // 3MB
          console.log("Image size: ", imageBuffer.length);
          if (imageBuffer.length > allowedSize) {
            throw new Error("Image exceeds the allowed size.");
          }

          const fileName = `public/${Date.now()}_${message.name}`;

          // Upload image to Supabase bucket
          const { data, error } = await supabase.storage
            .from("chat-images")
            .upload(fileName, imageBuffer);

          if (error) {
            throw new Error("Error uploading image to Supabase");
          }

          // If upload is successful, replace image in message with the URL
          const imageUrl = supabase.storage
            .from("chat-images")
            .getPublicUrl(data.path).data.publicUrl;
          message.image_url = imageUrl; // Replace the image field with URL
          message.has_image = true;
        }

        await kafkaProduceMessage(process.env.KAFKA_TOPIC, message).catch(
          (error) => {
            console.error("Error in producing message: ", error);
          }
        );

        // Emit the message to the room
        socket.in(room).emit("message", message);
      } catch (error) {
        console.error("Error in message handler: ", error);
        socket.emit("error", "An error occurred while sending the message");
      }
    });

    ////////////////////////////////////////////////////
    // User Join event
    ////////////////////////////////////////////////////
    socket.on("userJoined", async (user) => {
      if (!onlineUsersIdByRoom.has(socket.room)) {
        onlineUsersIdByRoom.set(socket.room, new Set());
      }

      const roomOnlineUsers = onlineUsersIdByRoom.get(socket.room);
      roomOnlineUsers.add(user.id);

      io.in(socket.room).emit("userJoined", {
        onlineUsersID: [...roomOnlineUsers],
        newUser: user,
      });
    });

    ////////////////////////////////////////////////////
    // Typing event
    ////////////////////////////////////////////////////
    socket.on("typing", (isTyping: boolean) => {
      if (!typingUsersByRoom.has(room)) {
        typingUsersByRoom.set(room, new Set());
      }

      const roomTypingUsers = typingUsersByRoom.get(room);

      if (isTyping) {
        roomTypingUsers?.add(socket.userID as string);
      } else {
        roomTypingUsers?.delete(socket.userID as string);
      }

      io.in(room).emit("typing", {
        userID: socket.userID,
        isTyping,
        typingUsers: [...(roomTypingUsers || [])],
      });
    });

    ////////////////////////////////////////////////////
    // Disconnect event
    ////////////////////////////////////////////////////
    socket.on("disconnect", () => {
      // Remove the user from the online users map
      const roomOnlineUsers = onlineUsersIdByRoom.get(room);
      if (roomOnlineUsers) {
        roomOnlineUsers.delete(socket.userID as string);
        if (roomOnlineUsers.size === 0) {
          onlineUsersIdByRoom.delete(room);
        }
      }
      io.in(room).emit("userLeft", {
        onlineUsersID: roomOnlineUsers ? [...roomOnlineUsers] : [],
        userId: socket.userID,
      });

      // Remove the user from the typing users map
      const roomTypingUsers = typingUsersByRoom.get(room);
      if (roomTypingUsers) {
        roomTypingUsers.delete(socket.userID as string);
        if (roomTypingUsers.size === 0) {
          typingUsersByRoom.delete(room);
        }
      }
      io.in(room).emit("typing", {
        userID: socket.userID,
        isTyping: false,
        typingUsers: [...(roomTypingUsers || [])],
      });
    });

    // Global socket error handling
    socket.on("error", (error) => {
      console.error("Socket error: ", error.message);
      socket.emit("error", "An unexpected error occurred");
    });
  });
}
