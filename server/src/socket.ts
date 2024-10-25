import { Server, Socket } from "socket.io";
import { kafkaProduceMessage } from "./helper.js";
import AuthController from "./controllers/AuthControllers.js";
import PrismaUtils from "./utils/PrismaUtils.js";
import prisma from "./config/db.config.js";

// Types
interface CustomSocket extends Socket {
  room?: string;
  passCode?: string;
  userID?: string;
}

// Logic
export function setupSocket(io: Server) {
  let onlineUsersID = new Map(); // Store online users
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

      if (!room || !passCode) {
        return next(new Error("Room and passCode are required"));
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
    socket.join(socket.room);
    console.log("########################");
    console.log("Connected: ", socket.id);
    console.log("#########################");

    socket.on("message", async (message) => {
      try {
        await kafkaProduceMessage(process.env.KAFKA_TOPIC, message).catch(
          (error) => {
            console.error("Error in producing message: ", error);
          }
        );

        // Emit the message to the room
        socket.to(socket.room).emit("message", message);
      } catch (error) {
        console.error("Error in message handler: ", error);
        socket.emit("error", "An error occurred while sending the message");
      }
    });

    socket.on("userJoined", async (user) => {
      try {
        // socket.to(socket.room).emit("userJoined", user);
        // io.in(socket.room).emit("userJoined", user);
        onlineUsersID.set(socket.id, socket.userID);
        io.in(socket.room).emit("userJoined", {
          onlineUsersID: [...onlineUsersID.values()],
          newUser: user,
        });
      } catch (error) {
        console.error("Error in userJoined handler: ", error);
        socket.emit("error", "An error occurred while joining the room");
      }
    });

    socket.on("disconnect", () => {
      console.log("########################");
      console.log("Disconnected: ", socket.id);
      console.log("#########################");

      onlineUsersID.delete(socket.id);
      io.in(socket.room).emit("userLeft", {
        onlineUsersID: [...onlineUsersID.values()],
        userId: socket.userID,
      });
    });

    // Global socket error handling
    socket.on("error", (error) => {
      console.error("Socket error: ", error.message);
      socket.emit("error", "An unexpected error occurred");
    });
  });
}
