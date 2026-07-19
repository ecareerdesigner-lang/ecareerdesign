'use client';

import { useState, useEffect } from 'react';
import { SectionHeader, Card, CardHeader, CardContent } from '@/components/business/components';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface RevenueEntry {
  id: string;
  date: string;
  amount: number;
  source?: string;
  description?: string;
  status: string;
}

export default function RevenuePage() {
  const [entries, setEntries] = useState<RevenueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [source, setSource] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetchRevenue();
  }, []);

  const fetchRevenue = async () => {
    try {
      const res = await fetch('/api/business/revenue');
      const data = await res.json();
      setEntries(data.revenue || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const addEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/business/revenue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          amount: parseFloat(amount),
          source,
          description,
          status: 'completed',
        }),
      });
      setDate(new Date().toISOString().split('T')[0]);
      setAmount('');
      setSource('');
      setDescription('');
      setShowForm(false);
      fetchRevenue();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const deleteEntry = async (id: string) => {
    if (!confirm('Delete this entry?')) return;
    try {
      await fetch(`/api/business/revenue/${id}`, { method: 'DELETE' });
      fetchRevenue();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const totalRevenue = entries.reduce((sum, entry) => sum + entry.amount, 0);
  const monthRevenue = entries
    .filter((e) => {
      const entryDate = new Date(e.date);
      const now = new Date();
      return entryDate.getMonth() === now.getMonth() && entryDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Revenue"
        description="Track your business revenue"
        action={{
          label: 'Add Revenue',
          onClick: () => setShowForm(!showForm),
        }}
      />

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <h3 className="text-sm text-neutral-600 dark:text-neutral-400">Total Revenue</h3>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">${totalRevenue.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h3 className="text-sm text-neutral-600 dark:text-neutral-400">This Month</h3>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">${monthRevenue.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Add Revenue</h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={addEntry} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                <Input type="number" step="0.01" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} required />
              </div>
              <Input placeholder="Source (e.g., Subscriptions, Services)" value={source} onChange={(e) => setSource(e.target.value)} />
              <textarea
                placeholder="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm dark:bg-neutral-950"
                rows={3}
              />
              <div className="flex gap-2">
                <Button type="submit">Add Revenue</Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : entries.length === 0 ? (
        <p className="text-neutral-500">No revenue entries yet</p>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="px-6 py-3 text-left">Date</th>
                    <th className="px-6 py-3 text-left">Source</th>
                    <th className="px-6 py-3 text-left">Amount</th>
                    <th className="px-6 py-3 text-left">Description</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.id} className="border-b hover:bg-neutral-50">
                      <td className="px-6 py-3 text-sm">{new Date(entry.date).toLocaleDateString()}</td>
                      <td className="px-6 py-3 text-sm">{entry.source || '-'}</td>
                      <td className="px-6 py-3 font-semibold">${entry.amount.toFixed(2)}</td>
                      <td className="px-6 py-3 text-sm text-neutral-500">{entry.description || '-'}</td>
                      <td className="px-6 py-3 text-right">
                        <button onClick={() => deleteEntry(entry.id)} className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}