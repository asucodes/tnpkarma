import { appendRow } from '@/lib/sheets';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const { name, rollNumber, company, hours } = await request.json();

        if (!name || !rollNumber || !company || !hours) {
            return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
        }

        const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
        await appendRow('Logs', [timestamp, name, rollNumber, company, parseFloat(hours), 0]);

        return NextResponse.json({ success: true, message: 'Log entry added!' });
    } catch (error) {
        console.error('Error adding log:', error);
        return NextResponse.json({ error: 'Failed to add log entry' }, { status: 500 });
    }
}
