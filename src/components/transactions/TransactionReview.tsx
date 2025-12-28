import React, { useState, useEffect, useRef } from 'react';
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
  X,
  Eye,
  EyeOff,
  Building,
  Calendar,
  DollarSign
} from 'lucide-react';

function SearchableCategoryDropdown({ 
  categories = [], 
  value = '', 
  onChange, 
  placeholder = "Select or search category...",
  className = "",
  merchantName
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    onChange(merchantName, category.id);
    setIsOpen(false);
    setSearchTerm('');
    setHighlightedIndex(-1);
  };

  const clearSelection = () => {
    onChange(merchantName, '');
    setSearchTerm('');
  };

  const selectedCategory = categories.find(cat => cat.id === value);

  return (
    <div ref={dropdownRef} className={`relative w-64 ${className}`}>
      <div
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

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-hidden">
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

          <div className="max-h-48 overflow-y-auto">
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

export default function EnhancedTransactionReview({ 
  transactions = [], 
  onSave, 
  onCancel,
  accountName 
}) {
  const [merchantGroups, setMerchantGroups] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState([]);
  const [merchantMappings, setMerchantMappings] = useState({});
  const [excludedMerchants, setExcludedMerchants] = useState(new Set());
  const [newCategory, setNewCategory] = useState({ name: '', color: '#ef4444' });
  const [isLoading, setIsLoading] = useState(true);

  // Group transactions by merchant name
  useEffect(() => {
    if (Array.isArray(transactions) && transactions.length > 0) {
      const groups = {};
      
      transactions.forEach((transaction) => {
        const merchantName = extractMerchantName(transaction.description);
        
        if (!groups[merchantName]) {
          groups[merchantName] = {
            merchantName,
            transactions: [],
            totalAmount: 0,
            categoryId: null,
            isExcluded: false
          };
        }
        
        groups[merchantName].transactions.push(transaction);
        groups[merchantName].totalAmount += Math.abs(transaction.amount);
      });
      
      setMerchantGroups(groups);
    }
    setIsLoading(false);
  }, [transactions]);

  // Load categories and merchant mappings
  useEffect(() => {
    loadCategories();
    loadMerchantMappings();
  }, []);

  // Auto-apply saved merchant categorizations
  useEffect(() => {
    if (Object.keys(merchantMappings).length > 0 && Object.keys(merchantGroups).length > 0) {
      setMerchantGroups(prevGroups => {
        const updatedGroups = { ...prevGroups };
        
        Object.keys(updatedGroups).forEach(merchantName => {
          if (merchantMappings[merchantName]) {
            updatedGroups[merchantName].categoryId = merchantMappings[merchantName];
          }
        });
        
        return updatedGroups;
      });
    }
  }, [merchantMappings, Object.keys(merchantGroups).length]);

  const extractMerchantName = (description) => {
    // Clean up transaction description to extract merchant name
    let merchant = description
      .replace(/^\d+\s*/, '') // Remove leading numbers
      .replace(/\s+\d{2}\/\d{2}.*$/, '') // Remove dates at end
      .replace(/\s+[A-Z]{2,3}\s*$/, '') // Remove state codes
      .replace(/\s*#\d+.*$/, '') // Remove reference numbers
      .replace(/\s*\*+.*$/, '') // Remove asterisk suffixes
      .trim();
    
    // Further cleanup for common patterns
    const cleanPatterns = [
      /^(PURCHASE|PAYMENT|TRANSFER|DEPOSIT|WITHDRAWAL)\s+/i,
      /\s+(PURCHASE|PAYMENT|TRANSFER|DEPOSIT|WITHDRAWAL)$/i,
      /\s+\d{4,}.*$/, // Remove long numbers at end
      /\s+[A-Z]{2}\s+\d+.*$/ // Remove state + numbers
    ];
    
    cleanPatterns.forEach(pattern => {
      merchant = merchant.replace(pattern, '').trim();
    });
    
    return merchant || description;
  };

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

  const loadMerchantMappings = async () => {
    try {
      const response = await fetch('/api/merchant-mappings');
      if (response.ok) {
        const result = await response.json();
        setMerchantMappings(result.mappings || {});
      }
    } catch (error) {
      console.error('Failed to load merchant mappings:', error);
      setMerchantMappings({});
    }
  };

  const saveMerchantMapping = async (merchantName, categoryId) => {
    try {
      await fetch('/api/merchant-mappings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantName, categoryId })
      });
      
      setMerchantMappings(prev => ({
        ...prev,
        [merchantName]: categoryId
      }));
    } catch (error) {
      console.error('Failed to save merchant mapping:', error);
    }
  };

  const updateMerchantCategory = (merchantName, categoryId) => {
    setMerchantGroups(prev => ({
      ...prev,
      [merchantName]: {
        ...prev[merchantName],
        categoryId: categoryId || null
      }
    }));
    
    // Save the mapping for future auto-categorization
    if (categoryId) {
      saveMerchantMapping(merchantName, categoryId);
    }
  };

  const toggleMerchantExclusion = (merchantName) => {
    setExcludedMerchants(prev => {
      const newSet = new Set(prev);
      if (newSet.has(merchantName)) {
        newSet.delete(merchantName);
      } else {
        newSet.add(merchantName);
      }
      return newSet;
    });

    setMerchantGroups(prev => ({
      ...prev,
      [merchantName]: {
        ...prev[merchantName],
        isExcluded: !prev[merchantName].isExcluded
      }
    }));
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
      }
    } catch (error) {
      console.error('Error creating category:', error);
    }
  };

  const handleSave = () => {
    // Flatten merchant groups back to individual transactions with categories
    const transactionsWithCategories = [];
    
    Object.values(merchantGroups).forEach(group => {
      const category = categories.find(c => c.id === group.categoryId);
      
      group.transactions.forEach(transaction => {
        transactionsWithCategories.push({
          ...transaction,
          merchantName: group.merchantName,
          categoryId: group.categoryId,
          categoryName: category?.name || null,
          categoryColor: category?.color || null,
          isExcluded: group.isExcluded
        });
      });
    });
    
    onSave(transactionsWithCategories, []);
  };

  const filteredMerchants = Object.values(merchantGroups).filter(group =>
    group.merchantName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalMerchants = Object.keys(merchantGroups).length;
  const categorizedMerchants = Object.values(merchantGroups).filter(g => g.categoryId).length;
  const totalAmount = Object.values(merchantGroups)
    .filter(g => !g.isExcluded)
    .reduce((sum, g) => sum + g.totalAmount, 0);
  const excludedAmount = Object.values(merchantGroups)
    .filter(g => g.isExcluded)
    .reduce((sum, g) => sum + g.totalAmount, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Processing transactions...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Review by Merchant</h1>
              <p className="text-gray-600">Categorize merchants for {accountName}</p>
            </div>
          </div>
          <Button 
            onClick={handleSave}
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            Save {totalMerchants} Merchants
          </Button>
        </div>
      </div>

      <div className="p-8 space-y-6 max-w-7xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Merchants</p>
                  <p className="text-2xl font-bold text-gray-900">{totalMerchants}</p>
                </div>
                <Building className="w-6 h-6 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Categorized</p>
                  <p className="text-2xl font-bold text-emerald-600">{categorizedMerchants}</p>
                </div>
                <Target className="w-6 h-6 text-emerald-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Included Amount</p>
                  <p className="text-2xl font-bold text-green-600">${totalAmount.toFixed(2)}</p>
                </div>
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Excluded Amount</p>
                  <p className="text-2xl font-bold text-red-600">${excludedAmount.toFixed(2)}</p>
                </div>
                <EyeOff className="w-6 h-6 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search merchants..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Merchant Groups */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Merchant Groups ({filteredMerchants.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {filteredMerchants.map((group) => {
                const selectedCategory = categories.find(c => c.id === group.categoryId);
                
                return (
                  <div 
                    key={group.merchantName} 
                    className={`p-6 transition-colors ${
                      group.isExcluded ? 'bg-red-50 opacity-75' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Building className="w-5 h-5 text-gray-600" />
                              <h3 className="font-semibold text-gray-900 text-lg">
                                {group.merchantName}
                              </h3>
                              {group.isExcluded && (
                                <Badge variant="destructive" className="text-xs">
                                  Excluded
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {group.transactions.length} transaction{group.transactions.length !== 1 ? 's' : ''}
                              </span>
                              <span className="flex items-center gap-1">
                                <DollarSign className="w-4 h-4" />
                                ${group.totalAmount.toFixed(2)} total
                              </span>
                            </div>

                            {/* Transaction Details */}
                            <div className="bg-gray-50 rounded-lg p-3 mb-4">
                              <div className="space-y-1">
                                {group.transactions.slice(0, 3).map((transaction, idx) => (
                                  <div key={idx} className="flex justify-between text-xs text-gray-600">
                                    <span>{transaction.date}</span>
                                    <span>${Math.abs(transaction.amount).toFixed(2)}</span>
                                  </div>
                                ))}
                                {group.transactions.length > 3 && (
                                  <div className="text-xs text-gray-500 text-center pt-1">
                                    +{group.transactions.length - 3} more transactions
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <SearchableCategoryDropdown
                                categories={categories}
                                value={group.categoryId || ''}
                                onChange={updateMerchantCategory}
                                placeholder="Select category..."
                                merchantName={group.merchantName}
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

                              <Button
                                variant={group.isExcluded ? "default" : "outline"}
                                size="sm"
                                onClick={() => toggleMerchantExclusion(group.merchantName)}
                                className={`ml-auto ${
                                  group.isExcluded 
                                    ? 'bg-green-600 text-white hover:bg-green-700' 
                                    : 'text-red-600 hover:bg-red-50'
                                }`}
                              >
                                {group.isExcluded ? (
                                  <>
                                    <Eye className="w-4 h-4 mr-1" />
                                    Include
                                  </>
                                ) : (
                                  <>
                                    <EyeOff className="w-4 h-4 mr-1" />
                                    Exclude
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
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

      {/* Sticky Bottom Bar */}
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
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg"
              >
                <Save className="w-4 h-4 mr-2" />
                Save ({categorizedMerchants}/{totalMerchants})
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}