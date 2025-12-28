// /api/projects/[projectId]/category-budgets/[budgetId]/link-transactions/route.js
import { NextResponse } from 'next/server';
import { readDataFile, writeDataFile } from '@/utils/dataManager';

export async function POST(request, { params }) {
  try {
    const { projectId, budgetId } = params;
    const { transactionIds } = await request.json();
    
    if (!Array.isArray(transactionIds)) {
      return NextResponse.json(
        { error: 'Transaction IDs must be an array' },
        { status: 400 }
      );
    }

    const categoryBudgets = readDataFile('project-category-budgets.json') || [];
    const budgetIndex = categoryBudgets.findIndex(budget => 
      budget.id === budgetId && budget.projectId === projectId
    );
    
    if (budgetIndex === -1) {
      return NextResponse.json(
        { error: 'Category budget not found' },
        { status: 404 }
      );
    }

    // Update the category budget with linked transaction IDs
    categoryBudgets[budgetIndex] = {
      ...categoryBudgets[budgetIndex],
      linkedTransactionIds: transactionIds,
      updatedAt: new Date().toISOString()
    };
    
    writeDataFile('project-category-budgets.json', categoryBudgets);

    return NextResponse.json({ 
      success: true, 
      linkedCount: transactionIds.length,
      categoryBudget: categoryBudgets[budgetIndex]
    });
  } catch (error) {
    console.error('Error linking transactions to category budget:', error);
    return NextResponse.json(
      { error: 'Failed to link transactions' },
      { status: 500 }
    );
  }
}

export async function GET(request, { params }) {
  try {
    const { projectId, budgetId } = params;
    
    const categoryBudgets = readDataFile('project-category-budgets.json') || [];
    const transactions = readDataFile('transactions.json') || [];
    
    const budget = categoryBudgets.find(budget => 
      budget.id === budgetId && budget.projectId === projectId
    );
    
    if (!budget) {
      return NextResponse.json(
        { error: 'Category budget not found' },
        { status: 404 }
      );
    }

    // Get linked transactions with full details
    const linkedTransactions = transactions.filter(t => 
      budget.linkedTransactionIds && budget.linkedTransactionIds.includes(t.id)
    );

    return NextResponse.json({ 
      success: true,
      transactions: linkedTransactions,
      count: linkedTransactions.length
    });
  } catch (error) {
    console.error('Error fetching linked transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch linked transactions' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { projectId, budgetId } = params;
    const { transactionId } = await request.json();
    
    if (!transactionId) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    const categoryBudgets = readDataFile('project-category-budgets.json') || [];
    const budgetIndex = categoryBudgets.findIndex(budget => 
      budget.id === budgetId && budget.projectId === projectId
    );
    
    if (budgetIndex === -1) {
      return NextResponse.json(
        { error: 'Category budget not found' },
        { status: 404 }
      );
    }

    // Remove transaction ID from linked transactions
    const currentLinkedIds = categoryBudgets[budgetIndex].linkedTransactionIds || [];
    const updatedLinkedIds = currentLinkedIds.filter(id => id !== transactionId);
    
    categoryBudgets[budgetIndex] = {
      ...categoryBudgets[budgetIndex],
      linkedTransactionIds: updatedLinkedIds,
      updatedAt: new Date().toISOString()
    };
    
    writeDataFile('project-category-budgets.json', categoryBudgets);

    return NextResponse.json({ 
      success: true,
      removedTransactionId: transactionId,
      remainingCount: updatedLinkedIds.length
    });
  } catch (error) {
    console.error('Error unlinking transaction from category budget:', error);
    return NextResponse.json(
      { error: 'Failed to unlink transaction' },
      { status: 500 }
    );
  }
}