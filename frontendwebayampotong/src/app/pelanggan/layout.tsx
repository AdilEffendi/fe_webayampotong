import Sidebar from "@/components/layout/Sidebar";

export default function PelangganLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex" }}>
      <Sidebar active="Pelanggan" />
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}
