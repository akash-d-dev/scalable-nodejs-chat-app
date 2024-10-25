import React from "react";
import MobileChatSidebar from "./MobileChatSidebar";

export default function ChatNav({
  chatGroup,
  oldUsers,
  user,
}: {
  chatGroup: ChatGroupType;
  oldUsers: Array<GroupChatUserType> | [];
  user?: GroupChatUserType;
}) {
  return (
    <nav className='w-full flex justify-between items-center  px-6 py-2 border-b'>
      <div className='flex space-x-4 md:space-x-0 items-center'>
        <div className='md:hidden'>
          <MobileChatSidebar oldUsers={oldUsers} />
        </div>

        <h1 className='text-2xl font-bold text-light-gray--500 bg-clip-text'>
          {chatGroup.title}
        </h1>
        {/* <p>{new Date(chatGroup.created_at).toDateString()}</p> */}
      </div>
      <p>{user?.name}</p>
    </nav>
  );
}
