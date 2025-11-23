"use client";

import { useState, useEffect } from "react";
import { User, CreateUserData, UpdateUserData } from "@/lib/api/admin";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface UserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: CreateUserData | UpdateUserData) => Promise<void>;
    user?: User | null;
    mode: "create" | "edit";
}

export default function UserModal({ isOpen, onClose, onSave, user, mode }: UserModalProps) {
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        role: "user",
        password: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (mode === "edit" && user) {
            setFormData({
                username: user.username,
                email: user.email,
                role: user.role,
                password: "",
            });
        } else {
            setFormData({
                username: "",
                email: "",
                role: "user",
                password: "",
            });
        }
        setError("");
    }, [user, mode, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            if (mode === "create") {
                if (!formData.password) {
                    setError("Password is required for new users");
                    setLoading(false);
                    return;
                }
                await onSave(formData as CreateUserData);
            } else {
                // For edit mode, only send changed fields
                const updateData: UpdateUserData = {};
                if (formData.username !== user?.username) updateData.username = formData.username;
                if (formData.email !== user?.email) updateData.email = formData.email;
                if (formData.role !== user?.role) updateData.role = formData.role;
                if (formData.password) updateData.password = formData.password;

                await onSave(updateData);
            }
            onClose();
        } catch (err: any) {
            setError(err.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-xl font-semibold text-gray-900">
                        {mode === "create" ? "Create New User" : "Edit User"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                        disabled={loading}
                    >
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                            {error}
                        </div>
                    )}

                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                            Username
                        </label>
                        <input
                            type="text"
                            id="username"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                            Role
                        </label>
                        <select
                            id="role"
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            required
                            disabled={loading}
                        >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                            <option value="devadmin">DevAdmin</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                            Password {mode === "edit" && <span className="text-gray-500 text-xs">(leave blank to keep current)</span>}
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            required={mode === "create"}
                            disabled={loading}
                        />
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                            disabled={loading}
                        >
                            {loading ? "Saving..." : mode === "create" ? "Create" : "Save"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
