import { getLeaderboardData } from '@/lib/sheets';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const data = await getLeaderboardData();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        return NextResponse.json([], { status: 500 });
    }
}
