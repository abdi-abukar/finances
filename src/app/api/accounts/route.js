import { NextResponse } from 'next/server';
import { readDataFile, writeDataFile } from '@/utils/dataManager';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profileId');
    
    const accounts = readDataFile('accounts.json') || [];
    const filteredAccounts = profileId 
      ? accounts.filter(account => account.profileId === profileId)
      : accounts;

    return NextResponse.json({ accounts: filteredAccounts });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { name, type, currency, profileId } = await request.json();
    
    if (!name || !type || !currency || !profileId) {
      return NextResponse.json(
        { error: 'Name, type, currency, and profileId are required' },
        { status: 400 }
      );
    }

    // Validate account type
    const validTypes = ['checking', 'savings', 'credit'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid account type. Must be: checking, savings, or credit' },
        { status: 400 }
      );
    }

    // Validate currency
    const validCurrencies = ['USD', 'CAD'];
    if (!validCurrencies.includes(currency)) {
      return NextResponse.json(
        { error: 'Invalid currency. Must be USD or CAD' },
        { status: 400 }
      );
    }

    const accounts = readDataFile('accounts.json') || [];
    const newAccount = {
      id: `account_${Date.now()}`,
      name,
      type,
      currency,
      profileId,
      balance: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    accounts.push(newAccount);
    writeDataFile('accounts.json', accounts);

    return NextResponse.json({ success: true, account: newAccount });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}