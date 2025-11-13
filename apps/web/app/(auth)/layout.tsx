import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Authentication - Prismify',
  description: 'Sign in to your Prismify account',
};

/**
 * Auth layout - Centered, minimal design for login/register pages
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="w-full max-w-md px-4">{children}</div>
    </div>
  );
}
