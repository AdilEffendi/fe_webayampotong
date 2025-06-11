import Sidebar from "@/components/layout/Sidebar";

export default function KasirLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex" }}>
      <Sidebar active="Kasir" />
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}
