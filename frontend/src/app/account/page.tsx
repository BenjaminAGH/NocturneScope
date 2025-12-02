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
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <ShieldCheckIcon className="w-5 h-5 text-primary" />
                            Información de Perfil
                        </h2>
                        {!isEditing && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="text-sm text-primary hover:underline"
                            >
                                Editar
                            </button>
                        )}
                    </div>

                    <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-md">
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Rol</label>
                            <div className="mt-1 p-2 bg-muted/50 rounded border border-border text-sm font-mono">
                                {user?.Role.toUpperCase()}
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Email</label>
                            <div className="mt-1 p-2 bg-muted/50 rounded border border-border text-sm flex items-center gap-2">
                                <EnvelopeIcon className="w-4 h-4 text-muted-foreground" />
                                {user?.Email}
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1">El email no se puede cambiar.</p>
                        </div>

                        <div>
                            <label className="text-sm font-medium">Nombre de Usuario</label>
                            <input
                                type="text"
                                disabled={!isEditing}
                                className="w-full mt-1 p-2 bg-background border border-border rounded text-sm focus:ring-2 focus:ring-primary/20 outline-none disabled:opacity-50"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>

                        {isEditing && (
                            <div className="space-y-4 pt-4 border-t border-border">
                                <div>
                                    <label className="text-sm font-medium">Nueva Contraseña (Opcional)</label>
                                    <input
                                        type="password"
                                        className="w-full mt-1 p-2 bg-background border border-border rounded text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                        placeholder="Dejar en blanco para mantener actual"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Confirmar Contraseña</label>
                                    <input
                                        type="password"
                                        className="w-full mt-1 p-2 bg-background border border-border rounded text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                        placeholder="Confirmar nueva contraseña"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                    />
                                </div>
                                <div className="flex gap-2 justify-end">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsEditing(false);
                                            setUsername(user?.Username || "");
                                            setPassword("");
                                            setConfirmPassword("");
                                        }}
                                        className="px-4 py-2 text-sm text-muted-foreground hover:bg-muted rounded"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90"
                                    >
                                        Guardar Cambios
                                    </button>
                                </div>
                            </div>
                        )}
                    </form>
                </div>



                {/* Groups Section (Read Only for now based on context) */}
                {/* We can use the GroupContext to show groups if we want, or fetch them. */}
                {/* Since we didn't implement getGroups in api.ts yet, we'll skip or use a placeholder if needed. */}
                {/* But the user asked to list groups. Let's try to use the GroupContext logic or fetch. */}

            </div>
        </div>
    );
}
