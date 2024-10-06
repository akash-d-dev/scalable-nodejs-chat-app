import { Server, Socket } from "socket.io";
import { kafkaProduceMessage } from "./helper.js";

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
      // Save the message to the database
      await kafkaProduceMessage(process.env.KAFKA_TOPIC, message).catch(
        (error) => {
          console.error("Error in producing message: ", error);
        }
      );

      // socket.on("message", async (message) => {
      // await prisma.chats.create({
      //   data: message,
      // });
      // });

      // Emit the message to the room
      socket.to(socket.room).emit("message", message);
    });
  });
}
