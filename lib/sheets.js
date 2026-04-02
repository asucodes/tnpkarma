import 'server-only';
import { google } from 'googleapis';
function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

function getSheets() {
  const auth = getAuth();
  return google.sheets({ version: 'v4', auth });
}

const SPREADSHEET_ID = process.env.NODE_ENV === 'development'
  ? (process.env.GOOGLE_SHEETS_SPREADSHEET_ID_TEST || process.env.GOOGLE_SHEETS_SPREADSHEET_ID)
  : process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

// Read rows from a range
export async function getSheet(range) {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range,
  });
  return res.data.values || [];
}

// Cache stores
let logsCache = { data: null, time: 0 };
let eventsCache = { data: null, time: 0 };
let usersCache = { data: null, time: 0 };
const CACHE_TTL = 30000; // 30 seconds

export function invalidateCache() {
  logsCache = { data: null, time: 0 };
  eventsCache = { data: null, time: 0 };
  usersCache = { data: null, time: 0 };
}

// Append a row to a sheet
export async function appendRow(sheetName, values) {
  const sheets = getSheets();
  // Ensure 9 columns: Timestamp, Name, Roll, Company, Hours, Upvotes(0), Downvotes(0), Status, Approver
  const row = [...values];
  while (row.length < 9) row.push('');
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A:I`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [row] },
  });
  invalidateCache();
}

// Update a specific cell
export async function updateCell(sheetName, cell, value) {
  const sheets = getSheets();
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!${cell}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[value]],
    },
  });
  invalidateCache();
}

function parseAnyDate(ts, rowIndex) {
  if (!ts || ts === 'Imported') {
    // Return early date but use rowIndex to preserve order among imported
    return new Date(2000, 0, 1, 0, 0, rowIndex || 0);
  }

  // Format: "29/3/2026, 4:58:38 pm" (DD/MM/YYYY)
  const indianMatch = ts.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4}),\s*(\d{1,2}):(\d{1,2}):(\d{1,2})\s*(am|pm)$/i);
  if (indianMatch) {
    let [_, d, m, y, h, min, s, ampm] = indianMatch;
    h = parseInt(h);
    if (ampm.toLowerCase() === 'pm' && h < 12) h += 12;
    if (ampm.toLowerCase() === 'am' && h === 12) h = 0;
    const date = new Date(y, m - 1, d, h, min, s);
    if (!isNaN(date)) return date;
  }

  // Format: "4 Feb" or "29 Mar"
  const shortMatch = ts.match(/^(\d{1,2})\s*([a-z]{3})$/i);
  if (shortMatch) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const mIdx = months.findIndex(m => m.toLowerCase() === shortMatch[2].toLowerCase());
    if (mIdx !== -1) {
      // Use current year or some fixed year if not specified
      const date = new Date(new Date().getFullYear(), mIdx, shortMatch[1]);
      if (!isNaN(date)) return date;
    }
  }

  const d = new Date(ts);
  return isNaN(d) ? new Date(2000, 0, 1) : d;
}

// Get all log entries
export async function getLogs(force = false) {
  if (!force && logsCache.data && Date.now() - logsCache.time < CACHE_TTL) {
    return [...logsCache.data];
  }

  const rows = await getSheet('Logs!A2:I');
  const mapped = rows.map((row, index) => {
    const upvotes = parseInt(row[5]) || 0;
    const downvotes = parseInt(row[6]) || 0;
    return {
      rowIndex: index + 2,
      timestamp: row[0] || '',
      name: row[1] || '',
      rollNumber: row[2] || '',
      company: row[3] || '',
      hours: parseFloat(row[4]) || 0,
      upvotes,
      downvotes,
      net: upvotes - downvotes,
      disputed: (upvotes - downvotes) <= -3,
      status: row[7] || 'approved', // legacy rows default to approved
      approver: row[8] || '',
      _sortDate: parseAnyDate(row[0] || '', index + 2),
    };
  });

  logsCache = { data: mapped, time: Date.now() };
  return mapped;
}

// Get unique companies from logs
export async function getCompanies() {
  const rows = await getSheet('Logs!D2:D');
  const companies = new Set();
  rows.forEach(row => {
    if (row[0] && row[0].trim()) {
      companies.add(row[0].trim());
    }
  });
  return [...companies].sort();
}

// Aggregate leaderboard data from logs
export async function getLeaderboardData() {
  const logs = await getLogs();
  const userMap = {};

  logs.forEach(log => {
    const key = log.rollNumber;
    if (!key) return;

    if (!userMap[key]) {
      userMap[key] = {
        name: log.name,
        rollNumber: log.rollNumber,
        totalHours: 0,
        events: new Set(),
        totalWitnessed: 0,
        logs: [],
      };
    }

    // Only approved, non-disputed logs count toward karma/hours/events
    const countsForKarma = !log.disputed && log.status === 'approved';
    if (countsForKarma) {
      userMap[key].totalHours += log.hours;
      if (log.company) userMap[key].events.add(log.company.trim().toLowerCase());
    }
    userMap[key].totalWitnessed += log.upvotes;
    userMap[key].logs.push(log);
  });

  return Object.values(userMap).map(user => {
    const totalHours = Math.round(user.totalHours * 10) / 10;
    const totalEvents = user.events.size;
    return {
      name: user.name,
      rollNumber: user.rollNumber,
      totalHours,
      totalEvents,
      karma: Math.round(totalHours * 10 + totalEvents * 50),
      totalWitnessed: user.totalWitnessed,
      // Only show approved logs in expanded view; pending visible on /profile only
      logs: user.logs.filter(l => l.status === 'approved').sort((a, b) => b.rowIndex - a.rowIndex),
    };
  });
}

// -------- Users tab helpers --------

export async function getUser(rollNumber) {
  if (usersCache.data && Date.now() - usersCache.time < CACHE_TTL) {
    return usersCache.data.find(u => u.rollNumber === rollNumber) || null;
  }
  const rows = await getSheet('Users!A2:E');
  const mapped = rows.map(r => ({ rollNumber: r[0], name: r[1], passwordHash: r[2], role: r[3] }));
  usersCache = { data: mapped, time: Date.now() };
  return mapped.find(u => u.rollNumber === rollNumber) || null;
}

export async function createUser(rollNumber, name, passwordHash) {
  const sheets = getSheets();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Users!A:E',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[rollNumber, name, passwordHash, 'user', new Date().toISOString()]] },
  });
  invalidateCache();
}

export async function updateUserPassword(rollNumber, newHash) {
  const rows = await getSheet('Users!A2:A');
  const rowIdx = rows.findIndex(r => r[0] === rollNumber);
  if (rowIdx === -1) throw new Error('User not found');
  await updateCell('Users', `C${rowIdx + 2}`, newHash);
}

// -------- Events tab helpers --------

export async function getEvents(force = false) {
  if (!force && eventsCache.data && Date.now() - eventsCache.time < CACHE_TTL) return [...eventsCache.data];
  const rows = await getSheet('Events!A2:C');
  const mapped = rows.map(row => ({
    name: row[0] || '',
    createdAt: row[1] || '',
    createdBy: row[2] || '',
  }));
  eventsCache = { data: mapped, time: Date.now() };
  return mapped;
}

export async function createEvent(name, createdBy) {
  const sheets = getSheets();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Events!A:C',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[name, new Date().toISOString(), createdBy]] },
  });
  invalidateCache();
}

// Check if event is within 3-day logging window
export function isEventOpen(createdAt) {
  if (!createdAt) return false;
  const created = new Date(createdAt);
  const diffDays = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays <= 3;
}

// Hardcoded volunteer roster
export const VOLUNTEERS = [
  { name: "Luv Wadhwa", rollNumber: "2025UBT1042" },
  { name: "Kumar Ojas", rollNumber: "2025UBT7268" },
  { name: "Ananshi", rollNumber: "2025UCA1802" },
  { name: "Kushagra Mittal", rollNumber: "2025UCA1878" },
  { name: "Krishna Agarwal", rollNumber: "2025UCA1900" },
  { name: "Anuja Sawhney", rollNumber: "2025UCA1932" },
  { name: "Agrim Goyal", rollNumber: "2025UCB6071" },
  { name: "Praket Sagar", rollNumber: "2025UCI6348" },
  { name: "Apoorva Sachan", rollNumber: "2025UCM2318" },
  { name: "Anshika Sharma", rollNumber: "2025UCM2320" },
  { name: "Aryan Kumar", rollNumber: "2025UCM2331" },
  { name: "Uddesheya Khanna", rollNumber: "2025UCS1664" },
  { name: "Agamya Jain", rollNumber: "2025UCS1683" },
  { name: "Bharti Gupta", rollNumber: "2025UCS1717" },
  { name: "Arif Mustafa Khan", rollNumber: "2025UEA6507" },
  { name: "Naman Jain", rollNumber: "2025UEC2716" },
  { name: "Aditya Pratap Singh", rollNumber: "2025UEA6616" },
  { name: "Ayaan Chauhan", rollNumber: "2025UEC2510" },
  { name: "Kinshuki Gupta", rollNumber: "2025UEC2530" },
  { name: "Archit Gola", rollNumber: "2025UEC2629" },
  { name: "Ujjwal Gupta", rollNumber: "2025UEC2670" },
  { name: "Shreyus Jindal", rollNumber: "2025UEC2801" },
  { name: "Sumit Gupta", rollNumber: "2025UEE4199" },
  { name: "Prachi Shukla", rollNumber: "2025UEE4502" },
  { name: "Ayush Kumar Singh", rollNumber: "2025UEE4534" },
  { name: "Amardeep Singh", rollNumber: "2025UEE4626" },
  { name: "Anshika Arpan", rollNumber: "2025UEV2863" },
  { name: "Anju", rollNumber: "2025UGI7243" },
  { name: "Alokik Sharma", rollNumber: "2025UGI7253" },
  { name: "Rishabh Verma", rollNumber: "2025UIC3503" },
  { name: "Arnab Tiwari", rollNumber: "2025UIC3593" },
  { name: "Rishabh Mishra", rollNumber: "2025UIC3609" },
  { name: "Aavya Singh", rollNumber: "2025UIC3620" },
  { name: "Harsh Agrawal", rollNumber: "2025UIC3640" },
  { name: "Ishan Akash", rollNumber: "2025UIN3344" },
  { name: "Aman Dev", rollNumber: "2025UIT3029" },
  { name: "Anjali Sah", rollNumber: "2025UIT3045" },
  { name: "Adwait Kumar Choudhary", rollNumber: "2025UME4109" },
  { name: "Ashirvad Dwivedi", rollNumber: "2025UME4153" },
  { name: "Neeti Khattar", rollNumber: "2025UME7250" },
  { name: "Lakshay Gautam", rollNumber: "2025UMV7610" },
  { name: "Kanav Sahu", rollNumber: "2025UMV7613" },
];
