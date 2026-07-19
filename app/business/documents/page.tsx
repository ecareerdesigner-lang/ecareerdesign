'use client';

import React, { useState } from 'react';
import {
  SectionHeader,
  Card,
  CardHeader,
  CardContent,
  NoDataEmptyState,
  ErrorBoundary,
} from '@/components/business/components';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Search, Upload } from 'lucide-react';

export default function DocumentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Documents"
        description="Store and organize business documents"
        action={{
          label: 'Upload Document',
          onClick: () => console.log('Upload document'),
        }}
      />

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="rounded-md border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-800 dark:bg-neutral-950"
        >
          <option value="all">All Categories</option>
          <option value="policies">Policies</option>
          <option value="templates">Templates</option>
          <option value="contracts">Contracts</option>
          <option value="guidelines">Guidelines</option>
        </select>
      </div>

      <ErrorBoundary>
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Document Library</h2>
          </CardHeader>
          <CardContent>
            <NoDataEmptyState
                         title="No documents yet"
              description="Upload documents to organize and share them"
              action={{
                label: 'Upload Document',
                onClick: () => console.log('Upload document'),
              }}
            />
          </CardContent>
        </Card>
      </ErrorBoundary>
    </div>
  );
}

