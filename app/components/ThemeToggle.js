'use client';

import { useState, useEffect } from 'react';

export default function ThemeToggle() {
    const [theme, setTheme] = useState('light'); // 'light' is default
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // Only access localStorage on the client
        setMounted(true);
        const stored = localStorage.getItem('tnpkarma_theme') || 'light';
        setTheme(stored);
        document.documentElement.setAttribute('data-theme', stored);
    }, []);

    if (!mounted) {
        return null; // hide until hydration finishes so we don't mismatch
    }

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('tnpkarma_theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
    };

    return (
        <div className="theme-toggle-container">
            <button
                onClick={toggleTheme}
                className="btn"
                style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                title="Toggle Theme"
            >
                {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
            </button>
        </div>
    );
}
