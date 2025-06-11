import React from "react";

export function Sheet({ open, onOpenChange, children }: any) {
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0,0,0,0.25)", // lebih soft
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={() => onOpenChange(false)}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          minWidth: 400,
          padding: 32,
          position: "relative",
          boxShadow: "0 2px 16px #0002",
          color: "#111",
          border: "1px solid #e5e7eb",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export function SheetContent({ children }: any) {
  return (
    <div style={{ background: "#f3f4f6", borderRadius: 12 }}>{children}</div>
  );
}

export function SheetHeader({ children }: any) {
  return <div style={{ marginBottom: 16 }}>{children}</div>;
}

export function SheetTitle({ children }: any) {
  return (
    <h2 style={{ fontSize: 20, fontWeight: 700, color: "#111" }}>{children}</h2>
  );
}
