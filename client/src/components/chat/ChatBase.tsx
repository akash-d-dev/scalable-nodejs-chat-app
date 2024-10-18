"use client";
import React, { useState } from "react";
import ChatSidebar from "./ChatSidebar";
import ChatNav from "./ChatNav";
import ChatUserDialog from "./ChatUserDialog";
import Chats from "./Chats";

export default function ChatBase({
  group,
  users,
  oldMessages,
}: {
  group: ChatGroupType;
  users: Array<GroupChatUserType> | [];
  oldMessages: Array<ChatMessageType> | [];
}) {
  const [open, setOpen] = useState(true);
  const [chatUser, setChatUser] = useState<GroupChatUserType>();

  return (
    <div className='flex'>
      {!open && <ChatSidebar users={users} />}
      <div className='w-full md:w-4/5 bg-gradient-to-b from-gray-50 to-white'>
        {open ? (
          <ChatUserDialog open={open} setOpen={setOpen} group={group} />
        ) : (
          <>
            <ChatNav chatGroup={group} users={users} />
            <Chats
              group={group}
              chatUser={chatUser}
              setChatUser={setChatUser}
              setOpen={setOpen}
              oldMessages={oldMessages}
            />
          </>
        )}
      </div>
    </div>
  );
}
