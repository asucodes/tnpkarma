import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createEvent } from '@/lib/sheets';

export async function POST(request) {
    const session = await getSession();
    if (session?.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    const { name } = await request.json();
    if (!name?.trim()) return NextResponse.json({ error: 'Event name required' }, { status: 400 });
    await createEvent(name.trim(), 'admin');
    return NextResponse.json({ success: true });
}
