import { NextResponse } from 'next/server';
import { initializeDataFiles } from '../../../utils/dataManager';

export async function POST() {
  try {
    initializeDataFiles();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to initialize data files' },
      { status: 500 }
    );
  }
}