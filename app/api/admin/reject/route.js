import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { updateCell } from '@/lib/sheets';

export async function POST(request) {
    const session = await getSession();
    if (session?.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    const { rowIndex, approverName } = await request.json();
    await updateCell('Logs', `H${rowIndex}`, 'rejected');
    if (approverName) await updateCell('Logs', `I${rowIndex}`, approverName);
    return NextResponse.json({ success: true });
}
