// src/app/login/layout.tsx

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="login-bg">{children}</div>;
}
