import React, { use, useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
export default function Chats({
  group,
  oldMessages,
  chatUser,
  socket,
  isTyping,
  setIsTyping,
}: {
  group: ChatGroupType;
  oldMessages: Array<ChatMessageType>;
  chatUser?: GroupChatUserType | null;
  socket: Socket;
  isTyping: boolean;
  setIsTyping: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Array<ChatMessageType>>(oldMessages);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Listen for messages
  useEffect(() => {
    //Socket event listener
    socket.on("message", (data: ChatMessageType) => {
      setMessages((prevMessages) => [...prevMessages, data]);
      scrollToBottom();
    });

    // Disconnect the socket when the component is unmounted
    return () => {
      socket.off("message");
      // socket.close();
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (message.length > 0 && !isTyping) {
      setIsTyping(true);
    } else if (message.length === 0 && isTyping) {
      setIsTyping(false);
    }
  }, [message]);

  useEffect(() => {
    socket.emit("typing", isTyping);
  }, [isTyping]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!message.length) return;

    const payload: ChatMessageType = {
      message: message,
      name: chatUser?.name ?? "Unknown",
      created_at: new Date().toISOString(),
      group_id: group.id,
      user_id: chatUser?.id ?? "",
    };

    // Emit the message to the room
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
                message.user_id === chatUser?.id
                  ? "bg-gradient-to-r from-blue-400 to-blue-600  text-white self-end"
                  : "bg-gradient-to-r from-gray-200 to-gray-300 text-black self-start"
              }`}
            >
              <div className='text-xs text-white-400'>
                {message.name} -{" "}
                {new Date(message.created_at).toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "numeric",
                })}
              </div>
              <div>{message.message}</div>
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
