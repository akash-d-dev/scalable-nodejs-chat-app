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
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Array<ChatMessageType>>(oldMessages);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  const [file, setFile] = useState<File | null>(null); // State for file

  // Listen for messages
  useEffect(() => {
    socket.on("message", (data: ChatMessageType) => {
      setMessages((prevMessages) => [...prevMessages, data]);
      scrollToBottom();
    });

    return () => {
      socket.off("message");
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];

      const allowedFileTypes = ["jpg", "jpeg", "png", "mp4", "mkv"];
      const fileExtension = selectedFile.name.split(".").pop()?.toLowerCase();

      if (!allowedFileTypes.includes(fileExtension || "")) {
        toast.error(
          "Invalid file type. Only JPEG, PNG, MKV and MP4 are allowed."
        );
        e.target.value = "";
        return;
      }

      const allowedSize = 10 * 1024 * 1024; // 10MB limit
      if (selectedFile.size > allowedSize) {
        toast.error("File exceeds the allowed size of 10MB.");
        e.target.value = "";
        return;
      }

      setFile(selectedFile);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if ((!message.length && !file) || loading) return;

    setLoading(true);

    const payload: ChatMessageType = {
      message: message || "",
      name: chatUser?.name ?? "Unknown",
      created_at: new Date().toISOString(),
      group_id: group.id,
      user_id: chatUser?.id ?? "",
      has_file: !!file,
    };

    if (file) {
      const fileName = `${group.id}/${chatUser?.id}/${Date.now()}_${file.name}`;

      // Upload file to Supabase
      const { data, error } = await supabase.storage
        .from("chat-images")
        .upload(fileName, file);

      if (error) {
        setLoading(false);
        throw new Error(`Failed to upload file: ${error.message}`);
      }

      // Get public URL of the uploaded file
      const fileUrl = supabase.storage
        .from("chat-images")
        .getPublicUrl(data.path).data.publicUrl;

      payload.file_url = fileUrl;
      payload.has_file = true;
    }

    socket.emit("message", payload);

    setMessage("");
    setFile(null);
    setMessages([...messages, payload]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setLoading(false);
  };

  // Helper function to determine if the file is an image or video
  const isImage = (fileUrl: string) => {
    return /\.(jpg|jpeg|png)$/i.test(fileUrl);
  };

  const isVideo = (fileUrl: string) => {
    return /\.(mp4|mkv)$/i.test(fileUrl);
  };

  return (
    <div className='flex flex-col h-[94vh] p-4'>
      <div className='flex-1 overflow-y-auto flex flex-col-reverse'>
        <div ref={messagesEndRef} />
        <div className='flex flex-col gap-2'>
          {messages.map(
            (message, i) =>
              (message.message !== "" || message.has_file) && (
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
                  {message.has_file ? (
                    <>
                      <div>{message.message}</div>
                      {message.file_url && isImage(message.file_url) ? (
                        <img
                          src={message.file_url}
                          alt='shared content'
                          className='max-w-full h-auto rounded-lg mt-2'
                        />
                      ) : message.file_url && isVideo(message.file_url) ? (
                        <video
                          controls
                          className='max-w-full h-auto rounded-lg mt-2'
                        >
                          <source src={message.file_url} type='video/mp4' />
                          Your browser does not support the video tag.
                        </video>
                      ) : null}
                    </>
                  ) : (
                    <div>{message.message}</div>
                  )}
                </div>
              )
          )}
        </div>
      </div>
      <form
        onSubmit={handleSubmit}
        className='mt-2 flex items-center gap-1 border rounded-lg border-[rgb(226 232 240)] p-1'
      >
        <input
          type='text'
          placeholder='Type a message...'
          value={message}
          className='flex-1 p-2 rounded-lg outline-none focus:ring-0'
          onChange={(e) => setMessage(e.target.value)}
        />
        <div className='grid w-30 max-w-sm items-center gap-1.5'>
          <Input
            id='file'
            type='file'
            onChange={handleFileSelect}
            ref={fileInputRef}
            className='border-none width-10%'
          />
        </div>
        <Button variant='outline' size='icon'>
          <SendHorizontal className='h-4 w-4' />
        </Button>
      </form>
    </div>
  );
}
