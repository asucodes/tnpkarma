// Migration script: set all existing Logs rows (col H) to 'approved'
// Run once: node scripts/migrate-status.mjs
import { google } from 'googleapis';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID_TEST || process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

const auth = new google.auth.GoogleAuth({
    credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

async function main() {
    // Get all rows from Logs
    const res = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: 'Logs!A2:H' });
    const rows = res.data.values || [];
    console.log(`Found ${rows.length} rows in Logs sheet.`);

    // Find rows where col H (index 7) is empty or not set
    const toUpdate = [];
    rows.forEach((row, idx) => {
        const status = row[7];
        if (!status || status.trim() === '' || status.trim() === '0') {
            toUpdate.push(idx + 2); // 1-indexed, skip header
        }
    });

    console.log(`${toUpdate.length} rows need status set to 'approved'.`);

    if (toUpdate.length === 0) {
        console.log('Nothing to do!');
        return;
    }

    // Batch update
    const data = toUpdate.map(rowIndex => ({
        range: `Logs!H${rowIndex}`,
        values: [['approved']],
    }));

    await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: { valueInputOption: 'USER_ENTERED', data },
    });

    console.log(`✓ Set ${toUpdate.length} rows to 'approved'.`);
}

main().catch(console.error);
