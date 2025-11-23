"use client";

import { useState } from "react";
import { User } from "@/lib/api/admin";
import { TrashIcon, PencilIcon } from "@heroicons/react/24/outline";

interface UserTableProps {
    users: User[];
    onEdit: (user: User) => void;
    onDelete: (user: User) => void;
}

export default function UserTable({ users, onEdit, onDelete }: UserTableProps) {
    const [sortField, setSortField] = useState<keyof User>("id");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

    const handleSort = (field: keyof User) => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDirection("asc");
        }
    };

    const sortedUsers = [...users].sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];

        if (aVal === undefined || bVal === undefined) return 0;

        if (typeof aVal === "string" && typeof bVal === "string") {
            return sortDirection === "asc"
                ? aVal.localeCompare(bVal)
                : bVal.localeCompare(aVal);
        }

        if (typeof aVal === "number" && typeof bVal === "number") {
            return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
        }

        return 0;
    });

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case "devadmin":
                return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
            case "admin":
                return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
            case "user":
                return "bg-primary/10 text-primary border-primary/20";
            default:
                return "bg-muted text-muted-foreground border-border";
        }
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead className="bg-muted/50 border-b border-border">
                    <tr>
                        <th
                            className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-muted/70 transition-colors"
                            onClick={() => handleSort("id")}
                        >
                            ID {sortField === "id" && (sortDirection === "asc" ? "↑" : "↓")}
                        </th>
                        <th
                            className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-muted/70 transition-colors"
                            onClick={() => handleSort("username")}
                        >
                            Username {sortField === "username" && (sortDirection === "asc" ? "↑" : "↓")}
                        </th>
                        <th
                            className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-muted/70 transition-colors"
                            onClick={() => handleSort("email")}
                        >
                            Email {sortField === "email" && (sortDirection === "asc" ? "↑" : "↓")}
                        </th>
                        <th
                            className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-muted/70 transition-colors"
                            onClick={() => handleSort("role")}
                        >
                            Role {sortField === "role" && (sortDirection === "asc" ? "↑" : "↓")}
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {sortedUsers.map((user) => (
                        <tr key={user.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3 text-sm">
                                {user.id}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium">
                                {user.username}
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                                {user.email}
                            </td>
                            <td className="px-4 py-3">
                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-md border ${getRoleBadgeColor(user.role)}`}>
                                    {user.role}
                                </span>
                            </td>
                            <td className="px-4 py-3 text-right text-sm font-medium">
                                <button
                                    onClick={() => onEdit(user)}
                                    className="text-primary hover:text-primary/80 mr-4 inline-flex items-center transition-colors"
                                    title="Edit user"
                                >
                                    <PencilIcon className="h-5 w-5" />
                                </button>
                                <button
                                    onClick={() => onDelete(user)}
                                    className="text-destructive hover:text-destructive/80 inline-flex items-center transition-colors"
                                    title="Delete user"
                                >
                                    <TrashIcon className="h-5 w-5" />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {users.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                    No users found
                </div>
            )}
        </div>
    );
}
