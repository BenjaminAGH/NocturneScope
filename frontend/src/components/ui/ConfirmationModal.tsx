"use client";

import React from "react";
import { XMarkIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDangerous?: boolean;
}

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    isDangerous = false,
}: ConfirmationModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
            <div className="bg-card border border-border rounded-lg shadow-lg w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            {isDangerous && (
                                <div className="p-2 bg-destructive/10 rounded-full">
                                    <ExclamationTriangleIcon className="w-6 h-6 text-destructive" />
                                </div>
                            )}
                            <h3 className="text-lg font-semibold text-card-foreground">
                                {title}
                            </h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                    </div>

                    <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                        {message}
                    </p>

                    <div className="flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-md transition-colors"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors shadow-sm
                                ${isDangerous
                                    ? "bg-destructive hover:bg-destructive/90"
                                    : "bg-primary hover:bg-primary/90"
                                }`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
