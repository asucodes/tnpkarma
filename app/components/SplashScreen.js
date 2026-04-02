'use client';
import { useState, useEffect } from 'react';

export default function SplashScreen() {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setVisible(false);
        }, 3000);
        return () => clearTimeout(timer);
    }, []);

    if (!visible) return null;

    return (
        <div className="splash-container">
            <img src="/cat.png" alt="TnP Karma Mascot" className="splash-mascot" />
            <div className="splash-footer">
                <div className="splash-brand">TnP Karma</div>
            </div>
        </div>
    );
}
