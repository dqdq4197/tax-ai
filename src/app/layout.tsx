import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../styles/globals.css";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "./components/app-sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import ReactQueryProvider from "./providers/react-query-provider";

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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="h-full">
        <ReactQueryProvider>
          <TooltipProvider>
            <SidebarProvider>
              <AppSidebar />
              <SidebarInset>
                <main>{children}</main>
              </SidebarInset>
            </SidebarProvider>
          </TooltipProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
