import type { Metadata } from "next";
import { Inter as FontSans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import SessionProvider from "@/providers/SessionProviders";
import { Toaster } from "@/components/ui/sonner";
// import SessionProvider from "../lib/SessionProviders";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "ChatBappa",
  description:
    "Even walls have ears, anyways let's start talkin without login.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <SessionProvider>
        <body
          className={cn(
            "min-h-screen bg-background font-sans antialiased",
            fontSans.variable
          )}
        >
          <Toaster richColors duration={1000} />
          {children}
        </body>
      </SessionProvider>
    </html>
  );
}
