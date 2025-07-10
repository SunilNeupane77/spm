import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="py-12 md:py-24 lg:py-32 xl:py-40 bg-gradient-to-b from-white to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container px-4 md:px-6 mx-auto flex flex-col items-center text-center space-y-8">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter">
            Organize Your Academic Life
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-[800px]">
            Manage assignments, exams, and projects in one place. Collaborate with peers, track progress, 
            and never miss a deadline again.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mx-auto">
            <Link href="/auth/register">
              <Button size="lg" className="font-medium text-base">
                Get Started
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline" className="font-medium text-base">
                Log In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-white dark:bg-gray-950">
        <div className="container px-4 md:px-6 mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-6 bg-gray-50 dark:bg-gray-900 rounded-lg shadow-sm">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" 
                     strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Timeline View</h3>
              <p className="text-gray-600 dark:text-gray-400">
                View assignments, exams, and projects in chronological order. Drag and drop items to adjust due dates.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-gray-50 dark:bg-gray-900 rounded-lg shadow-sm">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" 
                     strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Reminders</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Receive reminders before assignments or projects are due via email, text message, or push notification.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-gray-50 dark:bg-gray-900 rounded-lg shadow-sm">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" 
                     strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Collaboration</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Invite other members of a group to view and edit timelines, achieving perfect time management.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-24 bg-gray-50 dark:bg-gray-900">
        <div className="container px-4 md:px-6 mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold mb-4">1</div>
              <h3 className="text-xl font-bold mb-2">Create an account</h3>
              <p className="text-gray-600 dark:text-gray-400">Sign up for free and set up your profile</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold mb-4">2</div>
              <h3 className="text-xl font-bold mb-2">Add your courses</h3>
              <p className="text-gray-600 dark:text-gray-400">Input your course details and schedule</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold mb-4">3</div>
              <h3 className="text-xl font-bold mb-2">Track assignments</h3>
              <p className="text-gray-600 dark:text-gray-400">Add tasks and manage your deadlines</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold mb-4">4</div>
              <h3 className="text-xl font-bold mb-2">Collaborate</h3>
              <p className="text-gray-600 dark:text-gray-400">Invite classmates to share resources</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-primary/10">
        <div className="container px-4 md:px-6 mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to get organized?</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-[600px] mx-auto">
            Join thousands of students and academics who are already using our platform to stay on top of their work.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register">
              <Button size="lg" className="font-medium text-base">
                Get Started for Free
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline" className="font-medium text-base">
                Log In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-gray-100 dark:bg-gray-800">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                © 2025 Academic Organizer. All rights reserved.
              </p>
            </div>
            <div className="flex gap-4">
              <Link href="/terms" className="text-sm text-gray-600 dark:text-gray-400 hover:underline">
                Terms
              </Link>
              <Link href="/privacy" className="text-sm text-gray-600 dark:text-gray-400 hover:underline">
                Privacy
              </Link>
              <Link href="/contact" className="text-sm text-gray-600 dark:text-gray-400 hover:underline">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

