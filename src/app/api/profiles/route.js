import { NextResponse } from 'next/server';
import { readDataFile, writeDataFile } from '@/utils/dataManager';

export async function GET() {
  try {
    const profiles = readDataFile('profiles.json') || [];
    return NextResponse.json({ profiles });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { title, description } = await request.json();
    
    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      );
    }

    const profiles = readDataFile('profiles.json') || [];
    const newProfile = {
      id: `profile_${Date.now()}`,
      title,
      description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    profiles.push(newProfile);
    writeDataFile('profiles.json', profiles);

    return NextResponse.json({ success: true, profile: newProfile });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create profile' },
      { status: 500 }
    );
  }
}