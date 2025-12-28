// /api/projects/route.js
import { NextResponse } from 'next/server';
import { readDataFile, writeDataFile } from '@/utils/dataManager';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profileId');
    
    const projects = readDataFile('projects.json') || [];
    
    // Filter projects by profile
    const filteredProjects = profileId 
      ? projects.filter(project => project.profileId === profileId)
      : projects;

    return NextResponse.json({ projects: filteredProjects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { name, description, clientBudget, startDate, endDate, status, profileId } = await request.json();
    
    if (!name || !description || !clientBudget || !profileId) {
      return NextResponse.json(
        { error: 'Name, description, client budget, and profile ID are required' },
        { status: 400 }
      );
    }

    const projects = readDataFile('projects.json') || [];
    
    const newProject = {
      id: `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      description: description.trim(),
      clientBudget: parseFloat(clientBudget),
      startDate,
      endDate,
      status: status || 'active',
      profileId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    projects.push(newProject);
    writeDataFile('projects.json', projects);

    return NextResponse.json({ success: true, project: newProject });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const { projectId, updates } = await request.json();
    
    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
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

    // Update project
    projects[projectIndex] = {
      ...projects[projectIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    writeDataFile('projects.json', projects);

    return NextResponse.json({ 
      success: true, 
      project: projects[projectIndex] 
    });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { projectId } = await request.json();
    
    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
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

    // Remove project
    const deletedProject = projects.splice(projectIndex, 1)[0];
    writeDataFile('projects.json', projects);

    // Also clean up category budgets for this project
    const categoryBudgets = readDataFile('project-category-budgets.json') || [];
    const filteredBudgets = categoryBudgets.filter(budget => budget.projectId !== projectId);
    writeDataFile('project-category-budgets.json', filteredBudgets);

    return NextResponse.json({ 
      success: true, 
      deletedProject 
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}