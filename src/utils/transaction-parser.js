export function parseTransactions(fileContent, accountId, fileName = '', fileType = '') {
  console.log('Transaction Parser: Starting extraction for real data only');
  console.log('Transaction Parser: Content length:', fileContent.length);

  try {
    const cleanContent = fileContent
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .trim();

    if (cleanContent.length === 0) {
      throw new Error('File is empty - no content to parse');
    }

    let transactions = [];

    // Check if this is an RBC statement
    if (detectRBCStatement(cleanContent)) {
      console.log('Transaction Parser: Processing RBC credit card statement');
      transactions = parseRBCStatement(cleanContent);
    }
    // CSV format
    else if (detectCSVFormat(cleanContent)) {
      console.log('Transaction Parser: Processing CSV format');
      transactions = parseCSVTransactions(cleanContent);
    }
    // Generic bank statement
    else {
      console.log('Transaction Parser: Processing generic bank statement');
      transactions = parseGenericBankStatement(cleanContent);
    }

    console.log('Transaction Parser: Extracted', transactions.length, 'raw transactions');

    if (transactions.length === 0) {
      throw new Error('No transactions found in the file. Please check the file format.');
    }

    // Clean and validate
    transactions = validateAndCleanTransactions(transactions);

    if (transactions.length === 0) {
      throw new Error('No valid transactions found after validation. Please check the data format.');
    }

    console.log('Transaction Parser: Final valid transactions:', transactions.length);
    return transactions;

  } catch (error) {
    console.error('Transaction Parser Error:', error);
    throw error; // Don't fall back to sample data
  }
}

function detectRBCStatement(content) {
  const indicators = ['RBC', 'ROYAL BANK', 'VISA', 'STATEMENT FROM', 'TRANSACTION DATE', 'POSTING DATE'];
  const upperContent = content.toUpperCase();
  const matchCount = indicators.filter(indicator => upperContent.includes(indicator)).length;
  console.log('RBC Detection: Found', matchCount, 'indicators');
  return matchCount >= 3;
}

function parseRBCStatement(content) {
  const transactions = [];
  const lines = content.split('\n');

  console.log('RBC Parser: Processing', lines.length, 'lines');

  let inTransactionSection = false;
  let foundTransactions = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (!line) continue;

    // Look for transaction section markers
    if ((line.includes('TRANSACTION') && line.includes('DATE')) || 
        (line.includes('JUN') && line.includes('JUL') && line.includes('$'))) {
      inTransactionSection = true;
      console.log('RBC Parser: Transaction section starts at line', i);
      continue;
    }

    // End markers
    if (inTransactionSection && (
      line.includes('TOTAL ACCOUNT BALANCE') ||
      line.includes('Time to Pay') ||
      line.includes('INTEREST RATE CHART') ||
      line.includes('IMPORTANT INFORMATION')
    )) {
      console.log('RBC Parser: Transaction section ends at line', i);
      break;
    }

    if (inTransactionSection) {
      const transaction = parseRBCTransactionLine(line, i);
      if (transaction) {
        transactions.push(transaction);
        foundTransactions++;
      }
    }
  }

  console.log('RBC Parser: Found', foundTransactions, 'transactions');
  return transactions;
}

function parseRBCTransactionLine(line, lineNumber) {
  console.log(`RBC Line ${lineNumber}:`, line.substring(0, 100));

  // Pattern 1: Standard RBC transaction line
  // JUN 22 JUN 24 CAD SODA SNACK VENDING TORONTO ON 74537885174103563409872 $3.75
  const standardPattern = /^([A-Z]{3}\s+\d{1,2})\s+([A-Z]{3}\s+\d{1,2})\s+(.+?)\s+\$(-?\d+\.?\d*)$/;
  
  // Pattern 2: Payment line
  // JUN 30 JUN 30 PAYMENT - THANK YOU / PAIEMENT - MERCI -$500.30
  const paymentPattern = /^([A-Z]{3}\s+\d{1,2})\s+([A-Z]{3}\s+\d{1,2})\s+(PAYMENT.+?)\s+(-?\$\d+\.?\d*)$/;

  // Pattern 3: Fee lines
  // JUL 22 JUL 22 ANNUAL FEE $4.00
  const feePattern = /^([A-Z]{3}\s+\d{1,2})\s+([A-Z]{3}\s+\d{1,2})\s+(.+?FEE.+?)\s+(-?\$\d+\.?\d*)$/;

  let match = line.match(standardPattern) || line.match(paymentPattern) || line.match(feePattern);

  if (match) {
    try {
      const [, transactionDate, postingDate, description, amountStr] = match;
      
      // Parse date (use posting date)
      const date = parseRBCDate(postingDate);
      if (!date) {
        console.log('RBC Parser: Invalid date:', postingDate);
        return null;
      }

      // Clean description
      let cleanDescription = description
        .replace(/\d{20,}/g, '') // Remove long reference numbers
        .replace(/\s+/g, ' ')
        .trim();

      if (!cleanDescription || cleanDescription.length < 3) {
        console.log('RBC Parser: Invalid description:', description);
        return null;
      }

      // Parse amount
      let amount = parseFloat(amountStr.replace(/[$,]/g, ''));
      if (isNaN(amount)) {
        console.log('RBC Parser: Invalid amount:', amountStr);
        return null;
      }

      // For credit card statements:
      // - Charges are positive in the statement but should be negative (money going out)
      // - Payments/credits are negative in the statement but should be positive (money coming in)
      if (cleanDescription.toUpperCase().includes('PAYMENT') || 
          cleanDescription.toUpperCase().includes('CREDIT') ||
          cleanDescription.toUpperCase().includes('REBATE')) {
        // Keep payments as positive (money credited to account)
        amount = Math.abs(amount);
      } else {
        // Make charges negative (money debited from account)
        amount = -Math.abs(amount);
      }

      const transaction = {
        date,
        amount,
        description: cleanDescription.substring(0, 200)
      };

      console.log('RBC Parser: Parsed transaction:', transaction);
      return transaction;

    } catch (error) {
      console.log('RBC Parser: Error parsing line:', error.message);
      return null;
    }
  }

  return null;
}

function parseRBCDate(dateStr) {
  // Parse "JUN 24" format
  const parts = dateStr.trim().split(/\s+/);
  if (parts.length !== 2) return null;

  const [monthStr, dayStr] = parts;
  const monthMap = {
    'JAN': 1, 'FEB': 2, 'MAR': 3, 'APR': 4, 'MAY': 5, 'JUN': 6,
    'JUL': 7, 'AUG': 8, 'SEP': 9, 'OCT': 10, 'NOV': 11, 'DEC': 12
  };

  const month = monthMap[monthStr];
  const day = parseInt(dayStr);

  if (!month || isNaN(day) || day < 1 || day > 31) return null;

  // Use 2025 based on the statement
  const year = 2025;
  
  try {
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
      return null;
    }
    return date.toISOString().split('T')[0];
  } catch (error) {
    return null;
  }
}

function detectCSVFormat(content) {
  const lines = content.split('\n').slice(0, 5);
  const hasCommas = lines.some(line => line.split(',').length > 3);
  const hasTabs = lines.some(line => line.split('\t').length > 3);
  return hasCommas || hasTabs;
}

function parseCSVTransactions(content) {
  const transactions = [];
  const lines = content.split('\n').filter(line => line.trim().length > 0);
  
  if (lines.length < 2) {
    throw new Error('CSV file must have at least a header and one data row');
  }

  const delimiter = lines[0].includes('\t') ? '\t' : ',';
  const headers = lines[0].toLowerCase().split(delimiter).map(h => h.trim().replace(/['"]/g, ''));
  
  console.log('CSV Parser: Headers:', headers);

  // Find column indices
  const dateIndex = findColumnIndex(headers, ['date', 'transaction date', 'posting date']);
  const amountIndex = findColumnIndex(headers, ['amount', 'transaction amount']);
  const debitIndex = findColumnIndex(headers, ['debit', 'withdrawal']);
  const creditIndex = findColumnIndex(headers, ['credit', 'deposit']);
  const descriptionIndex = findColumnIndex(headers, ['description', 'merchant', 'payee', 'memo']);

  if (dateIndex === -1 || descriptionIndex === -1) {
    throw new Error('Required columns not found. Need Date and Description columns.');
  }

  if (amountIndex === -1 && (debitIndex === -1 || creditIndex === -1)) {
    throw new Error('Amount columns not found. Need Amount or Debit/Credit columns.');
  }

  // Process data rows
  for (let i = 1; i < lines.length; i++) {
    const columns = parseCSVLine(lines[i], delimiter);
    
    if (columns.length <= Math.max(dateIndex, descriptionIndex, amountIndex || 0)) continue;

    try {
      const dateStr = columns[dateIndex]?.trim();
      const description = columns[descriptionIndex]?.trim();

      if (!dateStr || !description) continue;

      let amount = 0;
      if (debitIndex !== -1 && creditIndex !== -1) {
        const debit = parseFloat(columns[debitIndex]?.replace(/[,$]/g, '') || '0');
        const credit = parseFloat(columns[creditIndex]?.replace(/[,$]/g, '') || '0');
        amount = credit - debit;
      } else if (amountIndex !== -1) {
        amount = parseFloat(columns[amountIndex]?.replace(/[,$]/g, '') || '0');
      }

      if (amount === 0) continue;

      const date = parseGenericDate(dateStr);
      if (!date) continue;

      transactions.push({
        date,
        amount,
        description: description.substring(0, 200)
      });

    } catch (error) {
      console.log(`CSV Parser: Error on line ${i}:`, error.message);
      continue;
    }
  }

  return transactions;
}

function parseGenericBankStatement(content) {
  const transactions = [];
  const lines = content.split('\n');

  // Look for lines with date and amount patterns
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.length < 10) continue;

    // Match various date patterns with amounts
    const patterns = [
      /(\d{1,2}\/\d{1,2}\/\d{2,4})\s+(.+?)\s+([+-]?\$?\d{1,3}(?:,\d{3})*\.?\d{0,2})$/,
      /(\d{4}-\d{1,2}-\d{1,2})\s+(.+?)\s+([+-]?\$?\d{1,3}(?:,\d{3})*\.?\d{0,2})$/,
      /(\d{1,2}-\d{1,2}-\d{2,4})\s+(.+?)\s+([+-]?\$?\d{1,3}(?:,\d{3})*\.?\d{0,2})$/
    ];

    for (const pattern of patterns) {
      const match = trimmedLine.match(pattern);
      if (match) {
        try {
          const [, dateStr, description, amountStr] = match;
          
          const date = parseGenericDate(dateStr);
          if (!date) continue;

          const amount = parseFloat(amountStr.replace(/[$,]/g, ''));
          if (isNaN(amount) || amount === 0) continue;

          transactions.push({
            date,
            amount,
            description: description.trim().substring(0, 200)
          });
          break;
        } catch (error) {
          continue;
        }
      }
    }
  }

  return transactions;
}

function parseGenericDate(dateStr) {
  const formats = [
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
    /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
    /^(\d{1,2})\/(\d{1,2})\/(\d{2})$/
  ];

  for (const format of formats) {
    const match = dateStr.match(format);
    if (match) {
      try {
        let year, month, day;
        
        if (format.source.includes('\\d{4}')) {
          if (format.source.startsWith('^\\(\\d{4}\\)')) {
            [, year, month, day] = match.map(Number);
          } else {
            [, month, day, year] = match.map(Number);
          }
        } else {
          [, month, day, year] = match.map(Number);
          year += year < 50 ? 2000 : 1900;
        }

        const date = new Date(year, month - 1, day);
        if (isNaN(date.getTime())) continue;
        
        return date.toISOString().split('T')[0];
      } catch (error) {
        continue;
      }
    }
  }
  return null;
}

function findColumnIndex(headers, possibleNames) {
  for (const name of possibleNames) {
    const index = headers.findIndex(h => h.includes(name));
    if (index !== -1) return index;
  }
  return -1;
}

function parseCSVLine(line, delimiter) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

function validateAndCleanTransactions(transactions) {
  const valid = [];
  const seen = new Set();

  for (const transaction of transactions) {
    try {
      // Validate required fields
      if (!transaction.date || !transaction.description || transaction.amount === undefined) {
        continue;
      }

      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(transaction.date)) {
        continue;
      }

      // Validate amount
      if (typeof transaction.amount !== 'number' || isNaN(transaction.amount) || transaction.amount === 0) {
        continue;
      }

      // Clean description
      let description = transaction.description.trim().replace(/\s+/g, ' ');
      if (description.length === 0) continue;

      // Avoid duplicates
      const key = `${transaction.date}-${transaction.amount}-${description.substring(0, 50)}`;
      if (seen.has(key)) continue;
      seen.add(key);

      valid.push({
        date: transaction.date,
        amount: Math.round(transaction.amount * 100) / 100,
        description: description.substring(0, 200)
      });

    } catch (error) {
      continue;
    }
  }

  // Sort by date (newest first)
  valid.sort((a, b) => new Date(b.date) - new Date(a.date));
  return valid;
}