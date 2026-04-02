'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

function IconBoard({ active }) {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--accent)' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 21v-4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4" />
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M12 7v4" /><path d="M8 11h8" />
        </svg>
    );
}
function IconLog({ active }) {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--accent)' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z" />
        </svg>
    );
}
function IconFeed({ active }) {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--accent)' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8Z" />
            <path d="M15 3v4a2 2 0 0 0 2 2h4" /><path d="M10 13h4" /><path d="M10 17h4" />
        </svg>
    );
}
function IconProfile({ active }) {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--accent)' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
        </svg>
    );
}

export default function BottomNav() {
    const pathname = usePathname();
    const [pendingCount, setPendingCount] = useState(0);
    const [isAdmin, setIsAdmin] = useState(false);

    // Auth pages don't need bottom nav
    const isAuthPage = pathname === '/login' || pathname === '/signup';

    useEffect(() => {
        if (isAuthPage) return;
        fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(data => {
            if (data?.user?.role === 'admin') {
                setIsAdmin(true);
                fetch('/api/admin/pending').then(r => r.json()).then(p => setPendingCount(p.length)).catch(() => { });
            } else {
                setIsAdmin(false);
            }
        }).catch(() => { setIsAdmin(false); });
    }, [pathname]);

    if (isAuthPage) return null;

    const items = [
        { href: '/', label: 'Board', Icon: IconBoard },
        { href: '/log', label: 'Log', Icon: IconLog },
        { href: '/feed', label: 'Feed', Icon: IconFeed },
        { href: '/profile', label: 'My Logs', Icon: IconProfile },
        ...(isAdmin ? [{ href: '/admin', label: `Admin${pendingCount > 0 ? ` (${pendingCount})` : ''}`, Icon: ({ active }) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--accent)' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg> }] : []),
    ];

    return (
        <nav className="bottom-nav">
            <div className="nav-inner">
                {items.map(item => {
                    const isActive = pathname === item.href;
                    return (
                        <Link key={item.href} href={item.href} className={`nav-item ${isActive ? 'active' : ''}`}>
                            <item.Icon active={isActive} />
                            {item.label}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
