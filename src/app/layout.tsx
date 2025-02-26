import type { Metadata } from "next";
import { GeistSans, GeistMono } from "geist/font";
import "./globals.css";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { Toaster } from "sonner";
import Loader from "@/components/Loader";

export const metadata: Metadata = {
  title: "Himspired",
  description: "Where thrift meets luxury",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={GeistSans.className}>
      <body className={`antialiased min-h-screen flex flex-col`}>
        <Navbar />
        <div className="flex-grow">{children}</div>
        <Footer />
        <Toaster position="top-right" richColors expand={false} />
      </body>
    </html>
  );
}
