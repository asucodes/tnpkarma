import { NextResponse } from 'next/server';
import { getUser } from '@/lib/sheets';
import { verifyPassword, verifyAdmin, createToken, COOKIE_NAME } from '@/lib/auth';

export async function POST(request) {
    try {
        const { rollNumber, password, rememberMe } = await request.json();
        if (!rollNumber || !password) {
            return NextResponse.json({ success: false, error: 'Missing credentials' }, { status: 400 });
        }

        let payload;

        // Admin account — check via verifyAdmin (plaintext comparison, no env hash)
        if (verifyAdmin(rollNumber, password)) {
            payload = { rollNumber: 'admin', name: 'Admin', role: 'admin' };
        } else {
            const user = await getUser(rollNumber);
            if (!user) return NextResponse.json({ success: false, error: 'Account not found. Sign up first.' }, { status: 401 });
            const ok = await verifyPassword(password, user.passwordHash);
            if (!ok) return NextResponse.json({ success: false, error: 'Invalid password' }, { status: 401 });
            payload = { rollNumber: user.rollNumber, name: user.name, role: 'user' };
        }

        const token = createToken(payload, !!rememberMe);
        const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24;
        const response = NextResponse.json({ success: true, user: payload });
        response.cookies.set(COOKIE_NAME, token, {
            httpOnly: true,
            path: '/',
            maxAge,
            sameSite: 'lax',
        });
        return response;
    } catch (err) {
        console.error('Login error:', err);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}
