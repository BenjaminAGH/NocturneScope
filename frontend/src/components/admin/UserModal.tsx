"use client";

import { useState, useEffect } from "react";
import { User, CreateUserData, UpdateUserData } from "@/lib/api/admin";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useLanguage } from "@/context/LanguageContext";

interface UserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: CreateUserData | UpdateUserData) => Promise<void>;
    user?: User | null;
    mode: "create" | "edit";
}

export default function UserModal({ isOpen, onClose, onSave, user, mode }: UserModalProps) {
    const { t } = useLanguage();
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
                    setError(t('passwordRequired'));
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
            setError(err.message || t('errorOccurred'));
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card border border-border rounded-lg w-full max-w-md">
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <h2 className="text-xl font-semibold">
                        {mode === "create" ? t('createNewUser') : t('editUser')}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        disabled={loading}
                    >
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label htmlFor="username" className="block text-sm font-medium">
                            {t('username')}
                        </label>
                        <input
                            type="text"
                            id="username"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="email" className="block text-sm font-medium">
                            {t('email')}
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="role" className="block text-sm font-medium">
                            {t('role')}
                        </label>
                        <select
                            id="role"
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            required
                            disabled={loading}
                        >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                            <option value="devadmin">DevAdmin</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="password" className="block text-sm font-medium">
                            {t('password')} {mode === "edit" && <span className="text-muted-foreground text-xs">({t('leaveBlank')})</span>}
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            required={mode === "create"}
                            disabled={loading}
                        />
                    </div>

                    <div className="flex gap-2 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-background hover:bg-accent border border-border rounded text-sm transition-colors disabled:opacity-50"
                            disabled={loading}
                        >
                            {t('cancel')}
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded text-sm transition-colors disabled:opacity-50"
                            disabled={loading}
                        >
                            {loading ? t('saving') : mode === "create" ? t('create') : t('save')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
