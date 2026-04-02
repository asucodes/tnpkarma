'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

function parseIndianDate(ts) {
    if (!ts || ts === 'Imported') return null;
    const parts = ts.split(/[\s,]+/);
    if (parts.length >= 2) {
        const dateParts = parts[0].split('/');
        if (dateParts.length === 3) {
            // Force MM/DD/YYYY parsing
            const maybeD = new Date(`${dateParts[1]}/${dateParts[0]}/${dateParts[2]} ${parts[1]} ${parts[2] || ''}`);
            if (!isNaN(maybeD)) return maybeD;
        }
    }
    return new Date(ts);
}

function timeAgo(ts) {
    const d = parseIndianDate(ts);
    if (!d || isNaN(d)) return ts || '';
    const m = Math.floor((Date.now() - d) / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
}

function isExpired(createdAt) {
    if (!createdAt) return true;
    return (Date.now() - new Date(createdAt)) / 86400000 > 3;
}

export default function AdminPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [events, setEvents] = useState([]);
    const [allLogs, setAllLogs] = useState([]);
    const [approverName, setApproverName] = useState('');
    const [approverSet, setApproverSet] = useState(false);
    const [newEvent, setNewEvent] = useState('');
    const [creating, setCreating] = useState(false);
    const [expanded, setExpanded] = useState({});
    const [acting, setActing] = useState({});
    const [resetRoll, setResetRoll] = useState('');
    const [resetPass, setResetPass] = useState('');
    const [resetMsg, setResetMsg] = useState('');

    useEffect(() => {
        // Verify admin
        fetch('/api/auth/me').then(r => r.json()).then(data => {
            if (data.user?.role !== 'admin') { router.push('/login'); return; }
            const saved = sessionStorage.getItem('tnpkarma_approver');
            if (saved) { setApproverName(saved); setApproverSet(true); }
            fetchData();
        }).catch(() => router.push('/login'));
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [ev, logsRes] = await Promise.all([
                fetch('/api/events').then(r => r.json()).catch(() => []),
                fetch('/api/admin/logs').then(r => r.json()).catch(() => []),
            ]);
            setEvents(Array.isArray(ev) ? ev.reverse() : []); // newest first
            setAllLogs(Array.isArray(logsRes) ? logsRes : []);
        } catch (err) {
            console.error('Fetch error:', err);
        } finally { setLoading(false); }
    };

    const setApprover = () => {
        if (!approverName.trim()) return;
        sessionStorage.setItem('tnpkarma_approver', approverName.trim());
        setApproverSet(true);
    };

    const handleApprove = async (rowIndex) => {
        setActing(p => ({ ...p, [rowIndex]: true }));
        await fetch('/api/admin/approve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rowIndex, approverName }) });
        setAllLogs(p => p.map(l => l.rowIndex === rowIndex ? { ...l, status: 'approved', approver: approverName } : l));
        setActing(p => ({ ...p, [rowIndex]: false }));
    };

    const handleReject = async (rowIndex) => {
        setActing(p => ({ ...p, [rowIndex]: true }));
        await fetch('/api/admin/reject', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rowIndex, approverName }) });
        setAllLogs(p => p.map(l => l.rowIndex === rowIndex ? { ...l, status: 'rejected', approver: approverName } : l));
        setActing(p => ({ ...p, [rowIndex]: false }));
    };

    const handleCreateEvent = async (e) => {
        e.preventDefault();
        if (!newEvent.trim()) return;
        setCreating(true);
        await fetch('/api/admin/create-event', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newEvent.trim() }) });
        setNewEvent('');
        setCreating(false);
        fetchData();
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setResetMsg('');
        const res = await fetch('/api/admin/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rollNumber: resetRoll, newPassword: resetPass }) });
        const data = await res.json();
        setResetMsg(data.success ? `✓ Password reset for ${resetRoll}` : `Error: ${data.error}`);
        if (data.success) { setResetRoll(''); setResetPass(''); }
    };

    if (loading) return (
        <div className="page-content">
            <div className="loading-state"><div className="spinner"></div><div style={{ marginTop: '8px' }}>Loading admin panel...</div></div>
        </div>
    );

    // Group logs by event/company
    const logsByEvent = {};
    allLogs.forEach(log => {
        const key = log.company?.toLowerCase() || 'Unknown';
        if (!logsByEvent[key]) logsByEvent[key] = [];
        logsByEvent[key].push(log);
    });

    const pendingCount = allLogs.filter(l => l.status === 'pending').length;

    return (
        <div className="page-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: '700' }}>Admin Dashboard</h2>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {pendingCount > 0 && <span style={{ color: '#e03d00', fontWeight: '700' }}>{pendingCount} pending</span>}
                </span>
            </div>

            {/* Approver name prompt */}
            {!approverSet ? (
                <div className="card" style={{ marginBottom: '16px', background: 'var(--bg-secondary)' }}>
                    <p style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '10px' }}>Who is approving today?</p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <input className="form-input" placeholder="Your name (e.g. Nitin)" value={approverName} onChange={e => setApproverName(e.target.value)} style={{ flex: 1 }} />
                        <button className="btn btn-primary" onClick={setApprover}>Set</button>
                    </div>
                </div>
            ) : (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                    Approving as <strong style={{ color: 'var(--accent)' }}>{approverName}</strong>
                    <button onClick={() => setApproverSet(false)} style={{ marginLeft: '8px', background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.7rem', padding: 0 }}>change</button>
                </div>
            )}

            {/* Create Event */}
            <div className="card" style={{ marginBottom: '16px' }}>
                <p style={{ fontSize: '0.8rem', fontWeight: '700', marginBottom: '8px' }}>Create New Event</p>
                <form onSubmit={handleCreateEvent} style={{ display: 'flex', gap: '8px' }}>
                    <input className="form-input" placeholder="Event / Company name" value={newEvent} onChange={e => setNewEvent(e.target.value)} style={{ flex: 1 }} />
                    <button type="submit" className="btn btn-primary" disabled={creating}>{creating ? '...' : 'Create'}</button>
                </form>
            </div>

            {/* Recent Events & Logs */}
            <p style={{ fontSize: '0.8rem', fontWeight: '700', marginBottom: '8px' }}>Recent Events & Logs</p>
            {events.length === 0 ? (
                <div className="empty-state"><div></div><div className="empty-state-text">No events yet.</div></div>
            ) : events.map(ev => {
                const eKey = ev.name.toLowerCase();
                const eventLogs = logsByEvent[eKey] || [];
                const pCount = eventLogs.filter(l => l.status === 'pending').length;

                return (
                    <div key={ev.name} className="card" style={{ marginBottom: '10px' }}>
                        <div
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: expanded[ev.name] ? '10px' : 0 }}
                            onClick={() => setExpanded(p => ({ ...p, [ev.name]: !p[ev.name] }))}
                        >
                            <div>
                                <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>{ev.name}</span>
                                <div style={{ color: isExpired(ev.createdAt) ? '#e03d00' : 'var(--text-muted)', fontSize: '0.65rem', marginTop: '2px' }}>
                                    {isExpired(ev.createdAt) ? 'Closed' : 'Open'} · {timeAgo(ev.createdAt)}
                                </div>
                            </div>
                            <span style={{ fontSize: '0.75rem', color: pCount > 0 ? '#e03d00' : 'var(--text-muted)', fontWeight: '700' }}>
                                {pCount > 0 ? `${pCount} pending` : `${eventLogs.length} logs`} {expanded[ev.name] ? '▲' : '▼'}
                            </span>
                        </div>

                        {expanded[ev.name] && (
                            eventLogs.length === 0 ? (
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '8px 0', borderTop: '1px solid var(--border-light)' }}>No logs submitted for this event yet.</div>
                            ) : (
                                eventLogs.sort((a, b) => b.rowIndex - a.rowIndex).map(log => (
                                    <div key={log.rowIndex} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid var(--border-light)', gap: '8px' }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: '600', fontSize: '0.82rem' }}>{log.name}</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{log.rollNumber} · {log.hours}h · {timeAgo(log.timestamp)}</div>
                                        </div>

                                        {log.status === 'pending' ? (
                                            <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                                                <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '0.72rem' }} disabled={acting[log.rowIndex] || !approverSet} onClick={() => handleApprove(log.rowIndex)}>✓ Approve</button>
                                                <button className="btn" style={{ padding: '4px 10px', fontSize: '0.72rem', borderColor: '#e03d00', color: '#e03d00' }} disabled={acting[log.rowIndex] || !approverSet} onClick={() => handleReject(log.rowIndex)}>✕ Reject</button>
                                            </div>
                                        ) : (
                                            <div style={{ fontSize: '0.65rem', fontWeight: '600', textAlign: 'right', color: log.status === 'approved' ? '#16a34a' : '#dc2626' }}>
                                                {log.status === 'approved' ? '✓ Approved' : '✕ Rejected'}
                                                {log.approver && <div style={{ color: 'var(--text-muted)', fontWeight: '500' }}>by {log.approver}</div>}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )
                        )}
                    </div>
                );
            })}

            {/* Password Reset */}
            <div className="card" style={{ marginTop: '16px' }}>
                <p style={{ fontSize: '0.8rem', fontWeight: '700', marginBottom: '8px' }}>Reset Student Password</p>
                <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <input className="form-input" placeholder="Roll Number" value={resetRoll} onChange={e => setResetRoll(e.target.value)} />
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <input className="form-input" placeholder="New Temporary Password" value={resetPass} onChange={e => setResetPass(e.target.value)} style={{ flex: 1 }} />
                        <button type="submit" className="btn">Reset</button>
                    </div>
                    {resetMsg && <div style={{ fontSize: '0.78rem', color: resetMsg.startsWith('✓') ? '#16a34a' : '#e03d00' }}>{resetMsg}</div>}
                </form>
            </div>
        </div>
    );
}
