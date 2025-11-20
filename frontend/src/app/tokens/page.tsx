"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createAPIToken, getAPITokens, deleteAPIToken, APIToken } from "@/lib/api/tokens";
import { getDevices } from "@/lib/api/api";

export default function TokensPage() {
    const router = useRouter();
    const [jwt, setJwt] = useState<string | null>(null);
    const [tokens, setTokens] = useState<APIToken[]>([]);
    const [devices, setDevices] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Modal state
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newTokenName, setNewTokenName] = useState("");
    const [selectedDevice, setSelectedDevice] = useState("");
    const [createdToken, setCreatedToken] = useState<string | null>(null);

    // Authentication check
    useEffect(() => {
        const t = localStorage.getItem("jwt");
        if (!t) {
            router.replace("/auth/login");
            return;
        }
        setJwt(t);
    }, [router]);

    // Load tokens and devices
    useEffect(() => {
        if (!jwt) return;

        const loadData = async () => {
            setLoading(true);
            setError("");
            try {
                const [tokensData, devicesData] = await Promise.all([
                    getAPITokens(jwt),
                    getDevices(jwt),
                ]);
                setTokens(tokensData || []);
                setDevices(devicesData || []);
            } catch (e: any) {
                setError(e?.message || "Error loading data");
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [jwt]);

    const handleCreateToken = async () => {
        if (!jwt || !newTokenName.trim() || !selectedDevice) return;

        setLoading(true);
        setError("");
        try {
            const result = await createAPIToken(jwt, newTokenName.trim(), selectedDevice);
            setCreatedToken(result.token);
            setNewTokenName("");
            setSelectedDevice("");

            // Reload tokens
            const tokensData = await getAPITokens(jwt);
            setTokens(tokensData || []);
        } catch (e: any) {
            setError(e?.message || "Error creating token");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteToken = async (tokenId: number) => {
        if (!jwt || !confirm("¿Estás seguro de eliminar este token? Esta acción no se puede deshacer.")) return;

        setLoading(true);
        setError("");
        try {
            await deleteAPIToken(jwt, tokenId);

            // Reload tokens
            const tokensData = await getAPITokens(jwt);
            setTokens(tokensData || []);
        } catch (e: any) {
            setError(e?.message || "Error deleting token");
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert("Token copiado al portapapeles");
    };

    const closeCreateModal = () => {
        setShowCreateModal(false);
        setCreatedToken(null);
        setNewTokenName("");
        setSelectedDevice("");
    };

    return (
        <div className="container mx-auto px-4 py-6 space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-semibold">Gestión de Tokens API</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Administra los tokens de acceso para tus dispositivos
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                    + Crear Token
                </button>
            </header>

            {error && (
                <div className="rounded-lg bg-destructive/10 text-destructive px-4 py-3">
                    {error}
                </div>
            )}

            {/* Tokens List */}
            <div className="rounded-xl bg-card border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-muted/50 border-b border-border">
                            <tr>
                                <th className="text-left px-4 py-3 text-sm font-medium">Nombre</th>
                                <th className="text-left px-4 py-3 text-sm font-medium">Dispositivo</th>
                                <th className="text-left px-4 py-3 text-sm font-medium">Creado</th>
                                <th className="text-right px-4 py-3 text-sm font-medium">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && tokens.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="text-center py-8 text-muted-foreground">
                                        Cargando...
                                    </td>
                                </tr>
                            ) : tokens.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="text-center py-8 text-muted-foreground">
                                        No hay tokens creados. Crea uno para comenzar.
                                    </td>
                                </tr>
                            ) : (
                                tokens.map((token) => (
                                    <tr key={token.ID} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="font-medium">{token.Name}</div>
                                            <div className="text-xs text-muted-foreground font-mono">
                                                {token.TokenHash.substring(0, 16)}...
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md font-medium">
                                                {token.DeviceName}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">
                                            {new Date(token.CreatedAt).toLocaleDateString('es-CL', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                onClick={() => handleDeleteToken(token.ID)}
                                                disabled={loading}
                                                className="px-3 py-1 text-sm text-destructive hover:bg-destructive/10 rounded transition-colors disabled:opacity-50"
                                            >
                                                Eliminar
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Info Card */}
            <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-4">
                <h3 className="font-medium text-blue-600 dark:text-blue-400 mb-2">ℹ️ Información</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Cada token está asociado a un dispositivo específico</li>
                    <li>• Los tokens permiten que tus dispositivos envíen métricas al sistema</li>
                    <li>• Guarda el token en un lugar seguro, solo se muestra una vez al crearlo</li>
                    <li>• Puedes eliminar tokens que ya no uses</li>
                </ul>
            </div>

            {/* Create Token Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md space-y-4">
                        {!createdToken ? (
                            <>
                                <h3 className="text-lg font-semibold">Crear Nuevo Token</h3>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Nombre del Token</label>
                                        <input
                                            type="text"
                                            placeholder="Ej: Token Servidor Principal"
                                            value={newTokenName}
                                            onChange={(e) => setNewTokenName(e.target.value)}
                                            className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm"
                                            autoFocus
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Nombre del Dispositivo</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                list="devices-list"
                                                placeholder="Ej: servidor-linux-01"
                                                value={selectedDevice}
                                                onChange={(e) => setSelectedDevice(e.target.value)}
                                                className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm"
                                            />
                                            <datalist id="devices-list">
                                                {devices.map((device) => (
                                                    <option key={device} value={device} />
                                                ))}
                                            </datalist>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Escribe el nombre del nuevo dispositivo o selecciona uno existente.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={closeCreateModal}
                                        className="flex-1 px-4 py-2 bg-background hover:bg-accent border border-border rounded text-sm"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleCreateToken}
                                        disabled={loading || !newTokenName.trim() || !selectedDevice}
                                        className="flex-1 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded text-sm disabled:opacity-50"
                                    >
                                        {loading ? "Creando..." : "Crear"}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <h3 className="text-lg font-semibold">✅ Token Creado</h3>
                                <div className="space-y-2">
                                    <p className="text-sm text-muted-foreground">
                                        Guarda este token en un lugar seguro. No podrás verlo nuevamente.
                                    </p>
                                    <div className="bg-muted p-3 rounded-md font-mono text-sm break-all">
                                        {createdToken}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => copyToClipboard(createdToken)}
                                        className="flex-1 px-4 py-2 bg-background hover:bg-accent border border-border rounded text-sm"
                                    >
                                        📋 Copiar
                                    </button>
                                    <button
                                        onClick={closeCreateModal}
                                        className="flex-1 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded text-sm"
                                    >
                                        Cerrar
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
