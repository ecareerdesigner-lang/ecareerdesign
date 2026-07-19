'use client';

import React, { useState } from 'react';
import {
  SectionHeader,
  Card,
  CardHeader,
  CardContent,
  ErrorBoundary,
} from '@/components/business/components';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    companyName: 'eCareer Design',
    companyEmail: 'hello@ecareerdesign.net',
    currency: 'USD',
    timezone: 'America/New_York',
  });

  const [notifications, setNotifications] = useState({
    emailOnHighExpense: true,
    emailOnProjectDelay: true,
    emailOnAIUsageThreshold: true,
    dailySummary: false,
    weeklyReports: true,
  });

  const handleSettingsChange = (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleNotificationChange = (key: string) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Settings"
        description="Configure Business Center settings"
      />

      <ErrorBoundary>
        <div className="grid gap-6 max-w-2xl">
          {/* General Settings */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">General</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Company Name</label>
                <Input
                  value={settings.companyName}
                  onChange={(e) =>
                    handleSettingsChange('companyName', e.target.value)
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Company Email</label>
                <Input
                  type="email"
                  value={settings.companyEmail}
                  onChange={(e) =>
                    handleSettingsChange('companyEmail', e.target.value)
                  }
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Currency</label>
                  <select
                    value={settings.currency}
                    onChange={(e) =>
                      handleSettingsChange('currency', e.target.value)
                    }
                    className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-800 dark:bg-neutral-950"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Timezone</label>
                  <select
                    value={settings.timezone}
                    onChange={(e) =>
                      handleSettingsChange('timezone', e.target.value)
                    }
                    className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-800 dark:bg-neutral-950"
                  >
                    <option value="America/New_York">Eastern</option>
                    <option value="America/Chicago">Central</option>
                    <option value="America/Denver">Mountain</option>
                    <option value="America/Los_Angeles">Pacific</option>
                  </select>
                </div>
              </div>
              <Button>Save Changes</Button>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Notifications</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(notifications).map(([key, value]) => {
                const labels: Record<string, string> = {
                  emailOnHighExpense: 'Alert on high expenses',
                  emailOnProjectDelay: 'Alert on project delays',
                  emailOnAIUsageThreshold: 'Alert on API usage threshold',
                  dailySummary: 'Daily summary email',
                  weeklyReports: 'Weekly reports',
                };

                return (
                  <div key={key} className="flex items-center justify-between">
                    <label className="text-sm">{labels[key]}</label>
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={() => handleNotificationChange(key)}
                      className="h-4 w-4 rounded border-neutral-300"
                    />
                  </div>
                );
              })}
              <Button>Save Preferences</Button>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-200 dark:border-red-900">
            <CardHeader>
              <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">
                Danger Zone
              </h2>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  These actions cannot be undone. Please proceed with caution.
                </AlertDescription>
              </Alert>
              <div className="mt-4 space-y-2">
                <Button variant="destructive" className="w-full">
                  Reset All Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </ErrorBoundary>
    </div>
  );
}
