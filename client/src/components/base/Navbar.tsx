"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Button } from "../ui/button";
import LoginModal from "../auth/LoginModal";
import { CustomUser } from "@/app/api/auth/[...nextauth]/options";
export default function Navbar({ user }: { user?: CustomUser }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleModalClose = () => setIsModalOpen(false);
  const handleBtnClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      setIsModalOpen(true);
    }
  };
  return (
    <nav className='p-6 flex justify-between items-center bg-white shadow-sm'>
      <Link href='/'>
        <h1 className='text-xl md:text-2xl font-extrabold'>ChatBappa</h1>
      </Link>
      <div className='flex items-center space-x-2 md:space-x-6 text-gray-700'>
        <Link href='/'>Home</Link>
        <Link href='#features'>Features</Link>
        <Link href={user ? "/dashboard" : "#"} onClick={handleBtnClick}>
          <Button>{user ? "Dashboard" : "Getting Started"}</Button>
        </Link>
        <LoginModal isOpen={isModalOpen} onClose={handleModalClose} />
      </div>
    </nav>
  );
}
