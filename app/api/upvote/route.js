import { NextResponse } from 'next/server';
import { updateCell, getLogs } from '@/lib/sheets';

export async function POST(request) {
    try {
        const { rowIndex, company, upvoterRoll } = await request.json();

        if (!rowIndex || !company || !upvoterRoll) {
            return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 });
        }

        // 1. Fetch all logs to verify if this upvoter actually attended this company
        const logs = await getLogs();

        const hasAttended = logs.some(
            log => log.rollNumber === upvoterRoll &&
                log.company.trim().toLowerCase() === company.trim().toLowerCase()
        );

        if (!hasAttended) {
            return NextResponse.json({
                success: false,
                error: `You haven't logged hours for ${company} yet! You can only upvote peers from events you attended.`
            }, { status: 403 });
        }

        // 2. Fetch current upvotes for the target row
        // Fast path: find the target row in the logs we already fetched
        const targetLog = logs.find(log => log.rowIndex === rowIndex);
        if (!targetLog) {
            return NextResponse.json({ success: false, error: 'Record not found' }, { status: 404 });
        }

        const currentUpvotes = targetLog.upvotes || 0;
        const newUpvotes = currentUpvotes + 1;

        // 3. Update the sheet
        // Column F is Upvotes (index 5)
        await updateCell('Logs', `F${rowIndex}`, newUpvotes);

        return NextResponse.json({ success: true, upvotes: newUpvotes });
    } catch (error) {
        console.error('Upvote API Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to record upvote' }, { status: 500 });
    }
}
