'use client';

import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, FileX, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Loading Skeleton for Metric Cards
 */
export function MetricCardSkeleton() {
  return (
    <div className="space-y-3 rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-950">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-4 w-20" />
    </div>
  );
}

/**
 * Loading Skeleton Grid for Dashboard
 */
export function MetricsGridSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <MetricCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Loading Skeleton for Table
 */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-12 w-12 rounded-md" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Loading Skeleton for Chart
 */
export function ChartSkeleton() {
  return (
    <div className="space-y-4 rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-950">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

/**
 * Error Boundary Component
 */
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  reset = () => {
    this.setState({ hasError: false, error: undefined });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <ErrorFallback error={this.state.error} onReset={this.reset} />;
    }

    return this.props.children;
  }
}

/**
 * Error Fallback Component
 */
export function ErrorFallback({
  error,
  onReset,
}: {
  error?: Error;
  onReset?: () => void;
}) {
  return (
    <Alert variant="destructive" className="my-4">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        <div className="space-y-2">
          <p className="font-semibold">Something went wrong</p>
          <p className="text-sm text-red-700 dark:text-red-200">
            {error?.message || 'An unexpected error occurred'}
          </p>
          {onReset && (
            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              className="mt-2"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Try again
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}

/**
 * Empty State Component
 */
interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-dashed border-neutral-200 py-12 dark:border-neutral-800',
        className,
      )}
    >
      {icon && (
        <div className="mb-4 text-neutral-400 dark:text-neutral-600">
          {icon}
        </div>
      )}
      <h3 className="mb-2 text-lg font-semibold text-neutral-900 dark:text-neutral-50">
        {title}
      </h3>
      <p className="mb-6 max-w-sm text-center text-sm text-neutral-600 dark:text-neutral-400">
        {description}
      </p>
      {action && (
        <Button onClick={action.onClick} size="sm">
          {action.label}
        </Button>
      )}
    </div>
  );
}

/**
 * No Data Empty State (Common pattern)
 */
export function NoDataEmptyState({
  title = 'No data available',
  description = 'There is no data to display at this time.',
  action,
  className,
}: Omit<EmptyStateProps, 'icon'> & { icon?: never }) {
  return (
    <EmptyState
      icon={<FileX className="h-12 w-12" />}
      title={title}
      description={description}
      action={action}
      className={className}
    />
  );
}

/**
 * Loading State Wrapper
 */
export function LoadingState({
  isLoading,
  children,
  skeleton,
}: {
  isLoading: boolean;
  children: ReactNode;
  skeleton?: ReactNode;
}) {
  if (isLoading) {
    return skeleton || <MetricsGridSkeleton />;
  }
  return <>{children}</>;
}

/**
 * Metric Card Component
 * Used for displaying KPI metrics
 */
interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  previousValue?: number;
  trend?: 'up' | 'down' | 'neutral';
  icon?: ReactNode;
  className?: string;
  isLoading?: boolean;
}

export function MetricCard({
  label,
  value,
  unit,
  previousValue,
  trend,
  icon,
  className,
  isLoading,
}: MetricCardProps) {
  if (isLoading) {
    return <MetricCardSkeleton />;
  }

  const changePercent =
    previousValue !== undefined && previousValue !== 0
      ? (((Number(value) - previousValue) / previousValue) * 100).toFixed(1)
      : null;

  const trendColor =
    trend === 'up'
      ? 'text-green-600 dark:text-green-400'
      : trend === 'down'
        ? 'text-red-600 dark:text-red-400'
        : 'text-neutral-600 dark:text-neutral-400';

  return (
    <div
      className={cn(
        'rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-950',
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
            {label}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
              {value}
            </span>
            {unit && (
              <span className="text-sm text-neutral-500 dark:text-neutral-500">
                {unit}
              </span>
            )}
          </div>
          {changePercent && (
            <p className={cn('mt-2 text-xs font-semibold', trendColor)}>
              {trend === 'up' ? '+' : ''}
              {changePercent}% from last month
            </p>
          )}
        </div>
        {icon && (
          <div className="text-neutral-400 dark:text-neutral-600">{icon}</div>
        )}
      </div>
    </div>
  );
}

/**
 * Section Header Component
 */
interface SectionHeaderProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function SectionHeader({
  title,
  description,
  action,
}: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-neutral-600 dark:text-neutral-400">
            {description}
          </p>
        )}
      </div>
      {action && (
        <Button onClick={action.onClick}>{action.label}</Button>
      )}
    </div>
  );
}

/**
 * Card Component (Wrapper)
 */
export function Card({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Card Header
 */
export function CardHeader({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('border-b border-neutral-200 px-6 py-4 dark:border-neutral-800', className)}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Card Content
 */
export function CardContent({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('px-6 py-4', className)} {...props}>
      {children}
    </div>
  );
}

/**
 * Card Footer
 */
export function CardFooter({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'border-t border-neutral-200 px-6 py-4 dark:border-neutral-800',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
