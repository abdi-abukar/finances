'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function CreateAccountForm({ profileId, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'checking',
    currency: 'USD'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [exchangeRate, setExchangeRate] = useState(null);

  useEffect(() => {
    if (formData.currency === 'CAD') {
      fetchExchangeRate();
    } else {
      setExchangeRate(null);
    }
  }, [formData.currency]);

  const fetchExchangeRate = async () => {
    try {
      const response = await fetch('/api/currency/convert?from=USD&to=CAD&amount=1');
      const result = await response.json();
      if (result.success) {
        setExchangeRate(result);
      }
    } catch (err) {
      console.error('Failed to fetch exchange rate:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          profileId
        }),
      });

      const result = await response.json();

      if (result.success) {
        onSuccess(result.account);
      } else {
        setError(result.error || 'Failed to create account');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAccountTypeIcon = (type) => {
    switch (type) {
      case 'checking': return '🏦';
      case 'savings': return '💰';
      case 'credit': return '💳';
      default: return '🏦';
    }
  };

  return (
    <Card className="card-shadow">
      <CardHeader>
        <CardTitle className="text-primary">Add New Account</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Account Name</Label>
            <Input
              id="name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Chase Checking"
              className="focus:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Account Type</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
              <SelectTrigger className="focus:ring-primary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="checking">
                  <div className="flex items-center gap-2">
                    <span>🏦</span> Checking Account
                  </div>
                </SelectItem>
                <SelectItem value="savings">
                  <div className="flex items-center gap-2">
                    <span>💰</span> Savings Account
                  </div>
                </SelectItem>
                <SelectItem value="credit">
                  <div className="flex items-center gap-2">
                    <span>💳</span> Credit Card
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
              <SelectTrigger className="focus:ring-primary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">
                  <div className="flex items-center gap-2">
                    <span>🇺🇸</span> USD ($)
                  </div>
                </SelectItem>
                <SelectItem value="CAD">
                  <div className="flex items-center gap-2">
                    <span>🇨🇦</span> CAD ($)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {exchangeRate && (
            <div className="bg-accent/50 border border-accent rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm text-accent-foreground">
                <span>📊</span>
                <div>
                  <p className="font-medium">Current exchange rate: 1 USD = {exchangeRate.rate} CAD</p>
                  <p className="text-xs text-muted-foreground">Updated: {exchangeRate.lastUpdated}</p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="text-destructive text-sm bg-destructive/10 border border-destructive/20 rounded-md p-3">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90"
            >
              {isSubmitting ? 'Creating...' : 'Add Account'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}