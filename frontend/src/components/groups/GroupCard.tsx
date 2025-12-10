"use client";

import { DeviceGroup } from "@/context/GroupContext";
import { PencilIcon, TrashIcon, ServerIcon } from "@heroicons/react/24/outline";
import { useLanguage } from "@/context/LanguageContext";

interface GroupCardProps {
    group: DeviceGroup;
    onSelect: (group: DeviceGroup) => void;
    onEdit: (group: DeviceGroup) => void;
    onDelete: (group: DeviceGroup) => void;
}

export default function GroupCard({ group, onSelect, onEdit, onDelete }: GroupCardProps) {
    const { t } = useLanguage();
    return (
        <div
            className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer group relative overflow-hidden"
            onClick={() => onSelect(group)}
        >
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onEdit(group);
                    }}
                    className="p-2 hover:bg-muted rounded-full text-muted-foreground hover:text-primary transition-colors"
                    title={t('editGroup')}
                >
                    <PencilIcon className="w-4 h-4" />
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(group);
                    }}
                    className="p-2 hover:bg-destructive/10 rounded-full text-muted-foreground hover:text-destructive transition-colors"
                    title={t('deleteGroupTitle')}
                >
                    <TrashIcon className="w-4 h-4" />
                </button>
            </div>

            <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-lg text-primary">
                    <ServerIcon className="w-8 h-8" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">{group.Name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{group.Description || t('noDescription')}</p>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border/50 flex justify-between items-center text-xs text-muted-foreground">
                <span>{t('createdAt')}: {new Date(group.CreatedAt).toLocaleDateString()}</span>
            </div>
        </div>
    );
}
