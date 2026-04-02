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
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px'
        }}>
            <span style={{ fontWeight: '700', color: 'var(--text-primary)', opacity: 0.9 }}>{user.name}</span>
            <div style={{ width: '1px', height: '10px', background: 'var(--border)' }}></div>
            <button
                onClick={handleLogout}
                style={{
                    background: 'none', border: 'none', padding: 0,
                    color: 'var(--accent)', cursor: 'pointer', fontSize: '0.7rem',
                    fontFamily: 'inherit', fontWeight: '800', textTransform: 'uppercase',
                    letterSpacing: '0.02em', transition: 'opacity 0.2s'
                }}
                onMouseOver={e => e.currentTarget.style.opacity = '0.7'}
                onMouseOut={e => e.currentTarget.style.opacity = '1'}
            >
                Logout
            </button>
        </div>
    );
}
