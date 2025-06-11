import React from "react";

export function Tabs({ value, onChange, children }: any) {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
      {React.Children.map(children, (child: any) =>
        React.cloneElement(child, {
          active: child.props.value === value,
          onClick: () => onChange(child.props.value),
        })
      )}
    </div>
  );
}

export function Tab({ value, active, onClick, children }: any) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? "#111" : "#fff",
        color: active ? "#fff" : "#111",
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        padding: "8px 20px",
        fontWeight: 600,
        cursor: "pointer",
        opacity: active ? 1 : 0.7,
        transition: "all 0.2s",
      }}
    >
      {children}
    </button>
  );
}
