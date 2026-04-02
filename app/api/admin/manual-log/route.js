import { NextResponse } from 'next/server';
import { appendRow, VOLUNTEERS } from '@/lib/sheets';
import { getSession } from '@/lib/auth';

export async function POST(req) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Unauthorized. Admin only.' }, { status: 401 });
        }

        const body = await req.json();
        const { rollNumber, company, hours } = body;

        if (!rollNumber || !company || typeof hours !== 'number' || hours <= 0) {
            return NextResponse.json({ success: false, error: 'Invalid data' }, { status: 400 });
        }

        // Validate volunteer
        const volunteers = VOLUNTEERS;
        const volunteer = volunteers.find(v => v.rollNumber === rollNumber);

        if (!volunteer) {
            return NextResponse.json({ success: false, error: 'Volunteer not found' }, { status: 404 });
        }

        const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

        await appendRow('Logs', [
            timestamp,
            volunteer.name,
            rollNumber,
            company,
            hours.toString(),
            '0',
            '0',
            'approved', // Auto-approved
            session.name || 'Admin', // Approver name
            'manual_entry'
        ]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in manual log:', error);
        return NextResponse.json({ success: false, error: 'Failed to create log' }, { status: 500 });
    }
}
