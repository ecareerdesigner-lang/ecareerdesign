'use client';

import { useState, useEffect } from 'react';
import { SectionHeader, Card, CardHeader, CardContent } from '@/components/business/components';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { formatDateSafe } from '@/lib/utils';

interface Employee {
  id: string;
  name: string;
}

interface TimeEntry {
  id: string;
  date: string;
  hours_worked: number;
  description?: string;
  status: string;
  employee_id?: string;
}

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function toDateInputValue(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function TimeTrackingPage() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [hours, setHours] = useState('');
  const [description, setDescription] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Bulk entry state
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [bulkEmployeeId, setBulkEmployeeId] = useState('');
  const [bulkWeekStart, setBulkWeekStart] = useState(toDateInputValue(getMonday(new Date())));
  const [bulkHours, setBulkHours] = useState<Record<number, string>>({});
  const [bulkNotes, setBulkNotes] = useState<Record<number, string>>({});
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  useEffect(() => {
    fetchEmployees();
    fetchEntries();
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

  const fetchEntries = async () => {
    try {
      const res = await fetch('/api/business/time-entries');
      const data = await res.json();
      setEntries(data.entries || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const addEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/business/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          hours_worked: parseFloat(hours),
          description,
          employee_id: employeeId || null,
          status: 'draft',
        }),
      });
      setDate(new Date().toISOString().split('T')[0]);
      setHours('');
      setDescription('');
      setEmployeeId('');
      setShowForm(false);
      fetchEntries();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const updateEntryStatus = async (id: string, newStatus: string) => {
    try {
      await fetch(`/api/business/time-entries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchEntries();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const deleteEntry = async (id: string) => {
    if (!confirm('Delete this entry?')) return;
    try {
      await fetch(`/api/business/time-entries/${id}`, { method: 'DELETE' });
      fetchEntries();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const getEmployeeName = (empId?: string) => {
    if (!empId) return '-';
    const emp = employees.find((e) => e.id === empId);
    return emp?.name || '-';
  };

  const weekDayLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const getWeekDates = (): Date[] => {
    const [year, month, day] = bulkWeekStart.split('-').map(Number);
    const start = new Date(year, month - 1, day);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  };

  const weekDates = getWeekDates();

  const submitBulkWeek = async (e: React.FormEvent) => {
    e.preventDefault();
    setBulkSubmitting(true);
    try {
      const entriesToCreate = weekDates
        .map((d, i) => ({
          date: toDateInputValue(d),
          hours_worked: parseFloat(bulkHours[i] || '0'),
          description: bulkNotes[i] || '',
          employee_id: bulkEmployeeId || null,
          status: 'draft',
        }))
        .filter((entry) => entry.hours_worked > 0);

      if (entriesToCreate.length === 0) {
        alert('Enter hours for at least one day before submitting.');
        setBulkSubmitting(false);
        return;
      }

      await Promise.all(
        entriesToCreate.map((entry) =>
          fetch('/api/business/time-entries', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(entry),
          })
        )
      );

      setBulkHours({});
      setBulkNotes({});
      setBulkEmployeeId('');
      setShowBulkForm(false);
      fetchEntries();
    } catch (error) {
      console.error('Bulk entry error:', error);
      alert('Something went wrong submitting the week. Please try again.');
    } finally {
      setBulkSubmitting(false);
    }
  };

  const bulkWeekTotal = Object.values(bulkHours).reduce((sum, h) => sum + (parseFloat(h) || 0), 0);

  const filteredEntries = entries.filter((entry) =>
    statusFilter === 'all' ? true : entry.status === statusFilter
  );

  const totalHours = filteredEntries.reduce((sum, entry) => sum + entry.hours_worked, 0);

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    submitted: 'bg-blue-100 text-blue-800',
    approved: 'bg-green-100 text-green-800',
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Time Tracking"
        description="Log and manage work hours"
        action={{
          label: 'Log Hours',
          onClick: () => setShowForm(!showForm),
        }}
      />

      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setShowBulkForm(!showBulkForm)}>
          {showBulkForm ? 'Close Bulk Entry' : 'Bulk Entry (Full Week)'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Log Hours</h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={addEntry} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                <Input type="number" step="0.5" placeholder="Hours worked" value={hours} onChange={(e) => setHours(e.target.value)} required />
              </div>
              <select
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm dark:bg-neutral-950"
              >
                <option value="">Select Employee (optional)</option>
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
                <Button type="submit">Log Hours</Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {showBulkForm && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Bulk Entry — Full Week</h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitBulkWeek} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <select
                  value={bulkEmployeeId}
                  onChange={(e) => setBulkEmployeeId(e.target.value)}
                  className="px-3 py-2 border rounded-md text-sm dark:bg-neutral-950"
                  required
                >
                  <option value="">Select Employee</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
                <div>
                  <label className="block text-sm text-neutral-500 mb-1">Week Starting (Monday)</label>
                  <Input
                    type="date"
                    value={bulkWeekStart}
                    onChange={(e) => setBulkWeekStart(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                {weekDates.map((d, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center border-b pb-2">
                    <div className="col-span-3 text-sm font-medium">
                      {weekDayLabels[i]}
                      <div className="text-xs text-neutral-500">{formatDateSafe(toDateInputValue(d))}</div>
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        step="0.5"
                        min="0"
                        placeholder="Hours"
                        value={bulkHours[i] || ''}
                        onChange={(e) => setBulkHours({ ...bulkHours, [i]: e.target.value })}
                      />
                    </div>
                    <div className="col-span-7">
                      <Input
                        type="text"
                        placeholder="Note (optional)"
                        value={bulkNotes[i] || ''}
                        onChange={(e) => setBulkNotes({ ...bulkNotes, [i]: e.target.value })}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2">
                <p className="text-sm font-semibold">Week Total: {bulkWeekTotal.toFixed(1)}h</p>
                <div className="flex gap-2">
                  <Button type="submit" disabled={bulkSubmitting}>
                    {bulkSubmitting ? 'Submitting...' : 'Submit Week'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowBulkForm(false)}>
                    Cancel
                  </Button>
                </div>
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
        </select>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Total Hours: {totalHours.toFixed(1)}</h2>
        </CardHeader>
      </Card>

      {loading ? (
        <p>Loading...</p>
      ) : filteredEntries.length === 0 ? (
        <p className="text-neutral-500">No time entries yet</p>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="px-6 py-3 text-left">Date</th>
                    <th className="px-6 py-3 text-left">Employee</th>
                    <th className="px-6 py-3 text-left">Hours</th>
                    <th className="px-6 py-3 text-left">Description</th>
                    <th className="px-6 py-3 text-left">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.map((entry) => (
                    <tr key={entry.id} className="border-b hover:bg-neutral-50">
                      <td className="px-6 py-3 text-sm">{formatDateSafe(entry.date)}</td>
                      <td className="px-6 py-3 text-sm">{getEmployeeName(entry.employee_id)}</td>
                      <td className="px-6 py-3 font-semibold">{entry.hours_worked}h</td>
                      <td className="px-6 py-3 text-sm text-neutral-500">{entry.description || '-'}</td>
                      <td className="px-6 py-3">
                        <select
                          value={entry.status}
                          onChange={(e) => updateEntryStatus(entry.id, e.target.value)}
                          className={`px-2 py-1 rounded text-sm ${statusColors[entry.status] || 'bg-gray-100'}`}
                        >
                          <option value="draft">Draft</option>
                          <option value="submitted">Submitted</option>
                          <option value="approved">Approved</option>
                        </select>
                      </td>
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