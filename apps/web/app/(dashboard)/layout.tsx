import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardNav } from '@/components/dashboard/DashboardNav';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';

export const metadata: Metadata = {
  title: 'Dashboard - Prismify',
  description: 'Manage your SEO audits and analytics',
};

/**
 * Dashboard layout with sidebar navigation and header
 * Protected by middleware - requires authentication
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Sidebar Navigation */}
      <DashboardNav />

      {/* Main Content Area */}
      <div className="lg:pl-64">
        <DashboardHeader user={user} />
        <main className="py-8 px-4 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
