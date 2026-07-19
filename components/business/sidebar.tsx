'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  LayoutDashboard,
  Users,
  DollarSign,
  Briefcase,
  CheckSquare,
  Clock,
  TrendingUp,
  Zap,
  BarChart3,
  FileText,
  Settings,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';

interface SidebarNavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
  disabled?: boolean;
}

const navItems: SidebarNavItem[] = [
  {
    title: 'Dashboard',
    href: '/business/dashboard',
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  {
    title: 'Employees',
    href: '/business/employees',
    icon: <Users className="h-4 w-4" />,
  },
  {
    title: 'Expenses',
    href: '/business/expenses',
    icon: <DollarSign className="h-4 w-4" />,
  },
  {
    title: 'Projects',
    href: '/business/projects',
    icon: <Briefcase className="h-4 w-4" />,
  },
  {
    title: 'Tasks',
    href: '/business/tasks',
    icon: <CheckSquare className="h-4 w-4" />,
  },
  {
    title: 'Time Tracking',
    href: '/business/time-tracking',
    icon: <Clock className="h-4 w-4" />,
  },
  {
    title: 'Revenue',
    href: '/business/revenue',
    icon: <TrendingUp className="h-4 w-4" />,
  },
  {
    title: 'AI Usage',
    href: '/business/ai-usage',
    icon: <Zap className="h-4 w-4" />,
  },
  {
    title: 'Reports',
    href: '/business/reports',
    icon: <BarChart3 className="h-4 w-4" />,
  },
  {
    title: 'Documents',
    href: '/business/documents',
    icon: <FileText className="h-4 w-4" />,
  },
  {
    title: 'Settings',
    href: '/business/settings',
    icon: <Settings className="h-4 w-4" />,
  },
];

interface BusinessSidebarProps {
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

/**
 * Sidebar Navigation Component
 * Persistent left sidebar for Business Center navigation
 */
export function BusinessSidebar({
  className,
  isOpen = true,
  onClose,
}: BusinessSidebarProps) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        'fixed left-0 top-0 h-screen w-40 border-r border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950',
        'pt-16 flex flex-col',
        'transition-transform duration-300 ease-in-out',
        'lg:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full',
        className,
      )}
    >
      <ScrollArea className="flex-1 px-0">
        <div className="space-y-2 px-4 py-6">
          {navItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium',
                  'transition-colors duration-200',
                  isActive
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400'
                    : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-900',
                  item.disabled && 'pointer-events-none opacity-50',
                )}
                onClick={onClose}
              >
                <span className="shrink-0">{item.icon}</span>
                <span className="flex-1">{item.title}</span>

                {item.badge && (
                  <span className="inline-flex items-center justify-center rounded-full bg-red-500 px-2 py-1 text-xs font-bold text-white">
                    {item.badge}
                  </span>
                )}

                {isActive && (
                  <div className="absolute right-0 top-0 h-full w-1 rounded-l-md bg-blue-600 dark:bg-blue-400" />
                )}
              </Link>
            );
          })}
        </div>
      </ScrollArea>

      {/* Footer Section */}
      <div className="border-t border-neutral-200 px-4 py-4 dark:border-neutral-800">
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Business Center v1.0
        </p>
      </div>
    </nav>
  );
}

/**
 * Mobile Sidebar Toggle Button
 */
export function SidebarToggle({
  isOpen,
  onToggle,
}: {
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="lg:hidden"
      onClick={onToggle}
      aria-label="Toggle sidebar"
    >
      {isOpen ? (
        <X className="h-5 w-5" />
      ) : (
        <Menu className="h-5 w-5" />
      )}
    </Button>
  );
}
