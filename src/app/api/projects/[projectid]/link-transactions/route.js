// /api/projects/[projectId]/link-transactions/route.js - Link transactions to projects

import { NextResponse } from 'next/server';
import { readDataFile, writeDataFile } from '@/utils/dataManager';

export async function POST(request, { params }) {
  try {
    const { projectId } = params;
    const { transactionIds } = await request.json();
    
    if (!Array.isArray(transactionIds)) {
      return NextResponse.json(
        { error: 'Transaction IDs must be an array' },
        { status: 400 }
      );
    }

    const projects = readDataFile('projects.json') || [];
    const projectIndex = projects.findIndex(p => p.id === projectId);
    
    if (projectIndex === -1) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Update project with linked transaction IDs
    projects[projectIndex] = {
      ...projects[projectIndex],
      linkedTransactionIds: transactionIds,
      updatedAt: new Date().toISOString()
    };
    
    writeDataFile('projects.json', projects);

    return NextResponse.json({ 
      success: true, 
      linkedCount: transactionIds.length,
      project: projects[projectIndex]
    });
  } catch (error) {
    console.error('Error linking transactions to project:', error);
    return NextResponse.json(
      { error: 'Failed to link transactions' },
      { status: 500 }
    );
  }
}

export async function GET(request, { params }) {
  try {
    const { projectId } = params;
    
    const projects = readDataFile('projects.json') || [];
    const transactions = readDataFile('transactions.json') || [];
    
    const project = projects.find(p => p.id === projectId);
    
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Get linked transactions with full details
    const linkedTransactions = transactions.filter(t => 
      project.linkedTransactionIds && project.linkedTransactionIds.includes(t.id)
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
    const { projectId } = params;
    const { transactionId } = await request.json();
    
    if (!transactionId) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    const projects = readDataFile('projects.json') || [];
    const projectIndex = projects.findIndex(p => p.id === projectId);
    
    if (projectIndex === -1) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Remove transaction ID from linked transactions
    const currentLinkedIds = projects[projectIndex].linkedTransactionIds || [];
    const updatedLinkedIds = currentLinkedIds.filter(id => id !== transactionId);
    
    projects[projectIndex] = {
      ...projects[projectIndex],
      linkedTransactionIds: updatedLinkedIds,
      updatedAt: new Date().toISOString()
    };
    
    writeDataFile('projects.json', projects);

    return NextResponse.json({ 
      success: true,
      removedTransactionId: transactionId,
      remainingCount: updatedLinkedIds.length
    });
  } catch (error) {
    console.error('Error unlinking transaction from project:', error);
    return NextResponse.json(
      { error: 'Failed to unlink transaction' },
      { status: 500 }
    );
  }
}