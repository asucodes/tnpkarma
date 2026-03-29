import { VOLUNTEERS } from '@/lib/sheets';
import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json(VOLUNTEERS);
}
