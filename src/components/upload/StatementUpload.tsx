'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  X,
  CreditCard,
  File
} from 'lucide-react';

export default function StatementUpload({ accounts, onTransactionsExtracted }) {
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [uploadState, setUploadState] = useState('idle');
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [extractedTransactions, setExtractedTransactions] = useState([]);
  const [error, setError] = useState('');
  const [exchangeRate, setExchangeRate] = useState(null);

  console.log('StatementUpload rendered:', { selectedAccount, file, uploadState });

  // Function to fetch current CAD-USD exchange rate
  const fetchExchangeRate = async () => {
    try {
      // Use a free exchange rate API
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/CAD');
      const data = await response.json();
      return data.rates.USD; // Returns CAD to USD rate
    } catch (error) {
      console.warn('Failed to fetch live exchange rate, using fallback:', error);
      // Fallback rate based on recent data (approximately 0.794)
      return 0.794;
    }
  };

  // Function to convert CAD amount to USD
  const convertCADToUSD = (cadAmount, rate) => {
    return cadAmount * rate;
  };

  const handleFileSelect = useCallback((event) => {
    const selectedFile = event.target.files[0];
    console.log('File selected:', selectedFile);
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  }, []);

  const handleDrop = useCallback((event) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];
    console.log('File dropped:', droppedFile);
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  }, []);

  const handleDragOver = useCallback((event) => {
    event.preventDefault();
  }, []);

  const validateAndSetFile = (selectedFile) => {
    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'text/csv',
      'text/plain',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    const allowedExtensions = ['.pdf', '.csv', '.txt', '.xls', '.xlsx'];
    const fileExtension = selectedFile.name.toLowerCase().slice(selectedFile.name.lastIndexOf('.'));
    
    if (!allowedTypes.includes(selectedFile.type) && !allowedExtensions.includes(fileExtension)) {
      setError('Please upload a PDF, CSV, TXT, or Excel file');
      return;
    }

    // Validate file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setFile(selectedFile);
    setError('');
    setUploadState('idle');
    setExtractedTransactions([]);
  };

  const processFile = async () => {
    console.log('processFile called', { file, selectedAccount });
    
    if (!file || !selectedAccount) {
      const errorMsg = 'Please select both a file and an account';
      console.error(errorMsg);
      setError(errorMsg);
      return;
    }

    setUploadState('uploading');
    setProgress(25);
    setError('');

    try {
      console.log('Sending file to AI for processing...');
      
      // If account is CAD, fetch exchange rate first
      let currentExchangeRate = null;
      if (selectedAccount.currency === 'CAD') {
        console.log('CAD account detected, fetching exchange rate...');
        currentExchangeRate = await fetchExchangeRate();
        setExchangeRate(currentExchangeRate);
        console.log('Exchange rate fetched:', currentExchangeRate);
      }
      
      // Create FormData to send the actual file
      const formData = new FormData();
      formData.append('file', file);
      formData.append('accountId', selectedAccount.id);

      setProgress(50);
      setUploadState('processing');

      const response = await fetch('/api/extract-transactions', {
        method: 'POST',
        body: formData, // Send as FormData, not JSON
      });

      console.log('API response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown server error' }));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const result = await response.json();
      console.log('API result:', result);

      if (result.success && result.transactions && Array.isArray(result.transactions)) {
        if (result.transactions.length === 0) {
          throw new Error('No transactions found in the file.');
        }
        
        // Enrich transactions with selected account data AND unique IDs
        const enrichedTransactions = result.transactions.map((transaction, index) => {
          let processedTransaction = {
            ...transaction,
            // Generate a proper unique ID for each transaction
            id: transaction.id || `txn_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 16)}`,
            accountId: selectedAccount.id,
            accountName: selectedAccount.name,
            accountType: selectedAccount.type,
            currency: selectedAccount.currency
          };

          // Convert CAD amounts to USD if account is CAD
          if (selectedAccount.currency === 'CAD' && currentExchangeRate) {
            const originalAmount = processedTransaction.amount;
            const convertedAmount = convertCADToUSD(originalAmount, currentExchangeRate);
            
            processedTransaction = {
              ...processedTransaction,
              amount: convertedAmount, // Store in USD
              originalAmount: originalAmount, // Keep original CAD amount for reference
              originalCurrency: 'CAD',
              exchangeRate: currentExchangeRate,
              convertedFromCAD: true
            };
            
            console.log(`Converted transaction: CAD $${originalAmount.toFixed(2)} → USD $${convertedAmount.toFixed(2)} (rate: ${currentExchangeRate})`);
          }

          return processedTransaction;
        });
        
        console.log('Enriched transaction sample:', enrichedTransactions[0]);
        
        setExtractedTransactions(enrichedTransactions);
        setProgress(100);
        setUploadState('success');
        console.log('Successfully extracted transactions:', enrichedTransactions.length);
        
        // Log conversion summary for CAD accounts
        if (selectedAccount.currency === 'CAD' && currentExchangeRate) {
          console.log(`Currency conversion applied: CAD → USD at rate ${currentExchangeRate}`);
        }
      } else {
        throw new Error(result.error || 'Failed to extract transactions');
      }
    } catch (err) {
      console.error('Process file error:', err);
      setError(err.message || 'An unexpected error occurred');
      setUploadState('error');
      setProgress(0);
    }
  };

  const resetUpload = () => {
    console.log('Resetting upload');
    setFile(null);
    setUploadState('idle');
    setProgress(0);
    setError('');
    setExtractedTransactions([]);
    setExchangeRate(null);
  };

  const canProcess = file && selectedAccount && uploadState === 'idle';

  const getFileIcon = (file) => {
    if (!file) return <Upload className="w-12 h-12 text-gray-400" />;
    
    const extension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    
    switch (extension) {
      case '.pdf':
        return <File className="w-6 h-6 text-red-600" />;
      case '.xlsx':
      case '.xls':
        return <FileText className="w-6 h-6 text-green-600" />;
      default:
        return <FileText className="w-6 h-6 text-blue-600" />;
    }
  };

  const getFileTypeLabel = (file) => {
    if (!file) return '';
    
    const extension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    
    switch (extension) {
      case '.pdf':
        return 'PDF';
      case '.xlsx':
      case '.xls':
        return 'Excel';
      case '.csv':
        return 'CSV';
      default:
        return 'Text';
    }
  };

  const formatTransactionAmount = (transaction) => {
    // If it was converted from CAD, show both amounts
    if (transaction.convertedFromCAD && transaction.originalAmount !== undefined) {
      return (
        <div className="text-right">
          <p className={`text-sm font-semibold ${transaction.amount >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {transaction.amount >= 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)} USD
          </p>
          <p className="text-xs text-gray-500">
            (CAD ${Math.abs(transaction.originalAmount).toFixed(2)})
          </p>
        </div>
      );
    } else {
      // Regular USD display
      return (
        <p className={`text-sm font-semibold ${transaction.amount >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
          {transaction.amount >= 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
        </p>
      );
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Upload Statement</h1>
        <p className="text-gray-600 text-lg">Import transactions from your bank statement</p>
        <p className="text-sm text-gray-500">Supported formats: PDF, CSV, Excel, TXT (max 10MB)</p>
        {selectedAccount?.currency === 'CAD' && (
          <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
            <AlertCircle className="w-4 h-4 text-blue-600" />
            <p className="text-sm text-blue-700">
              CAD account selected - amounts will be converted to USD for storage
              {exchangeRate && ` (Rate: 1 CAD = ${exchangeRate.toFixed(4)} USD)`}
            </p>
          </div>
        )}
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center space-x-8 py-6">
        <div className={`flex items-center space-x-2 ${selectedAccount ? 'text-emerald-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${selectedAccount ? 'bg-emerald-50 border-emerald-200' : 'border-gray-300'}`}>
            <span className="text-sm font-semibold">1</span>
          </div>
          <span className="font-medium">Select Account</span>
        </div>
        
        <div className={`h-0.5 w-16 ${selectedAccount ? 'bg-emerald-200' : 'bg-gray-200'}`}></div>
        
        <div className={`flex items-center space-x-2 ${file ? 'text-emerald-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${file ? 'bg-emerald-50 border-emerald-200' : 'border-gray-300'}`}>
            <span className="text-sm font-semibold">2</span>
          </div>
          <span className="font-medium">Upload File</span>
        </div>
        
        <div className={`h-0.5 w-16 ${uploadState === 'success' ? 'bg-emerald-200' : 'bg-gray-200'}`}></div>
        
        <div className={`flex items-center space-x-2 ${uploadState === 'success' ? 'text-emerald-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${uploadState === 'success' ? 'bg-emerald-50 border-emerald-200' : 'border-gray-300'}`}>
            <span className="text-sm font-semibold">3</span>
          </div>
          <span className="font-medium">Review</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Step 1: Account Selection */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                <span className="text-emerald-600 font-bold">1</span>
              </div>
              Select Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {accounts.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">No accounts available</p>
                <p className="text-sm text-gray-500">Create an account first</p>
              </div>
            ) : (
              accounts.map((account) => (
                <div
                  key={account.id}
                  onClick={() => {
                    console.log('Account selected:', account);
                    setSelectedAccount(account);
                  }}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                    selectedAccount?.id === account.id
                      ? 'border-emerald-300 bg-emerald-50/50 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border shadow-sm">
                        <CreditCard className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{account.name}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs capitalize">{account.type}</Badge>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${account.currency === 'CAD' ? 'border-blue-300 text-blue-700 bg-blue-50' : ''}`}
                          >
                            {account.currency}
                            {account.currency === 'CAD' && ' → USD'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    {selectedAccount?.id === account.id && (
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Step 2: File Upload */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                <span className="text-emerald-600 font-bold">2</span>
              </div>
              Upload Statement
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!file ? (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-emerald-400 transition-colors cursor-pointer bg-gray-50/50"
                onClick={() => document.getElementById('file-input').click()}
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-700 font-medium mb-2">Drop your statement here</p>
                <p className="text-sm text-gray-500 mb-4">or click to browse files</p>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-400 max-w-xs mx-auto">
                  <span className="flex items-center justify-center gap-1 py-1">
                    <File className="w-3 h-3 text-red-500" />
                    PDF
                  </span>
                  <span className="flex items-center justify-center gap-1 py-1">
                    <FileText className="w-3 h-3 text-blue-500" />
                    CSV
                  </span>
                  <span className="flex items-center justify-center gap-1 py-1">
                    <FileText className="w-3 h-3 text-green-500" />
                    Excel
                  </span>
                  <span className="flex items-center justify-center gap-1 py-1">
                    <FileText className="w-3 h-3 text-purple-500" />
                    TXT
                  </span>
                </div>
                <input
                  id="file-input"
                  type="file"
                  accept=".csv,.pdf,.txt,.xls,.xlsx"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-emerald-50/50 rounded-xl border border-emerald-200">
                  {getFileIcon(file)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{file.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                      <Badge variant="outline" className="text-xs">
                        {getFileTypeLabel(file)}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetUpload}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {uploadState === 'idle' && (
                  <Button
                    onClick={processFile}
                    disabled={!canProcess}
                    className={`w-full shadow-sm transition-all duration-200 ${
                      canProcess 
                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white' 
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {!selectedAccount ? 'Select Account First' : 'Process Statement'}
                  </Button>
                )}

                {(uploadState === 'uploading' || uploadState === 'processing') && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                      <span className="text-sm text-gray-700 font-medium">
                        {uploadState === 'uploading' ? 'Reading file...' : 
                         selectedAccount?.currency === 'CAD' ? 'Extracting transactions & converting CAD to USD...' : 'Extracting transactions...'}
                      </span>
                    </div>
                    <Progress value={progress} className="w-full h-2" />
                    <p className="text-xs text-gray-500 text-center">{progress}% complete</p>
                  </div>
                )}

                {uploadState === 'success' && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 p-3 rounded-lg">
                      <CheckCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">Successfully extracted {extractedTransactions.length} transactions</span>
                    </div>
                    {selectedAccount?.currency === 'CAD' && exchangeRate && (
                      <div className="text-blue-700 bg-blue-50 p-2 rounded-lg border border-blue-200">
                        <p className="text-xs font-medium">Converted from CAD to USD at rate: 1 CAD = {exchangeRate.toFixed(4)} USD</p>
                      </div>
                    )}
                  </div>
                )}

                {uploadState === 'error' && (
                  <div className="space-y-3">
                    <div className="text-red-700 bg-red-50 p-3 rounded-lg border border-red-200">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Processing failed</p>
                          <p className="text-xs mt-1">{error}</p>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        setUploadState('idle');
                        setError('');
                        setProgress(0);
                      }}
                      variant="outline"
                      className="w-full"
                    >
                      Try Again
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 3: Transaction Preview */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                <span className="text-emerald-600 font-bold">3</span>
              </div>
              Review & Import
            </CardTitle>
          </CardHeader>
          <CardContent>
            {extractedTransactions.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">Transactions will appear here</p>
                <p className="text-sm text-gray-500">after processing completes</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-emerald-50/50 rounded-lg">
                  <span className="text-sm font-medium text-emerald-700">
                    {extractedTransactions.length} transactions found
                  </span>
                  <Badge className="bg-emerald-100 text-emerald-700">Ready to import</Badge>
                </div>
                
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {extractedTransactions.slice(0, 10).map((transaction) => {
                    // Generate a proper UUID for each transaction
                    const transactionKey = transaction.id || `preview_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
                    
                    return (
                      <div key={transactionKey} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">{transaction.description}</p>
                          <p className="text-xs text-gray-500">{transaction.date}</p>
                        </div>
                        <div className="ml-2">
                          {formatTransactionAmount(transaction)}
                        </div>
                      </div>
                    );
                  })}
                  {extractedTransactions.length > 10 && (
                    <p className="text-xs text-gray-500 text-center py-2">
                      +{extractedTransactions.length - 10} more transactions
                    </p>
                  )}
                </div>
                
                <Button
                  onClick={() => {
                    // ENSURE EVERY TRANSACTION HAS UNIQUE ID AND ACCOUNT DATA
                    const transactionsWithAccount = extractedTransactions.map((transaction, index) => ({
                      ...transaction,
                      // Ensure unique ID exists
                      id: transaction.id || `txn_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 16)}`,
                      accountId: selectedAccount.id,
                      accountName: selectedAccount.name,
                      accountType: selectedAccount.type,
                      currency: selectedAccount.currency
                    }));
                    console.log('Sending transactions with account data:', transactionsWithAccount[0]);
                    onTransactionsExtracted(transactionsWithAccount, selectedAccount);
                  }}
                  className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-sm transition-all duration-200"
                >
                  Review All Transactions
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}