"use client";
import React, { Dispatch, SetStateAction, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useParams } from "next/navigation";
import axios from "axios";
import { CHAT_GROUP_USERS_URL } from "@/lib/apiEndpoints";
import { toast } from "sonner";
import { clearCache } from "@/actions/common";

export default function ChatUserDialog({
  open,
  setOpen,
  group,
  setChatUser,
  connectSocket,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  group: ChatGroupType;
  setChatUser: Dispatch<SetStateAction<GroupChatUserType | null>>;
  connectSocket: (group: ChatGroupType, passcode: string) => Promise<boolean>;
}) {
  const params = useParams();
  const [state, setState] = useState({
    name: "",
    passcode: "",
  });

  // useEffect(() => {
  //   const data = localStorage.getItem(params["id"] as string);
  //   if (data) {
  //     const jsonData = JSON.parse(data);
  //     if (jsonData?.name && jsonData?.group_id && jsonData?.passcode) {
  //       setOpen(false);
  //     }
  //   }
  // }, []);

  // Form submission for user dialog
  const handleSubmit = async (
    event: React.FormEvent,
    name: string,
    passcode: string
  ) => {
    event.preventDefault();
    if (!name || !passcode) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      let connection = await connectSocket(group, passcode);

      console.log("connection", connection);

      if (!connection) {
        toast.error("Please check the passcode and try again.");
        return;
      }
      const { data } = await axios.post(CHAT_GROUP_USERS_URL, {
        name: name,
        group_id: params["id"] as string,
      });

      // Save user details and passcode in local storage
      const userData = { ...data?.data, passcode };
      localStorage.setItem(params["id"] as string, JSON.stringify(userData));
      setChatUser(userData);
      setOpen(false);
      clearCache("chat/[id]");
    } catch (error) {
      toast.error("Something went wrong. Please try again!");
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Name and Passcode</DialogTitle>
          <DialogDescription>
            Add your name and passcode to join the room
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => handleSubmit(e, state.name, state.passcode)}>
          <div className='mt-2'>
            <Input
              placeholder='Enter your name'
              value={state.name}
              onChange={(e) => setState({ ...state, name: e.target.value })}
            />
          </div>
          <div className='mt-2'>
            <Input
              placeholder='Enter your passcode'
              value={state.passcode}
              onChange={(e) => setState({ ...state, passcode: e.target.value })}
            />
          </div>
          <div className='mt-2'>
            <Button className='w-full'>Submit</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
