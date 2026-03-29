import 'dotenv/config';
import { google } from 'googleapis';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const auth = new google.auth.GoogleAuth({
    credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

async function run() {
    console.log('=== Filtering Logs for BPCL ===\n');

    console.log('1. Fetching all logs...');
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Logs!A2:F',
    });

    const rows = res.data.values || [];
    console.log(`   Found ${rows.length} total entries`);

    // Filter for BPCL
    const filtered = rows.filter(row => row[3] && row[3].toUpperCase().includes('BPCL'));
    console.log(`   Found ${filtered.length} BPCL entries`);

    console.log('2. Clearing existing Logs data...');
    await sheets.spreadsheets.values.clear({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Logs!A2:F',
    });

    if (filtered.length > 0) {
        console.log('3. Writing BPCL entries back to sheet...');
        await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Logs!A2:F',
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: filtered },
        });
        console.log('   ✓ Done writing');
    }

    console.log(`\n=== Cleanup Complete ===`);
}

run().catch(console.error);
