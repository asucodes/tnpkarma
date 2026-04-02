import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { updateUserPassword } from '@/lib/sheets';
import { hashPassword } from '@/lib/auth';

export async function POST(request) {
    const session = await getSession();
    if (session?.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    const { rollNumber, newPassword } = await request.json();
    if (!rollNumber || !newPassword) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    const hash = await hashPassword(newPassword);
    await updateUserPassword(rollNumber, hash);
    return NextResponse.json({ success: true });
}
