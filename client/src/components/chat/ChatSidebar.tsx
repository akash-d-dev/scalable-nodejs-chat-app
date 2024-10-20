import React, { useEffect, useMemo, useState } from "react";
import { Socket } from "socket.io-client";

export default function ChatSidebar({
  socket,
  oldUsers,
  chatUser,
}: {
  socket: Socket;
  oldUsers: Array<GroupChatUserType> | [];
  chatUser: GroupChatUserType | null;
}) {
  const [users, setUsers] = useState<Array<GroupChatUserType>>(oldUsers);

  useEffect(() => {
    if (!chatUser) return;

    socket.on("userJoined", (newUser: GroupChatUserType) => {
      setUsers((prevUsers) => [...prevUsers, newUser]);
    });

    // Disconnect the socket when the component is unmounted
    return () => {
      socket.off("userJoined");
      // socket.close();
    };
  }, []);

  useEffect(() => {
    if (!chatUser) return;
    socket.emit("userJoined", chatUser);
  }, [chatUser]);

  return (
    <div className='hidden md:block h-screen overflow-y-auto w-1/5 bg-muted px-2'>
      <h1 className='text-2xl font-extrabold py-4 '>Users</h1>
      {users.length > 0 &&
        users.map((item, index) => (
          <div key={index} className='bg-white rounded-md p-2 mt-2'>
            <p className='font-bold'> {item.name}</p>
            <p>
              Joined : <span>{new Date(item.created_at).toDateString()}</span>
            </p>
          </div>
        ))}
    </div>
  );
}
