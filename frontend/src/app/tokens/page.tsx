"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createApiToken, listApiTokens, deleteApiToken, getDevices, deleteDevice, getGroups, APIToken } from "@/lib/api/api";
import { InformationCircleIcon, CheckCircleIcon, ClipboardDocumentIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useNotification } from "@/context/NotificationContext";
import { useLanguage } from "@/context/LanguageContext";
import { useGroup, DeviceGroup } from "@/context/GroupContext";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

export default function TokensPage() {
    const router = useRouter();
    const { t } = useLanguage();
    const { groups: contextGroups, refreshGroups } = useGroup(); // Renamed to avoid conflict with local state
    const [jwt, setJwt] = useState<string | null>(null);
    const [tokens, setTokens] = useState<APIToken[]>([]);
    const [devices, setDevices] = useState<string[]>([]);
    const [groups, setGroups] = useState<DeviceGroup[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const { notify } = useNotification();

    // Modal state
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newTokenName, setNewTokenName] = useState("");
    const [selectedDevice, setSelectedDevice] = useState("");
    const [selectedGroupId, setSelectedGroupId] = useState<number | "">("");
    const [createdToken, setCreatedToken] = useState<string | null>(null);

    // Confirmation Modal state
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        isDangerous?: boolean;
    }>({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: () => { },
    });

    // Authentication check
    useEffect(() => {
        const t = localStorage.getItem("jwt");
        if (!t) {
            router.replace("/auth/login");
            return;
        }
        setJwt(t);
        refreshGroups();
    }, [router, refreshGroups]);

    // Load tokens and devices
    useEffect(() => {
        if (!jwt) return;

        const loadData = async () => {
            setLoading(true);
            setError("");
            try {
                const [tokensData, devicesData, groupsData] = await Promise.all([
                    listApiTokens(jwt),
                    getDevices(jwt),
                    getGroups(jwt),
                ]);
                setTokens(tokensData || []);
                setDevices(devicesData || []);
                setGroups(groupsData || []);
            } catch (e: any) {
                setError(e?.message || "Error loading data");
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [jwt]);

    const handleCreateToken = async () => {
        if (!jwt || !newTokenName.trim() || !selectedGroupId) return;

        setLoading(true);
        setError("");
        try {
            const result = await createApiToken(jwt, newTokenName.trim(), selectedDevice, Number(selectedGroupId));
            setCreatedToken(result.token);
            setNewTokenName("");
            setSelectedDevice("");
            setSelectedGroupId("");

            // Reload tokens
            const tokensData = await listApiTokens(jwt);
            setTokens(tokensData || []);
            notify("Token creado exitosamente", "success");
        } catch (e: any) {
            setError(e?.message || "Error creating token");
            notify(e?.message || "Error creando token", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteToken = async (tokenId: number) => {
        setConfirmModal({
            isOpen: true,
            title: t('deleteTopologyTitle'), // Or similar generic title like "Eliminar Token"
            message: t('confirmDeleteToken'),
            isDangerous: true,
            onConfirm: () => executeDeleteToken(tokenId),
        });
    };

    const executeDeleteToken = async (tokenId: number) => {
        if (!jwt) return;

        setLoading(true);
        setError("");
        try {
            await deleteApiToken(jwt, tokenId);

            // Reload tokens
            const tokensData = await listApiTokens(jwt);
            setTokens(tokensData || []);
        } catch (e: any) {
            setError(e?.message || "Error deleting token");
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        notify(t('copySuccess'), "success");
    };

    const closeCreateModal = () => {
        setShowCreateModal(false);
        setCreatedToken(null);
        setNewTokenName("");
        setSelectedDevice("");
        setSelectedGroupId("");
    };

    const handleDeleteDevice = async (name: string) => {
        setConfirmModal({
            isOpen: true,
            title: t('delete') + " " + t('device'),
            message: `${t('confirmDeleteDevice')} "${name}"?`,
            isDangerous: true,
            onConfirm: () => executeDeleteDevice(name),
        });
    };

    const executeDeleteDevice = async (name: string) => {
        try {
            const jwt = localStorage.getItem("jwt");
            if (!jwt) return;
            await deleteDevice(jwt, name);
            setDevices(devices.filter((d) => d !== name));
            notify(t('groupDeleted').replace('Grupo', 'Dispositivo'), "success"); // Recycling translation vaguely or adding new one would be better, but sticking to existing keys for now effectively
        } catch (e) {
            console.error(e);
            notify("Error al eliminar dispositivo", "error");
        }
    };

    return (
        <div className="container mx-auto px-4 py-6 space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-semibold">{t('tokenManagement')}</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {t('tokenManagementDesc')}
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                    + {t('createToken')}
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
                                <th className="text-left px-4 py-3 text-sm font-medium">{t('tokenName')}</th>
                                <th className="text-left px-4 py-3 text-sm font-medium">{t('status')}</th>
                                <th className="text-left px-4 py-3 text-sm font-medium">{t('device')}</th>
                                <th className="text-left px-4 py-3 text-sm font-medium">{t('group')}</th>
                                <th className="text-left px-4 py-3 text-sm font-medium">{t('createdAt')}</th>
                                <th className="text-right px-4 py-3 text-sm font-medium">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && tokens.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-8 text-muted-foreground">
                                        Cargando...
                                    </td>
                                </tr>
                            ) : tokens.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-8 text-muted-foreground">
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
                                            <div className="flex items-center gap-2">
                                                <div className={`w - 2 h - 2 rounded - full ${token.Status === 'online' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'} `} />
                                                <span className="text-xs text-muted-foreground capitalize">{token.Status === 'online' ? t('active') : t('inactive')}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            {token.DeviceName ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md font-medium">
                                                    {token.DeviceName}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-muted text-muted-foreground rounded-md font-medium text-xs">
                                                    {t('unassigned')}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">
                                            {/* We would need to fetch group info or include it in token response to show name here */}
                                            {token.GroupID ? `Grupo #${token.GroupID} ` : "Sin grupo"}
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
                                                {t('delete')}
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
                <h3 className="font-medium text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-2">
                    <InformationCircleIcon className="w-5 h-5" />
                    {t('infoTitle')}
                </h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• {t('infoToken1')}</li>
                    <li>• {t('infoToken2')}</li>
                    <li>• {t('infoToken3')}</li>
                    <li>• {t('infoToken4')}</li>
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
                                        <label className="text-sm font-medium">Grupo</label>
                                        <select
                                            value={selectedGroupId}
                                            onChange={(e) => setSelectedGroupId(Number(e.target.value))}
                                            className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm"
                                        >
                                            <option value="">Selecciona un grupo</option>
                                            {groups.map((group) => (
                                                <option key={group.ID} value={group.ID}>
                                                    {group.Name}
                                                </option>
                                            ))}
                                        </select>
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
                                            {t('deviceHint')}
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
                                        disabled={loading || !newTokenName.trim() || !selectedGroupId}
                                        className="flex-1 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded text-sm disabled:opacity-50"
                                    >
                                        {loading ? "Creando..." : "Crear"}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                                    Token Creado
                                </h3>
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
                                        onClick={() => createdToken && copyToClipboard(createdToken)}
                                        className="flex-1 px-4 py-2 bg-background hover:bg-accent border border-border rounded text-sm flex items-center justify-center gap-2"
                                    >
                                        <ClipboardDocumentIcon className="w-4 h-4" />
                                        Copiar
                                    </button>
                                    <button
                                        onClick={closeCreateModal}
                                        className="flex-1 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded text-sm"
                                    >
                                        {t('close')}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Dispositivos Detectados */}
            <div className="mt-12">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-semibold text-white">Dispositivos Detectados</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Equipos que han enviado métricas recientemente. Crea un token para gestionarlos.
                        </p>
                    </div>
                </div>

                <div className="bg-card/50 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10 bg-white/5">
                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Nombre del Dispositivo
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                                {devices.length === 0 ? (
                                    <tr>
                                        <td colSpan={2} className="px-4 py-8 text-center text-muted-foreground">
                                            No se han detectado dispositivos aún.
                                        </td>
                                    </tr>
                                ) : (
                                    devices.map((device) => {
                                        const hasToken = tokens.some(t => t.DeviceName === device);
                                        return (
                                            <tr key={device} className="hover:bg-white/5 transition-colors">
                                                <td className="px-4 py-3 text-sm font-medium text-white">
                                                    <div className="flex items-center gap-2">
                                                        {device}
                                                        {hasToken && (
                                                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-xs border border-emerald-500/20">
                                                                Gestionado
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-right">
                                                    <button
                                                        onClick={() => handleDeleteDevice(device)}
                                                        className="p-2 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 rounded-lg transition-colors"
                                                        title="Eliminar dispositivo"
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>


            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                isDangerous={confirmModal.isDangerous}
                confirmText={t('confirm')}
                cancelText={t('cancel')}
            />
        </div >
    );
}
