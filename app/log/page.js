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

    return (
        <div className="page-content">
            {toast && (
                <div className="toast-container">
                    <div className={`toast ${toast.isError ? 'error' : ''}`}>{toast.message}</div>
                </div>
            )}

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
                +10 karma per hour • +50 karma per unique event • Pending admin approval
            </div>
        </div>
    );
}
