import { NextResponse } from 'next/server';
import { readDataFile, writeDataFile } from '@/utils/dataManager';
import { isRecurringTransaction } from '@/lib/categories';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profileId');
    
    const transactions = readDataFile('transactions.json') || [];
    const accounts = readDataFile('accounts.json') || [];
    
    // Filter transactions by profile and enrich with account data
    const profileAccounts = accounts.filter(account => account.profileId === profileId);
    const accountIds = profileAccounts.map(account => account.id);
    const filteredTransactions = transactions
      .filter(transaction => accountIds.includes(transaction.accountId))
      .map(transaction => {
        const account = profileAccounts.find(acc => acc.id === transaction.accountId);
        return {
          ...transaction,
          accountName: account?.name || transaction.accountName || 'Unknown Account',
          accountType: account?.type || transaction.accountType || 'unknown',
          currency: account?.currency || transaction.currency || 'USD'
        };
      });

    return NextResponse.json({ transactions: filteredTransactions });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { transactions: newTransactions, customCategories } = await request.json();
    
    const existingTransactions = readDataFile('transactions.json') || [];
    const existingCategories = readDataFile('categories.json') || [];
    const accounts = readDataFile('accounts.json') || [];
    
    console.log('RECEIVED TRANSACTIONS:', newTransactions.length);
    console.log('FIRST TRANSACTION:', newTransactions[0]);
    console.log('AVAILABLE ACCOUNTS:', accounts);
    
    // Get the first account that matches the profile (FUCK IT, JUST USE ANY ACCOUNT)
    const firstTransaction = newTransactions[0];
    let targetAccount = null;
    
    if (firstTransaction?.accountId) {
      targetAccount = accounts.find(acc => acc.id === firstTransaction.accountId);
    }
    
    if (!targetAccount && accounts.length > 0) {
      // Just use the first fucking account if we can't find the right one
      targetAccount = accounts[0];
    }
    
    console.log('USING ACCOUNT:', targetAccount);
    
    // FORCE THE ACCOUNT DATA INTO EVERY TRANSACTION
    const enrichedTransactions = newTransactions.map(transaction => {
      const isRecurring = isRecurringTransaction(transaction.description, Math.abs(transaction.amount));
      
      return {
        ...transaction,
        id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        accountId: targetAccount?.id || 'default_account',
        accountName: targetAccount?.name || 'Main Account',
        accountType: targetAccount?.type || 'credit',
        currency: targetAccount?.currency || 'CAD',
        isRecurring,
        processed: true,
        importedAt: new Date().toISOString()
      };
    });
    
    console.log('FINAL TRANSACTION SAMPLE:', enrichedTransactions[0]);
    
    const updatedTransactions = [...existingTransactions, ...enrichedTransactions];
    
    let updatedCategories = existingCategories;
    if (customCategories && customCategories.length > 0) {
      updatedCategories = [...existingCategories, ...customCategories];
    }
    
    writeDataFile('transactions.json', updatedTransactions);
    writeDataFile('categories.json', updatedCategories);

    return NextResponse.json({ 
      success: true, 
      count: newTransactions.length,
      categoriesAdded: customCategories?.length || 0 
    });
  } catch (error) {
    console.error('Error saving transactions:', error);
    return NextResponse.json({ error: 'Failed to save transactions' }, { status: 500 });
  }
}