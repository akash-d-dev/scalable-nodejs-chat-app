"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomUser } from "@/app/api/auth/[...nextauth]/options";
import GroupChatCardMenu from "./GroupChatCardMenu";
import Link from "next/link";

export default function GroupChatCard({
  group,
  user,
}: {
  group: ChatGroupType;
  user: CustomUser;
}) {
  return (
    <Link href={`/chat/${group.id}`} target='_blank' rel='noreferrer'>
      <Card>
        <CardHeader className='flex-row justify-between items-center '>
          <CardTitle className='text-2xl'>{group.title}</CardTitle>
          {/* Stop the click event propagation on the GroupChatCardMenu */}
          <div onClick={(e) => e.stopPropagation()}>
            <GroupChatCardMenu user={user} group={group} />
          </div>
        </CardHeader>
        <CardContent>
          <p>
            Passcode :-<strong>{group.passcode}</strong>
          </p>
          <p>Created At :- {new Date(group.created_at).toDateString()}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
