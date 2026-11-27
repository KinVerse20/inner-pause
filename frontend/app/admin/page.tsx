import type { Metadata } from "next";

import { AdminScreen } from "@/components/admin-screen";

export const metadata: Metadata = { title: "Admin · Inner Pause", robots: { index: false, follow: false } };

export default function AdminPage() {
  return <AdminScreen />;
}
