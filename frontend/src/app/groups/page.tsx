"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGroup, DeviceGroup } from "@/context/GroupContext";
import { createDeviceGroup, updateDeviceGroup, deleteDeviceGroup } from "@/lib/api/groups";
import GroupCard from "@/components/groups/GroupCard";
import GroupModal from "@/components/groups/GroupModal";
import { PlusIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";

export default function GroupsPage() {
    const router = useRouter();
    const { groups, refreshGroups, setSelectedGroup, loading } = useGroup();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<DeviceGroup | null>(null);

    useEffect(() => {
        const token = localStorage.getItem("jwt");
        if (!token) {
            router.replace("/auth/login");
            return;
        }
        refreshGroups();
    }, [router]);

    const handleSelectGroup = (group: DeviceGroup) => {
        setSelectedGroup(group);
        router.push("/dashboard");
    };

    const handleCreateGroup = async (name: string, description: string) => {
        const token = localStorage.getItem("jwt");
        if (!token) return;

        try {
            await createDeviceGroup(token, name, description);
            toast.success("Grupo creado exitosamente");
            refreshGroups();
        } catch (error) {
            toast.error("Error al crear el grupo");
            console.error(error);
        }
    };

    const handleUpdateGroup = async (name: string, description: string) => {
        const token = localStorage.getItem("jwt");
        if (!token || !editingGroup) return;

        try {
            await updateDeviceGroup(token, editingGroup.ID, name, description);
            toast.success("Grupo actualizado exitosamente");
            refreshGroups();
        } catch (error) {
            toast.error("Error al actualizar el grupo");
            console.error(error);
        }
    };

    const handleDeleteGroup = async (group: DeviceGroup) => {
        if (!confirm(`¿Estás seguro de eliminar el grupo "${group.Name}"? Se eliminarán todos los tokens asociados.`)) {
            return;
        }

        const token = localStorage.getItem("jwt");
        if (!token) return;

        try {
            await deleteDeviceGroup(token, group.ID);
            toast.success("Grupo eliminado exitosamente");
            refreshGroups();
        } catch (error) {
            toast.error("Error al eliminar el grupo");
            console.error(error);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">Mis Grupos</h1>
                    <p className="text-muted-foreground">Selecciona un grupo para ver sus dispositivos</p>
                </div>
                <button
                    onClick={() => {
                        setEditingGroup(null);
                        setIsModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                    <PlusIcon className="w-5 h-5" />
                    Nuevo Grupo
                </button>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-48 bg-muted/20 animate-pulse rounded-xl" />
                    ))}
                </div>
            ) : groups.length === 0 ? (
                <div className="text-center py-12 bg-muted/10 rounded-xl border border-dashed border-border">
                    <h3 className="text-lg font-medium text-foreground mb-2">No tienes grupos creados</h3>
                    <p className="text-muted-foreground mb-4">Crea tu primer grupo para comenzar a monitorear dispositivos</p>
                    <button
                        onClick={() => {
                            setEditingGroup(null);
                            setIsModalOpen(true);
                        }}
                        className="text-primary hover:underline"
                    >
                        Crear mi primer grupo
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groups.map((group) => (
                        <GroupCard
                            key={group.ID}
                            group={group}
                            onSelect={handleSelectGroup}
                            onEdit={(g) => {
                                setEditingGroup(g);
                                setIsModalOpen(true);
                            }}
                            onDelete={handleDeleteGroup}
                        />
                    ))}
                </div>
            )}

            <GroupModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingGroup(null);
                }}
                onSubmit={editingGroup ? handleUpdateGroup : handleCreateGroup}
                group={editingGroup}
            />
        </div>
    );
}
