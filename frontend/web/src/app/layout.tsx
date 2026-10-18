import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar, Footer } from "@/components/Navigation";
import { AuthProvider } from "@/context/AuthContext";
import { ChatBotWidget } from "@/components/ChatBotWidget";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "The Hidden Cost of Being a Student | Make Student Life Cost Less",
  description:
    "Compare where you live, how you bank and how you travel — and understand the real cost of each choice. Built for GUTS Hackathon 2026.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col font-sans bg-slate-50 text-slate-900" suppressHydrationWarning>
        <AuthProvider>
          <Navbar />
          <main className="flex-1" suppressHydrationWarning>{children}</main>
          <Footer />
          <ChatBotWidget />
        </AuthProvider>
      </body>
    </html>
  );
}

