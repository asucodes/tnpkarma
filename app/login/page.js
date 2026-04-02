'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LoginPage() {
    const router = useRouter();
    const [rollNumber, setRollNumber] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rollNumber, password, rememberMe }),
            });
            const data = await res.json();
            if (data.success) {
                if (data.user?.role === 'admin') {
                    router.push('/admin');
                } else {
                    router.push('/');
                }
            } else {
                setError(data.error || 'Login failed');
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
                {/* Sign In Card */}

                <div className="card" style={{ padding: '24px' }}>
                    <h1 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '16px' }}>Sign In</h1>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Roll Number</label>
                            <input
                                className="form-input"
                                type="text"
                                placeholder="e.g. 1983UME0001"
                                value={rollNumber}
                                onChange={e => setRollNumber(e.target.value.trim())}
                                required
                                autoComplete="username"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <input
                                className="form-input"
                                type="password"
                                placeholder="Your password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                            />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                            <input
                                type="checkbox"
                                id="remember"
                                checked={rememberMe}
                                onChange={e => setRememberMe(e.target.checked)}
                                style={{ cursor: 'pointer' }}
                            />
                            <label htmlFor="remember" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                Remember me for 30 days
                            </label>
                        </div>

                        {error && (
                            <div style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.3)', borderRadius: 'var(--radius-sm)', padding: '8px 10px', marginBottom: '12px', fontSize: '0.8rem', color: '#dc2626' }}>
                                {error}
                            </div>
                        )}

                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        New volunteer?{' '}
                        <a href="/signup" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: '600' }}>
                            Create account
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
