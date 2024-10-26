"use client";
import React, { useEffect, useState } from "react";
import ChatSidebar from "./ChatSidebar";
import ChatNav from "./ChatNav";
import ChatUserDialog from "./ChatUserDialog";
import Chats from "./Chats";
import { getSocket } from "@/lib/socket.confg";
import { toast } from "sonner";
import { useParams } from "next/navigation";

export default function ChatBase({
  group,
  oldUsers,
  oldMessages,
}: {
  group: ChatGroupType;
  oldUsers: Array<GroupChatUserType> | [];
  oldMessages: Array<ChatMessageType> | [];
}) {
  const [open, setOpen] = useState(true);
  const [chatUser, setChatUser] = useState<GroupChatUserType | null>(null);
  const [socket, setSocket] = useState<any>(null); // Socket instance
  const [isTyping, setIsTyping] = useState(false);
  const params = useParams();

  // Socket connection function
  const connectSocket = async (
    chatGroup: ChatGroupType,
    passcode: string,
    userID: string
  ): Promise<boolean> => {
    try {
      const socket = getSocket();
      socket.auth = {
        room: chatGroup.id,
        passCode: passcode,
        userID: userID,
      };

      // Promise that resolves when the socket connection is established or fails
      return new Promise((resolve, reject) => {
        socket.connect();

        // Handle successful connection
        socket.on("connect", () => {
          setSocket(socket);
          resolve(true);
        });

        // Handle connection errors
        socket.on("connect_error", (error) => {
          // console.error("Socket connection error:", error);
          resolve(false);
        });
      });
    } catch (error) {
      console.error("Failed to establish socket connection:", error);
      return false; // Return false on exception
    }
  };

  // Check localStorage on page load for user details
  useEffect(() => {
    const storedData = localStorage.getItem(params["id"] as string);
    if (storedData) {
      const jsonData = JSON.parse(storedData);
      if (jsonData?.name && jsonData?.group_id && jsonData?.passcode) {
        let connection = connectSocket(group, jsonData.passcode, jsonData.id);
        if (!connection) {
          toast.error("Please check the passcode and try again.");
          localStorage.removeItem(params["id"] as string);
        } else {
          setOpen(false);
          setChatUser(jsonData);
        }
      }
    }
  }, []);

  return (
    <div className='flex'>
      {!open && socket && (
        <ChatSidebar socket={socket} chatUser={chatUser} oldUsers={oldUsers} />
      )}
      <div className='w-full md:w-4/5 bg-gradient-to-b from-gray-50 to-white'>
        {!open && socket ? (
          <>
            <ChatNav chatGroup={group} oldUsers={oldUsers} />
            <Chats
              group={group}
              oldMessages={oldMessages}
              chatUser={chatUser}
              socket={socket}
              isTyping={isTyping}
              setIsTyping={setIsTyping}
            />
          </>
        ) : (
          <ChatUserDialog
            open={open}
            setOpen={setOpen}
            group={group}
            setChatUser={setChatUser}
            connectSocket={connectSocket}
          />
        )}
      </div>
    </div>
  );
}
