'use client';

import { useState, useEffect } from 'react';
import { SectionHeader, Card, CardHeader, CardContent } from '@/components/business/components';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  status: string;
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [department, setDepartment] = useState('');

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/business/employees');
      const data = await res.json();
      setEmployees(data.employees || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const addEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/business/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, role, department, status: 'active' }),
      });
      setName('');
      setEmail('');
      setRole('');
      setDepartment('');
      setShowForm(false);
      fetchEmployees();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const deleteEmployee = async (id: string) => {
    if (!confirm('Delete this employee?')) return;
    try {
      await fetch(`/api/business/employees/${id}`, { method: 'DELETE' });
      fetchEmployees();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Employees"
        description="Manage your team"
        action={{
          label: 'Add Employee',
          onClick: () => setShowForm(!showForm),
        }}
      />

      {showForm && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Add Employee</h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={addEmployee} className="space-y-4">
              <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
              <Input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <Input placeholder="Role" value={role} onChange={(e) => setRole(e.target.value)} required />
              <Input placeholder="Department" value={department} onChange={(e) => setDepartment(e.target.value)} />
              <div className="flex gap-2">
                <Button type="submit">Add</Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : employees.length === 0 ? (
        <p className="text-neutral-500">No employees yet</p>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="px-6 py-3 text-left">Name</th>
                  <th className="px-6 py-3 text-left">Email</th>
                  <th className="px-6 py-3 text-left">Role</th>
                  <th className="px-6 py-3 text-right">Delete</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp.id} className="border-b hover:bg-neutral-50">
                    <td className="px-6 py-3">{emp.name}</td>
                    <td className="px-6 py-3">{emp.email}</td>
                    <td className="px-6 py-3">{emp.role}</td>
                    <td className="px-6 py-3 text-right">
                      <button onClick={() => deleteEmployee(emp.id)} className="text-red-600">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}