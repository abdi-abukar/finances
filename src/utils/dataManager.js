import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'src/data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function readDataFile(filename) {
  const filePath = path.join(DATA_DIR, filename);
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return null; // File doesn't exist or is invalid
  }
}

export function writeDataFile(filename, data) {
  const filePath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

export function initializeDataFiles() {
  const files = {
    'profiles.json': [],
    'accounts.json': [],
    'transactions.json': [],
    'categories.json': [
      'Food & Dining',
      'Transportation', 
      'Shopping',
      'Bills & Utilities',
      'Entertainment',
      'Healthcare',
      'Income',
      'Other'
    ],
    'merchants.json': []
  };

  Object.entries(files).forEach(([filename, defaultData]) => {
    if (!readDataFile(filename)) {
      writeDataFile(filename, defaultData);
    }
  });
}