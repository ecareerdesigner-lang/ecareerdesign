'use client';

import { useState, useEffect } from 'react';
import { SectionHeader, Card, CardHeader, CardContent } from '@/components/business/components';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  progress: number;
  budget?: number;
  spent?: number;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/business/projects');
      const data = await res.json();
      setProjects(data.projects || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const addProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/business/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          budget: budget ? parseInt(budget) : null,
          status: 'active',
          progress: 0,
        }),
      });
      setName('');
      setDescription('');
      setBudget('');
      setShowForm(false);
      fetchProjects();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const updateProjectStatus = async (id: string, newStatus: string) => {
    try {
      await fetch(`/api/business/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchProjects();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const deleteProject = async (id: string) => {
    if (!confirm('Delete this project?')) return;
    try {
      await fetch(`/api/business/projects/${id}`, { method: 'DELETE' });
      fetchProjects();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const filteredProjects = projects.filter((proj) =>
    statusFilter === 'all' ? true : proj.status === statusFilter
  );

  const statusColors: Record<string, string> = {
    planning: 'bg-gray-100 text-gray-800',
    active: 'bg-blue-100 text-blue-800',
    on_hold: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Projects"
        description="Create and manage your projects"
        action={{
          label: 'Add Project',
          onClick: () => setShowForm(!showForm),
        }}
      />

      {showForm && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Add Project</h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={addProject} className="space-y-4">
              <Input placeholder="Project name" value={name} onChange={(e) => setName(e.target.value)} required />
              <textarea
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm dark:bg-neutral-950"
                rows={3}
              />
              <Input placeholder="Budget (optional)" type="number" value={budget} onChange={(e) => setBudget(e.target.value)} />
              <div className="flex gap-2">
                <Button type="submit">Add Project</Button>
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
          <option value="planning">Planning</option>
          <option value="active">Active</option>
          <option value="on_hold">On Hold</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : filteredProjects.length === 0 ? (
        <p className="text-neutral-500">No projects yet</p>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="px-6 py-3 text-left">Name</th>
                    <th className="px-6 py-3 text-left">Status</th>
                    <th className="px-6 py-3 text-left">Progress</th>
                    <th className="px-6 py-3 text-left">Budget</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.map((proj) => (
                    <tr key={proj.id} className="border-b hover:bg-neutral-50">
                      <td className="px-6 py-3">
                        <div>
                          <p className="font-medium">{proj.name}</p>
                          {proj.description && <p className="text-sm text-neutral-500">{proj.description.substring(0, 50)}</p>}
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <select
                          value={proj.status}
                          onChange={(e) => updateProjectStatus(proj.id, e.target.value)}
                          className={`px-2 py-1 rounded text-sm ${statusColors[proj.status] || 'bg-gray-100'}`}
                        >
                          <option value="planning">Planning</option>
                          <option value="active">Active</option>
                          <option value="on_hold">On Hold</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-6 py-3">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${proj.progress}%` }}></div>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-sm">${proj.budget || 0}</td>
                      <td className="px-6 py-3 text-right">
                        <button onClick={() => deleteProject(proj.id)} className="text-red-600 hover:text-red-700">
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