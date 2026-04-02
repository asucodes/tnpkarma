import { getLogs } from '@/lib/sheets';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const logs = await getLogs();
        // Robust sort based on parsed timestamps
        logs.sort((a, b) => {
            const dateA = a._sortDate.getTime();
            const dateB = b._sortDate.getTime();

            // If both are 'Imported' (same date in my parser), use row order
            if (dateA === dateB) {
                return b.rowIndex - a.rowIndex; // Newer rows first
            }
            return dateB - dateA; // Newest dates first
        });
        return NextResponse.json(logs);
    } catch (error) {
        console.error('Error fetching logs:', error);
        return NextResponse.json([], { status: 500 });
    }
}
