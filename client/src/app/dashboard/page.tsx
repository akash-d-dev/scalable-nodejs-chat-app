import DashNav from "@/components/dashboard/DashNav";
import React from "react";
import { authOptions, CustomSession } from "../api/auth/[...nextauth]/options";
import { getServerSession } from "next-auth";
import CreateChat from "@/components/groupChat/CreateChat";
import { fetchChatGroups } from "@/fetch/groupFetch";
import GroupChatCard from "@/components/groupChat/GroupChatCard";

async function dashboard() {
  const session: CustomSession | null = await getServerSession(authOptions);

  const groups: Array<ChatGroupType> | [] = await fetchChatGroups(
    session?.user?.token!
  );

  return (
    <div>
      <DashNav
        name={session?.user?.name!}
        image={session?.user?.image ?? undefined}
      />
      <div className='container'>
        <div className='mt-6 text-end'>
          <CreateChat user={session?.user!} />
        </div>
        <div className='my-4'></div>{" "}
        {/* Add space between the two child divs */}
        {/* If Groups */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
          {groups.length > 0 &&
            groups.map((item, index) => (
              <GroupChatCard group={item} key={index} user={session?.user!} />
            ))}
        </div>
      </div>
    </div>
  );
}

export default dashboard;
