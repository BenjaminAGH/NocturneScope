"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getDeviceGroups } from "@/lib/api/groups";

export interface DeviceGroup {
    ID: number;
    Name: string;
    Description: string;
    CreatedAt: string;
    UpdatedAt: string;
}

interface GroupContextType {
    selectedGroup: DeviceGroup | null;
    setSelectedGroup: (group: DeviceGroup | null) => void;
    groups: DeviceGroup[];
    refreshGroups: () => Promise<void>;
    loading: boolean;
    initialized: boolean;
}

const GroupContext = createContext<GroupContextType | undefined>(undefined);

export function GroupProvider({ children }: { children: ReactNode }) {
    const [selectedGroup, setSelectedGroupState] = useState<DeviceGroup | null>(null);
    const [groups, setGroups] = useState<DeviceGroup[]>([]);
    const [loading, setLoading] = useState(false);
    const [initialized, setInitialized] = useState(false);

    // Load selected group from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem("selectedGroup");
        if (saved) {
            try {
                setSelectedGroupState(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse saved group", e);
            }
        }
        setInitialized(true);
    }, []);

    const setSelectedGroup = (group: DeviceGroup | null) => {
        setSelectedGroupState(group);
        if (group) {
            localStorage.setItem("selectedGroup", JSON.stringify(group));
        } else {
            localStorage.removeItem("selectedGroup");
        }
    };

    const refreshGroups = async () => {
        const token = localStorage.getItem("jwt");
        if (!token) return;

        setLoading(true);
        try {
            const data = await getDeviceGroups(token);
            setGroups(data);

            // If selected group exists but is not in the list (deleted), clear selection
            if (selectedGroup && !data.find(g => g.ID === selectedGroup.ID)) {
                setSelectedGroup(null);
            }
        } catch (error) {
            console.error("Failed to fetch groups", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <GroupContext.Provider value={{ selectedGroup, setSelectedGroup, groups, refreshGroups, loading, initialized }}>
            {children}
        </GroupContext.Provider>
    );
}

export function useGroup() {
    const context = useContext(GroupContext);
    if (context === undefined) {
        throw new Error("useGroup must be used within a GroupProvider");
    }
    return context;
}
