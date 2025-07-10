'use client';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, FilePlus } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function MindmapsLayout({ children }) {
  const pathname = usePathname();
  const isRootPath = pathname === '/mindmaps';
  
  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Mind Maps</h1>
          <p className="text-muted-foreground">
            Create and manage visual representations of knowledge and concepts.
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button asChild variant="outline">
            <Link href="/analytics?tab=mindmaps">
              <BarChart3 className="mr-2 h-4 w-4" />
              Analytics
            </Link>
          </Button>
          
          {!isRootPath && (
            <Button asChild>
              <Link href="/mindmaps">
                <FilePlus className="mr-2 h-4 w-4" />
                New Mind Map
              </Link>
            </Button>
          )}
        </div>
      </div>
      
      {isRootPath && (
        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">All Mind Maps</TabsTrigger>
            <TabsTrigger value="recent">Recent</TabsTrigger>
            <TabsTrigger value="shared">Shared with Me</TabsTrigger>
            <TabsTrigger value="byCourse">By Course</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-6">
            {children}
          </TabsContent>
          <TabsContent value="recent" className="mt-6">
            {children}
          </TabsContent>
          <TabsContent value="shared" className="mt-6">
            {children}
          </TabsContent>
          <TabsContent value="byCourse" className="mt-6">
            {children}
          </TabsContent>
        </Tabs>
      )}
      
      {!isRootPath && children}
    </div>
  );
}
