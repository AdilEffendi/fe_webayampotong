import React from "react";
import Sidebar from "@/components/layout/Sidebar";

export default function PrediksiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, background: "#f9fafb" }}>{children}</main>
    </div>
  );
}
