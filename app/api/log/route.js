import { appendRow, getEvents, isEventOpen } from '@/lib/sheets';
import { getSession } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
        if (session.role === 'admin') return NextResponse.json({ error: 'Admin cannot log hours' }, { status: 403 });

        const { company, hours } = await request.json();
        if (!company || !hours) return NextResponse.json({ error: 'All fields are required' }, { status: 400 });

        const numericHours = parseFloat(hours);
        if (isNaN(numericHours) || numericHours <= 0 || numericHours > 24) {
            return NextResponse.json({ error: 'Hours must be a valid number between 0 and 24' }, { status: 400 });
        }

        // Validate event exists and is within 3-day window
        const events = await getEvents();
        const event = events.find(e => e.name.trim().toLowerCase() === company.trim().toLowerCase());
        if (!event) return NextResponse.json({ error: 'Event not found. Only admin-created events can be logged.' }, { status: 400 });
        if (!isEventOpen(event.createdAt)) return NextResponse.json({ error: 'This event closed 3 days after creation. Logging is no longer allowed.' }, { status: 400 });

        // Prepend single quote so Google Sheets treats it as plain text 
        // to avoid US-date auto-formatting bugs (e.g. 02/04 -> 4 Feb)
        const timestamp = "'" + new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
        // Col H = 'pending' for new submissions
        await appendRow('Logs', [timestamp, session.name, session.rollNumber, company, parseFloat(hours), 0, 0, 'pending']);

        return NextResponse.json({ success: true, message: 'Log submitted for approval!' });
    } catch (error) {
        console.error('Error adding log:', error);
        return NextResponse.json({ error: 'Failed to add log entry' }, { status: 500 });
    }
}
