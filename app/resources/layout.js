'use client'

import { Button } from "@/components/ui/button";
import { ArrowLeft, FileUp, Plus } from "lucide-react";
import Link from "next/link";

export default function ResourcesLayout({ children }) {
  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="h-8 w-8 mr-1"
          >
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back to Dashboard</span>
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Resources</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <Button asChild size="sm">
            <Link href="/resources/new">
              <Plus className="h-4 w-4 mr-1" />
              Add Resource
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/resources/upload">
              <FileUp className="h-4 w-4 mr-1" />
              Upload Files
            </Link>
          </Button>
        </div>
      </div>
      
      {children}
    </div>
  );
}
