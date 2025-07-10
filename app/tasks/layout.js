export const metadata = {
  title: 'Tasks | Academic Organizer',
  description: 'Manage your academic tasks, assignments, exams, and projects',
}

export default function TasksLayout({ children }) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}
