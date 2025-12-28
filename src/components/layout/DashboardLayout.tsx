import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  CreditCard, 
  Upload, 
  TrendingUp, 
  Settings,
  Building2,
  ArrowLeft,
  Plus,
  FolderOpen
} from 'lucide-react';

export default function UpdatedDashboardLayout({ 
  children, 
  selectedProfile, 
  onBackToProfiles,
  onCreateAccount,
  activeView,
  onViewChange
}) {
  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: TrendingUp },
    { id: 'projects', label: 'Projects', icon: FolderOpen },
    { id: 'upload', label: 'Upload Statement', icon: Upload },
  ];

  return (
    <div className="flex h-screen bg-gray-50/50">
      {/* Sidebar */}
      <div className="w-72 bg-white border-r border-gray-200/60 flex flex-col shadow-sm">
        {/* Profile Header */}
        <div className="p-6 border-b border-gray-100">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBackToProfiles}
            className="mb-4 -ml-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100/80 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            All Profiles
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-gray-900 truncate">{selectedProfile?.title}</h2>
              <p className="text-sm text-gray-500 truncate">{selectedProfile?.description}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                    isActive 
                      ? 'bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 text-emerald-700 border border-emerald-200/60 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/60'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-600' : ''}`} />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Quick Actions */}
        <div className="p-4 border-t border-gray-100">
          <Button
            onClick={onCreateAccount}
            className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-sm transition-all duration-200"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Account
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-gray-50/50">
        {children}
      </div>
    </div>
  );
}