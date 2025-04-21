'use client'
import type { Metadata } from "next";
import { GeistSans, GeistMono } from 'geist/font'
import "./globals.css";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { Toaster } from "sonner";
import Loader from '@/components/Loader'
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { persistor, store } from "@/redux/store";


// export const metadata: Metadata = {
//   title: "Himspired",
//   description: "Where thrift meets luxury",
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (


    <html lang="en" className={GeistSans.className}>

      <body className={`antialiased min-h-screen flex flex-col`}>
        <Loader />
        <main
          className="opacity-0 animate-fadeIn"
          style={{
            animationDelay: '6.5s',
            animationFillMode: 'forwards'
          }}
        >
          <Provider store={store} >
            <PersistGate loading={null} persistor={persistor} >
              <Navbar />
              <div className="flex-grow">{children}</div>
              <Footer />
              <Toaster position="top-right" richColors expand={false} />
            </PersistGate>
          </Provider>
        </main>
      </body>

    </html>

  );
}