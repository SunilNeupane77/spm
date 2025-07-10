'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function MindmapsLayout({ children }) {
  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Mind Maps</h1>
        <p className="text-muted-foreground">
          Create and manage visual representations of knowledge and concepts.
        </p>
      </div>
      
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Mind Maps</TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
          <TabsTrigger value="shared">Shared with Me</TabsTrigger>
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
      </Tabs>
    </div>
  );
}
