// /api/categories/route.js - Categories CRUD API

import { NextResponse } from 'next/server';
import { readDataFile, writeDataFile } from '@/utils/dataManager';

export async function GET() {
  try {
    const categories = readDataFile('categories.json') || [];
    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { category } = await request.json();
    
    if (!category || !category.name || !category.color) {
      return NextResponse.json(
        { error: 'Category name and color are required' },
        { status: 400 }
      );
    }

    const categories = readDataFile('categories.json') || [];
    
    // Check if category name already exists
    const existingCategory = categories.find(cat => 
      cat.name.toLowerCase() === category.name.toLowerCase()
    );
    
    if (existingCategory) {
      return NextResponse.json(
        { error: 'Category with this name already exists' },
        { status: 400 }
      );
    }

    const newCategory = {
      id: category.id || `category_${Date.now()}`,
      name: category.name.trim(),
      color: category.color,
      createdAt: category.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    categories.push(newCategory);
    writeDataFile('categories.json', categories);

    return NextResponse.json({ success: true, category: newCategory });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const { categoryId, updates } = await request.json();
    
    if (!categoryId) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      );
    }

    const categories = readDataFile('categories.json') || [];
    const categoryIndex = categories.findIndex(cat => cat.id === categoryId);
    
    if (categoryIndex === -1) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Update category
    categories[categoryIndex] = {
      ...categories[categoryIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    writeDataFile('categories.json', categories);

    return NextResponse.json({ 
      success: true, 
      category: categories[categoryIndex] 
    });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { categoryId } = await request.json();
    
    if (!categoryId) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      );
    }

    const categories = readDataFile('categories.json') || [];
    const categoryIndex = categories.findIndex(cat => cat.id === categoryId);
    
    if (categoryIndex === -1) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Remove category
    const deletedCategory = categories.splice(categoryIndex, 1)[0];
    writeDataFile('categories.json', categories);

    // Note: You might want to update transactions that use this category
    // to set their categoryId to null or a default category

    return NextResponse.json({ 
      success: true, 
      deletedCategory 
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}