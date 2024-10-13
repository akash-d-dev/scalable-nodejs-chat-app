import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "../ui/button";
import Image from "next/image";
import { signIn } from "next-auth/react";

function LoginModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const handleLogin = () => {
    signIn("google", {
      callbackUrl: "/dashboard",
      redirect: true,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className='text-2xl'>Welcome to ChatBappa</DialogTitle>
          <DialogDescription>Choose an option to continue</DialogDescription>
        </DialogHeader>
        <Button variant={"outline"} onClick={handleLogin}>
          <Image
            src={"/images/google.png"}
            className='mr-4'
            width={25}
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
