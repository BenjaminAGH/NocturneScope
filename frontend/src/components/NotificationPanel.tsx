import { useEffect, useState } from 'react';
import { getNotifications } from '@/lib/api/api';
import { useLanguage } from '@/context/LanguageContext';

type Notification = {
    ID: number;
    user_id: number;
    type: 'system' | 'topology';
    title: string;
    message: string;
    device_name?: string;
    topic?: string;
    read: boolean;
    created_at: string;
};

export default function NotificationPanel({ jwt, fullPage = false }: { jwt: string, fullPage?: boolean }) {
    const { t } = useLanguage();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!jwt) return;
        setLoading(true);
        // If full page, maybe fetch more?
        const limit = fullPage ? 1000 : 50;
        getNotifications(jwt, limit)
            .then(data => setNotifications(data || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [jwt, fullPage]);

    // Color mapping
    const getTypeColor = (type: string, topic?: string) => {
        if (type === 'system') return 'border-l-4 border-blue-500 bg-blue-500/10';
        if (topic === 'alert') return 'border-l-4 border-red-500 bg-red-500/10';
        return 'border-l-4 border-yellow-500 bg-yellow-500/10';
    };

    const [filterType, setFilterType] = useState<'all' | 'system' | 'topology'>('all');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');

    const filteredNotifications = notifications.filter(n => {
        if (filterType !== 'all' && n.type !== filterType) return false;
        if (startDate && new Date(n.created_at) < new Date(startDate)) return false;
        if (endDate && new Date(n.created_at) > new Date(endDate + 'T23:59:59')) return false;
        return true;
    });

    return (
        <div className="w-full h-full p-4 bg-card rounded-xl border border-border/50 overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">{t('notifications') || 'Notifications'}</h2>
                {fullPage && (
                    <div className="flex gap-2">
                        <select
                            className="bg-background border rounded px-2 py-1 text-sm"
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value as any)}
                        >
                            <option value="all">{t('all') || 'All'}</option>
                            <option value="system">System</option>
                            <option value="topology">Topology</option>
                        </select>
                        <input
                            type="date"
                            className="bg-background border rounded px-2 py-1 text-sm"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                        <input
                            type="date"
                            className="bg-background border rounded px-2 py-1 text-sm"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                {loading && <div className="text-center p-4 text-muted-foreground">{t('loading') || 'Loading...'}</div>}

                {!loading && filteredNotifications.length === 0 && (
                    <div className="text-center p-4 text-muted-foreground">{t('noNotifications') || 'No notifications'}</div>
                )}

                {filteredNotifications.map((n) => (
                    <div key={n.ID} className={`p-3 rounded-md transition-all hover:bg-muted/50 ${getTypeColor(n.type, n.topic)}`}>
                        <div className="flex justify-between items-start">
                            <h3 className="font-semibold text-sm">{n.title}</h3>
                            <span className="text-[10px] text-muted-foreground opacity-70">
                                {new Date(n.created_at).toLocaleString()}
                            </span>
                        </div>
                        <p className="text-xs mt-1 opacity-90">{n.message}</p>
                        {n.device_name && (
                            <div className="mt-2 text-[10px] bg-background/50 inline-block px-1 rounded border border-border/30">
                                {n.device_name}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
