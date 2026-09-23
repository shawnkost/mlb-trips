import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TabNav } from "./components/tab-nav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MLB Trips",
  description: "Track the MLB ballparks you've visited.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <TabNav />
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-6 pb-[calc(3.5rem+env(safe-area-inset-bottom)+1.5rem)] sm:order-last sm:pb-6">
          {children}
        </main>
      </body>
    </html>
  );
}
