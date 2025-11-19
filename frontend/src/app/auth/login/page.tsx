"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login as apiLogin, saveTokens } from "@/lib/api/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const { accessToken, refreshToken } = await apiLogin(email, password);
      saveTokens(accessToken, refreshToken);
      router.push("/dashboard");
    } catch (e) {
      console.error("login error:", e);
      setErr("Credenciales inválidas o backend no disponible.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="px-4 py-10 flex justify-center">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl bg-card text-card-foreground shadow-lg ring-1 ring-border/50 p-5">
          <h1 className="text-xl md:text-2xl font-semibold text-center">Iniciar sesión</h1>
          <p className="text-sm text-muted-foreground text-center mt-1">
            Accede a tu panel y administra tu red.
          </p>

          {err && (
            <div className="mt-4 text-sm rounded-md bg-destructive/10 text-destructive px-3 py-2">
              {err}
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-5 space-y-4">
            <div className="space-y-2">
              <label className="text-sm mb-2 block">Email</label>
              <input
                type="email"
                className="w-full rounded-md border px-3 py-2 bg-background"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm mb-2 block">Contraseña</label>
              <input
                type="password"
                className="w-full rounded-md border px-3 py-2 bg-background"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary text-primary-foreground py-2 hover:opacity-90 transition disabled:opacity-60"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <div className="mt-5 text-center text-sm text-muted-foreground">
            ¿No tienes cuenta?{" "}
            <Link href="/auth/register" className="underline underline-offset-4 hover:text-foreground">
              Crear cuenta
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
