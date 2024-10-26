import { on } from "events";
import React, { useEffect, useState } from "react";
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
  const [onlineUsersID, setOnlineUsersID] = useState<[number]>([-1]);
  const [typingUsersID, setTypingUsersID] = useState<[number]>([-1]);

  useEffect(() => {
    if (!chatUser) return;

    socket.on(
      "userJoined",
      ({
        onlineUsersID,
        newUser,
      }: {
        onlineUsersID: [number];
        newUser: GroupChatUserType;
      }) => {
        setOnlineUsersID(onlineUsersID);
        setUsers((prevUsers) => {
          if (prevUsers.some((user) => user.id === newUser.id)) {
            return prevUsers;
          }
          return [...prevUsers, newUser];
        });
      }
    );

    socket.on(
      "userLeft",
      ({
        onlineUsersID,
        userId,
      }: {
        onlineUsersID: [number];
        userId: string;
      }) => {
        setOnlineUsersID(onlineUsersID);
      }
    );

    socket.on("typing", ({ typingUsers }: { typingUsers: [number] }) => {
      setTypingUsersID(typingUsers);
    });

    // Disconnect the socket when the component is unmounted
    return () => {
      socket.off("userJoined");
      socket.off("userLeft");
      socket.off("typing");
      // socket.close();
    };
  }, []);

  useEffect(() => {
    if (!chatUser) return;
    socket.emit("userJoined", chatUser);
  }, [chatUser]);

  return (
    <div className='hidden md:block h-screen overflow-y-auto w-1/5 bg-muted px-2'>
      {/* <h1 className='text-2xl font-extrabold py-4 '>Users</h1> */}
      {users.length > 0 &&
        onlineUsersID.length > 0 &&
        users.map((item, index) => (
          <div key={index} className='bg-white rounded-md p-2 mt-2'>
            <div>
              <p
                className={`font-bold ${
                  onlineUsersID.includes(Number(item.id))
                    ? "text-green-500"
                    : ""
                }`}
              >
                {" "}
                {item.name}{" "}
                <span
                  className='text-black'
                  style={{ fontSize: "14px", fontWeight: 400 }}
                >
                  {item.id === chatUser?.id ? "(You)" : ""}
                </span>
              </p>
              <p>
                {onlineUsersID.includes(Number(item.id)) ? "Online" : "Offline"}
              </p>
              <p>
                {typingUsersID.includes(Number(item.id)) &&
                Number(item.id) != Number(chatUser?.id)
                  ? "Typing..."
                  : ""}
              </p>
            </div>
            <p>
              Joined : <span>{new Date(item.created_at).toDateString()}</span>
            </p>
          </div>
        ))}
    </div>
  );
}
