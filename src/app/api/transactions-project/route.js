// /api/projects/transactions/route.js - Get transactions with categories for projects

import { NextResponse } from 'next/server';
import { readDataFile } from '@/utils/dataManager';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profileId');
    
    if (!profileId) {
      return NextResponse.json(
        { error: 'Profile ID is required' },
        { status: 400 }
      );
    }

    // Fetch all data
    const transactions = readDataFile('transactions.json') || [];
    const accounts = readDataFile('accounts.json') || [];
    const categories = readDataFile('categories.json') || [];
    
    // Filter accounts for this profile
    const profileAccounts = accounts.filter(account => account.profileId === profileId);
    const accountIds = profileAccounts.map(account => account.id);
    
    // Filter and enrich transactions
    const profileTransactions = transactions
      .filter(transaction => accountIds.includes(transaction.accountId))
      .map(transaction => {
        const account = profileAccounts.find(acc => acc.id === transaction.accountId);
        const category = categories.find(cat => cat.id === transaction.categoryId);
        
        return {
          ...transaction,
          // Account info
          accountName: account?.name || transaction.accountName || 'Unknown Account',
          accountType: account?.type || transaction.accountType || 'unknown',
          currency: account?.currency || transaction.currency || 'USD',
          
          // Category info (populated)
          category: category ? {
            id: category.id,
            name: category.name,
            color: category.color
          } : null,
          categoryName: category?.name || transaction.categoryName || 'Uncategorized',
          categoryColor: category?.color || transaction.categoryColor || '#6B7280'
        };
      })
      .filter(transaction => !transaction.isExcluded); // Only include non-excluded transactions

    // Group transactions by category for easier project management
    const transactionsByCategory = {};
    const availableCategories = [];
    
    categories.forEach(category => {
      const categoryTransactions = profileTransactions.filter(t => t.categoryId === category.id);
      if (categoryTransactions.length > 0) {
        transactionsByCategory[category.id] = categoryTransactions;
        availableCategories.push({
          ...category,
          transactionCount: categoryTransactions.length,
          totalAmount: categoryTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
        });
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        transactions: profileTransactions,
        transactionsByCategory,
        categories: availableCategories,
        summary: {
          totalTransactions: profileTransactions.length,
          totalCategories: availableCategories.length,
          totalAmount: profileTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching project transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project transactions' },
      { status: 500 }
    );
  }
}