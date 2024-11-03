import React from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";
import { GitHubLogoIcon } from "@radix-ui/react-icons";

export default function Footer() {
  return (
    <footer className='p-6 bg-gray-900 text-white'>
      <div className='flex justify-between'>
        <div>
          <div>© 2024 ChatBappa. All rights reserved.</div>
          <div className='flex items-center space-x-4 mt-6'>
            <Link
              href='https://github.com/akash-d-dev'
              target='_blank'
              rel='noopener noreferrer'
            >
              <GitHubLogoIcon />
            </Link>
            <Link href='/#'>Privacy Policy</Link>
            <Link href='/#'>Terms of Service</Link>
          </div>
        </div>
        <div className='space-y-4'>
          <Input
            placeholder='Subscribe to our newsletter'
            className='bg-gray-800 border-none'
          />
          <Button>Subscribe</Button>
        </div>
      </div>
    </footer>
  );
}
