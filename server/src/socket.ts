import { Server, Socket } from "socket.io";

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

    socket.on("message", (message) => {
      // Emit message to all clients in the room
      io.to(socket.room).emit("message", message);
    });
  });
}
