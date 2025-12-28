// /api/projects/[projectId]/category-budgets/[budgetId]/route.js
import { NextResponse } from 'next/server';
import { readDataFile, writeDataFile } from '@/utils/dataManager';

export async function PUT(request, { params }) {
  try {
    const { projectId, budgetId } = params;
    const { budgetAmount } = await request.json();
    
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

    // Update budget
    categoryBudgets[budgetIndex] = {
      ...categoryBudgets[budgetIndex],
      budgetAmount: budgetAmount ? parseFloat(budgetAmount) : categoryBudgets[budgetIndex].budgetAmount,
      updatedAt: new Date().toISOString()
    };
    
    writeDataFile('project-category-budgets.json', categoryBudgets);

    return NextResponse.json({ 
      success: true, 
      categoryBudget: categoryBudgets[budgetIndex] 
    });
  } catch (error) {
    console.error('Error updating category budget:', error);
    return NextResponse.json(
      { error: 'Failed to update category budget' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { projectId, budgetId } = params;
    
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

    // Remove budget
    const deletedBudget = categoryBudgets.splice(budgetIndex, 1)[0];
    writeDataFile('project-category-budgets.json', categoryBudgets);

    return NextResponse.json({ 
      success: true, 
      deletedBudget 
    });
  } catch (error) {
    console.error('Error deleting category budget:', error);
    return NextResponse.json(
      { error: 'Failed to delete category budget' },
      { status: 500 }
    );
  }
}