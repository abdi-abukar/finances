// /api/projects/[projectId]/category-budgets/route.js
import { NextResponse } from 'next/server';
import { readDataFile, writeDataFile } from '@/utils/dataManager';

export async function GET(request, { params }) {
  try {
    const { projectId } = params;
    
    const categoryBudgets = readDataFile('project-category-budgets.json') || [];
    const projectBudgets = categoryBudgets.filter(budget => budget.projectId === projectId);

    return NextResponse.json({ categoryBudgets: projectBudgets });
  } catch (error) {
    console.error('Error fetching category budgets:', error);
    return NextResponse.json({ error: 'Failed to fetch category budgets' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const { projectId } = params;
    const { categoryId, budgetAmount } = await request.json();
    
    if (!categoryId || !budgetAmount) {
      return NextResponse.json(
        { error: 'Category ID and budget amount are required' },
        { status: 400 }
      );
    }

    const categoryBudgets = readDataFile('project-category-budgets.json') || [];
    
    // Check if category already has a budget for this project
    const existingBudget = categoryBudgets.find(budget => 
      budget.projectId === projectId && budget.categoryId === categoryId
    );
    
    if (existingBudget) {
      return NextResponse.json(
        { error: 'Category already has a budget for this project' },
        { status: 400 }
      );
    }

    const newCategoryBudget = {
      id: `catbudget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      projectId,
      categoryId,
      budgetAmount: parseFloat(budgetAmount),
      linkedTransactionIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    categoryBudgets.push(newCategoryBudget);
    writeDataFile('project-category-budgets.json', categoryBudgets);

    return NextResponse.json({ success: true, categoryBudget: newCategoryBudget });
  } catch (error) {
    console.error('Error creating category budget:', error);
    return NextResponse.json(
      { error: 'Failed to create category budget' },
      { status: 500 }
    );
  }
}