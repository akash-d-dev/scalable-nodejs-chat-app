"use client";
import React from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "../ui/button";
import Image from "next/image";

function LoginModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Getting Started</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className='text-2xl'>Welcome to ChatBappa</DialogTitle>
          <DialogDescription>
            Ekdun solid cheej banaye hai. Na Gym kre na Login kare, Chatting
            kare jab man kre
          </DialogDescription>
        </DialogHeader>
        <Button variant={"outline"}>
          <Image
            src={"/images/google.png"}
            className='mr-4'
            height={25}
            alt='google_logo'
          />
          Continue with Google
        </Button>
      </DialogContent>
    </Dialog>
  );
}

export default LoginModal;
