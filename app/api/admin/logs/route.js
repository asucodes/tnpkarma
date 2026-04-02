import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getLogs } from '@/lib/sheets';

export async function GET() {
    const session = await getSession();
    if (session?.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    try {
        const logs = await getLogs();
        return NextResponse.json(logs);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
