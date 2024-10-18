import { Server, Socket } from "socket.io";
import { kafkaProduceMessage } from "./helper.js";
import prisma from "./config/db.config.js";

// Types
interface CustomSocket extends Socket {
  room?: string;
}

// Logic
export function setupSocket(io: Server) {
  ////////////////////////////////////////////////////
  // Middleware to validate the room
  ////////////////////////////////////////////////////
  io.use((socket: CustomSocket, next) => {
    const room = socket.handshake.auth.room || socket.handshake.headers.room;
    if (!room) {
      return next(new Error("Invalid Room"));
    }
    socket.room = room;
    next();
  });

  ////////////////////////////////////////////////////
  // Connection event
  ////////////////////////////////////////////////////
  io.on("connection", (socket: CustomSocket) => {
    // Join the room
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
