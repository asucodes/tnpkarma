'use client';
import { useState, useEffect } from 'react';

export default function LogPage() {
    const [events, setEvents] = useState([]);
    const [company, setCompany] = useState('');
    const [hours, setHours] = useState('');
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);
    const [user, setUser] = useState(null);

    useEffect(() => {
        fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(data => {
            if (data?.user) setUser(data.user);
        });
        fetch('/api/events').then(r => r.json()).then(data => {
            // Only show events open for logging (within 3 days)
            const open = data.filter(ev => {
                if (!ev.createdAt) return false;
                return (Date.now() - new Date(ev.createdAt)) / 86400000 <= 3;
            });
            setEvents(open);
        });
    }, []);

    const showToast = (message, isError = false) => {
        setToast({ message, isError });
        setTimeout(() => setToast(null), 3000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!company || !hours) { showToast('Please fill all fields', true); return; }
        setLoading(true);
        try {
            const res = await fetch('/api/log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ company, hours: parseFloat(hours) }),
            });
            const data = await res.json();
            if (data.success) {
                showToast('Submitted! Pending admin approval ⏳');
                setCompany('');
                setHours('');
            } else {
                showToast(data.error || 'Something went wrong', true);
            }
        } catch {
            showToast('Network error. Try again.', true);
        } finally {
            setLoading(false);
        }
    };

    const [showWhatsNew, setShowWhatsNew] = useState(false);

    return (
        <div className="page-content">
            {toast && (
                <div className="toast-container">
                    <div className={`toast ${toast.isError ? 'error' : ''}`}>{toast.message}</div>
                </div>
            )}

            {/* What's New Section (Dropdown) */}
            <div className="whats-new animate-in">
                <div className="whats-new-summary" onClick={() => setShowWhatsNew(!showWhatsNew)}>
                    What's New {showWhatsNew ? '▲' : '▼'}
                </div>
                {showWhatsNew && (
                    <div className="whats-new-content animate-in">
                        <div className="whats-new-item">
                            <span className="whats-new-bullet">•</span>
                            <span><strong>User Accounts</strong>. Securely log in to track your karma.</span>
                        </div>
                        <div className="whats-new-item">
                            <span className="whats-new-bullet">•</span>
                            <span><strong>Flag & Witness</strong>. Witness peers to boost logs or flag suspicious activity.</span>
                        </div>
                        <div className="whats-new-item">
                            <span className="whats-new-bullet">•</span>
                            <span><strong>Approval Required</strong>. Logs now need to be approved by an admin to count.</span>
                        </div>
                        <div className="whats-new-item">
                            <span className="whats-new-bullet">•</span>
                            <span><strong>3 Day Expiry</strong>. Events close automatically 3 days after creation.</span>
                        </div>
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="animate-in card">
                {/* Logged-in identity */}
                {user && (
                    <div style={{ marginBottom: '14px', padding: '8px 10px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.8rem' }}>
                        Logging as <strong>{user.name}</strong>
                        <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>{user.rollNumber}</span>
                    </div>
                )}

                {/* Event selector from admin-created Events sheet */}
                <div className="form-group">
                    <label className="form-label">Event / Company</label>
                    {events.length === 0 ? (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: '8px 0' }}>
                            No open events right now. Events are created by admin and open for 3 days.
                        </div>
                    ) : (
                        <select className="form-select" value={company} onChange={e => setCompany(e.target.value)} required>
                            <option value="">Select event...</option>
                            {events.map(ev => (
                                <option key={ev.name} value={ev.name}>{ev.name}</option>
                            ))}
                        </select>
                    )}
                </div>

                {/* Hours */}
                <div className="form-group">
                    <label className="form-label">Hours Contributed</label>
                    <input
                        type="number"
                        className="form-input"
                        placeholder="e.g. 2.5"
                        value={hours}
                        onChange={e => setHours(e.target.value)}
                        min="0.5"
                        max="24"
                        step="0.5"
                        required
                    />
                </div>

                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading || !company || !hours || events.length === 0}
                    style={{ width: '100%', marginTop: '8px' }}
                >
                    {loading ? <span className="spinner"></span> : 'Log It'}
                </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                +10 karma per hour • +50 karma per unique event
            </div>

            <footer className="portal-footer animate-in">
                <div className="portal-footer-text">
                    <span className="portal-footer-managed">Managed by Ashirvad</span>
                    For any discrepancies, pls connect
                </div>
                <div className="portal-footer-socials">
                    <a href="https://wa.me/918957078438" target="_blank" rel="noopener noreferrer" className="social-link">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.067 2.877 1.215 3.076.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                        WhatsApp
                    </a>
                    <a href="https://discord.com/users/yuckfou__" target="_blank" rel="noopener noreferrer" className="social-link">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.632 12.632 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028 14.09 14.09 0 001.226-1.994.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.23 10.23 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" /></svg>
                        Discord
                    </a>
                </div>
            </footer>
        </div>
    );
}
