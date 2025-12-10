"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAccessToken } from "@/lib/api/api";
import { listUsers, createUser, updateUser, deleteUser, User, CreateUserData, UpdateUserData } from "@/lib/api/admin";
import { useLanguage } from "@/context/LanguageContext";
import UserTable from "@/components/admin/UserTable";
import UserModal from "@/components/admin/UserModal";
import { PlusIcon } from "@heroicons/react/24/outline";

export default function AdminUsersPage() {
    const router = useRouter();
    const { t } = useLanguage();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"create" | "edit">("create");
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<User | null>(null);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            setError("");
            const jwt = getAccessToken();
            if (!jwt) {
                router.push("/auth/login");
                return;
            }
            const data = await listUsers(jwt);
            setUsers(data);
        } catch (err: any) {
            setError(err.message || "Failed to load users");
            if (err.message === "Unauthorized") {
                router.push("/auth/login");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (data: CreateUserData | UpdateUserData) => {
        const jwt = getAccessToken();
        if (!jwt) return;
        await createUser(jwt, data as CreateUserData);
        await loadUsers();
    };

    const handleUpdateUser = async (data: CreateUserData | UpdateUserData) => {
        if (!selectedUser) return;
        const jwt = getAccessToken();
        if (!jwt) return;
        await updateUser(jwt, selectedUser.id, data as UpdateUserData);
        await loadUsers();
    };

    const handleDeleteUser = async (user: User) => {
        const jwt = getAccessToken();
        if (!jwt) return;
        try {
            await deleteUser(jwt, user.id);
            await loadUsers();
            setDeleteConfirm(null);
        } catch (err: any) {
            alert(err.message || "Failed to delete user");
        }
    };

    const openCreateModal = () => {
        setSelectedUser(null);
        setModalMode("create");
        setIsModalOpen(true);
    };

    const openEditModal = (user: User) => {
        setSelectedUser(user);
        setModalMode("edit");
        setIsModalOpen(true);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-muted-foreground">{t('loading')}</div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-6 space-y-6">
            <header className="space-y-1">
                <h1 className="text-2xl font-semibold">{t('userManagement')}</h1>
                <p className="text-sm text-muted-foreground">{t('manageUsersDesc')}</p>
            </header>

            {error && (
                <div className="rounded-lg bg-destructive/10 text-destructive px-4 py-3">
                    {error}
                </div>
            )}

            <div className="mb-6">
                <button
                    onClick={openCreateModal}
                    className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    {t('createUser')}
                </button>
            </div>

            <div className="rounded-xl bg-card border border-border overflow-hidden">
                <UserTable
                    users={users}
                    onEdit={openEditModal}
                    onDelete={(user) => setDeleteConfirm(user)}
                />
            </div>

            <UserModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={modalMode === "create" ? handleCreateUser : handleUpdateUser}
                user={selectedUser}
                mode={modalMode}
            />

            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md space-y-4">
                        <h3 className="text-lg font-semibold">{t('confirmDeleteUser')}</h3>
                        <p className="text-muted-foreground">
                            {t('deleteUserMsg')} <strong className="text-foreground">{deleteConfirm.username}</strong>?
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 px-4 py-2 bg-background hover:bg-accent border border-border rounded text-sm"
                            >
                                {t('cancel')}
                            </button>
                            <button
                                onClick={() => handleDeleteUser(deleteConfirm)}
                                className="flex-1 px-4 py-2 bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded text-sm"
                            >
                                {t('delete')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
