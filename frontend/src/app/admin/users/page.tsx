"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAccessToken } from "@/lib/api/api";
import { listUsers, createUser, updateUser, deleteUser, User, CreateUserData, UpdateUserData } from "@/lib/api/admin";
import UserTable from "@/components/admin/UserTable";
import UserModal from "@/components/admin/UserModal";
import { PlusIcon } from "@heroicons/react/24/outline";

export default function AdminUsersPage() {
    const router = useRouter();
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
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-gray-600">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
                    <p className="mt-2 text-gray-600">Manage all users in the system</p>
                </div>

                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                        {error}
                    </div>
                )}

                <div className="mb-6">
                    <button
                        onClick={openCreateModal}
                        className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                    >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Create User
                    </button>
                </div>

                <div className="bg-white rounded-lg shadow">
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
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Delete</h3>
                            <p className="text-gray-600 mb-6">
                                Are you sure you want to delete user <strong>{deleteConfirm.username}</strong>? This action cannot be undone.
                            </p>
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDeleteUser(deleteConfirm)}
                                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
