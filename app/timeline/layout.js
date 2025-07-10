export const metadata = {
  title: 'Timeline | Academic Organizer',
  description: 'View and manage your academic schedule in a timeline view',
}

export default function TimelineLayout({ children }) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}
