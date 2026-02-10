import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppSidebar from "@/components/AppSidebar";
import Navbar from "@/components/Navbar";
import { ClientProviders } from "@/components/providers/ClientProviders";
import { SidebarProvider } from "@/components/ui/sidebar";
import { cookies } from "next/headers";
import { setupAutoRollover } from "@/lib/cron";
import HiddenAdminLogin from "@/components/HiddenAdminLogin";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HSI App - Haluan Group",
  description: "Investasi Anda, Amanah Kami.",
  icons: {
    icon: "/money.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";

  // Setup auto rollover cron job
  if (typeof window === "undefined") {
    setupAutoRollover();
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex`}
      >
        <ClientProviders>
          <SidebarProvider defaultOpen={defaultOpen}>
            <AppSidebar />
            <main className="w-full">
              <Navbar />
              <div className="px-0">{children}</div>
            </main>
          </SidebarProvider>
        </ClientProviders>
      </body>
    </html>
  );
}
