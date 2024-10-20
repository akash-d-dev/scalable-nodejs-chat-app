import { Server, Socket } from "socket.io";
import { kafkaProduceMessage } from "./helper.js";
import AuthController from "./controllers/AuthControllers.js";

// Types
interface CustomSocket extends Socket {
  room?: string;
  passCode?: string;
}

// Logic
export function setupSocket(io: Server) {
  ////////////////////////////////////////////////////
  // Middleware to validate the room
  ////////////////////////////////////////////////////
  io.use(async (socket: CustomSocket, next) => {
    const room = socket.handshake.auth.room || socket.handshake.headers.room;
    const passCode =
      socket.handshake.auth.passCode || socket.handshake.headers.passCode;

    if (!room || !passCode) {
      return next(new Error("Room and passCode are required"));
    }

    const roomLogin = await AuthController.chatRoomLogin(room, passCode);

    if (!roomLogin) {
      return next(new Error("Invalid room or passCode"));
    }

    socket.room = room;
    next();
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
      console.log("Message: ", message);
      // Save the message to the database
      await kafkaProduceMessage(process.env.KAFKA_TOPIC, message).catch(
        (error) => {
          console.error("Error in producing message: ", error);
        }
      );

      // Emit the message to the room
      socket.to(socket.room).emit("message", message);
    });
  });
}
