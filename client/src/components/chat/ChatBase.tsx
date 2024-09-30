"use client";
import { getSocket } from "@/lib/socket.confg";
import React, { useEffect, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import { Button } from "../ui/button";

export default function ChatBase({ groupId }: { groupId: string }) {
  // Prevent unnecessary calls
  let socket = useMemo(() => {
    const socket = getSocket();
    socket.auth = {
      room: groupId,
    };
    return socket.connect();
  }, []);

  // Disconnect the socket when the component is unmounted
  useEffect(() => {
    socket.on("message", (data: any) => {
      console.log("Socket message: ", data);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Send a message
  const handleClick = () => {
    socket.emit("message", { name: "John", message: "Hello", id: uuidv4() });

    // console.log("Message sent");
  };

  return (
    <div>
      <Button onClick={handleClick}>Send Message</Button>
    </div>
  );
}
