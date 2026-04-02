import { NextResponse } from 'next/server';
import { VOLUNTEERS, getUser } from '@/lib/sheets';
import { hashPassword, COOKIE_NAME } from '@/lib/auth';

export async function POST(request) {
    try {
        const { rollNumber, password } = await request.json();
        if (!rollNumber || !password) {
            return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 });
        }

        // Roll number must be in volunteer roster
        const volunteer = VOLUNTEERS.find(v => v.rollNumber === rollNumber);
        if (!volunteer) {
            return NextResponse.json({ success: false, error: 'Roll number not in volunteer roster' }, { status: 403 });
        }

        // Must not already have an account
        const existing = await getUser(rollNumber);
        if (existing) {
            return NextResponse.json({ success: false, error: 'Account already exists. Please login.' }, { status: 409 });
        }

        const passwordHash = await hashPassword(password);
        const { createUser } = await import('@/lib/sheets');
        await createUser(rollNumber, volunteer.name, passwordHash);

        return NextResponse.json({ success: true, name: volunteer.name });
    } catch (err) {
        console.error('Signup error:', err);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}
