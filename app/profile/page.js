'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

function parseAnyDate(ts) {
    if (!ts || ts === 'Imported') return new Date(2000, 0, 1);

    // DD/MM/YYYY
    const indianMatch = ts.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (indianMatch) {
        const [_, d, m, y] = indianMatch;
        // Check if there's a time part
        const timePart = ts.split(',')[1] || '';
        const date = new Date(`${m}/${d}/${y} ${timePart}`);
        if (!isNaN(date)) return date;
    }

    const d = new Date(ts);
    return isNaN(d) ? new Date(2000, 0, 1) : d;
}

function timeAgo(ts) {
    const d = parseAnyDate(ts);
    if (d.getFullYear() === 2000) return ts || 'Imported';

    const m = Math.floor((Date.now() - d) / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
}

export default function ProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/auth/me')
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (!data?.user) { router.push('/login'); return; }
                setUser(data.user);
                fetch('/api/logs').then(r => r.json()).then(allLogs => {
                    const mine = allLogs.filter(l => l.rollNumber === data.user.rollNumber);
                    // API returns newest first, so no need to reverse
                    setLogs(mine);
                    setLoading(false);
                });
            });
    }, []);

    const statusBadge = (status) => {
        if (status === 'approved') return { label: '✓ Approved', color: '#16a34a', bg: 'rgba(34,197,94,0.1)' };
        if (status === 'rejected') return { label: '✕ Rejected', color: '#dc2626', bg: 'rgba(220,38,38,0.08)' };
        return { label: '⏳ Pending', color: '#ca8a04', bg: 'rgba(234,179,8,0.1)' };
    };

    if (loading) return (
        <div className="page-content">
            <div className="loading-state"><div className="spinner"></div><div style={{ marginTop: '8px' }}>Loading...</div></div>
        </div>
    );

    return (
        <div className="page-content">
            <div className="card animate-in" style={{ marginBottom: '16px', background: 'var(--bg-secondary)' }}>
                <div style={{ fontWeight: '700', fontSize: '1rem' }}>{user?.name}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>{user?.rollNumber}</div>
            </div>

            <p style={{ fontSize: '0.8rem', fontWeight: '700', marginBottom: '10px' }}>My Logs</p>

            {logs.length === 0 ? (
                <div className="empty-state">
                    <div style={{ fontSize: '2rem', marginBottom: '8px' }}></div>
                    <div className="empty-state-text">No logs yet. Start logging your hours!</div>
                </div>
            ) : (
                <div className="stagger">
                    {logs.map(log => (
                        <div key={log.rowIndex} className="card" style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div style={{ fontWeight: '700', fontSize: '1.05rem', marginBottom: '2px' }}>{log.company}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }} suppressHydrationWarning>{timeAgo(log.timestamp)}</div>
                                <div style={{ marginTop: '6px', fontSize: '1.2rem', fontWeight: '800', color: 'var(--accent)' }}>{log.hours} <span style={{ fontSize: '0.8rem', fontWeight: '500' }}>hours</span></div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                                {log.status === 'pending' && <span style={{ padding: '4px 8px', background: 'var(--bg-secondary)', color: 'var(--text-muted)', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '700' }}>⏳ PENDING</span>}
                                {log.status === 'approved' && <span style={{ padding: '4px 8px', background: 'rgba(22, 163, 74, 0.15)', color: '#16a34a', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '700' }}>✓ APPROVED</span>}
                                {log.status === 'rejected' && <span style={{ padding: '4px 8px', background: 'rgba(220, 38, 38, 0.15)', color: '#dc2626', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '700' }}>✕ REJECTED</span>}

                                {log.approver && log.status !== 'pending' && (
                                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>by {log.approver}</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
