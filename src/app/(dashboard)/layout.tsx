"use client";

import { useSessionTimeout } from "@/hooks/useSessionTimeout";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useSessionTimeout();

  return <>{children}</>;
}
