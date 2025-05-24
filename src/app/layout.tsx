import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font"
import "./globals.css"
import { Toaster } from "sonner"
import { LoadingProvider } from "@/context/LoadingContext"
import AppShell from "@/components/AppShell"
import { ReduxProvider } from "@/components/providers/ReduxProvider" 

export const metadata: Metadata = {
  title: "Himspired",
  description: "Where thrift meets luxury",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={GeistSans.className}>
      <body className={`antialiased min-h-screen flex flex-col`}>
        <ReduxProvider>
          <LoadingProvider>
            <AppShell>{children}</AppShell>
            <Toaster position="top-right" richColors expand={false} />
          </LoadingProvider>
        </ReduxProvider>
      </body>
    </html>
  )
}