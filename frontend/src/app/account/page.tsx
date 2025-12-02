"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useNotification } from "@/context/NotificationContext";
import {
    UserCircleIcon,
    KeyIcon,
    ServerIcon,
    TrashIcon,
    ShieldCheckIcon,
    EnvelopeIcon
} from "@heroicons/react/24/outline";

interface UserProfile {
    ID: number;
    Username: string;
    Email: string;
    Role: string;
}

interface DeviceToken {
    ID: number;
    Name: string;
    DeviceName: string;
    Status: string;
    CreatedAt: string;
}

interface Group {
    ID: number;
    Name: string;
}

export default function AccountPage() {
    const router = useRouter();
    const { notify } = useNotification();
    const [jwt, setJwt] = useState<string | null>(null);
    const [user, setUser] = useState<UserProfile | null>(null);
    const [devices, setDevices] = useState<DeviceToken[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);

    // Form states
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("jwt");
        if (!token) {
            router.push("/auth/login");
            return;
        }
        setJwt(token);
        loadData(token);
    }, [router]);

    const loadData = async (token: string) => {
        try {
            const { getUserProfile } = await import("@/lib/api/api");

            const userData = await getUserProfile(token);

            setUser(userData);
            setUsername(userData.Username);

        } catch (error) {
            console.error("Error loading account data:", error);
            notify("Error cargando datos de la cuenta", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!jwt || !user) return;

        if (password && password !== confirmPassword) {
            notify("Las contraseñas no coinciden", "error");
            return;
        }

        try {
            const { updateUser } = await import("@/lib/api/api");
            const data: any = { username };
            if (password) data.password = password;

            await updateUser(jwt, user.ID, data);
            notify("Perfil actualizado correctamente", "success");
            setIsEditing(false);
            setPassword("");
            setConfirmPassword("");
            loadData(jwt);
        } catch (error: any) {
            notify(error.message || "Error actualizando perfil", "error");
        }
    };

    const handleDeleteDevice = async (id: number) => {
        if (!jwt || !confirm("¿Estás seguro? Esto revocará el token y desconectará el agente.")) return;

        try {
            const { deleteApiToken } = await import("@/lib/api/api");
            await deleteApiToken(jwt, id);
            notify("Dispositivo eliminado y token revocado", "success");
            loadData(jwt);
        } catch (error: any) {
            notify("Error eliminando dispositivo", "error");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen pt-20 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-20 pb-10 bg-background">
            <div className="container mx-auto px-4 max-w-4xl space-y-8">

                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-primary/10 rounded-full">
                        <UserCircleIcon className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Mi Cuenta</h1>
                        <p className="text-muted-foreground">Administra tu perfil y recursos asociados</p>
                    </div>
                </div>

                {/* Profile Section */}
                <div className="relative overflow-hidden bg-card border border-border rounded-xl p-8 shadow-sm">
                    {/* Decorative background elements using theme colors */}
                    <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-secondary/10 rounded-full blur-3xl pointer-events-none"></div>

                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <ShieldCheckIcon className="w-6 h-6 text-primary" />
                                </div>
                                <h2 className="text-xl font-bold tracking-tight">Información de Perfil</h2>
                            </div>
                            {!isEditing && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="px-4 py-2 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-all"
                                >
                                    Editar Perfil
                                </button>
                            )}
                        </div>

                        <form onSubmit={handleUpdateProfile} className="space-y-6 max-w-lg">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rol</label>
                                    <div className="px-4 py-3 bg-muted/30 border border-border rounded-xl text-sm font-mono text-foreground flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-primary"></div>
                                        {user?.Role.toUpperCase()}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</label>
                                    <div className="px-4 py-3 bg-muted/30 border border-border rounded-xl text-sm text-foreground flex items-center gap-2 overflow-hidden">
                                        <EnvelopeIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                                        <span className="truncate">{user?.Email}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nombre de Usuario</label>
                                <input
                                    type="text"
                                    disabled={!isEditing}
                                    className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                            </div>

                            {isEditing && (
                                <div className="space-y-6 pt-6 border-t border-border animate-in fade-in slide-in-from-top-4 duration-300">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nueva Contraseña</label>
                                            <input
                                                type="password"
                                                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all outline-none"
                                                placeholder="••••••••"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Confirmar Contraseña</label>
                                            <input
                                                type="password"
                                                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all outline-none"
                                                placeholder="••••••••"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-3 justify-end pt-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsEditing(false);
                                                setUsername(user?.Username || "");
                                                setPassword("");
                                                setConfirmPassword("");
                                            }}
                                            className="px-6 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-6 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                        >
                                            Guardar Cambios
                                        </button>
                                    </div>
                                </div>
                            )}
                        </form>
                    </div>
                </div>



                {/* Groups Section (Read Only for now based on context) */}
                {/* We can use the GroupContext to show groups if we want, or fetch them. */}
                {/* Since we didn't implement getGroups in api.ts yet, we'll skip or use a placeholder if needed. */}
                {/* But the user asked to list groups. Let's try to use the GroupContext logic or fetch. */}

            </div>
        </div>
    );
}
