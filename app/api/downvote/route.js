import { NextResponse } from 'next/server';
import { updateCell, getLogs } from '@/lib/sheets';
import { getSession } from '@/lib/auth';

export async function POST(request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ success: false, error: 'Not logged in' }, { status: 401 });

        const { rowIndex, company } = await request.json();
        if (!rowIndex || !company) return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 });

        const flaggerRoll = session.rollNumber;
        const logs = await getLogs();

        const hasAttended = logs.some(
            log => log.rollNumber === flaggerRoll &&
                log.company.trim().toLowerCase() === company.trim().toLowerCase() &&
                log.status === 'approved'
        );
        if (!hasAttended) return NextResponse.json({ success: false, error: `Your log for ${company} must be approved first.` }, { status: 403 });

        const targetLog = logs.find(log => log.rowIndex === rowIndex);
        if (!targetLog) return NextResponse.json({ success: false, error: 'Record not found' }, { status: 404 });
        if (targetLog.rollNumber === flaggerRoll) return NextResponse.json({ success: false, error: 'Cannot flag your own log.' }, { status: 403 });

        const newDownvotes = (targetLog.downvotes || 0) + 1;
        await updateCell('Logs', `G${rowIndex}`, newDownvotes);

        const net = (targetLog.upvotes || 0) - newDownvotes;
        return NextResponse.json({ success: true, downvotes: newDownvotes, net, disputed: net <= -3 });
    } catch (error) {
        console.error('Flag API Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to record flag' }, { status: 500 });
    }
}
