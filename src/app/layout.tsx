import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Geist, Geist_Mono } from "next/font/google";
import "../styles/globals.css";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "./components/app-sidebar";
import TopNav from "./components/top-nav";
import { TooltipProvider } from "@/components/ui/tooltip";
import ReactQueryProvider from "./providers/react-query-provider";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "tax·ai — 종합소득세 AI 상담",
  description: "사업소득·프리랜서를 위한 종합소득세 AI 상담 서비스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="h-full">
        <Analytics />
        <ReactQueryProvider>
          <TooltipProvider>
            <SidebarProvider className="h-full">
              <AppSidebar />
              <main className="flex h-full w-full flex-col">
                <TopNav />
                <div className="min-h-0 flex-1">{children}</div>
              </main>
            </SidebarProvider>
          </TooltipProvider>
          <Toaster position="top-right" />
        </ReactQueryProvider>
      </body>
    </html>
  );
}
