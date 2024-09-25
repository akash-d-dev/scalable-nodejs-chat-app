import DashNav from "@/components/dashboard/DashNav";
import React from "react";
import { authOptions, CustomSession } from "../api/auth/[...nextauth]/options";
import { getServerSession } from "next-auth";

async function dashboard() {
  const session: CustomSession | null = await getServerSession(authOptions);

  return (
    <div>
      <p>{JSON.stringify(session)}</p>
      <DashNav
        name={session?.user?.name!}
        image={session?.user?.image ?? undefined}
      />
    </div>
  );
}

export default dashboard;
