import React, { useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { SendHorizontal } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/utils";
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  const [image, setImage] = useState<File | null>(null); // State for image

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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];

      if (
        selectedFile.name.split(".").pop() !== "jpg" &&
        selectedFile.name.split(".").pop() !== "jpeg" &&
        selectedFile.name.split(".").pop() !== "png"
      ) {
        toast.error("Invalid image type. Only JPEG, PNG and JPG are allowed.");
        e.target.value = "";
        return;
      }

      const allowedSize = 3 * 1024 * 1024; // 3MB
      if (selectedFile.size > allowedSize) {
        toast.error("Image exceeds the allowed size of 3MB.");
        e.target.value = "";
        return;
      }

      setImage(selectedFile);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!message.length && !image) return;

    const payload: ChatMessageType = {
      message: message || "",
      name: chatUser?.name ?? "Unknown",
      created_at: new Date().toISOString(),
      group_id: group.id,
      user_id: chatUser?.id ?? "",
      has_image: !!image,
    };

    if (image) {
      // Create a unique filename based on user and timestamp
      const fileName = `${group.id}/${chatUser?.id}/${Date.now()}_${
        image.name
      }`;

      // Upload image to Supabase
      const { data, error } = await supabase.storage
        .from("chat-images")
        .upload(fileName, image);

      if (error) {
        throw new Error(`Failed to upload image: ${error.message}`);
      }

      // Get public URL of the uploaded image
      const imageUrl = supabase.storage
        .from("chat-images")
        .getPublicUrl(data.path).data.publicUrl;

      // Update payload with image URL
      payload.image_url = imageUrl;
      payload.has_image = true;
    }

    console.log("Payload: ", payload);

    // Emit the message to the server (now includes the image URL)
    socket.emit("message", payload);

    setMessage("");
    setImage(null);
    setMessages([...messages, payload]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  console.log(oldMessages);

  return (
    <div className='flex flex-col h-[94vh]  p-4'>
      <div className='flex-1 overflow-y-auto flex flex-col-reverse'>
        <div ref={messagesEndRef} />
        <div className='flex flex-col gap-2'>
          {messages.map(
            (message, i) =>
              (message.message !== "" || message.has_image) && (
                <div
                  key={i}
                  className={`max-w-sm rounded-lg p-2 ${
                    message.user_id === chatUser?.id
                      ? "bg-gradient-to-r from-blue-400 to-blue-600 text-white self-end"
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
                  {message.has_image ? (
                    <>
                      <div>{message?.message}</div>{" "}
                      <img
                        src={message.image_url}
                        alt='shared'
                        className='max-w-full h-auto rounded-lg mt-2'
                      />
                    </>
                  ) : (
                    <div>{message.message}</div>
                  )}
                </div>
              )
          )}
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
        <div className='grid w-full max-w-sm items-center gap-1.5'>
          <Input
            id='picture'
            type='file'
            onChange={handleImageSelect}
            ref={fileInputRef}
          />
        </div>
        <Button variant='link' size='icon'>
          <SendHorizontal className='h-4 w-4' />
        </Button>
      </form>
    </div>
  );
}
