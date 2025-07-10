'use client';

export default function AnalyticsLayout({ children }) {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col space-y-2 mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Track your progress, analyze performance, and gain insights into your academic journey.
        </p>
      </div>
      {children}
    </div>
  );
}
