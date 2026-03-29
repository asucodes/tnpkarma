'use client';

import { useState, useEffect, useRef } from 'react';

export default function LogPage() {
    const [volunteers, setVolunteers] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [selectedVolunteer, setSelectedVolunteer] = useState(null);
    const [nameQuery, setNameQuery] = useState('');
    const [showNameDropdown, setShowNameDropdown] = useState(false);
    const [company, setCompany] = useState('');
    const [isNewCompany, setIsNewCompany] = useState(false);
    const [newCompanyName, setNewCompanyName] = useState('');
    const [hours, setHours] = useState('');
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);
    const nameRef = useRef(null);

    useEffect(() => {
        fetch('/api/volunteers').then(r => r.json()).then(setVolunteers);
        fetch('/api/companies').then(r => r.json()).then(setCompanies);
    }, []);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (nameRef.current && !nameRef.current.contains(e.target)) {
                setShowNameDropdown(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const filteredVolunteers = volunteers.filter(v =>
        v.name.toLowerCase().includes(nameQuery.toLowerCase()) ||
        v.rollNumber.toLowerCase().includes(nameQuery.toLowerCase())
    );

    const showToast = (message, isError = false) => {
        setToast({ message, isError });
        setTimeout(() => setToast(null), 3000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedVolunteer || (!company && !newCompanyName) || !hours) {
            showToast('Please fill all fields', true);
            return;
        }

        if (isNewCompany) {
            const trimmedNewName = newCompanyName.trim();
            const lowerNewName = trimmedNewName.toLowerCase();

            // Validation to prevent duplicate or messy entries
            const existingMatch = companies.find(c => c.toLowerCase() === lowerNewName);
            if (existingMatch) {
                showToast(`This company already exists as "${existingMatch}". Please select it from the dropdown.`, true);
                return;
            }

            if (trimmedNewName.length < 2) {
                showToast('Company name is too short.', true);
                return;
            }
        }

        setLoading(true);
        try {
            const res = await fetch('/api/log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: selectedVolunteer.name,
                    rollNumber: selectedVolunteer.rollNumber,
                    company: isNewCompany ? newCompanyName.trim() : company,
                    hours: parseFloat(hours),
                }),
            });
            const data = await res.json();
            if (data.success) {
                showToast('✅ Logged successfully! +karma');
                // Reset form
                setSelectedVolunteer(null);
                setNameQuery('');
                setCompany('');
                setNewCompanyName('');
                setIsNewCompany(false);
                setHours('');
                // Refresh companies list
                fetch('/api/companies').then(r => r.json()).then(setCompanies);
            } else {
                showToast(data.error || 'Something went wrong', true);
            }
        } catch (err) {
            showToast('Network error. Try again.', true);
        } finally {
            setLoading(false);
        }
    };

    const selectVolunteer = (v) => {
        setSelectedVolunteer(v);
        setNameQuery(v.name);
        setShowNameDropdown(false);
    };

    return (
        <div className="page-content">
            {toast && (
                <div className="toast-container">
                    <div className={`toast ${toast.isError ? 'error' : ''}`}>{toast.message}</div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="animate-in card">
                {/* Volunteer Name */}
                <div className="form-group" ref={nameRef}>
                    <label className="form-label">Your Name</label>
                    <div className="search-dropdown-wrapper">
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Search your name..."
                            value={nameQuery}
                            onChange={(e) => {
                                setNameQuery(e.target.value);
                                setShowNameDropdown(true);
                                setSelectedVolunteer(null);
                            }}
                            onFocus={() => setShowNameDropdown(true)}
                            autoComplete="off"
                        />
                        {showNameDropdown && nameQuery && filteredVolunteers.length > 0 && (
                            <div className="search-dropdown-list">
                                {filteredVolunteers.map(v => (
                                    <div
                                        key={v.rollNumber}
                                        className="search-dropdown-item"
                                        onClick={() => selectVolunteer(v)}
                                    >
                                        {v.name}
                                        <span className="roll">{v.rollNumber}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Roll Number — auto filled */}
                <div className="form-group">
                    <label className="form-label">Roll Number</label>
                    <input
                        type="text"
                        className="form-input"
                        value={selectedVolunteer?.rollNumber || ''}
                        disabled
                        placeholder="Auto-filled on name select"
                        style={{ opacity: selectedVolunteer ? 1 : 0.5 }}
                    />
                </div>

                {/* Company / Event */}
                <div className="form-group">
                    <label className="form-label">Company / Event</label>
                    {!isNewCompany ? (
                        <>
                            <select
                                className="form-select"
                                value={company}
                                onChange={(e) => setCompany(e.target.value)}
                            >
                                <option value="">Select company/event...</option>
                                {companies.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                            <button
                                type="button"
                                className="add-new-toggle"
                                onClick={() => setIsNewCompany(true)}
                            >
                                + Add new company
                            </button>
                        </>
                    ) : (
                        <>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Type new company name..."
                                value={newCompanyName}
                                onChange={(e) => setNewCompanyName(e.target.value)}
                                autoFocus
                            />
                            <div className="disclaimer-text">
                                <strong>Important:</strong> Only add a new company if you are absolutely sure it isn't listed under another name. We want to avoid duplicate records.
                            </div>
                            <button
                                type="button"
                                className="add-new-toggle"
                                onClick={() => { setIsNewCompany(false); setNewCompanyName(''); }}
                            >
                                ← Back to list
                            </button>
                        </>
                    )}
                </div>

                {/* Hours */}
                <div className="form-group">
                    <label className="form-label">Hours</label>
                    <input
                        type="number"
                        className="form-input"
                        placeholder="e.g. 2.5"
                        value={hours}
                        onChange={(e) => setHours(e.target.value)}
                        min="0.5"
                        max="24"
                        step="0.5"
                    />
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading || !selectedVolunteer || (!company && !newCompanyName) || !hours}
                    style={{ width: '100%', marginTop: '8px' }}
                >
                    {loading ? <span className="spinner"></span> : 'Log It'}
                </button>
            </form>

            {/* Karma hint */}
            <div style={{
                textAlign: 'center',
                marginTop: '16px',
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
            }}>
                +10 karma per hour • +50 karma per new event
            </div>
        </div>
    );
}
