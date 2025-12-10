"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NotificationPanel from "@/components/NotificationPanel";
import { useLanguage } from "@/context/LanguageContext";

export default function NotificationsPage() {
    const router = useRouter();
    const { t } = useLanguage();
    const [jwt, setJwt] = useState<string | null>(null);

    useEffect(() => {
        const token = localStorage.getItem("jwt");
        if (!token) {
            router.replace("/auth/login");
            return;
        }
        setJwt(token);
    }, [router]);

    if (!jwt) return null;

    return (
        <div className="container mx-auto px-4 py-6 h-[calc(100vh-var(--navbar-height))]">
            <div className="h-full">
                <NotificationPanel jwt={jwt} fullPage={true} />
            </div>
        </div>
    );
}
