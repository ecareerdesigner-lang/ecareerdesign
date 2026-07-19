'use client';

import { useState, useEffect } from 'react';
import { SectionHeader, Card, CardHeader, CardContent } from '@/components/business/components';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface Employee {
  id: string;
  name: string;
}

interface Expense {
  id: string;
  date: string;
  category: string;
  amount: number;
  description?: string;
  employee_id?: string;
  status: string;
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('travel');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchEmployees();
    fetchExpenses();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/business/employees');
      const data = await res.json();
      setEmployees(data.employees || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchExpenses = async () => {
    try {
      const res = await fetch('/api/business/expenses');
      const data = await res.json();
      setExpenses(data.expenses || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const addExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/business/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          category,
          amount: parseFloat(amount),
          description,
          employee_id: employeeId || null,
          status: 'draft',
        }),
      });
      setDate(new Date().toISOString().split('T')[0]);
      setCategory('travel');
      setAmount('');
      setDescription('');
      setEmployeeId('');
      setShowForm(false);
      fetchExpenses();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const updateExpenseStatus = async (id: string, newStatus: string) => {
    try {
      await fetch(`/api/business/expenses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchExpenses();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const deleteExpense = async (id: string) => {
    if (!confirm('Delete this expense?')) return;
    try {
      await fetch(`/api/business/expenses/${id}`, { method: 'DELETE' });
      fetchExpenses();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const getEmployeeName = (empId?: string) => {
    if (!empId) return '-';
    const emp = employees.find((e) => e.id === empId);
    return emp?.name || '-';
  };

  const filteredExpenses = expenses.filter((exp) =>
    statusFilter === 'all' ? true : exp.status === statusFilter
  );

  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const categoryTotals = expenses.reduce((acc: Record<string, number>, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {});

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    submitted: 'bg-blue-100 text-blue-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  };

  const categories = ['travel', 'software', 'equipment', 'marketing', 'meals', 'other'];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Expenses"
        description="Track and manage business expenses"
        action={{
          label: 'Add Expense',
          onClick: () => setShowForm(!showForm),
        }}
      />

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <h3 className="text-sm text-neutral-600 dark:text-neutral-400">Total Expenses</h3>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">${totalExpenses.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h3 className="text-sm text-neutral-600 dark:text-neutral-400">Expense Count</h3>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{filteredExpenses.length}</p>
          </CardContent>
        </Card>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Add Expense</h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={addExpense} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="px-3 py-2 border rounded-md text-sm dark:bg-neutral-950"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <Input type="number" step="0.01" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} required />
              <select
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm dark:bg-neutral-950"
              >
                <option value="">Submitted by (optional)</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </select>
              <textarea
                placeholder="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm dark:bg-neutral-950"
                rows={3}
              />
              <div className="flex gap-2">
                <Button type="submit">Add Expense</Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded-md text-sm dark:bg-neutral-950"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="submitted">Submitted</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : filteredExpenses.length === 0 ? (
        <p className="text-neutral-500">No expenses yet</p>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="px-6 py-3 text-left">Date</th>
                    <th className="px-6 py-3 text-left">Category</th>
                    <th className="px-6 py-3 text-left">Amount</th>
                    <th className="px-6 py-3 text-left">Employee</th>
                    <th className="px-6 py-3 text-left">Description</th>
                    <th className="px-6 py-3 text-left">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map((exp) => (
                    <tr key={exp.id} className="border-b hover:bg-neutral-50">
                      <td className="px-6 py-3 text-sm">{new Date(exp.date).toLocaleDateString()}</td>
                      <td className="px-6 py-3 text-sm capitalize">{exp.category}</td>
                      <td className="px-6 py-3 font-semibold">${exp.amount.toFixed(2)}</td>
                      <td className="px-6 py-3 text-sm">{getEmployeeName(exp.employee_id)}</td>
                      <td className="px-6 py-3 text-sm text-neutral-500">{exp.description || '-'}</td>
                      <td className="px-6 py-3">
                        <select
                          value={exp.status}
                          onChange={(e) => updateExpenseStatus(exp.id, e.target.value)}
                          className={`px-2 py-1 rounded text-sm ${statusColors[exp.status] || 'bg-gray-100'}`}
                        >
                          <option value="draft">Draft</option>
                          <option value="submitted">Submitted</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <button onClick={() => deleteExpense(exp.id)} className="text-red-600 hover:text-red-700">
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