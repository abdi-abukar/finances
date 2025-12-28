'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, TrendingUp, TrendingDown, CreditCard, Upload, DollarSign, Calendar, PieChart, Target, Trash2, Edit, ArrowDownCircle, Save, X, Palette, Filter, ChevronDown, BarChart3, Activity } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function DashboardOverview({ 
  accounts = [], 
  transactions = [], 
  onCreateAccount, 
  onUploadStatement,
  onRefreshTransactions 
}) {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  const [showCustomRange, setShowCustomRange] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', color: '#ef4444' });
  const [viewMode, setViewMode] = useState('spending'); // 'spending', 'income', or 'payments'
  const [sortBy, setSortBy] = useState('date'); // 'date', 'amount', 'category'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'
  const [newTransaction, setNewTransaction] = useState({
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    accountId: '',
    categoryId: ''
  });

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const result = await response.json();
      setCategories(result.categories || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
      setCategories([]);
    }
  };

  // Add new category
  const addCustomCategory = async () => {
    if (!newCategory.name.trim()) return;
    
    const category = {
      id: `category_${Date.now()}`,
      name: newCategory.name.trim(),
      color: newCategory.color,
      createdAt: new Date().toISOString()
    };

    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category })
      });

      if (response.ok) {
        setCategories(prev => [...prev, category]);
        setNewCategory({ name: '', color: '#ef4444' });
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create category');
      }
    } catch (error) {
      console.error('Error creating category:', error);
      alert('Error creating category');
    }
  };

  // Helper function to determine if transaction is spending (FIXED CREDIT CARD LOGIC)
  const isSpending = (transaction) => {
    const account = accounts.find(a => a.id === transaction.accountId);
    if (!account) return false;
    
    // Skip credit card payments - they're not spending
    if (account.type === 'credit' && transaction.amount > 0 && 
        (transaction.description.includes('PAYMENT') || transaction.description.includes('PAIEMENT'))) {
      return false;
    }
    
    // CREDIT CARDS: negative amount = spending (charges)
    // DEBIT/CHECKING: negative amount = spending
    return transaction.amount < 0;
  };

  // Helper function to determine if transaction is income  
  const isIncome = (transaction) => {
    const account = accounts.find(a => a.id === transaction.accountId);
    if (!account) return false;
    
    // Skip credit card payments - they're not income either
    if (account.type === 'credit' && transaction.amount > 0 && 
        (transaction.description.includes('PAYMENT') || transaction.description.includes('PAIEMENT'))) {
      return false;
    }
    
    // DEBIT/CHECKING: positive amount = income
    // CREDIT CARDS: no income transactions
    return account.type !== 'credit' && transaction.amount > 0;
  };

  // Helper function to determine if transaction is a payment
  const isPayment = (transaction) => {
    const account = accounts.find(a => a.id === transaction.accountId);
    if (!account) return false;
    
    // Credit card payments
    return account.type === 'credit' && transaction.amount > 0 && 
           (transaction.description.includes('PAYMENT') || transaction.description.includes('PAIEMENT'));
  };

// Get date range for selected period - FIXED VERSION
const getDateRange = (period) => {
  const now = new Date();
  let startDate = new Date();
  let endDate = new Date();
  
  if (period === 'custom' && customDateRange.start && customDateRange.end) {
    startDate = new Date(customDateRange.start);
    // Set end date to end of day to include all transactions on that date
    endDate = new Date(customDateRange.end);
    endDate.setHours(23, 59, 59, 999);
  } else {
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = new Date();
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'month':
        // Start of current month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        // End of current month - SET TO END OF DAY
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'quarter':
        const quarterStart = Math.floor(now.getMonth() / 3) * 3;
        startDate = new Date(now.getFullYear(), quarterStart, 1);
        // End of quarter - SET TO END OF DAY
        endDate = new Date(now.getFullYear(), quarterStart + 3, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        // End of year - SET TO END OF DAY
        endDate = new Date(now.getFullYear(), 11, 31);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'all':
        startDate = new Date(0);
        endDate = new Date();
        endDate.setHours(23, 59, 59, 999);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
    }
  }
  
  return { startDate, endDate };
};
  const { startDate, endDate } = getDateRange(selectedPeriod);

// Also update the transaction filtering to be more explicit
const periodTransactions = transactions.filter(t => {
  const transactionDate = new Date(t.date);
  // Make sure transaction date is compared properly
  const transactionTime = transactionDate.getTime();
  const startTime = startDate.getTime();
  const endTime = endDate.getTime();
  
  const inPeriod = transactionTime >= startTime && transactionTime <= endTime;
  
  // Debug logging (remove in production)
  if (selectedPeriod === 'month' && t.date.includes('2025-08-02')) {
    console.log('Debug transaction filter:', {
      transactionDate: t.date,
      transactionTime: new Date(transactionTime).toISOString(),
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      inPeriod
    });
  }
  
  if (selectedCategory === 'all') return inPeriod;
  if (selectedCategory === 'uncategorized') return inPeriod && !t.categoryId;
  return inPeriod && t.categoryId === selectedCategory;
});


  // Filter transactions by view mode (spending vs income vs payments)
  const filteredTransactions = periodTransactions.filter(t => {
    if (viewMode === 'spending') return isSpending(t);
    if (viewMode === 'income') return isIncome(t);
    if (viewMode === 'payments') return isPayment(t);
    return true;
  });

  // Calculate totals
  const totalSpending = periodTransactions.filter(isSpending).reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const totalIncome = periodTransactions.filter(isIncome).reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const totalPayments = periodTransactions.filter(isPayment).reduce((sum, t) => sum + Math.abs(t.amount), 0);
  
  const currentTotal = viewMode === 'spending' ? totalSpending : 
                      viewMode === 'income' ? totalIncome : totalPayments;
  
  const currentTransactions = viewMode === 'spending' ? periodTransactions.filter(isSpending) : 
                             viewMode === 'income' ? periodTransactions.filter(isIncome) :
                             periodTransactions.filter(isPayment);

  // Calculate spending by category
  const dataByCategory = currentTransactions.reduce((acc, transaction) => {
    const amount = Math.abs(transaction.amount);
    const categoryName = transaction.categoryName || 'Uncategorized';
    const categoryColor = transaction.categoryColor || '#6b7280';
    
    if (!acc[categoryName]) {
      acc[categoryName] = { 
        amount: 0, 
        count: 0, 
        color: categoryColor 
      };
    }
    acc[categoryName].amount += amount;
    acc[categoryName].count += 1;
    return acc;
  }, {});

  // Calculate data by account
  const dataByAccount = accounts.map(account => {
    const accountTransactions = currentTransactions.filter(t => t.accountId === account.id);
    const total = accountTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    return {
      ...account,
      total,
      transactionCount: accountTransactions.length
    };
  }).filter(account => account.total > 0).sort((a, b) => b.total - a.total);

  // Sort transactions
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    let aVal, bVal;
    
    switch (sortBy) {
      case 'amount':
        aVal = Math.abs(a.amount);
        bVal = Math.abs(b.amount);
        break;
      case 'category':
        aVal = a.categoryName || 'Uncategorized';
        bVal = b.categoryName || 'Uncategorized';
        break;
      case 'date':
      default:
        aVal = new Date(a.date);
        bVal = new Date(b.date);
        break;
    }
    
    if (sortOrder === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  // Recent transactions (top 8)
  const recentTransactions = sortedTransactions.slice(0, 8);

  // Add new transaction
  const addTransaction = async () => {
    try {
      const account = accounts.find(a => a.id === newTransaction.accountId);
      const category = categories.find(c => c.id === newTransaction.categoryId);
      
      const transactionData = {
        ...newTransaction,
        amount: parseFloat(newTransaction.amount),
        accountName: account?.name,
        accountType: account?.type,
        currency: account?.currency || 'CAD',
        categoryId: newTransaction.categoryId || null,
        categoryName: category?.name || null,
        categoryColor: category?.color || null,
        isRecurring: false
      };

      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions: [transactionData], customCategories: [] })
      });

      if (response.ok) {
        onRefreshTransactions?.();
        setShowAddTransaction(false);
        setNewTransaction({
          description: '',
          amount: '',
          date: new Date().toISOString().split('T')[0],
          accountId: '',
          categoryId: ''
        });
      }
    } catch (error) {
      console.error('Error adding transaction:', error);
      alert('Failed to add transaction');
    }
  };

  // Edit transaction
  const saveEditTransaction = async () => {
    try {
      const response = await fetch(`/api/transactions/${editingTransaction.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: editingTransaction.description,
          amount: parseFloat(editingTransaction.amount),
          date: editingTransaction.date
        })
      });

      if (response.ok) {
        onRefreshTransactions?.();
        setEditingTransaction(null);
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
      alert('Failed to update transaction');
    }
  };

  // Delete transaction
  const deleteTransaction = async (transactionId) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;
    
    try {
      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        onRefreshTransactions?.();
      } else {
        alert('Failed to delete transaction');
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert('Error deleting transaction');
    }
  };

  // Format date range display
  const formatDateRange = () => {
    if (selectedPeriod === 'custom' && customDateRange.start && customDateRange.end) {
      return `${new Date(customDateRange.start).toLocaleDateString()} - ${new Date(customDateRange.end).toLocaleDateString()}`;
    }
    
    const options = { month: 'long', day: 'numeric', year: 'numeric' };
    
    switch (selectedPeriod) {
      case 'week':
        return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`;
      case 'month':
        return `${startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
      case 'quarter':
        return `Q${Math.floor(startDate.getMonth() / 3) + 1} ${startDate.getFullYear()}`;
      case 'year':
        return `${startDate.getFullYear()}`;
      case 'all':
        return 'All Time';
      default:
        return `${startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
    }
  };

  // Get selected category name for display
  const getSelectedCategoryName = () => {
    if (selectedCategory === 'all') return 'All Categories';
    if (selectedCategory === 'uncategorized') return 'Uncategorized';
    const category = categories.find(c => c.id === selectedCategory);
    return category?.name || '';
  };

  // Get count of uncategorized transactions
  const uncategorizedCount = transactions.filter(t => !t.categoryId).length;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header with Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Financial Dashboard</h1>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-lg font-medium text-gray-700">{formatDateRange()}</span>
            <span className="text-sm text-gray-500">• {currentTransactions.length} {viewMode} transactions</span>
          </div>
        </div>
        
        {/* View Mode Toggle */}
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'spending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('spending')}
            className={viewMode === 'spending' ? 'bg-red-600 text-white' : 'text-red-600 border-red-200'}
          >
            <ArrowDownCircle className="w-4 h-4 mr-2" />
            Spending
          </Button>
          <Button
            variant={viewMode === 'income' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('income')}
            className={viewMode === 'income' ? 'bg-green-600 text-white' : 'text-green-600 border-green-200'}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Income
          </Button>
          <Button
            variant={viewMode === 'payments' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('payments')}
            className={viewMode === 'payments' ? 'bg-blue-600 text-white' : 'text-blue-600 border-blue-200'}
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Payments
          </Button>
        </div>
      </div>

      {/* Period Selection */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-gray-700">Period:</span>
        {[
          { key: 'week', label: 'Week' },
          { key: 'month', label: 'Month' },
          { key: 'quarter', label: 'Quarter' },
          { key: 'year', label: 'Year' },
          { key: 'custom', label: 'Custom' },
          { key: 'all', label: 'All' }
        ].map((period) => (
          <Button
            key={period.key}
            variant={selectedPeriod === period.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setSelectedPeriod(period.key);
              if (period.key === 'custom') {
                setShowCustomRange(true);
              } else {
                setShowCustomRange(false);
              }
            }}
            className={selectedPeriod === period.key ? 'bg-emerald-600 text-white' : ''}
          >
            {period.label}
          </Button>
        ))}
      </div>

      {/* Custom Date Range Picker */}
      {showCustomRange && (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <Input
                  type="date"
                  value={customDateRange.start}
                  onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="w-40"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <Input
                  type="date"
                  value={customDateRange.end}
                  onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="w-40"
                />
              </div>
              <div className="pt-6">
                <Button 
                  onClick={() => setSelectedPeriod('custom')}
                  disabled={!customDateRange.start || !customDateRange.end}
                  className="bg-emerald-600 text-white"
                >
                  Apply
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Filter Dropdown */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <Button
            variant="outline"
            onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
            className="min-w-[200px] justify-between"
          >
            <span className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              {getSelectedCategoryName()}
            </span>
            <ChevronDown className="w-4 h-4" />
          </Button>
          
          {showCategoryDropdown && (
            <div className="absolute z-50 top-full mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg">
              <div className="p-3 border-b">
                <div className="flex gap-2">
                  <Input
                    placeholder="New category name..."
                    value={newCategory.name}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                    className="flex-1"
                  />
                  <input
                    type="color"
                    value={newCategory.color}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, color: e.target.value }))}
                    className="w-10 h-10 rounded border"
                  />
                  <Button onClick={addCustomCategory} size="sm" className="bg-emerald-600 text-white">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="max-h-60 overflow-y-auto">
                <button
                  onClick={() => { setSelectedCategory('all'); setShowCategoryDropdown(false); }}
                  className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${selectedCategory === 'all' ? 'bg-emerald-50 text-emerald-700' : ''}`}
                >
                  All Categories ({transactions.length})
                </button>
                <button
                  onClick={() => { setSelectedCategory('uncategorized'); setShowCategoryDropdown(false); }}
                  className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${selectedCategory === 'uncategorized' ? 'bg-emerald-50 text-emerald-700' : ''}`}
                >
                  Uncategorized ({uncategorizedCount})
                </button>
                {categories.map((category) => {
                  const count = transactions.filter(t => t.categoryId === category.id).length;
                  return (
                    <button
                      key={category.id}
                      onClick={() => { setSelectedCategory(category.id); setShowCategoryDropdown(false); }}
                      className={`w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 ${selectedCategory === category.id ? 'bg-emerald-50 text-emerald-700' : ''}`}
                    >
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }}></div>
                      {category.name} ({count})
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
          >
            <option value="date">Date</option>
            <option value="amount">Amount</option>
            <option value="category">Category</option>
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </Button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className={`border-0 shadow-lg ${
          viewMode === 'spending' ? 'bg-gradient-to-br from-red-500 to-red-600' : 
          viewMode === 'income' ? 'bg-gradient-to-br from-green-500 to-green-600' :
          'bg-gradient-to-br from-blue-500 to-blue-600'
        } text-white`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${
                  viewMode === 'spending' ? 'text-red-100' : 
                  viewMode === 'income' ? 'text-green-100' : 'text-blue-100'
                }`}>
                  Total {viewMode === 'spending' ? 'Spending' : viewMode === 'income' ? 'Income' : 'Payments'}
                </p>
                <p className="text-3xl font-bold">${currentTotal.toFixed(2)}</p>
                <p className={`text-xs mt-1 ${
                  viewMode === 'spending' ? 'text-red-200' : 
                  viewMode === 'income' ? 'text-green-200' : 'text-blue-200'
                }`}>This period</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                {viewMode === 'spending' ? <ArrowDownCircle className="w-6 h-6" /> : 
                 viewMode === 'income' ? <TrendingUp className="w-6 h-6" /> : 
                 <CreditCard className="w-6 h-6" />}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Avg Transaction</p>
                <p className="text-3xl font-bold">
                  ${currentTransactions.length > 0 ? (currentTotal / currentTransactions.length).toFixed(2) : '0.00'}
                </p>
                <p className="text-blue-200 text-xs mt-1">Per transaction</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Categories</p>
                <p className="text-3xl font-bold">{Object.keys(dataByCategory).length}</p>
                <p className="text-purple-200 text-xs mt-1">Used this period</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <PieChart className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Transactions</p>
                <p className="text-3xl font-bold">{currentTransactions.length}</p>
                <p className="text-orange-200 text-xs mt-1">This period</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* By Category */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              {viewMode === 'spending' ? 'Spending' : viewMode === 'income' ? 'Income' : 'Payments'} by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(dataByCategory).length === 0 ? (
              <div className="text-center py-8">
                <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No data for this period</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(dataByCategory)
                  .sort(([,a], [,b]) => b.amount - a.amount)
                  .map(([category, data]) => {
                    const percentage = ((data.amount / currentTotal) * 100).toFixed(1);
                    return (
                      <div key={category} className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: data.color }}
                          ></div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{category}</p>
                            <p className="text-sm text-gray-500">{data.count} transactions • {percentage}%</p>
                          </div>
                        </div>
                        <p className="font-bold text-gray-900">${data.amount.toFixed(2)}</p>
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* By Account */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5"/>
                {viewMode === 'spending' ? 'Spending' : viewMode === 'income' ? 'Income' : 'Payments'} by Account
              </CardTitle>
              <Button 
                onClick={onCreateAccount} 
                size="sm"
                variant="outline"
                className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Account
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {dataByAccount.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No accounts with activity</p>
                <Button onClick={onCreateAccount} className="bg-emerald-600 text-white">
                  Create Your First Account
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {dataByAccount.map((account) => {
                  const percentage = currentTotal > 0 ? ((account.total / currentTotal) * 100).toFixed(1) : '0.0';
                  return (
                    <div key={account.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          account.type === 'credit' 
                            ? 'bg-orange-100 text-orange-600'
                            : account.type === 'savings'
                            ? 'bg-green-100 text-green-600'
                            : 'bg-blue-100 text-blue-600'
                        }`}>
                          <CreditCard className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{account.name}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs capitalize">{account.type}</Badge>
                            <span className="text-sm text-gray-500">
                              {account.transactionCount} transactions • {percentage}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${
                          viewMode === 'spending' ? 'text-red-600' : 
                          viewMode === 'income' ? 'text-green-600' : 'text-blue-600'
                        }`}>
                          ${account.total.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {viewMode === 'spending' ? 'Spent' : viewMode === 'income' ? 'Earned' : 'Paid'} this period
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Transaction */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Quick Actions</h2>
        <Button 
          onClick={() => setShowAddTransaction(true)}
          className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Transaction
        </Button>
      </div>

      {/* Add Transaction Form */}
      {showAddTransaction && (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Add New Transaction
              <Button variant="ghost" size="sm" onClick={() => setShowAddTransaction(false)}>
                <X className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <Input
                  value={newTransaction.description}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Transaction description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <Input
                  type="number"
                  step="0.01"
                  value={newTransaction.amount}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <Input
                  type="date"
                  value={newTransaction.date}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account</label>
                <select
                  value={newTransaction.accountId}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, accountId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Select Account</option>
                  {accounts.map(account => (
                    <option key={account.id} value={account.id}>{account.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={newTransaction.categoryId}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, categoryId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">No Category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddTransaction(false)}>
                Cancel
              </Button>
              <Button 
                onClick={addTransaction}
                disabled={!newTransaction.description || !newTransaction.amount || !newTransaction.accountId}
                className="bg-emerald-600 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                Add Transaction
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Transactions */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Recent {
              viewMode === 'spending' ? 'Spending' : 
              viewMode === 'income' ? 'Income' : 'Payment'
            } Transactions</CardTitle>
            <Button 
              onClick={onUploadStatement} 
              size="sm"
              variant="outline"
              className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Statement
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentTransactions.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No {viewMode} transactions yet</p>
              <Button onClick={onUploadStatement} className="bg-emerald-600 text-white">
                <Upload className="w-4 h-4 mr-2" />
                Upload Your First Statement
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map((transaction, index) => {
                const account = accounts.find(a => a.id === transaction.accountId);
                const isSpendingTxn = isSpending(transaction);
                const isIncomeTxn = isIncome(transaction);
                const isPaymentTxn = isPayment(transaction);
                const displayAmount = Math.abs(transaction.amount);
                
                // Determine color and icon based on transaction type
                let bgColor, textColor, icon;
                if (isSpendingTxn) {
                  bgColor = 'bg-red-100 text-red-600';
                  textColor = 'text-red-600';
                  icon = <TrendingDown className="w-5 h-5" />;
                } else if (isIncomeTxn) {
                  bgColor = 'bg-green-100 text-green-600';
                  textColor = 'text-green-600';
                  icon = <TrendingUp className="w-5 h-5" />;
                } else if (isPaymentTxn) {
                  bgColor = 'bg-blue-100 text-blue-600';
                  textColor = 'text-blue-600';
                  icon = <CreditCard className="w-5 h-5" />;
                } else {
                  bgColor = 'bg-gray-100 text-gray-600';
                  textColor = 'text-gray-600';
                  icon = <DollarSign className="w-5 h-5" />;
                }
                
                return (
                  <div key={transaction.id || index} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors group">
                    {editingTransaction?.id === transaction.id ? (
                      // Edit mode
                      <div className="flex items-center gap-4 flex-1">
                        <Input
                          value={editingTransaction.description}
                          onChange={(e) => setEditingTransaction(prev => ({ ...prev, description: e.target.value }))}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          step="0.01"
                          value={editingTransaction.amount}
                          onChange={(e) => setEditingTransaction(prev => ({ ...prev, amount: e.target.value }))}
                          className="w-24"
                        />
                        <Input
                          type="date"
                          value={editingTransaction.date}
                          onChange={(e) => setEditingTransaction(prev => ({ ...prev, date: e.target.value }))}
                          className="w-32"
                        />
                        <div className="flex gap-1">
                          <Button size="sm" onClick={saveEditTransaction} className="bg-emerald-600 text-white">
                            <Save className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingTransaction(null)}>
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // View mode
                      <>
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${bgColor}`}>
                            {icon}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{transaction.description}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-gray-500 text-sm">{new Date(transaction.date).toLocaleDateString()}</p>
                              <Badge variant="outline" className="text-xs">{account?.name}</Badge>
                              {transaction.categoryName && (
                                <Badge style={{ backgroundColor: transaction.categoryColor }} className="text-white text-xs">
                                  {transaction.categoryName}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className={`font-bold text-lg ${textColor}`}>
                              {isSpendingTxn ? '-' : '+'}${displayAmount.toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {isSpendingTxn ? 'Expense' : 
                               isIncomeTxn ? 'Income' : 
                               isPaymentTxn ? 'Payment' : 'Other'}
                            </p>
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                            <Button 
                              size="sm"
                              variant="ghost" 
                              className="h-8 w-8 p-0 text-gray-400 hover:text-blue-600"
                              onClick={() => setEditingTransaction({
                                ...transaction,
                                amount: Math.abs(transaction.amount).toString()
                              })}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"
                              onClick={() => deleteTransaction(transaction.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}