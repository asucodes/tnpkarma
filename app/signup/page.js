'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

// We need the volunteer list client-side; fetch it from the API
export default function SignupPage() {
    const router = useRouter();
    const [rollNumber, setRollNumber] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [volunteers, setVolunteers] = useState([]);

    // Load volunteers from API on mount
    useEffect(() => {
        fetch('/api/volunteers').then(r => r.json()).then(setVolunteers);
    }, []);

    const handleRollChange = (e) => {
        const roll = e.target.value;
        setRollNumber(roll);
        const vol = volunteers.find(v => v.rollNumber === roll);
        setName(vol ? vol.name : '');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (password !== confirm) { setError('Passwords do not match'); return; }
        if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
        setLoading(true);
        try {
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rollNumber, password }),
            });
            const data = await res.json();
            if (data.success) {
                setSuccess(`Account created for ${data.name}! Redirecting to login...`);
                setTimeout(() => router.push('/login'), 1500);
            } else {
                setError(data.error || 'Signup failed');
            }
        } catch {
            setError('Network error. Try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'var(--bg-primary)' }}>
            <div style={{ width: '100%', maxWidth: '380px' }}>
                {/* Create Account Card */}

                <div className="card" style={{ padding: '24px' }}>
                    <h1 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '16px' }}>Create Account</h1>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Select Your Name</label>
                            <select className="form-select" value={rollNumber} onChange={handleRollChange} required>
                                <option value="">-- Select your name --</option>
                                {volunteers.map(v => (
                                    <option key={v.rollNumber} value={v.rollNumber}>{v.name} ({v.rollNumber})</option>
                                ))}
                            </select>
                        </div>

                        {name && (
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '12px', marginTop: '-6px' }}>
                                Roll: <strong>{rollNumber}</strong>
                            </div>
                        )}

                        <div className="form-group">
                            <label className="form-label">Set Password</label>
                            <input className="form-input" type="password" placeholder="Min. 6 characters" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="new-password" />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Confirm Password</label>
                            <input className="form-input" type="password" placeholder="Repeat password" value={confirm} onChange={e => setConfirm(e.target.value)} required autoComplete="new-password" />
                        </div>

                        {error && <div style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.3)', borderRadius: 'var(--radius-sm)', padding: '8px 10px', marginBottom: '12px', fontSize: '0.8rem', color: '#dc2626' }}>{error}</div>}
                        {success && <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 'var(--radius-sm)', padding: '8px 10px', marginBottom: '12px', fontSize: '0.8rem', color: '#16a34a' }}>{success}</div>}

                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                            {loading ? 'Creating...' : 'Create Account'}
                        </button>
                    </form>

                    <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Already have an account?{' '}
                        <a href="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: '600' }}>Sign in</a>
                    </div>
                </div>
            </div>
        </div>
    );
}
