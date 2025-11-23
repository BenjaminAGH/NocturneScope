import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";

import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

import { NotificationProvider } from "@/context/NotificationContext";
import { Toaster } from "sonner";

import '@/styles/globals.css';
import '@xyflow/react/dist/style.css';

import React from "react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MirageNet",
  description: "A Honeypot Network",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          enableSystem={true}
          defaultTheme="system"
          storageKey="theme"
        >
          <Navbar />
          <div>{children}</div>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
