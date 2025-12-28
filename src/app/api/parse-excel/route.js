import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    console.log('Excel Parser: Processing file', file.name, 'size:', buffer.length);

    const workbook = XLSX.read(buffer, {
      type: 'buffer',
      cellDates: true,
      cellNF: false,
      cellText: false
    });

    // Get the first worksheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    console.log('Excel Parser: Processing sheet:', sheetName);

    // Convert to CSV format for easier parsing
    const csvData = XLSX.utils.sheet_to_csv(worksheet);

    console.log('Excel Parser: Converted to CSV, length:', csvData.length);
    console.log('Excel Parser: CSV preview:', csvData.substring(0, 500));

    if (!csvData || csvData.trim().length === 0) {
      return NextResponse.json({ 
        error: 'Could not extract data from Excel file. The sheet may be empty.' 
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      text: csvData,
      sheetName: sheetName,
      sheets: workbook.SheetNames
    });

  } catch (error) {
    console.error('Excel parsing error:', error);
    return NextResponse.json({
      error: 'Failed to parse Excel file: ' + error.message
    }, { status: 500 });
  }
}