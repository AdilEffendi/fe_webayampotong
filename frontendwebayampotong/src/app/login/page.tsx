"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EyeIcon, EyeOffIcon, LockIcon, UserIcon } from "lucide-react";
import { loginUser } from "@/services/auth";

// Komponen manual
function Button({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      style={{
        width: "100%",
        padding: "0.75rem",
        background: "#111827",
        color: "white",
        border: "none",
        borderRadius: "0.5rem",
        fontWeight: 600,
        fontSize: "1rem",
        cursor: props.disabled ? "not-allowed" : "pointer",
        opacity: props.disabled ? 0.7 : 1,
        marginTop: "1rem",
        transition: "background 0.2s",
      }}
    >
      {children}
    </button>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{
        width: "100%",
        padding: "0.5rem 2.5rem 0.5rem 2.5rem",
        border: "1px solid #e5e7eb",
        borderRadius: "0.5rem",
        fontSize: "1rem",
        background: "#f9fafb",
        marginTop: "0.25rem",
        outline: "none",
        boxSizing: "border-box",
      }}
    />
  );
}

function Label({
  children,
  htmlFor,
  className,
}: {
  children: React.ReactNode;
  htmlFor?: string;
  className?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      style={{
        fontWeight: 500,
        fontSize: "1rem",
        display: "block",
        marginBottom: 4,
      }}
    >
      {children}
    </label>
  );
}

function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: "1rem",
        background: "white",
        boxShadow: "0 2px 8px #0001",
        ...(className ? {} : {}),
      }}
    >
      {children}
    </div>
  );
}
function CardHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div style={{ padding: "2rem 2rem 0 2rem", textAlign: "center" }}>
      {children}
    </div>
  );
}
function CardTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2 style={{ fontSize: "2rem", fontWeight: 700, margin: 0 }}>{children}</h2>
  );
}
function CardDescription({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p style={{ color: "#6b7280", fontSize: "1rem", margin: "0.5rem 0 0 0" }}>
      {children}
    </p>
  );
}
function CardContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div style={{ padding: "2rem" }}>{children}</div>;
}
function CardFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div style={{ padding: "0 2rem 2rem 2rem" }}>{children}</div>;
}

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await loginUser(username, password);
      localStorage.setItem("token", res.token);
      localStorage.setItem("user", JSON.stringify(res.user));
      router.push("/dashboard");
    } catch (err: any) {
      setError("Login gagal. Username atau password salah.");
      console.error(err);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f3f4f6",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ width: "100%", maxWidth: 500, padding: 16 }}>
        <Card>
          <CardHeader>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "9999px",
                  background: "#111827",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <LockIcon size={24} color="white" />
              </div>
            </div>
            <CardTitle>Selamat Datang</CardTitle>
            <CardDescription>
              Masukan data anda untuk masuk ke dalam aplikasi
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <p
                style={{
                  color: "#dc2626",
                  fontSize: 14,
                  textAlign: "center",
                  marginBottom: 8,
                }}
              >
                {error}
              </p>
            )}
            <form
              onSubmit={handleLogin}
              style={{ display: "flex", flexDirection: "column", gap: 16 }}
            >
              <div>
                <Label htmlFor="username">Username</Label>
                <div style={{ position: "relative" }}>
                  <div
                    style={{
                      position: "absolute",
                      left: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#9ca3af",
                    }}
                  >
                    <UserIcon size={16} />
                  </div>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setUsername(e.target.value)
                    }
                    style={{ paddingLeft: 36 }}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <div style={{ position: "relative" }}>
                  <div
                    style={{
                      position: "absolute",
                      left: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#9ca3af",
                    }}
                  >
                    <LockIcon size={16} />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPassword(e.target.value)
                    }
                    style={{ paddingLeft: 36 }}
                    required
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    style={{
                      position: "absolute",
                      right: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: "#9ca3af",
                      cursor: "pointer",
                    }}
                  >
                    {showPassword ? (
                      <EyeOffIcon size={16} />
                    ) : (
                      <EyeIcon size={16} />
                    )}
                  </button>
                </div>
              </div>
              <Button type="submit">Masuk</Button>
            </form>
          </CardContent>
          <CardFooter>{null}</CardFooter>
        </Card>
      </div>
    </div>
  );
}
