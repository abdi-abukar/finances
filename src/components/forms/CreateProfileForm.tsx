'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function CreateProfileForm({ onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/profiles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        onSuccess(result.profile);
      } else {
        setError(result.error || 'Failed to create profile');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-2xl text-gray-900">Create New Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-gray-700 font-medium">Profile Title</Label>
            <Input
              id="title"
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Personal Finances"
              className="h-12 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-gray-700 font-medium">Description</Label>
            <Textarea
              id="description"
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of this financial profile"
              className="resize-none focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {error && (
            <div className="text-red-700 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              size="lg"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg"
              size="lg"
            >
              {isSubmitting ? 'Creating...' : 'Create Profile'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}