// page.tsx - Updated main page with Projects integration

'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Plus, TrendingUp, TrendingDown, CreditCard, Trash2, Upload, FolderOpen } from 'lucide-react';
import CreateProfileForm from '@/components/forms/CreateProfileForm';
import CreateAccountForm from '@/components/forms/CreateAccountForm';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DashboardOverview from '@/components/dashboard/DashboardOverview';
import StatementUpload from '@/components/upload/StatementUpload';
import TransactionReview from '@/components/transactions/TransactionReview';
import ProjectManagement from '@/components/projects/ProjectManagement';

export default function Home() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [profiles, setProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [showCreateProfile, setShowCreateProfile] = useState(false);
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [activeView, setActiveView] = useState('overview');
  const [extractedTransactions, setExtractedTransactions] = useState([]);
  const [showTransactionReview, setShowTransactionReview] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);

  useEffect(() => {
    initializeApp();
  }, []);

  useEffect(() => {
    if (selectedProfile) {
      fetchAccounts(selectedProfile.id);
      fetchTransactions(selectedProfile.id);
    }
  }, [selectedProfile]);

  const initializeApp = async () => {
    try {
      await fetch('/api/init-data', { method: 'POST' });
      await fetchProfiles();
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize app:', error);
    }
  };

  const fetchProfiles = async () => {
    try {
      const response = await fetch('/api/profiles');
      const result = await response.json();
      setProfiles(result.profiles || []);
    } catch (error) {
      console.error('Failed to fetch profiles:', error);
    }
  };

  const fetchAccounts = async (profileId) => {
    try {
      const response = await fetch(`/api/accounts?profileId=${profileId}`);
      const result = await response.json();
      setAccounts(result.accounts || []);
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
    }
  };

  const fetchTransactions = async (profileId) => {
    try {
      const response = await fetch(`/api/transactions?profileId=${profileId}`);
      const result = await response.json();
      setTransactions(result.transactions || []);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    }
  };

  const refreshTransactions = () => {
    if (selectedProfile) {
      fetchTransactions(selectedProfile.id);
      fetchAccounts(selectedProfile.id);
    }
  };

  const handleProfileCreated = (newProfile) => {
    setProfiles([...profiles, newProfile]);
    setShowCreateProfile(false);
    setSelectedProfile(newProfile);
    setActiveView('overview');
  };

  const handleAccountCreated = (newAccount) => {
    setAccounts([...accounts, newAccount]);
    setShowCreateAccount(false);
  };

  const handleViewChange = (newView) => {
    setActiveView(newView);
    setShowTransactionReview(false);
  };

  const handleTransactionsExtracted = (extractedTransactions) => {
    setExtractedTransactions(extractedTransactions);
    setShowTransactionReview(true);
  };

  const handleReviewSave = async (reviewedTransactions, customCategories) => {
    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          transactions: reviewedTransactions,
          customCategories 
        }),
      });

      const result = await response.json();

      if (result.success) {
        await refreshTransactions();
        setShowTransactionReview(false);
        setExtractedTransactions([]);
        setActiveView('overview');
      } else {
        throw new Error(result.error || 'Failed to save transactions');
      }
    } catch (error) {
      console.error('Error saving transactions:', error);
      alert('Failed to save transactions: ' + error.message);
    }
  };

  const handleReviewCancel = () => {
    setShowTransactionReview(false);
    setExtractedTransactions([]);
    setActiveView('upload');
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <Card className="w-96 shadow-lg border-0">
          <CardContent className="p-8">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
              <span className="text-gray-700 font-medium">Initializing application...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!selectedProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container mx-auto p-8 max-w-6xl">
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Spending Tracker</h1>
            <p className="text-xl text-gray-600">Track your spending across all accounts and categories</p>
          </div>

          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Financial Profiles</h2>
              <p className="text-gray-600">Create and manage your spending profiles</p>
            </div>
            <Button
              onClick={() => setShowCreateProfile(true)}
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg"
              size="lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Profile
            </Button>
          </div>

          {showCreateProfile && (
            <div className="mb-8">
              <CreateProfileForm
                onSuccess={handleProfileCreated}
                onCancel={() => setShowCreateProfile(false)}
              />
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {profiles.length === 0 ? (
              <Card className="col-span-full border-0 shadow-lg">
                <CardContent className="p-16 text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Building2 className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">No profiles yet</h3>
                  <p className="text-gray-600 mb-8 text-lg">Create your first spending profile to get started</p>
                  <Button
                    onClick={() => setShowCreateProfile(true)}
                    className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg"
                    size="lg"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Create Profile
                  </Button>
                </CardContent>
              </Card>
            ) : (
              profiles.map((profile) => (
                <Card
                  key={profile.id}
                  className="border-0 shadow-lg hover:shadow-xl cursor-pointer transition-all duration-300 hover:-translate-y-1 bg-white/80 backdrop-blur"
                  onClick={() => setSelectedProfile(profile)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
                        <Building2 className="w-7 h-7 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-xl text-gray-900">{profile.title}</CardTitle>
                        <p className="text-gray-600 text-sm">{profile.description}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">
                        Created {new Date(profile.createdAt).toLocaleDateString()}
                      </span>
                      <div className="flex items-center gap-1 text-emerald-600 font-medium">
                        <TrendingUp className="w-4 h-4" />
                        <span>Open Dashboard</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  const renderDashboardContent = () => {
    if (showTransactionReview) {
      return (
        <TransactionReview
          transactions={extractedTransactions}
          onSave={handleReviewSave}
          onCancel={handleReviewCancel}
          accountName={selectedAccount?.name || 'Selected Account'}
        />
      );
    }
    
    switch (activeView) {
      case 'overview':
        return (
          <DashboardOverview 
            accounts={accounts}
            transactions={transactions}
            onCreateAccount={() => setShowCreateAccount(true)}
            onUploadStatement={() => setActiveView('upload')}
            onRefreshTransactions={refreshTransactions}
          />
        );
      case 'upload':
        return (
          <StatementUpload 
            accounts={accounts}
            onTransactionsExtracted={handleTransactionsExtracted}
          />
        );
      case 'projects':
        return (
          <ProjectManagement 
            profileId={selectedProfile.id}
            transactions={transactions}
          />
        );
      case 'accounts':
        return <AccountsView accounts={accounts} onCreateAccount={() => setShowCreateAccount(true)} />;
      case 'transactions':
        return <TransactionsView transactions={transactions} accounts={accounts} onRefresh={refreshTransactions} />;
      case 'settings':
        return <SettingsView profile={selectedProfile} />;
      default:
        return (
          <DashboardOverview 
            accounts={accounts}
            transactions={transactions}
            onCreateAccount={() => setShowCreateAccount(true)}
            onUploadStatement={() => setActiveView('upload')}
            onRefreshTransactions={refreshTransactions}
          />
        );
    }
  };

  return (
    <DashboardLayout
      selectedProfile={selectedProfile}
      onBackToProfiles={() => {
        setSelectedProfile(null);
        setActiveView('overview');
        setShowTransactionReview(false);
      }}
      onCreateAccount={() => setShowCreateAccount(true)}
      activeView={activeView}
      onViewChange={handleViewChange}
    >
      {renderDashboardContent()}
      
      {showCreateAccount && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border-0">
            <CreateAccountForm
              profileId={selectedProfile.id}
              onSuccess={handleAccountCreated}
              onCancel={() => setShowCreateAccount(false)}
            />
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

// Simplified Accounts View - Just account creation and upload
function AccountsView({ accounts, onCreateAccount }) {
  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Accounts</h1>
          <p className="text-gray-600 text-lg">Manage your accounts and upload statements</p>
        </div>
        <Button 
          onClick={onCreateAccount} 
          className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg"
          size="lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Account
        </Button>
      </div>
      
      {accounts.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-16 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <CreditCard className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No accounts yet</h3>
            <p className="text-gray-600 mb-8 text-lg">Add your first account to start tracking spending</p>
            <Button 
              onClick={onCreateAccount} 
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg"
              size="lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Account
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <Card key={account.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${
                      account.type === 'credit' 
                        ? 'bg-orange-100 text-orange-600'
                        : account.type === 'savings'
                        ? 'bg-green-100 text-green-600'
                        : 'bg-blue-100 text-blue-600'
                    }`}>
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-gray-900 text-lg">{account.name}</h3>
                      <p className="text-gray-600 capitalize">{account.type} Account</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Currency</span>
                    <Badge variant="outline" className="font-medium">{account.currency}</Badge>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Created</span>
                    <span className="text-gray-700">{new Date(account.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Quick Upload Section */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Upload className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to track spending?</h3>
          <p className="text-gray-600 mb-6">Upload statements to see detailed spending analytics by category and account</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={onCreateAccount}
              variant="outline"
              className="border-emerald-600 text-emerald-700 hover:bg-emerald-50"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Another Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Simplified Transactions View - Just viewing and deleting
function TransactionsView({ transactions, accounts, onRefresh }) {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('all');

  const deleteTransaction = async (transactionId) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;
    
    try {
      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        onRefresh();
      } else {
        alert('Failed to delete transaction');
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert('Error deleting transaction');
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAccount = selectedAccount === 'all' || transaction.accountId === selectedAccount;
    
    const account = accounts.find(a => a.id === transaction.accountId);
    const isExpense = account?.type === 'credit' ? transaction.amount > 0 : transaction.amount < 0;
    
    const matchesFilter = filter === 'all' || 
      (filter === 'income' && !isExpense) ||
      (filter === 'expense' && isExpense);
    
    return matchesSearch && matchesFilter && matchesAccount;
  });

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">All Transactions</h1>
        <p className="text-gray-600 text-lg">View and manage all your transactions</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
          />
        </div>
        
        <div className="flex gap-2">
          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="all">All Accounts</option>
            {accounts.map(account => (
              <option key={account.id} value={account.id}>{account.name}</option>
            ))}
          </select>
          
          {['all', 'income', 'expense'].map((filterType) => (
            <Button
              key={filterType}
              variant={filter === filterType ? 'default' : 'outline'}
              onClick={() => setFilter(filterType)}
              className={filter === filterType ? 'bg-emerald-600 text-white' : ''}
            >
              {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
            </Button>
          ))}
        </div>
      </div>
      
      {filteredTransactions.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-16 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <TrendingUp className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              {transactions.length === 0 ? 'No transactions yet' : 'No matching transactions'}
            </h3>
            <p className="text-gray-600 text-lg">
              {transactions.length === 0 
                ? 'Upload a statement to see your transactions here'
                : 'Try adjusting your search or filter criteria'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {filteredTransactions.map((transaction, index) => {
                const account = accounts.find(a => a.id === transaction.accountId);
                const isExpense = account?.type === 'credit' ? transaction.amount > 0 : transaction.amount < 0;
                
                return (
                  <div key={index} className="flex items-center justify-between p-6 hover:bg-gray-50/50 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        isExpense 
                          ? 'bg-red-100 text-red-600' 
                          : 'bg-green-100 text-green-600'
                      }`}>
                        {isExpense ? (
                          <TrendingDown className="w-6 h-6" />
                        ) : (
                          <TrendingUp className="w-6 h-6" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-lg">{transaction.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-gray-500">{new Date(transaction.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}</p>
                          <Badge variant="outline" className="text-xs">
                            {account?.name || 'Unknown Account'}
                          </Badge>
                          {transaction.categoryName && (
                            <Badge 
                              style={{ backgroundColor: transaction.categoryColor }}
                              className="text-white text-xs"
                            >
                              {transaction.categoryName}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className={`text-2xl font-bold ${
                          isExpense ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {isExpense ? '-' : '+'}${Math.abs(transaction.amount).toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {account?.type === 'credit' 
                            ? isExpense ? 'Charge' : 'Payment'
                            : isExpense ? 'Expense' : 'Income'
                          }
                        </p>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => deleteTransaction(transaction.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Settings View
function SettingsView({ profile }) {
  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 text-lg">Manage your profile and preferences</p>
      </div>
      
      <div className="grid gap-8 md:grid-cols-2">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Profile Name</label>
              <div className="p-3 bg-gray-50 rounded-lg border">
                <p className="text-gray-900 font-medium">{profile.title}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Description</label>
              <div className="p-3 bg-gray-50 rounded-lg border">
                <p className="text-gray-900">{profile.description}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Created</label>
              <div className="p-3 bg-gray-50 rounded-lg border">
                <p className="text-gray-900">{new Date(profile.createdAt).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Auto-categorization</p>
                  <p className="text-sm text-gray-600">Automatically categorize transactions</p>
                </div>
                <input type="checkbox" className="h-4 w-4 text-emerald-600 rounded" defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Dark Mode</p>
                  <p className="text-sm text-gray-600">Switch to dark theme</p>
                </div>
                <input type="checkbox" className="h-4 w-4 text-emerald-600 rounded" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}