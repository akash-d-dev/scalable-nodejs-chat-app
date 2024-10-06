import React, { useEffect, useMemo, useRef, useState } from "react";
import { getSocket } from "@/lib/socket.confg";
export default function Chats({
  group,
  oldMessages,
  chatUser,
}: {
  group: ChatGroupType;
  oldMessages: Array<ChatMessageType> | [];
  chatUser?: GroupChatUserType;
}) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Array<ChatMessageType>>(oldMessages);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Prevent unnecessary calls
  let socket = useMemo(() => {
    const socket = getSocket();
    socket.auth = {
      room: group.id,
    };
    return socket.connect();
  }, []);

  // Disconnect the socket when the component is unmounted
  useEffect(() => {
    socket.on("message", (data: ChatMessageType) => {
      console.log("The message is", data);
      setMessages((prevMessages) => [...prevMessages, data]);
      scrollToBottom();
    });

    return () => {
      socket.close();
    };
  }, []);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!message.length) return;

    const payload: ChatMessageType = {
      // id: uuidv4(),
      message: message,
      name: chatUser?.name ?? "Unknown",
      created_at: new Date().toISOString(),
      group_id: group.id,
    };

    console.log("The payload is", payload);
    socket.emit("message", payload);
    setMessage("");
    setMessages([...messages, payload]);
  };

  return (
    <div className='flex flex-col h-[94vh]  p-4'>
      <div className='flex-1 overflow-y-auto flex flex-col-reverse'>
        <div ref={messagesEndRef} />
        <div className='flex flex-col gap-2'>
          {messages.map((message, i) => (
            <div
              key={i}
              className={`max-w-sm rounded-lg p-2 ${
                message.name === chatUser?.name
                  ? "bg-gradient-to-r from-blue-400 to-blue-600  text-white self-end"
                  : "bg-gradient-to-r from-gray-200 to-gray-300 text-black self-start"
              }`}
            >
              {message.message}
            </div>
          ))}
        </div>
      </div>
      <form onSubmit={handleSubmit} className='mt-2 flex items-center'>
        <input
          type='text'
          placeholder='Type a message...'
          value={message}
          className='flex-1 p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500'
          onChange={(e) => setMessage(e.target.value)}
        />
      </form>
    </div>
  );
}
