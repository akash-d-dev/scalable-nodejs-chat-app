"use client";
import React from "react";
import Link from "next/link";
import { Button } from "../ui/button";
import LoginModal from "../auth/LoginModal";
import { CustomUser } from "@/app/api/auth/[...nextauth]/options";
import ProfileMenu from "../auth/ProfileMenu";

export default function DashNav({
  name,
  image,
}: {
  name: string;
  image?: string;
}) {
  return (
    <nav className='p-6 flex justify-between items-center bg-white shadow-sm'>
      <Link href={"/"}>
        <h1 className='text-xl md:text-2xl font-extrabold'>ChatBappa</h1>
      </Link>
      <div className='flex items-center space-x-2 md:space-x-6 text-gray-700'>
        <ProfileMenu name={name} image={image} />
      </div>
    </nav>
  );
}
