'use client';

import { useState, useEffect } from 'react';
import { SectionHeader, Card, CardHeader, CardContent } from '@/components/business/components';

interface Metrics {
  totalApplications: number;
  activeMatches: number;
  interviewSessions: number;
  avgResumeScore: number;
  totalResumes: number;
  matchScores: number;
  careerStories: number;
  responseScores: number;
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/business/metrics');
        const data = await response.json();
        setMetrics(data);
      } catch (error) {
        console.error('Error fetching metrics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Dashboard"
        description="Overview of your business metrics and performance"
      />

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <h3 className="text-sm font-medium">Job Applications</h3>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{metrics?.totalApplications || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-sm font-medium">Active Matches</h3>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{metrics?.activeMatches || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-sm font-medium">Interview Sessions</h3>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{metrics?.interviewSessions || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-sm font-medium">Avg Resume Score</h3>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{metrics?.avgResumeScore || 0}%</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <h3 className="text-sm font-medium">Total Resumes</h3>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{metrics?.totalResumes || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-sm font-medium">Match Scores</h3>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{metrics?.matchScores || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-sm font-medium">Career Stories</h3>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{metrics?.careerStories || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-sm font-medium">Response Scores</h3>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{metrics?.responseScores || 0}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}