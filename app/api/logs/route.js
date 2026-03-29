import { getLogs } from '@/lib/sheets';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const logs = await getLogs();
        // Return most recent first
        return NextResponse.json(logs.reverse());
    } catch (error) {
        console.error('Error fetching logs:', error);
        return NextResponse.json([], { status: 500 });
    }
}
