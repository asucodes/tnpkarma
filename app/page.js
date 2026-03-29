'use client';

import { useState, useEffect } from 'react';

const TABS = [
  { key: 'events', label: 'Events', sortField: 'totalEvents', unit: 'events' },
  { key: 'hours', label: 'Hours', sortField: 'totalHours', unit: 'hrs' },
  { key: 'karma', label: 'Karma', sortField: 'karma', unit: 'pts' },
];

export default function Leaderboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('events');
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

  const getScoreValue = (item) => {
    return item[currentTab.sortField];
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

      <div className="refresh-bar" onClick={fetchData}>
        ↻ Refresh
      </div>

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
            return (
              <div
                key={item.rollNumber}
                className={`lb-row ${rank <= 3 ? 'top-3' : ''}`}
              >
                <div
                  className="lb-row-header"
                  onClick={() => toggleRow(item.rollNumber)}
                >
                  <div className={`lb-rank ${getRankClass(rank)}`}>
                    {rank}
                  </div>
                  <div className="lb-info">
                    <div className="lb-name">{item.name}</div>
                    <div className="lb-roll">{item.rollNumber}</div>
                  </div>
                  <div className="lb-score">
                    <div className="lb-score-value">{getScoreValue(item)}</div>
                    <div className="lb-score-label">{currentTab.unit}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px', fontWeight: 'bold' }}>
                      ▲ {item.totalUpvotes}
                    </div>
                  </div>
                </div>
                {isExpanded && item.logs && (
                  <div className="lb-details">
                    {item.logs.map((log) => (
                      <div key={log.rowIndex} className="lb-log-item">
                        <div className="lb-log-company">{log.company}</div>
                        <div className="lb-log-stats">
                          <span className="lb-log-stat">
                            ⏱ {log.hours}h
                          </span>
                          <span className="lb-log-stat">
                            ▲ {log.upvotes}
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
