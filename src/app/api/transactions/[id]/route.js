// /api/transactions/[id]/route.js - Delete transaction API

import { NextResponse } from 'next/server';
import { readDataFile, writeDataFile } from '@/utils/dataManager';

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    const transactions = readDataFile('transactions.json') || [];
    
    // Find the transaction to delete
    const transactionIndex = transactions.findIndex(t => t.id === id);
    
    if (transactionIndex === -1) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Remove the transaction
    const deletedTransaction = transactions.splice(transactionIndex, 1)[0];
    
    // Save the updated transactions
    writeDataFile('transactions.json', transactions);

    return NextResponse.json({ 
      success: true, 
      message: 'Transaction deleted successfully',
      deletedTransaction 
    });

  } catch (error) {
    console.error('Error deleting transaction:', error);
    return NextResponse.json(
      { error: 'Failed to delete transaction' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const updateData = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    const transactions = readDataFile('transactions.json') || [];
    
    // Find the transaction to update
    const transactionIndex = transactions.findIndex(t => t.id === id);
    
    if (transactionIndex === -1) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Update the transaction
    transactions[transactionIndex] = {
      ...transactions[transactionIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    
    // Save the updated transactions
    writeDataFile('transactions.json', transactions);

    return NextResponse.json({ 
      success: true, 
      message: 'Transaction updated successfully',
      transaction: transactions[transactionIndex]
    });

  } catch (error) {
    console.error('Error updating transaction:', error);
    return NextResponse.json(
      { error: 'Failed to update transaction' },
      { status: 500 }
    );
  }
}