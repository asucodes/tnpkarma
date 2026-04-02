import { updateCell, appendRow } from '../lib/sheets.js';

async function run() {
    console.log("Testing updateCell...");
    try {
        await updateCell('Logs', 'Z1', 'test');
        console.log("updateCell Success!");
    } catch (e) {
        console.error("updateCell Error", e);
    }
}
run();
