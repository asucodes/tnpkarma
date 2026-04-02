import { NextResponse } from 'next/server';
import { getEvents } from '@/lib/sheets';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';
    const events = await getEvents(force);
    return NextResponse.json(events);
}
