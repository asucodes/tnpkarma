'use client';

import { useState, useEffect } from 'react';

export default function Feed() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [upvoting, setUpvoting] = useState({});
    const [upvotedState, setUpvotedState] = useState({});
    const [showRules, setShowRules] = useState(false);

    // Peer upvote identity state
    const [volunteers, setVolunteers] = useState([]);
    const [identity, setIdentity] = useState(null); // { name, rollNumber }

    useEffect(() => {
        fetchData();
        fetch('/api/volunteers').then(r => r.json()).then(setVolunteers);

        // Load saved identity from localStorage
        try {
            const saved = localStorage.getItem('tnpkarma_identity');
            if (saved) setIdentity(JSON.parse(saved));

            const savedUpvotes = localStorage.getItem('tnpkarma_upvotes');
            if (savedUpvotes) setUpvotedState(JSON.parse(savedUpvotes));
        } catch (e) { }
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/logs');
            const json = await res.json();

            // Filter feed: hide old non-BPCL imports, show BPCL + all new entries
            const visibleLogs = json.filter(log =>
                log.timestamp !== 'Imported' || (log.company && log.company.toLowerCase().includes('bpcl'))
            );

            setLogs(visibleLogs.reverse()); // Newest first
        } catch (err) {
            console.error('Failed to fetch logs:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleIdentityChange = (e) => {
        const roll = e.target.value;
        if (!roll) {
            setIdentity(null);
            localStorage.removeItem('tnpkarma_identity');
            return;
        }
        const vol = volunteers.find(v => v.rollNumber === roll);
        if (vol) {
            setIdentity(vol);
            localStorage.setItem('tnpkarma_identity', JSON.stringify(vol));
        }
    };

    const handleUpvote = async (rowIndex, company) => {
        if (upvoting[rowIndex]) return;

        if (!identity) {
            alert("Please select your identity at the top first! We need to verify you attended the same event.");
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        setUpvoting(prev => ({ ...prev, [rowIndex]: true }));

        try {
            const res = await fetch('/api/upvote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    rowIndex,
                    company,
                    upvoterRoll: identity.rollNumber
                }),
            });
            const data = await res.json();

            if (data.success) {
                // Update local logs state
                setLogs(logs.map(log =>
                    log.rowIndex === rowIndex ? { ...log, upvotes: data.upvotes } : log
                ));

                // Save to local storage that WE upvoted this
                const newUpvoted = { ...upvotedState, [rowIndex]: true };
                setUpvotedState(newUpvoted);
                localStorage.setItem('tnpkarma_upvotes', JSON.stringify(newUpvoted));
            } else {
                alert(data.error || 'Failed to upvote');
            }
        } catch (err) {
            alert('Network error while upvoting.');
        } finally {
            setUpvoting(prev => ({ ...prev, [rowIndex]: false }));
        }
    };

    if (loading) {
        return (
            <div className="page-content">
                <div className="loading-state">
                    <div className="spinner"></div>
                    <div style={{ marginTop: '8px' }}>Loading feed...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="page-content">

            {/* Identity Selector & Rules */}
            <div className="card animate-in" style={{ marginBottom: '16px', background: 'var(--bg-secondary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '0.85rem' }}>Peer Upvoting</h3>
                    <button
                        onClick={() => setShowRules(!showRules)}
                        style={{
                            background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer',
                            fontWeight: 'bold', fontSize: '0.9rem', padding: '0 4px',
                            borderRadius: '50%', border: '1px solid var(--accent)', width: '20px', height: '20px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                    >
                        ?
                    </button>
                </div>

                {showRules && (
                    <div className="disclaimer-text" style={{ marginBottom: '12px' }}>
                        <strong>How it works:</strong> You can only upvote a peer's log if you <b>also logged hours</b> for that exact same Company/Event. Select your name below so we can verify your attendance!
                    </div>
                )}

                <select
                    className="form-select"
                    value={identity?.rollNumber || ''}
                    onChange={handleIdentityChange}
                    style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                >
                    <option value="">-- Identify yourself to upvote --</option>
                    {volunteers.map(v => (
                        <option key={v.rollNumber} value={v.rollNumber}>{v.name} ({v.rollNumber})</option>
                    ))}
                </select>
            </div>

            <div className="refresh-bar" onClick={fetchData}>
                ↻ Refresh feed
            </div>

            {logs.length === 0 ? (
                <div className="empty-state">
                    <div>📭</div>
                    <div className="empty-state-text">No activity yet.</div>
                </div>
            ) : (
                <div className="stagger">
                    {logs.map((log) => (
                        <div key={log.rowIndex} className="card feed-card">
                            <div className="feed-card-voter">
                                <button
                                    className={`upvote-btn ${upvotedState[log.rowIndex] ? 'upvoted' : ''}`}
                                    onClick={() => handleUpvote(log.rowIndex, log.company)}
                                    disabled={upvoting[log.rowIndex] || upvotedState[log.rowIndex]}
                                    title={upvotedState[log.rowIndex] ? "You peer-verified this!" : "Peer verify this"}
                                >
                                    <span className="arrow">▲</span>
                                    <span>{log.upvotes || 0}</span>
                                </button>
                            </div>
                            <div className="feed-card-content">
                                <div className="feed-header">
                                    <span className="feed-name">{log.name}</span>
                                    <span style={{ margin: '0 4px' }}>•</span>
                                    <span>Logged {log.hours} {log.hours === 1 ? 'hour' : 'hours'}</span>
                                </div>
                                <div className="feed-title">{log.company}</div>
                                <div style={{ marginTop: '6px' }}>
                                    <span className="feed-tag">+{Math.round(log.hours * 10)} karma</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
