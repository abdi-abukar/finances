import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Plus,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Trash2,
  BarChart3,
  CheckCircle,
  FolderOpen,
  ArrowLeft,
  PieChart,
  Calculator,
  Target,
  Building,
  Calendar
} from 'lucide-react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

// Simple Create Project Modal
function CreateProjectModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    clientBudget: '',
    status: 'active'
  });

  const handleSubmit = async () => {
    if (!formData.name || !formData.clientBudget) {
      alert('Please fill in project name and budget');
      return;
    }

    const newProject = {
      id: `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: formData.name.trim(),
      clientBudget: parseFloat(formData.clientBudget),
      status: formData.status,
      assignedCategories: {}, // categoryId -> { amount: total, transactionIds: [] }
      createdAt: new Date().toISOString()
    };

    onSuccess(newProject);
    setFormData({ name: '', clientBudget: '', status: 'active' });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Create Project</h2>
          <p className="text-gray-600">Set up a new project for expense tracking</p>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project Name *
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Client Website Project"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Total Budget ($) *
            </label>
            <Input
              type="number"
              value={formData.clientBudget}
              onChange={(e) => setFormData(prev => ({ ...prev, clientBudget: e.target.value }))}
              placeholder="50000"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
            >
              <option value="active">Active</option>
              <option value="planning">Planning</option>
              <option value="on-hold">On Hold</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="flex-1 bg-emerald-600 text-white">
              Create Project
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Category Assignment Modal - Shows all transactions in the category
function CategoryAssignmentModal({ isOpen, onClose, project, category, categoryData, onUpdateProject }) {
  const [selectedTransactions, setSelectedTransactions] = useState(new Set());

  useEffect(() => {
    if (project && category && project.assignedCategories[category.id]) {
      setSelectedTransactions(new Set(project.assignedCategories[category.id].transactionIds || []));
    } else {
      setSelectedTransactions(new Set());
    }
  }, [project, category]);

  const toggleTransaction = (transactionId) => {
    setSelectedTransactions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(transactionId)) {
        newSet.delete(transactionId);
      } else {
        newSet.add(transactionId);
      }
      return newSet;
    });
  };

  const handleSave = () => {
    const selectedTransactionObjects = categoryData.transactions.filter(t => 
      selectedTransactions.has(t.id)
    );
    const totalAmount = selectedTransactionObjects.reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const updatedProject = {
      ...project,
      assignedCategories: {
        ...project.assignedCategories,
        [category.id]: {
          amount: totalAmount,
          transactionIds: Array.from(selectedTransactions),
          transactionCount: selectedTransactions.size
        }
      }
    };
    
    onUpdateProject(updatedProject);
    onClose();
  };

  const handleSelectAll = () => {
    setSelectedTransactions(new Set(categoryData.transactions.map(t => t.id)));
  };

  const handleSelectNone = () => {
    setSelectedTransactions(new Set());
  };

  if (!isOpen || !category || !categoryData) return null;

  const selectedTransactionObjects = categoryData.transactions.filter(t => selectedTransactions.has(t.id));
  const totalSelected = selectedTransactionObjects.reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[80vh] shadow-2xl flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            Assign {category.name} Transactions to {project.name}
          </h2>
          <p className="text-gray-600">
            {categoryData.transactions.length} total transactions • ${categoryData.totalAmount.toFixed(2)} total amount
          </p>
          <p className="text-emerald-600 font-medium">
            Selected: {selectedTransactions.size} transactions • ${totalSelected.toFixed(2)}
          </p>
        </div>

        <div className="p-6 border-b">
          <div className="flex gap-2">
            <Button 
              onClick={handleSelectAll}
              variant="outline"
              size="sm"
            >
              Select All
            </Button>
            <Button 
              onClick={handleSelectNone}
              variant="outline"
              size="sm"
            >
              Select None
            </Button>
            <div className="ml-auto flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              <span className="font-medium">{category.name}</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-2">
            {categoryData.transactions.map(transaction => (
              <div
                key={transaction.id}
                className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  selectedTransactions.has(transaction.id)
                    ? 'border-emerald-200 bg-emerald-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => toggleTransaction(transaction.id)}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                    selectedTransactions.has(transaction.id)
                      ? 'border-emerald-600 bg-emerald-600'
                      : 'border-gray-300'
                  }`}>
                    {selectedTransactions.has(transaction.id) && (
                      <CheckCircle className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {transaction.merchantName || transaction.description}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="w-3 h-3" />
                      <span>{transaction.date}</span>
                      <span>•</span>
                      <span>{transaction.accountName}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-red-600">
                    ${Math.abs(transaction.amount).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 border-t bg-gray-50">
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-gray-600">
              {selectedTransactions.size} of {categoryData.transactions.length} transactions selected
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-gray-900">
                Total: ${totalSelected.toFixed(2)}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1 bg-emerald-600 text-white">
              Assign {selectedTransactions.size} Transactions
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Project Management Component
export default function ProjectManagement({ profileId }) {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [categoryData, setCategoryData] = useState({}); // categoryId -> { transactions: [], totalAmount: number }
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [profileId]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch categories
      const categoriesResponse = await fetch('/api/categories');
      const categoriesResult = await categoriesResponse.json();
      const allCategories = categoriesResult.categories || [];
      setCategories(allCategories);

      // Fetch transactions
      const transactionsResponse = await fetch(`/api/transactions?profileId=${profileId}`);
      const transactionsResult = await transactionsResponse.json();
      const allTransactions = transactionsResult.transactions || [];
      setTransactions(allTransactions);

      // Group transactions by category (like the TransactionReview component)
      const categoryGroups = {};
      allCategories.forEach(category => {
        const categoryTransactions = allTransactions.filter(t => 
          t.categoryId === category.id && !t.isExcluded
        );
        
        if (categoryTransactions.length > 0) {
          categoryGroups[category.id] = {
            transactions: categoryTransactions,
            totalAmount: categoryTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0),
            category: category
          };
        }
      });
      
      setCategoryData(categoryGroups);

      // Load projects from localStorage
      const savedProjects = localStorage.getItem(`projects_${profileId}`);
      if (savedProjects) {
        setProjects(JSON.parse(savedProjects));
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveProjects = (updatedProjects) => {
    setProjects(updatedProjects);
    localStorage.setItem(`projects_${profileId}`, JSON.stringify(updatedProjects));
  };

  const handleProjectCreated = (newProject) => {
    const updatedProjects = [...projects, newProject];
    saveProjects(updatedProjects);
  };

  const handleUpdateProject = (updatedProject) => {
    const updatedProjects = projects.map(p => 
      p.id === updatedProject.id ? updatedProject : p
    );
    saveProjects(updatedProjects);
    setSelectedProject(updatedProject);
  };

  const deleteProject = (projectId) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    
    const updatedProjects = projects.filter(p => p.id !== projectId);
    saveProjects(updatedProjects);
    if (selectedProject?.id === projectId) {
      setSelectedProject(null);
    }
  };

  const removeCategoryFromProject = (categoryId) => {
    if (!confirm('Remove this category from the project?')) return;
    
    const updatedProject = {
      ...selectedProject,
      assignedCategories: Object.fromEntries(
        Object.entries(selectedProject.assignedCategories).filter(([id]) => id !== categoryId)
      )
    };
    handleUpdateProject(updatedProject);
  };

  // Calculate project analytics
  const getProjectAnalytics = (project) => {
    const assignedCategories = project.assignedCategories || {};
    const totalSpent = Object.values(assignedCategories).reduce((sum, cat) => sum + (cat.amount || 0), 0);
    const netProfit = project.clientBudget - totalSpent;
    const profitMargin = project.clientBudget > 0 ? (netProfit / project.clientBudget) * 100 : 0;
    const spentPercentage = project.clientBudget > 0 ? (totalSpent / project.clientBudget) * 100 : 0;

    const categoryBreakdown = Object.entries(assignedCategories).map(([categoryId, data]) => {
      const category = categories.find(c => c.id === categoryId);
      return {
        category: category?.name || 'Unknown',
        amount: data.amount || 0,
        color: category?.color || '#6B7280',
        transactionCount: data.transactionCount || 0,
        id: categoryId
      };
    }).filter(item => item.amount > 0);

    return {
      totalSpent,
      netProfit,
      profitMargin,
      spentPercentage,
      categoryBreakdown
    };
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'planning': return 'bg-blue-100 text-blue-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'on-hold': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          <span className="ml-3 text-gray-600">Loading project data...</span>
        </div>
      </div>
    );
  }

  // Project Detail View
  if (selectedProject) {
    const analytics = getProjectAnalytics(selectedProject);
    const availableCategories = Object.keys(categoryData).filter(catId => 
      !selectedProject.assignedCategories[catId]
    );
    
    return (
      <div className="p-8 space-y-6 max-w-7xl mx-auto">
        {/* Project Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => setSelectedProject(null)}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Projects
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{selectedProject.name}</h1>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={getStatusBadgeColor(selectedProject.status)}>
                  {selectedProject.status}
                </Badge>
                <span className="text-sm text-gray-500">
                  {Object.keys(selectedProject.assignedCategories || {}).length} categories assigned
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => setShowCategoryModal(true)}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
              disabled={availableCategories.length === 0}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Category ({availableCategories.length} available)
            </Button>
            <Button 
              onClick={() => deleteProject(selectedProject.id)}
              variant="outline"
              className="border-red-600 text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Project
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Budget</p>
                  <p className="text-2xl font-bold text-blue-600">
                    ${selectedProject.clientBudget?.toLocaleString() || '0'}
                  </p>
                </div>
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Spent</p>
                  <p className="text-2xl font-bold text-red-600">
                    ${analytics.totalSpent.toLocaleString()}
                  </p>
                </div>
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Net Profit</p>
                  <p className={`text-2xl font-bold ${
                    analytics.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    ${analytics.netProfit.toLocaleString()}
                  </p>
                </div>
                <Calculator className={`w-6 h-6 ${
                  analytics.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                }`} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Profit Margin</p>
                  <p className={`text-2xl font-bold ${
                    analytics.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {analytics.profitMargin.toFixed(1)}%
                  </p>
                </div>
                <TrendingUp className={`w-6 h-6 ${
                  analytics.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'
                }`} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Bar */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Budget Usage</h3>
                <span className="text-sm text-gray-600">
                  {analytics.spentPercentage.toFixed(1)}% of budget used
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div 
                  className={`h-4 rounded-full transition-all ${
                    analytics.spentPercentage > 100 ? 'bg-red-500' :
                    analytics.spentPercentage > 90 ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(analytics.spentPercentage, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Spent: ${analytics.totalSpent.toLocaleString()}</span>
                <span>Remaining: ${(selectedProject.clientBudget - analytics.totalSpent).toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analytics Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Spending Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.categoryBreakdown.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No categories assigned yet</p>
                  <Button 
                    onClick={() => setShowCategoryModal(true)}
                    className="bg-emerald-600 text-white"
                    disabled={availableCategories.length === 0}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Category
                  </Button>
                </div>
              ) : (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={analytics.categoryBreakdown}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="amount"
                        nameKey="category"
                      >
                        {analytics.categoryBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => [`$${value.toFixed(2)}`, 'Amount']}
                        labelFormatter={(label) => `Category: ${label}`}
                      />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assigned Categories */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Assigned Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-80 overflow-y-auto">
                {analytics.categoryBreakdown.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">No categories assigned yet</p>
                    <Button 
                      onClick={() => setShowCategoryModal(true)}
                      className="bg-emerald-600 text-white"
                      disabled={availableCategories.length === 0}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Category
                    </Button>
                  </div>
                ) : (
                  analytics.categoryBreakdown.map(categoryItem => {
                    const percentage = analytics.totalSpent > 0 ? (categoryItem.amount / analytics.totalSpent) * 100 : 0;
                    const category = categories.find(c => c.id === categoryItem.id);
                    
                    return (
                      <div key={categoryItem.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-5 h-5 rounded-full"
                              style={{ backgroundColor: categoryItem.color }}
                            />
                            <div>
                              <h3 className="font-semibold text-gray-900">{categoryItem.category}</h3>
                              <p className="text-sm text-gray-500">
                                {categoryItem.transactionCount} transactions assigned
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <p className="font-bold text-gray-900">${categoryItem.amount.toFixed(2)}</p>
                              <p className="text-sm text-gray-500">{percentage.toFixed(1)}%</p>
                            </div>
                   
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:bg-red-50"
                              onClick={() => removeCategoryFromProject(categoryItem.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full"
                            style={{ 
                              backgroundColor: categoryItem.color,
                              width: `${percentage}%`
                            }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Available Categories Modal */}
        {showCategoryModal && !selectedCategory && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl max-h-[80vh] overflow-y-auto">
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold text-gray-900">
                  Add Category to Project
                </h2>
                <p className="text-gray-600">Select a category to assign its transactions to this project</p>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 gap-4 max-h-96 overflow-y-auto">
                  {availableCategories.map(categoryId => {
                    const categoryGroup = categoryData[categoryId];
                    const category = categoryGroup?.category;
                    
                    if (!category) return null;
                    
                    return (
                      <div
                        key={categoryId}
                        onClick={() => {
                          setSelectedCategory(category);
                          setShowCategoryModal(false);
                        }}
                        className="p-4 border-2 border-gray-200 rounded-lg hover:border-emerald-300 hover:bg-emerald-50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-6 h-6 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                            <div>
                              <h3 className="font-semibold text-gray-900">{category.name}</h3>
                              <p className="text-sm text-gray-500">
                                {categoryGroup.transactions.length} transactions • ${categoryGroup.totalAmount.toFixed(2)} total
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-900">${categoryGroup.totalAmount.toFixed(2)}</p>
                            <p className="text-sm text-gray-500">{categoryGroup.transactions.length} transactions</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="flex gap-3 pt-6">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowCategoryModal(false);
                      setSelectedCategory(null);
                    }} 
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transaction Assignment Modal */}
        <CategoryAssignmentModal
          isOpen={!showCategoryModal && selectedCategory !== null}
          onClose={() => setSelectedCategory(null)}
          onSuccess={() => setSelectedCategory(null)}
          project={selectedProject}
          category={selectedCategory}
          categoryData={selectedCategory ? categoryData[selectedCategory.id] : null}
          onUpdateProject={handleUpdateProject}
        />
      </div>
    );
  }

  // Projects List View
  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600">Track expenses and calculate net profit by project</p>
          <p className="text-sm text-gray-500 mt-1">
            {Object.keys(categoryData).length} categories with transactions available
          </p>
        </div>
        <Button 
          onClick={() => setShowCreateProject(true)}
          className="bg-emerald-600 text-white hover:bg-emerald-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Button>
      </div>

      {/* Quick Stats */}
      {Object.keys(categoryData).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Available Categories</p>
                  <p className="text-2xl font-bold text-blue-600">{Object.keys(categoryData).length}</p>
                </div>
                <Target className="w-6 h-6 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Transactions</p>
                  <p className="text-2xl font-bold text-green-600">
                    {Object.values(categoryData).reduce((sum, cat) => sum + cat.transactions.length, 0)}
                  </p>
                </div>
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="text-2xl font-bold text-purple-600">
                    ${Object.values(categoryData).reduce((sum, cat) => sum + cat.totalAmount, 0).toLocaleString()}
                  </p>
                </div>
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Projects</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {projects.filter(p => p.status === 'active').length}
                  </p>
                </div>
                <FolderOpen className="w-6 h-6 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-16 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <FolderOpen className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No projects yet</h3>
            <p className="text-gray-600 mb-8 text-lg">Create your first project to start tracking expenses and net profit</p>
            <Button 
              onClick={() => setShowCreateProject(true)}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map(project => {
            const analytics = getProjectAnalytics(project);
            
            return (
              <Card 
                key={project.id} 
                className="border-0 shadow-lg hover:shadow-xl cursor-pointer transition-all duration-300 hover:-translate-y-1 bg-white"
                onClick={() => setSelectedProject(project)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-xl text-gray-900 truncate">{project.name}</CardTitle>
                    </div>
                    <Badge className={`ml-2 ${getStatusBadgeColor(project.status)}`}>
                      {project.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Budget & Net Profit */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-600 font-medium">Budget</p>
                      <p className="text-lg font-bold text-blue-700">
                        ${project.clientBudget?.toLocaleString() || '0'}
                      </p>
                    </div>
                    <div className={`text-center p-3 rounded-lg ${
                      analytics.netProfit >= 0 ? 'bg-green-50' : 'bg-red-50'
                    }`}>
                      <p className={`text-xs font-medium ${
                        analytics.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>Net Profit</p>
                      <p className={`text-lg font-bold ${
                        analytics.netProfit >= 0 ? 'text-green-700' : 'text-red-700'
                      }`}>
                        ${analytics.netProfit.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Spent & Margin */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <p className="text-xs text-red-600 font-medium">Spent</p>
                      <p className="text-lg font-bold text-red-700">
                        ${analytics.totalSpent.toLocaleString()}
                      </p>
                    </div>
                    <div className={`text-center p-3 rounded-lg ${
                      analytics.profitMargin >= 0 ? 'bg-green-50' : 'bg-red-50'
                    }`}>
                      <p className={`text-xs font-medium ${
                        analytics.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>Margin</p>
                      <p className={`text-lg font-bold ${
                        analytics.profitMargin >= 0 ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {analytics.profitMargin.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {/* Categories Info */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Assigned Categories</span>
                      <span className="text-gray-600">{Object.keys(project.assignedCategories || {}).length}</span>
                    </div>
                    
                    {/* Categories Preview */}
                    {analytics.categoryBreakdown.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {analytics.categoryBreakdown.slice(0, 3).map((cat, idx) => (
                          <div key={idx} className="flex items-center gap-1">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: cat.color }}
                            />
                            <span className="text-xs text-gray-600">
                              ${cat.amount.toFixed(0)}
                            </span>
                          </div>
                        ))}
                        {analytics.categoryBreakdown.length > 3 && (
                          <span className="text-xs text-gray-400">
                            +{analytics.categoryBreakdown.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="text-sm text-gray-500">
                      Created {new Date(project.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1 text-emerald-600 font-medium text-sm">
                      <PieChart className="w-4 h-4" />
                      <span>View Details</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={showCreateProject}
        onClose={() => setShowCreateProject(false)}
        onSuccess={handleProjectCreated}
      />
    </div>
  );
}