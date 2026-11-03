import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ServerProvider } from "@/context/ServerContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export const metadata: Metadata = {
  title: "ValoriaSMP Panel — Modern Minecraft Server Dashboard",
  description: "Sophisticated, production-grade Minecraft server management panel.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-valoria-950 text-zinc-100 min-h-screen antialiased selection:bg-emerald-500/30 selection:text-emerald-200">
        <AuthProvider>
          <ServerProvider>
            <DashboardLayout>{children}</DashboardLayout>
          </ServerProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

