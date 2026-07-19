'use client';

import { useState, useEffect } from 'react';
import { SectionHeader, Card, CardHeader, CardContent } from '@/components/business/components';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface AIUsage {
  id: string;
  date: string;
  requests: number;
  tokens_used: number;
  cost: number;
  model?: string;
  description?: string;
}

export default function AIUsagePage() {
  const [entries, setEntries] = useState<AIUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [requests, setRequests] = useState('');
  const [tokens, setTokens] = useState('');
  const [cost, setCost] = useState('');
  const [model, setModel] = useState('claude-opus-4-6');
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetchUsage();
  }, []);

  const fetchUsage = async () => {
    try {
      const res = await fetch('/api/business/ai-usage');
      const data = await res.json();
      setEntries(data.usage || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const addEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/business/ai-usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          requests: parseInt(requests),
          tokens_used: parseInt(tokens),
          cost: parseFloat(cost),
          model,
          description,
        }),
      });
      setDate(new Date().toISOString().split('T')[0]);
      setRequests('');
      setTokens('');
      setCost('');
      setModel('claude-opus-4-6');
      setDescription('');
      setShowForm(false);
      fetchUsage();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const deleteEntry = async (id: string) => {
    if (!confirm('Delete this entry?')) return;
    try {
      await fetch(`/api/business/ai-usage/${id}`, { method: 'DELETE' });
      fetchUsage();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const totalCost = entries.reduce((sum, entry) => sum + entry.cost, 0);
  const totalRequests = entries.reduce((sum, entry) => sum + entry.requests, 0);
  const totalTokens = entries.reduce((sum, entry) => sum + entry.tokens_used, 0);
  const avgCostPerRequest = totalRequests > 0 ? (totalCost / totalRequests).toFixed(4) : 0;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="AI API Usage"
        description="Track Claude API usage and costs"
        action={{
          label: 'Log Usage',
          onClick: () => setShowForm(!showForm),
        }}
      />

      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <h3 className="text-sm text-neutral-600 dark:text-neutral-400">Total Cost</h3>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${totalCost.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h3 className="text-sm text-neutral-600 dark:text-neutral-400">Total Requests</h3>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalRequests}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h3 className="text-sm text-neutral-600 dark:text-neutral-400">Total Tokens</h3>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalTokens.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h3 className="text-sm text-neutral-600 dark:text-neutral-400">Avg Cost/Request</h3>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${avgCostPerRequest}</p>
          </CardContent>
        </Card>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Log API Usage</h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={addEntry} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="px-3 py-2 border rounded-md text-sm dark:bg-neutral-950"
                >
                  <option value="claude-opus-4-6">Claude Opus 4.6</option>
                  <option value="claude-sonnet-4-6">Claude Sonnet 4.6</option>
                  <option value="claude-haiku-4-5">Claude Haiku 4.5</option>
                </select>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <Input type="number" placeholder="Requests" value={requests} onChange={(e) => setRequests(e.target.value)} required />
                <Input type="number" placeholder="Tokens Used" value={tokens} onChange={(e) => setTokens(e.target.value)} required />
                <Input type="number" step="0.01" placeholder="Cost ($)" value={cost} onChange={(e) => setCost(e.target.value)} required />
              </div>
              <textarea
                placeholder="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm dark:bg-neutral-950"
                rows={3}
              />
              <div className="flex gap-2">
                <Button type="submit">Log Usage</Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : entries.length === 0 ? (
        <p className="text-neutral-500">No usage entries yet</p>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="px-6 py-3 text-left">Date</th>
                    <th className="px-6 py-3 text-left">Model</th>
                    <th className="px-6 py-3 text-left">Requests</th>
                    <th className="px-6 py-3 text-left">Tokens</th>
                    <th className="px-6 py-3 text-left">Cost</th>
                    <th className="px-6 py-3 text-left">Description</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.id} className="border-b hover:bg-neutral-50">
                      <td className="px-6 py-3 text-sm">{new Date(entry.date).toLocaleDateString()}</td>
                      <td className="px-6 py-3 text-sm">{entry.model || '-'}</td>
                      <td className="px-6 py-3 font-semibold">{entry.requests}</td>
                      <td className="px-6 py-3 text-sm">{entry.tokens_used.toLocaleString()}</td>
                      <td className="px-6 py-3 font-semibold">${entry.cost.toFixed(2)}</td>
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