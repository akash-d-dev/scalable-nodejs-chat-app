import ChatBase from "@/components/chat/ChatBase";
import React from "react";

export default function chat({ params }: { params: { id: string } }) {
  console.log("Group ID", params.id);
  return (
    <div>
      <div>chat</div>
      <ChatBase groupId={params.id} />
    </div>
  );
}
