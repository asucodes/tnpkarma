'use client';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function AuthHeader() {
    const [user, setUser] = useState(null);
    const router = useRouter();
    const pathname = usePathname();

    // Skip on auth pages
    const isAuthPage = pathname === '/login' || pathname === '/signup';

    useEffect(() => {
        if (isAuthPage) return;
        fetch('/api/auth/me')
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (data?.user) {
                    setUser(data.user);
                } else if (!isAuthPage) {
                    router.push('/login');
                }
            })
            .catch(() => { if (!isAuthPage) router.push('/login'); });
    }, [pathname]);

    if (isAuthPage || !user) return null;

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        setUser(null);
        router.push('/login');
    };

    return (
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '8px'
        }}>
            <span style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>{user.name}</span>
            <button
                onClick={handleLogout}
                style={{
                    background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.65rem', padding: '2px 7px',
                    fontFamily: 'inherit', fontWeight: '600', transition: 'all 0.15s'
                }}
            >
                Logout
            </button>
        </div>
    );
}
