"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const ORIGIN = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000").replace(/\/+$/, "");
const API = `${ORIGIN}/api`;

export default function RegisterPage() {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [err, setErr] = useState("");
    const [ok, setOk] = useState(false);
    const router = useRouter();

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErr(""); setOk(false);
        try {
            const res = await fetch(`${API}/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, password, role: "user" }),
            });
            if (!res.ok) throw new Error(await res.text());
            setOk(true);
            setTimeout(() => router.push("/login"), 900);
        } catch {
            setErr("No se pudo crear la cuenta (email/usuario en uso o backend caído).");
        }
    };

    return (
        <main className="px-4 py-10 flex justify-center">
            <div className="w-full max-w-sm">
                <div className="rounded-2xl bg-card text-card-foreground shadow-lg ring-1 ring-border/50 p-5">
                    <h1 className="text-xl md:text-2xl font-semibold text-center">Crear cuenta</h1>
                    <p className="text-sm text-muted-foreground text-center mt-1">
                        Regístrate para usar el panel de NocturneScope.
                    </p>

                    {err && (
                        <div className="mt-4 text-sm rounded-md bg-destructive/10 text-destructive px-3 py-2">
                            {err}
                        </div>
                    )}
                    {ok && (
                        <div className="mt-4 text-sm rounded-md bg-emerald-500/10 text-emerald-500 px-3 py-2">
                            Cuenta creada. Redirigiendo a login…
                        </div>
                    )}

                    <form onSubmit={onSubmit} className="mt-5 space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm mb-2 block">Usuario</label>
                            <input
                                className="w-full rounded-md border px-3 py-2 bg-background"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm mb-2 block">Email</label>
                            <input
                                type="email"
                                className="w-full rounded-md border px-3 py-2 bg-background"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
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

                        <button className="w-full rounded-lg bg-primary text-primary-foreground py-2.5 hover:opacity-90 transition">
                            Registrarme
                        </button>
                    </form>

                    <div className="mt-5 text-center">
                        <Link href="/auth/login" className="text-sm underline underline-offset-4 text-muted-foreground hover:text-foreground">
                            Ya tengo cuenta
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
}
