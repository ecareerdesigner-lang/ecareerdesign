'use client';

import { useState, useEffect, useRef } from 'react';
import { SectionHeader, Card, CardContent } from '@/components/business/components';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2, FileText, Download } from 'lucide-react';

interface Document {
  id: string;
  name: string;
  category: string;
  file_url: string;
  file_size: number;
  created_at: string;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [category, setCategory] = useState('other');
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/business/documents');
      const data = await res.json();
      setDocuments(data.documents || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);

      const res = await fetch('/api/business/documents', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        alert(`Upload failed: ${err.error}`);
      } else {
        fetchDocuments();
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const deleteDocument = async (id: string) => {
    if (!confirm('Delete this document?')) return;
    try {
      await fetch(`/api/business/documents/${id}`, { method: 'DELETE' });
      fetchDocuments();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const filteredDocuments = documents.filter((doc) =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Documents"
        description="Store and organize business documents"
        action={{
          label: uploading ? 'Uploading...' : 'Upload Document',
          onClick: handleFileSelect,
        }}
      />

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      <div className="flex gap-4">
        <Input
          placeholder="Search documents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-2 border rounded-md text-sm dark:bg-neutral-950"
        >
          <option value="other">Other</option>
          <option value="policies">Policies</option>
          <option value="templates">Templates</option>
          <option value="contracts">Contracts</option>
          <option value="guidelines">Guidelines</option>
        </select>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : filteredDocuments.length === 0 ? (
        <p className="text-neutral-500">No documents yet. Click "Upload Document" to add one.</p>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="px-6 py-3 text-left">Name</th>
                  <th className="px-6 py-3 text-left">Category</th>
                  <th className="px-6 py-3 text-left">Size</th>
                  <th className="px-6 py-3 text-left">Uploaded</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.map((doc) => (
                  <tr key={doc.id} className="border-b hover:bg-neutral-50">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-neutral-400" />
                        {doc.name}
                      </div>
                    </td>
                    <td className="px-6 py-3 text-sm capitalize">{doc.category}</td>
                    <td className="px-6 py-3 text-sm">{formatFileSize(doc.file_size)}</td>
                    <td className="px-6 py-3 text-sm">{new Date(doc.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex gap-2 justify-end">
                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700">
                          <Download className="h-4 w-4" />
                        </a>
                        <button onClick={() => deleteDocument(doc.id)} className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
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