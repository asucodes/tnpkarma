// One-time script to import CSV data into Google Sheets
import 'dotenv/config';
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// dotenv doesn't auto-load .env.local, so load it manually
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
    console.log('=== tnpkarma Data Import ===\n');

    // Step 1: Clear existing data (keep header)
    console.log('1. Clearing existing Logs data...');
    try {
        await sheets.spreadsheets.values.clear({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Logs!A2:F',
        });
        console.log('   ✓ Cleared all existing rows\n');
    } catch (e) {
        console.log('   ⚠ Could not clear:', e.message, '\n');
    }

    // Step 2: Read CSV
    console.log('2. Reading CSV data...');
    const csvPath = path.join(__dirname, '..', 'tnp_data.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.trim().split('\n').slice(1); // skip header

    const rows = lines.map(line => {
        const parts = line.split(',');
        const name = parts[0].trim();
        const rollNumber = parts[1].trim();
        const company = parts[2].trim();
        const hours = parseFloat(parts[3].trim());
        const timestamp = 'Imported';
        const upvotes = 0;
        return [timestamp, name, rollNumber, company, hours, upvotes];
    });

    console.log(`   Found ${rows.length} log entries\n`);

    // Step 3: Write all rows to sheet
    console.log('3. Writing to Google Sheet...');
    await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Logs!A:F',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            values: rows,
        },
    });
    console.log(`   ✓ Wrote ${rows.length} rows to Logs sheet\n`);

    // Step 4: Verify
    console.log('4. Verifying...');
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Logs!A2:F',
    });
    const count = res.data.values?.length || 0;
    console.log(`   ✓ Sheet now has ${count} log entries`);

    // Summary
    const uniqueNames = new Set(rows.map(r => r[1]));
    const uniqueCompanies = new Set(rows.map(r => r[3]));
    console.log(`\n=== Import Complete ===`);
    console.log(`   Volunteers with data: ${uniqueNames.size}`);
    console.log(`   Unique companies: ${uniqueCompanies.size}`);
    console.log(`   Total log entries: ${rows.length}`);
}

run().catch(err => {
    console.error('Import failed:', err.message);
    process.exit(1);
});
