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

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

// Read rows from a range
export async function getSheet(range) {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range,
  });
  return res.data.values || [];
}

// Append a row to a sheet
export async function appendRow(sheetName, values) {
  const sheets = getSheets();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A:F`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [values],
    },
  });
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
}

// Get all log entries
export async function getLogs() {
  const rows = await getSheet('Logs!A2:F');
  return rows.map((row, index) => ({
    rowIndex: index + 2, // 1-indexed, skip header
    timestamp: row[0] || '',
    name: row[1] || '',
    rollNumber: row[2] || '',
    company: row[3] || '',
    hours: parseFloat(row[4]) || 0,
    upvotes: parseInt(row[5]) || 0,
  }));
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
        totalUpvotes: 0,
        logs: [],
      };
    }

    userMap[key].totalHours += log.hours;
    if (log.company) userMap[key].events.add(log.company);
    userMap[key].totalUpvotes += log.upvotes;
    userMap[key].logs.push(log);
  });

  return Object.values(userMap).map(user => ({
    name: user.name,
    rollNumber: user.rollNumber,
    totalHours: Math.round(user.totalHours * 10) / 10,
    totalEvents: user.events.size,
    karma: Math.round(user.totalHours * 10 + user.events.size * 50),
    totalUpvotes: user.totalUpvotes,
    logs: user.logs.sort((a, b) => b.rowIndex - a.rowIndex), // Sort logs newest first
  }));
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
  { name: "Naman Jain", rollNumber: "2025UEA6513" },
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
