'use client';

import { useState, useEffect } from 'react';
import { SectionHeader, Card, CardHeader, CardContent } from '@/components/business/components';
import { Button } from '@/components/ui/button';

interface ReportData {
  employees: any[];
  tasks: any[];
  expenses: any[];
  revenue: any[];
  timeEntries: any[];
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportData();
  }, []);

 const fetchReportData = async () => {
    try {
      const res = await fetch('/api/business/reports');
      const reportData = await res.json();

      // Create employee lookup map
      const employeeMap: Record<string, string> = {};
      reportData.employees.forEach((emp: any) => {
        employeeMap[emp.id] = emp.name;
      });

      // Replace employee_id with employee name in time entries and expenses
      reportData.timeEntries = reportData.timeEntries.map((entry: any) => ({
        ...entry,
        employee_name: employeeMap[entry.employee_id] || 'Unassigned',
      }));

      reportData.expenses = reportData.expenses.map((exp: any) => ({
        ...exp,
        employee_name: employeeMap[exp.employee_id] || 'Unassigned',
      }));

      setData(reportData);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = (filename: string, data: any[]) => {
    if (data.length === 0) {
      alert('No data to export');
      return;
    }

    try {
      const headers = Object.keys(data[0]);
      let csv = headers.join(',') + '\n';
      
      for (const row of data) {
        const values = headers.map((header) => {
          const value = row[header];
          if (value === null || value === undefined) return '';
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value}"`;
          }
          return String(value);
        });
        csv += values.join(',') + '\n';
      }

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log(`Exported ${filename} with ${data.length} rows`);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data');
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!data) return <p className="text-neutral-500">Failed to load report data</p>;

  const totalEmployees = data.employees.length;
  const totalTasks = data.tasks.length;
  const completedTasks = data.tasks.filter((t) => t.status === 'completed').length;
  const totalExpenses = data.expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalRevenue = data.revenue.reduce((sum, r) => sum + r.amount, 0);
  const totalHours = data.timeEntries.reduce((sum, t) => sum + t.hours_worked, 0);
  const approvedExpenses = data.expenses.filter((e) => e.status === 'approved').length;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Reports"
        description="Business analytics and reports"
      />

      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <h3 className="text-sm text-neutral-600 dark:text-neutral-400">Total Employees</h3>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalEmployees}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-sm text-neutral-600 dark:text-neutral-400">Tasks Completed</h3>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{completedTasks}/{totalTasks}</p>
          </CardContent>
        </Card>

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
            <h3 className="text-sm text-neutral-600 dark:text-neutral-400">Total Expenses</h3>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">${totalExpenses.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Summary</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p><span className="font-semibold">Net Profit:</span> ${(totalRevenue - totalExpenses).toFixed(2)}</p>
            <p><span className="font-semibold">Profit Margin:</span> {totalRevenue > 0 ? (((totalRevenue - totalExpenses) / totalRevenue) * 100).toFixed(1) : 0}%</p>
            <p><span className="font-semibold">Total Hours Logged:</span> {totalHours.toFixed(1)}h</p>
            <p><span className="font-semibold">Approved Expenses:</span> {approvedExpenses}/{data.expenses.length}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Task Summary</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><span className="font-semibold">To Do:</span> {data.tasks.filter((t) => t.status === 'todo').length}</p>
              <p><span className="font-semibold">In Progress:</span> {data.tasks.filter((t) => t.status === 'in_progress').length}</p>
              <p><span className="font-semibold">In Review:</span> {data.tasks.filter((t) => t.status === 'review').length}</p>
              <p><span className="font-semibold">Completed:</span> {completedTasks}</p>
              <p><span className="font-semibold">Blocked:</span> {data.tasks.filter((t) => t.status === 'blocked').length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Expense Summary</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><span className="font-semibold">Draft:</span> ${data.expenses.filter((e) => e.status === 'draft').reduce((s, e) => s + e.amount, 0).toFixed(2)}</p>
              <p><span className="font-semibold">Submitted:</span> ${data.expenses.filter((e) => e.status === 'submitted').reduce((s, e) => s + e.amount, 0).toFixed(2)}</p>
              <p><span className="font-semibold">Approved:</span> ${data.expenses.filter((e) => e.status === 'approved').reduce((s, e) => s + e.amount, 0).toFixed(2)}</p>
              <p><span className="font-semibold">Rejected:</span> ${data.expenses.filter((e) => e.status === 'rejected').reduce((s, e) => s + e.amount, 0).toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Export Data</h2>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => exportToCSV('employees', data.employees)}>Export Employees</Button>
              <Button onClick={() => exportToCSV('tasks', data.tasks)}>Export Tasks</Button>
              <Button onClick={() => exportToCSV('expenses', data.expenses)}>Export Expenses</Button>
              <Button onClick={() => exportToCSV('revenue', data.revenue)}>Export Revenue</Button>
              <Button onClick={() => exportToCSV('time-entries', data.timeEntries)}>Export Time Entries</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}