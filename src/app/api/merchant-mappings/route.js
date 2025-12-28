// /api/merchant-mappings/route.js
import { NextResponse } from 'next/server';
import { readDataFile, writeDataFile } from '@/utils/dataManager';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profileId');
    
    const mappings = readDataFile('merchant-mappings.json') || {};
    
    // Filter by profile if specified
    const filteredMappings = profileId 
      ? Object.fromEntries(
          Object.entries(mappings).filter(([key, value]) => 
            value.profileId === profileId
          )
        )
      : mappings;

    // Convert to simple merchantName -> categoryId mapping for easier use
    const simpleMappings = {};
    Object.values(filteredMappings).forEach(mapping => {
      simpleMappings[mapping.merchantName] = mapping.categoryId;
    });

    return NextResponse.json({ mappings: simpleMappings });
  } catch (error) {
    console.error('Error fetching merchant mappings:', error);
    return NextResponse.json({ error: 'Failed to fetch merchant mappings' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { merchantName, categoryId, profileId } = await request.json();
    
    if (!merchantName || !categoryId) {
      return NextResponse.json(
        { error: 'Merchant name and category ID are required' },
        { status: 400 }
      );
    }

    const mappings = readDataFile('merchant-mappings.json') || {};
    
    // Create a unique key for the merchant-profile combination
    const mappingKey = profileId ? `${merchantName}_${profileId}` : merchantName;
    
    mappings[mappingKey] = {
      merchantName,
      categoryId,
      profileId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    writeDataFile('merchant-mappings.json', mappings);

    return NextResponse.json({ 
      success: true, 
      mapping: mappings[mappingKey] 
    });
  } catch (error) {
    console.error('Error saving merchant mapping:', error);
    return NextResponse.json(
      { error: 'Failed to save merchant mapping' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { merchantName, profileId } = await request.json();
    
    if (!merchantName) {
      return NextResponse.json(
        { error: 'Merchant name is required' },
        { status: 400 }
      );
    }

    const mappings = readDataFile('merchant-mappings.json') || {};
    const mappingKey = profileId ? `${merchantName}_${profileId}` : merchantName;
    
    if (mappings[mappingKey]) {
      delete mappings[mappingKey];
      writeDataFile('merchant-mappings.json', mappings);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting merchant mapping:', error);
    return NextResponse.json(
      { error: 'Failed to delete merchant mapping' },
      { status: 500 }
    );
  }
}