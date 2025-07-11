'use client';

import { CloudinaryResource } from '@/components/CloudinaryImage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useResources } from '@/lib/resourceHooks';
import { format } from 'date-fns';
import { BookOpen, ExternalLink, FileText, Globe, Play, Search, Share2, Tag } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

export default function ResourcesPage() {
  // State for filters
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterScope, setFilterScope] = useState('all');
  
  // Fetch resources
  const { data: resources, isLoading, error } = useResources({
    type: filterType !== 'all' ? filterType : undefined,
    subject: filterSubject !== 'all' ? filterSubject : undefined,
    isPublic: filterScope === 'public' ? true : undefined,
  });
  
  // Apply search filter client-side (for better UX)
  const filteredResources = useMemo(() => {
    if (!resources) return [];
    
    if (!search.trim()) return resources;
    
    const searchLower = search.toLowerCase();
    return resources.filter(resource => 
      resource.title.toLowerCase().includes(searchLower) ||
      (resource.description && resource.description.toLowerCase().includes(searchLower)) ||
      (resource.subject && resource.subject.toLowerCase().includes(searchLower)) ||
      (resource.topic && resource.topic.toLowerCase().includes(searchLower)) ||
      (resource.tags && resource.tags.some(tag => tag.toLowerCase().includes(searchLower)))
    );
  }, [resources, search]);
  
  // Group resources by type for the tabs
  const resourcesByType = useMemo(() => {
    if (!filteredResources) return {};
    
    return filteredResources.reduce((acc, resource) => {
      if (!acc[resource.type]) {
        acc[resource.type] = [];
      }
      acc[resource.type].push(resource);
      return acc;
    }, { all: filteredResources });
  }, [filteredResources]);
  
  // Get unique subjects for the filter
  const subjects = useMemo(() => {
    if (!resources) return [];
    
    const subjectSet = new Set();
    resources.forEach(resource => {
      if (resource.subject) {
        subjectSet.add(resource.subject);
      }
    });
    
    return Array.from(subjectSet);
  }, [resources]);
  
  // Resource type icons and labels
  const resourceTypeInfo = {
    document: { icon: <FileText className="h-4 w-4" />, label: 'Document' },
    video: { icon: <Play className="h-4 w-4" />, label: 'Video' },
    link: { icon: <ExternalLink className="h-4 w-4" />, label: 'Link' },
    book: { icon: <BookOpen className="h-4 w-4" />, label: 'Book' },
    article: { icon: <FileText className="h-4 w-4" />, label: 'Article' },
    other: { icon: <FileText className="h-4 w-4" />, label: 'Other' },
  };
  
  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search resources..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="type-filter">Type</Label>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger id="type-filter">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="document">Documents</SelectItem>
              <SelectItem value="video">Videos</SelectItem>
              <SelectItem value="link">Links</SelectItem>
              <SelectItem value="book">Books</SelectItem>
              <SelectItem value="article">Articles</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="subject-filter">Subject</Label>
          <Select value={filterSubject} onValueChange={setFilterSubject}>
            <SelectTrigger id="subject-filter">
              <SelectValue placeholder="All Subjects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {subjects.map(subject => (
                <SelectItem key={subject} value={subject}>{subject}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="scope-filter">Scope</Label>
          <Select value={filterScope} onValueChange={setFilterScope}>
            <SelectTrigger id="scope-filter">
              <SelectValue placeholder="All Resources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Resources</SelectItem>
              <SelectItem value="mine">My Resources</SelectItem>
              <SelectItem value="shared">Shared With Me</SelectItem>
              <SelectItem value="public">Public Resources</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}
      
      {/* Error State */}
      {error && (
        <div className="text-center p-8 border rounded-lg">
          <p className="text-red-500 mb-4">Error loading resources.</p>
          <Button variant="outline">Try Again</Button>
        </div>
      )}
      
      {/* Empty State */}
      {!isLoading && filteredResources?.length === 0 && (
        <div className="text-center p-8 border rounded-lg">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
          <h3 className="text-lg font-medium mb-1">No resources found</h3>
          <p className="text-muted-foreground mb-4">
            {search ? 'Try adjusting your search or filters.' : 'Get started by adding your first resource.'}
          </p>
          <Button asChild>
            <Link href="/resources/new">Add Resource</Link>
          </Button>
        </div>
      )}
      
      {/* Resources Display */}
      {!isLoading && filteredResources?.length > 0 && (
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All ({filteredResources.length})</TabsTrigger>
            {Object.entries(resourcesByType).map(([type, items]) => {
              if (type === 'all') return null;
              return (
                <TabsTrigger key={type} value={type}>
                  {resourceTypeInfo[type]?.label || type} ({items.length})
                </TabsTrigger>
              );
            })}
          </TabsList>
          
          <TabsContent value="all" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {renderResourceCards(filteredResources)}
            </div>
          </TabsContent>
          
          {Object.entries(resourcesByType).map(([type, items]) => {
            if (type === 'all') return null;
            return (
              <TabsContent key={type} value={type} className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {renderResourceCards(items)}
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      )}
    </div>
  );
  
  // Helper function to render resource cards
  function renderResourceCards(resourcesList) {
    return resourcesList.map(resource => (
      <Card key={resource._id} className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <CardTitle className="line-clamp-1">{resource.title}</CardTitle>
            <div className="flex items-center gap-1">
              {resource.isPublic && (
                <Badge variant="secondary">
                  <Globe className="h-3 w-3 mr-1" />
                  Public
                </Badge>
              )}
              {resourceTypeInfo[resource.type] && (
                <Badge variant="outline" className="ml-1">
                  {resourceTypeInfo[resource.type].icon}
                  <span className="ml-1">{resourceTypeInfo[resource.type].label}</span>
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Display Cloudinary image/resource if available */}
          {resource.cloudinary && resource.cloudinary.publicId && (
            <div className="mb-3">
              <CloudinaryResource 
                resource={resource} 
                width={300} 
                height={150} 
                className="w-full h-32 object-cover" 
              />
            </div>
          )}
          
          {resource.description && (
            <p className="text-muted-foreground text-sm line-clamp-2 mb-2">
              {resource.description}
            </p>
          )}
          
          <div className="grid grid-cols-2 gap-2 text-sm">
            {resource.subject && (
              <div>
                <span className="font-medium">Subject:</span>
                <p className="text-muted-foreground truncate">{resource.subject}</p>
              </div>
            )}
            
            {resource.course && (
              <div>
                <span className="font-medium">Course:</span>
                <p className="text-muted-foreground truncate">
                  {resource.course.code || resource.course.name}
                </p>
              </div>
            )}
          </div>
          
          {resource.tags && resource.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {resource.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          
          <div className="text-xs text-muted-foreground mt-2">
            {resource.createdAt && (
              <time dateTime={resource.createdAt}>
                Added {format(new Date(resource.createdAt), 'MMM d, yyyy')}
              </time>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="pt-1 flex justify-between">
          <Button asChild size="sm" variant="outline">
            <Link href={`/resources/${resource._id}`}>View Details</Link>
          </Button>
          
          {resource.owner._id === resource.userId && (
            <Button size="sm" variant="ghost">
              <Share2 className="h-4 w-4" />
              <span className="sr-only">Share</span>
            </Button>
          )}
        </CardFooter>
      </Card>
    ));
  }
}
