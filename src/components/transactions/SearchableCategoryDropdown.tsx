'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft,
  Save,
  Search,
  Palette,
  Target,
  ChevronDown,
  X
} from 'lucide-react';

function SearchableCategoryDropdown({ 
  categories = [], 
  value = '', 
  onChange, 
  placeholder = "Select or search category...",
  className = "",
  transactionIndex,
  transactionList
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Filter categories based on search term
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        setIsOpen(true);
        setHighlightedIndex(0);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredCategories.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredCategories.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredCategories[highlightedIndex]) {
          selectCategory(filteredCategories[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
        break;
    }
  };

  const selectCategory = (category) => {
    onChange(transactionIndex, category.id);
    setIsOpen(false);
    setSearchTerm('');
    setHighlightedIndex(-1);
    
    // Auto-advance to next uncategorized transaction
    setTimeout(() => {
      if (transactionList && transactionIndex < transactionList.length - 1) {
        // Find next uncategorized transaction
        for (let i = transactionIndex + 1; i < transactionList.length; i++) {
          if (!transactionList[i].categoryId) {
            const nextDropdown = document.querySelector(`[data-transaction-index="${i}"]`);
            if (nextDropdown) {
              nextDropdown.click();
              break;
            }
          }
        }
      }
    }, 100);
  };

  const clearSelection = () => {
    onChange(transactionIndex, '');
    setSearchTerm('');
  };

  const selectedCategory = categories.find(cat => cat.id === value);

  return (
    <div ref={dropdownRef} className={`relative w-64 ${className}`}>
      {/* Main Input/Button */}
      <div
        data-transaction-index={transactionIndex}
        className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus-within:ring-2 focus-within:ring-emerald-500 cursor-pointer ${
          isOpen ? 'ring-2 ring-emerald-500' : ''
        }`}
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            setTimeout(() => inputRef.current?.focus(), 50);
          }
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1">
            {selectedCategory ? (
              <>
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: selectedCategory.color }}
                />
                <span className="text-sm font-medium text-gray-900">
                  {selectedCategory.name}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 ml-auto text-gray-400 hover:text-gray-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearSelection();
                  }}
                >
                  <X className="w-3 h-3" />
                </Button>
              </>
            ) : (
              <span className="text-gray-500 text-sm">{placeholder}</span>
            )}
          </div>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`} />
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                ref={inputRef}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setHighlightedIndex(-1);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Type to search categories..."
                className="pl-10 text-sm"
              />
            </div>
          </div>

          {/* Options */}
          <div className="max-h-48 overflow-y-auto">
            {/* Category Options */}
            {filteredCategories.length === 0 ? (
              <div className="px-3 py-4 text-center text-gray-500 text-sm">
                No categories found
              </div>
            ) : (
              filteredCategories.map((category, index) => (
                <div
                  key={category.id}
                  className={`px-3 py-2 cursor-pointer transition-colors ${
                    highlightedIndex === index 
                      ? 'bg-emerald-100' 
                      : value === category.id 
                      ? 'bg-emerald-50 text-emerald-700' 
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                  onClick={() => selectCategory(category)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-sm font-medium">{category.name}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TransactionReview({ 
  transactions = [], 
  onSave, 
  onCancel,
  accountName 
}) {
  const [transactionList, setTransactionList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState({ name: '', color: '#ef4444' });
  const [isLoading, setIsLoading] = useState(true);

  // Initialize transactions with proper structure
  useEffect(() => {
    console.log('Received transactions:', transactions);
    if (Array.isArray(transactions) && transactions.length > 0) {
      const processedTransactions = transactions.map((transaction, index) => ({
        id: transaction.id || `temp_${index}`,
        description: transaction.description || 'Unknown Transaction',
        amount: parseFloat(transaction.amount) || 0,
        date: transaction.date || new Date().toISOString().split('T')[0],
        categoryId: null,
        originalIndex: index
      }));
      setTransactionList(processedTransactions);
      console.log('Processed transactions:', processedTransactions);
    }
    setIsLoading(false);
  }, [transactions]);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const result = await response.json();
        setCategories(result.categories || []);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
      setCategories([]);
    }
  };

  const filteredTransactions = transactionList.filter(transaction =>
    transaction.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const updateTransactionCategory = (transactionIndex, categoryId) => {
    setTransactionList(prev => {
      const newList = [...prev];
      if (newList[transactionIndex]) {
        newList[transactionIndex] = {
          ...newList[transactionIndex],
          categoryId: categoryId
        };
      }
      return newList;
    });
  };

  const addCustomCategory = async () => {
    if (!newCategory.name.trim()) return;
    
    const category = {
      id: `category_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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
        console.error('Failed to create category');
      }
    } catch (error) {
      console.error('Error creating category:', error);
    }
  };

  const handleSave = () => {
    const transactionsWithCategories = transactionList.map(transaction => {
      const category = categories.find(c => c.id === transaction.categoryId);
      return {
        ...transaction,
        categoryName: category?.name || null,
        categoryColor: category?.color || null
      };
    });
    
    onSave(transactionsWithCategories, []);
  };

  const categorizedCount = transactionList.filter(t => t.categoryId).length;
  const allCategorized = transactionList.length > 0 && categorizedCount === transactionList.length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading transactions...</p>
        </div>
      </div>
    );
  }

  if (!transactionList || transactionList.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">No transactions to review</p>
          <Button onClick={onCancel} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onCancel}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Upload
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Review Transactions</h1>
              <p className="text-gray-600">Categorize transactions for {accountName}</p>
            </div>
          </div>
          <Button 
            onClick={handleSave}
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            Save {transactionList.length} Transactions
          </Button>
        </div>
      </div>

      <div className="p-8 space-y-6 max-w-7xl mx-auto">
        {/* Stats & Search */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Transactions</p>
                  <p className="text-2xl font-bold text-gray-900">{transactionList.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Categorized</p>
                  <p className="text-2xl font-bold text-emerald-600">{categorizedCount}</p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Categories</p>
                  <p className="text-2xl font-bold text-purple-600">{categories.length}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Palette className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transactions List */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Transactions ({filteredTransactions.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {filteredTransactions.map((transaction, index) => {
                const selectedCategory = categories.find(c => c.id === transaction.categoryId);
                const originalIndex = transactionList.findIndex(t => t.id === transaction.id);
                
                return (
                  <div key={`txn_${transaction.id}_${index}`} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-gray-900 truncate">{transaction.description}</p>
                            <p className="text-sm text-gray-500">{transaction.date}</p>
                          </div>
                          <div className="text-right ml-4">
                            <p className={`text-xl font-bold ${
                              transaction.amount >= 0 ? 'text-emerald-600' : 'text-red-600'
                            }`}>
                              {transaction.amount >= 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center gap-3">
                          <SearchableCategoryDropdown
                            categories={categories}
                            value={transaction.categoryId || ''}
                            onChange={updateTransactionCategory}
                            placeholder="Select category..."
                            transactionIndex={originalIndex}
                            transactionList={transactionList}
                          />

                          {selectedCategory && (
                            <Badge 
                              style={{ 
                                backgroundColor: selectedCategory.color,
                                color: 'white'
                              }}
                              className="px-3 py-1"
                            >
                              {selectedCategory.name}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Centered Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Palette className="w-4 h-4" />
              <span>Add Category:</span>
            </div>
            <Input
              placeholder="Category name"
              value={newCategory.name}
              onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
              className="w-64"
              onKeyPress={(e) => e.key === 'Enter' && addCustomCategory()}
            />
            <input
              type="color"
              value={newCategory.color}
              onChange={(e) => setNewCategory(prev => ({ ...prev, color: e.target.value }))}
              className="w-10 h-10 rounded border"
            />
            <Button onClick={addCustomCategory} size="sm" className="bg-emerald-600 text-white">
              Add
            </Button>
            
            <div className="border-l border-gray-300 pl-4 ml-2">
              <Button 
                onClick={handleSave}
                className={`${
                  allCategorized 
                    ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg animate-pulse' 
                    : 'bg-gray-400 text-gray-700 cursor-not-allowed'
                }`}
                disabled={!allCategorized}
              >
                <Save className="w-4 h-4 mr-2" />
                Done ({categorizedCount}/{transactionList.length})
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}