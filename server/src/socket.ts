import { Server } from "socket.io";
import { Socket } from "socket.io";

export function setUpSocket(io: Server) {
  io.on("connection", (socket: Socket) => {
    console.log("Socket connected", socket.id);

    socket.on("message", (data: string) => {
      console.log("Message received");
      socket.broadcast.emit("message", data);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected", socket.id);
    });
  });
}
