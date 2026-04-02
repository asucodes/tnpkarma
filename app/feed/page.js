'use client';
import { useState, useEffect } from 'react';

function EyeIcon({ size = 14, active = false }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
            stroke={active ? 'var(--accent)' : 'currentColor'}
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    );
}

function FlagIcon({ active = false }) {
    return (
        <svg width={12} height={12} viewBox="0 0 24 24" fill={active ? '#e03d00' : 'none'}
            stroke={active ? '#e03d00' : 'currentColor'}
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
            <line x1="4" y1="22" x2="4" y2="15" />
        </svg>
    );
}

function timeAgo(timestampStr) {
    if (!timestampStr || timestampStr === 'Imported') return 'Imported';
    try {
        const d = new Date(timestampStr);
        if (isNaN(d)) return timestampStr;
        const m = Math.floor((Date.now() - d) / 60000);
        if (m < 1) return 'just now';
        if (m < 60) return `${m}m ago`;
        const h = Math.floor(m / 60);
        if (h < 24) return `${h}h ago`;
        const days = Math.floor(h / 24);
        return days === 1 ? '1 day ago' : days < 30 ? `${days} days ago` : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    } catch { return timestampStr; }
}

export default function Feed() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [witnessState, setWitnessState] = useState({});
    const [flagState, setFlagState] = useState({});
    const [acting, setActing] = useState({});
    const [bannerDismissed, setBannerDismissed] = useState(false);

    useEffect(() => {
        fetchData();
        try {
            const savedW = localStorage.getItem('tnpkarma_witnessed');
            if (savedW) setWitnessState(JSON.parse(savedW));
            const savedF = localStorage.getItem('tnpkarma_flagged');
            if (savedF) setFlagState(JSON.parse(savedF));
            const dismissed = localStorage.getItem('tnpkarma_banner_dismissed');
            if (dismissed) setBannerDismissed(true);
        } catch (e) { }
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/logs');
            const json = await res.json();
            // Show only approved logs; filter old non-BPCL imports from feed
            const visible = json.filter(log =>
                log.status === 'approved' &&
                (log.timestamp !== 'Imported' || log.company?.toLowerCase().includes('bpcl'))
            ).reverse();
            setLogs(visible);
        } catch { } finally { setLoading(false); }
    };

    const handleWitness = async (rowIndex, company) => {
        if (acting[rowIndex] || witnessState[rowIndex]) return;
        setActing(p => ({ ...p, [rowIndex]: true }));
        try {
            const res = await fetch('/api/upvote', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rowIndex, company }),
            });
            const data = await res.json();
            if (data.success) {
                setLogs(logs.map(l => l.rowIndex === rowIndex ? { ...l, upvotes: data.upvotes } : l));
                const next = { ...witnessState, [rowIndex]: true };
                setWitnessState(next);
                localStorage.setItem('tnpkarma_witnessed', JSON.stringify(next));
            } else { alert(data.error || 'Could not witness.'); }
        } catch { alert('Network error.'); }
        finally { setActing(p => ({ ...p, [rowIndex]: false })); }
    };

    const handleFlag = async (rowIndex, company) => {
        if (acting[rowIndex] || flagState[rowIndex]) return;
        setActing(p => ({ ...p, [rowIndex]: true }));
        try {
            const res = await fetch('/api/downvote', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rowIndex, company }),
            });
            const data = await res.json();
            if (data.success) {
                setLogs(logs.map(l => l.rowIndex === rowIndex ? { ...l, downvotes: data.downvotes, net: data.net, disputed: data.disputed } : l));
                const next = { ...flagState, [rowIndex]: true };
                setFlagState(next);
                localStorage.setItem('tnpkarma_flagged', JSON.stringify(next));
            } else { alert(data.error || 'Could not flag.'); }
        } catch { alert('Network error.'); }
        finally { setActing(p => ({ ...p, [rowIndex]: false })); }
    };

    if (loading) return (
        <div className="page-content">
            <div className="loading-state"><div className="spinner"></div><div style={{ marginTop: '8px' }}>Loading feed...</div></div>
        </div>
    );

    return (
        <div className="page-content">
            {/* Info Banner */}
            {!bannerDismissed && (
                <div className="witness-banner">
                    <div className="witness-banner-body">
                        <div className="witness-banner-row">
                            <span className="witness-banner-icon"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg></span>
                            <span><strong>Witness</strong> a log if you were at the same event and saw that person.</span>
                        </div>
                        <div className="witness-banner-row">
                            <span className="witness-banner-icon flag">⚑</span>
                            <span><strong>Flag</strong> if you attended and did <em>not</em> see them. Anonymous — 3+ net flags removes from leaderboard.</span>
                        </div>
                    </div>
                    <button className="witness-banner-close" onClick={() => { setBannerDismissed(true); localStorage.setItem('tnpkarma_banner_dismissed', '1'); }}>✕</button>
                </div>
            )}

            <div className="refresh-bar" onClick={fetchData}>↻ Refresh feed</div>

            {logs.length === 0 ? (
                <div className="empty-state"><div>📭</div><div className="empty-state-text">No approved activity yet.</div></div>
            ) : (
                <div className="stagger">
                    {logs.map((log) => {
                        const isDisputed = log.disputed;
                        return (
                            <div key={log.rowIndex} className={`card feed-card ${isDisputed ? 'feed-card-disputed' : ''}`}>
                                <div className="feed-card-voter">
                                    <button
                                        className={`witness-btn ${witnessState[log.rowIndex] ? 'witnessed' : ''}`}
                                        onClick={() => handleWitness(log.rowIndex, log.company)}
                                        disabled={acting[log.rowIndex] || witnessState[log.rowIndex] || isDisputed}
                                        title={witnessState[log.rowIndex] ? 'You witnessed this!' : 'I was there too'}
                                    >
                                        <EyeIcon active={witnessState[log.rowIndex]} />
                                        <span>{log.upvotes || 0}</span>
                                    </button>
                                    <button
                                        className={`flag-btn ${flagState[log.rowIndex] ? 'flagged' : ''}`}
                                        onClick={() => handleFlag(log.rowIndex, log.company)}
                                        disabled={acting[log.rowIndex] || flagState[log.rowIndex] || isDisputed}
                                        title={flagState[log.rowIndex] ? 'Flagged' : 'Flag as suspicious'}
                                    >
                                        <FlagIcon active={flagState[log.rowIndex]} />
                                    </button>
                                </div>
                                <div className="feed-card-content" style={isDisputed ? { textDecoration: 'line-through', opacity: 0.55 } : {}}>
                                    <div className="feed-header">
                                        <span className="feed-name">{log.name}</span>
                                        <span style={{ margin: '0 4px' }}>•</span>
                                        <span>Logged {log.hours} {log.hours === 1 ? 'hour' : 'hours'}</span>
                                        <span style={{ margin: '0 4px' }}>•</span>
                                        <span style={{ color: 'var(--text-muted)' }}>{timeAgo(log.timestamp)}</span>
                                    </div>
                                    <div className="feed-title">{log.company}</div>
                                    <div style={{ marginTop: '6px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                                        {isDisputed
                                            ? <span className="disputed-tag">⚑ Peer Disputed</span>
                                            : <span className="feed-tag">+{Math.round(log.hours * 10)} karma</span>
                                        }
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
