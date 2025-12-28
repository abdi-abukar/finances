// /src/app/api/extract-transactions/route.js
import { NextRequest, NextResponse } from 'next/server';
import { extractTransactionsFromFile } from '@/lib/openai';
import Papa from 'papaparse';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const accountId = formData.get('accountId');

    if (!file || !accountId) {
      return NextResponse.json(
        { success: false, error: 'File and account ID are required' },
        { status: 400 }
      );
    }

    console.log('Processing file:', file.name, 'Type:', file.type);

    let fileContent;
    let shouldConvertToJson = false;

    // Handle different file types
    if (file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv')) {
      // Convert CSV to JSON for OpenAI processing with dynamic field handling
      const csvText = await file.text();
      
      // More flexible CSV parsing - let it handle any number of fields
      const csvData = Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        transformHeader: (header) => header.trim(),
        // Remove field count validation - let it parse whatever fields exist
        fastMode: false,
        // Handle quotes and escaping better
        quoteChar: '"',
        escapeChar: '"',
        // Try multiple delimiters
        delimitersToGuess: [',', '\t', ';', '|'],
        // Skip rows with parsing errors but continue processing
        skipFirstNLines: 0,
        transform: (value, field) => {
          // Clean up common CSV issues
          if (typeof value === 'string') {
            return value.trim();
          }
          return value;
        }
      });

      console.log('CSV parsing completed:', {
        totalRows: csvData.data.length,
        errors: csvData.errors.length,
        fields: csvData.meta.fields
      });

      // Filter out completely empty rows and clean up data
      const cleanData = csvData.data.filter(row => {
        // Keep row if it has at least one non-null, non-empty value
        return Object.values(row).some(value => 
          value !== null && 
          value !== undefined && 
          value !== '' && 
          String(value).trim() !== ''
        );
      }).map(row => {
        // Clean up each row - remove null/undefined fields and empty strings
        const cleanRow = {};
        Object.entries(row).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== '' && String(value).trim() !== '') {
            cleanRow[key] = value;
          }
        });
        return cleanRow;
      });

      console.log(`Cleaned CSV data: ${cleanData.length} valid rows from ${csvData.data.length} total rows`);

      if (cleanData.length === 0) {
        return NextResponse.json(
          { success: false, error: 'No valid data found in CSV file' },
          { status: 400 }
        );
      }

      // Convert cleaned CSV data to JSON string for AI processing
      fileContent = JSON.stringify({
        headers: csvData.meta.fields,
        rows: cleanData,
        totalRows: cleanData.length,
        originalFileName: file.name
      }, null, 2);
      
      shouldConvertToJson = true;
      
      console.log(`Converted CSV with ${cleanData.length} rows to JSON for AI processing`);
    } else {
      // For other file types (PDF, Excel, etc.), read as buffer
      const arrayBuffer = await file.arrayBuffer();
      fileContent = Buffer.from(arrayBuffer);
    }

    // Extract transactions using OpenAI
    const result = await extractTransactionsFromFile(
      fileContent,
      file.name,
      shouldConvertToJson ? 'application/json' : file.type,
      shouldConvertToJson
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        transactions: result.transactions,
        message: `Successfully extracted ${result.transactions.length} transactions`
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('API: Transaction extraction error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process file' },
      { status: 500 }
    );
  }
}