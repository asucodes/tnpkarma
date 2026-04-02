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

const TABS = [
  { key: 'karma', label: 'Karma', sortField: 'karma', unit: 'pts' },
  { key: 'events', label: 'Events', sortField: 'totalEvents', unit: 'events' },
  { key: 'hours', label: 'Hours', sortField: 'totalHours', unit: 'hrs' },
  { key: 'witnessed', label: 'Witnessed', sortField: 'totalWitnessed', unit: 'seen' },
];

export default function Leaderboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('karma');
  const [expandedRow, setExpandedRow] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/leaderboard');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const currentTab = TABS.find(t => t.key === activeTab);
  const sorted = [...data].sort((a, b) => b[currentTab.sortField] - a[currentTab.sortField]);

  const getRankClass = (rank) => {
    if (rank === 1) return 'rank-1';
    if (rank === 2) return 'rank-2';
    if (rank === 3) return 'rank-3';
    return 'rank-other';
  };

  const toggleRow = (rollNumber) => {
    setExpandedRow(prev => prev === rollNumber ? null : rollNumber);
  };

  if (loading) {
    return (
      <div className="page-content">
        <div className="loading-state">
          <div className="spinner"></div>
          <div style={{ marginTop: '8px' }}>Loading leaderboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      {/* Tabs */}
      <div className="tabs">
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={`tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="refresh-bar" onClick={fetchData}>↻ Refresh</div>

      {sorted.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🏆</div>
          <div className="empty-state-text">No data yet. Start logging hours!</div>
        </div>
      ) : (
        <div className="stagger">
          {sorted.map((item, index) => {
            const rank = index + 1;
            const isExpanded = expandedRow === item.rollNumber;
            const scoreValue = item[currentTab.sortField];
            return (
              <div key={item.rollNumber} className={`lb-row ${rank <= 3 ? 'top-3' : ''}`}>
                <div className="lb-row-header" onClick={() => toggleRow(item.rollNumber)}>
                  <div className={`lb-rank ${getRankClass(rank)}`}>{rank}</div>
                  <div className="lb-info">
                    <div className="lb-name">{item.name}</div>
                    <div className="lb-roll">{item.rollNumber}</div>
                  </div>
                  <div className="lb-score">
                    <div className="lb-score-value">{scoreValue}</div>
                    <div className="lb-score-label">{currentTab.unit}</div>
                  </div>
                </div>
                {isExpanded && item.logs && (
                  <div className="lb-details">
                    {item.logs.map((log) => (
                      <div
                        key={log.rowIndex}
                        className="lb-log-item"
                        style={log.disputed ? { opacity: 0.45, textDecoration: 'line-through' } : {}}
                      >
                        <div className="lb-log-company">
                          {log.company}
                          {log.disputed && <span style={{ marginLeft: '6px', fontSize: '0.65rem', color: '#e03d00', textDecoration: 'none', display: 'inline-block' }}>⚑ disputed</span>}
                        </div>
                        <div className="lb-log-stats">
                          <span className="lb-log-stat">⏱ {log.hours}h</span>
                          <span className="lb-log-stat">
                            <EyeIcon size={10} active={log.upvotes > 0} />
                            {log.upvotes}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
