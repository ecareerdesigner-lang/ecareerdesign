# Business Center Folder Structure & Implementation Guide

## Directory Structure

```
app/
├── business/
│   ├── layout.tsx                    # Root layout with sidebar & auth
│   ├── dashboard/
│   │   └── page.tsx                  # Dashboard with metrics
│   ├── employees/
│   │   ├── page.tsx                  # Employees list
│   │   ├── [id]/
│   │   │   └── page.tsx              # Employee detail
│   │   └── new/
│   │       └── page.tsx              # New employee form
│   ├── expenses/
│   │   ├── page.tsx                  # Expenses list
│   │   ├── [id]/
│   │   │   └── page.tsx              # Expense detail
│   │   └── new/
│   │       └── page.tsx              # New expense form
│   ├── projects/
│   │   ├── page.tsx                  # Projects list
│   │   ├── [id]/
│   │   │   └── page.tsx              # Project detail
│   │   └── new/
│   │       └── page.tsx              # New project form
│   ├── tasks/
│   │   ├── page.tsx                  # Tasks board
│   │   ├── [id]/
│   │   │   └── page.tsx              # Task detail
│   │   └── new/
│   │       └── page.tsx              # New task form
│   ├── time-tracking/
│   │   ├── page.tsx                  # Time entries
│   │   └── new/
│   │       └── page.tsx              # New time entry
│   ├── revenue/
│   │   └── page.tsx                  # Revenue analytics
│   ├── ai-usage/
│   │   └── page.tsx                  # AI usage stats
│   ├── reports/
│   │   ├── page.tsx                  # Reports list
│   │   └── [id]/
│   │       └── page.tsx              # Report detail
│   ├── documents/
│   │   ├── page.tsx                  # Documents library
│   │   └── [id]/
│   │       └── page.tsx              # Document detail
│   └── settings/
│       └── page.tsx                  # Settings page

components/business/
├── sidebar.tsx                       # Sidebar navigation
├── layout.tsx                        # Business layout wrapper
├── components.tsx                    # Reusable components
├── forms/
│   ├── employee-form.tsx             # Employee form
│   ├── expense-form.tsx              # Expense form
│   ├── project-form.tsx              # Project form
│   └── task-form.tsx                 # Task form
├── tables/
│   ├── employees-table.tsx           # Employees table
│   ├── expenses-table.tsx            # Expenses table
│   ├── projects-table.tsx            # Projects table
│   └── tasks-table.tsx               # Tasks table
└── dialogs/
    ├── delete-dialog.tsx             # Confirm delete
    ├── edit-dialog.tsx               # Edit modal
    └── view-dialog.tsx               # View modal

lib/business/
├── auth.ts                           # Auth utilities
├── api.ts                            # API client
├── utils.ts                          # Utility functions
└── hooks.ts                          # Custom hooks

lib/types/
└── business.ts                       # TypeScript types
```

## Implementation Steps

### 1. Copy Type Definitions
Copy `business-types.ts` to:
```
lib/types/business.ts
```

### 2. Copy Authentication Utilities
Copy `business-auth.ts` to:
```
lib/business/auth.ts
```

### 3. Copy Components
Copy the following files:

**Sidebar Component:**
```
components/business/sidebar.tsx
```
From: `business-sidebar.tsx`

**Reusable Components:**
```
components/business/components.tsx
```
From: `business-components.tsx`

**Layout:**
```
components/business/layout.tsx
```
From: `business-layout.tsx`

### 4. Set Up App Router Structure

**Root Layout:**
```
app/business/layout.tsx
```
From: `app-business-layout.tsx`

**Dashboard:**
```
app/business/dashboard/page.tsx
```
From: `business-dashboard-page.tsx`

### 5. Create Section Pages

For each section below, create the corresponding page file:

**Employees:**
```typescript
// app/business/employees/page.tsx
'use client';

import { EmployeesPage } from '@/components/business/sections/employees';
export default EmployeesPage;
```

**Expenses:**
```typescript
// app/business/expenses/page.tsx
'use client';

import { ExpensesPage } from '@/components/business/sections/expenses';
export default ExpensesPage;
```

**Projects:**
```typescript
// app/business/projects/page.tsx
'use client';

import { ProjectsPage } from '@/components/business/sections/projects';
export default ProjectsPage;
```

**Tasks:**
```typescript
// app/business/tasks/page.tsx
'use client';

import { TasksPage } from '@/components/business/sections/tasks';
export default TasksPage;
```

**Time Tracking:**
```typescript
// app/business/time-tracking/page.tsx
'use client';

import { TimeTrackingPage } from '@/components/business/sections/time-tracking';
export default TimeTrackingPage;
```

**Revenue:**
```typescript
// app/business/revenue/page.tsx
'use client';

import { RevenuePage } from '@/components/business/sections/revenue';
export default RevenuePage;
```

**AI Usage:**
```typescript
// app/business/ai-usage/page.tsx
'use client';

import { AIUsagePage } from '@/components/business/sections/ai-usage';
export default AIUsagePage;
```

**Reports:**
```typescript
// app/business/reports/page.tsx
'use client';

import { ReportsPage } from '@/components/business/sections/reports';
export default ReportsPage;
```

**Documents:**
```typescript
// app/business/documents/page.tsx
'use client';

import { DocumentsPage } from '@/components/business/sections/documents';
export default DocumentsPage;
```

**Settings:**
```typescript
// app/business/settings/page.tsx
'use client';

import { SettingsPage } from '@/components/business/sections/settings';
export default SettingsPage;
```

## Authentication Implementation

### TODO: Replace Placeholder Auth

In `app/business/layout.tsx`, replace the placeholder with your actual Supabase auth:

```typescript
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function BusinessRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/');
  }

  // Check if user has admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (!profile || (profile.role !== 'admin' && profile.role !== 'superadmin')) {
    redirect('/');
  }

  return (
    <ErrorBoundary>
      <BusinessLayout>{children}</BusinessLayout>
    </ErrorBoundary>
  );
}
```

## API Integration Points

### 1. Dashboard Metrics

Replace placeholder data in `app/business/dashboard/page.tsx`:

```typescript
useEffect(() => {
  async function fetchMetrics() {
    const response = await fetch('/api/business/metrics');
    const data = await response.json();
    // Update state with real data
  }
  fetchMetrics();
}, []);
```

### 2. Add API Routes

Create backend routes:

```
app/api/business/
├── metrics/route.ts
├── employees/route.ts
├── expenses/route.ts
├── projects/route.ts
├── tasks/route.ts
├── time-tracking/route.ts
├── revenue/route.ts
└── ai-usage/route.ts
```

## Customization Guide

### Dark Mode
All components use Tailwind's `dark:` prefix and CSS variables from shadcn/ui.
Dark mode is automatically supported.

### Color Scheme
Customize colors in your tailwind.config.js:
```javascript
theme: {
  colors: {
    // Primary: Blue (used for active states)
    blue: { ... },
    // Neutral: Gray (used for text/backgrounds)
    neutral: { ... }
  }
}
```

### Adding New Sections

1. Create page in `app/business/[section]/page.tsx`
2. Add to sidebar navigation in `components/business/sidebar.tsx`
3. Create reusable components if needed
4. Implement API routes in `app/api/business/[section]/`

### Responsive Design

- Mobile: Single column layout, sidebar toggles
- Tablet (md): 2 column grids
- Desktop (lg): Full sidebar + multi-column layouts
- All breakpoints use Tailwind's responsive classes

## Environment Variables

Add to your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Testing

### Test Admin Access
1. Create a user with `admin` role in Supabase
2. Navigate to `/business/dashboard`
3. Should display dashboard (or redirect if not authenticated)

### Test Non-Admin Access
1. Create a user with `user` role
2. Navigate to `/business/dashboard`
3. Should show "Access Denied" message

## Performance Optimization

1. **Lazy Loading**: Use `React.lazy()` for less critical components
2. **ISR**: Add `revalidate` in page components for static revalidation
3. **Code Splitting**: Automatic via Next.js
4. **Images**: Use `next/image` with `width` and `height`
5. **Metadata**: Add to each layout/page for SEO

## Security Considerations

1. ✅ Admin-only routes protected
2. ✅ Role-based access control
3. ✅ Type-safe TypeScript throughout
4. ✅ Error boundaries for crash prevention
5. TODO: Add rate limiting to API routes
6. TODO: Implement audit logging

## Monitoring & Analytics

Add tracking for:
- User engagement in Business Center
- Most viewed sections
- Performance metrics
- Error tracking

## Support & Troubleshooting

### Sidebar not showing
- Check if `lg:ml-64` margin is applied to main content
- Verify sidebar component is mounted

### Dark mode not working
- Ensure Tailwind dark mode is enabled in config
- Check CSS variable definitions in globals.css

### API calls failing
- Check network tab for 401/403 errors
- Verify authentication token is valid
- Check CORS settings if calling external APIs

## Future Enhancements

- [ ] Real-time updates with WebSockets
- [ ] Advanced filtering and search
- [ ] Custom dashboards
- [ ] Data export (CSV, PDF)
- [ ] Team collaboration features
- [ ] Audit logging
- [ ] Advanced analytics
- [ ] Integration with external services
