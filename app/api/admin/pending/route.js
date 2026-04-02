import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getLogs } from '@/lib/sheets';

export async function GET() {
    const session = await getSession();
    if (session?.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    const logs = await getLogs();
    const pending = logs.filter(l => l.status === 'pending');
    return NextResponse.json(pending);
}
