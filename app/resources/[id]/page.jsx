'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useDeleteResource, useResource, useShareResource } from '@/lib/resourceHooks';
import { format } from 'date-fns';
import { ArrowLeft, Calendar, Download, ExternalLink, FileText, Globe, Loader2, Pencil, Share2, Tag, Trash2, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function ResourceDetailPage({ params }) {
  const resourceId = params.id;
  const router = useRouter();
  const { toast } = useToast();
  
  // States for dialogs
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [sharePermission, setSharePermission] = useState('view');
  
  // Fetch resource details
  const { data: resource, isLoading, error } = useResource(resourceId);
  
  // Delete resource mutation
  const deleteResource = useDeleteResource();
  
  // Share resource mutation
  const shareResource = useShareResource();
  
  // Handle resource deletion
  const handleDeleteResource = () => {
    deleteResource.mutate(resourceId, {
      onSuccess: () => {
        toast({
          title: 'Resource deleted',
          description: 'The resource has been successfully deleted.',
        });
        setIsDeleteDialogOpen(false);
        router.push('/resources');
      },
      onError: (error) => {
        toast({
          title: 'Error',
          description: error.message || 'Failed to delete resource',
          variant: 'destructive',
        });
      }
    });
  };
  
  // Handle resource sharing
  const handleShareResource = (e) => {
    e.preventDefault();
    
    shareResource.mutate({
      resourceId,
      shareData: {
        email: shareEmail,
        permission: sharePermission,
      }
    }, {
      onSuccess: () => {
        toast({
          title: 'Resource shared',
          description: `Resource has been shared with ${shareEmail}`,
        });
        setIsShareDialogOpen(false);
        setShareEmail('');
        setSharePermission('view');
      },
      onError: (error) => {
        toast({
          title: 'Error',
          description: error.message || 'Failed to share resource',
          variant: 'destructive',
        });
      }
    });
  };
  
  // Resource type icons and labels
  const resourceTypeInfo = {
    document: { icon: <FileText className="h-5 w-5" />, label: 'Document' },
    video: { icon: <ExternalLink className="h-5 w-5" />, label: 'Video' },
    link: { icon: <ExternalLink className="h-5 w-5" />, label: 'Link' },
    book: { icon: <FileText className="h-5 w-5" />, label: 'Book' },
    article: { icon: <FileText className="h-5 w-5" />, label: 'Article' },
    other: { icon: <FileText className="h-5 w-5" />, label: 'Other' },
  };
  
  // Check if user is the owner
  const isOwner = resource && resource.owner && resource.owner._id === resource.userId;
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center p-8 border rounded-lg">
        <p className="text-red-500 mb-4">Error loading resource details.</p>
        <Button variant="outline" onClick={() => router.refresh()}>Try Again</Button>
      </div>
    );
  }
  
  if (!resource) {
    return (
      <div className="text-center p-8 border rounded-lg">
        <p className="mb-4">Resource not found.</p>
        <Button asChild variant="outline">
          <Link href="/resources">Back to Resources</Link>
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Navigation */}
      <Button asChild variant="outline" size="sm" className="mb-6">
        <Link href="/resources">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Resources
        </Link>
      </Button>
      
      {/* Resource Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            {resourceTypeInfo[resource.type] && (
              <Badge variant="outline" className="px-2 py-1">
                {resourceTypeInfo[resource.type].icon}
                <span className="ml-1">{resourceTypeInfo[resource.type].label}</span>
              </Badge>
            )}
            
            {resource.isPublic && (
              <Badge variant="secondary">
                <Globe className="h-3 w-3 mr-1" />
                Public
              </Badge>
            )}
          </div>
          <h1 className="text-3xl font-bold">{resource.title}</h1>
          {resource.description && (
            <p className="text-muted-foreground mt-2">{resource.description}</p>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {isOwner && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsShareDialogOpen(true)}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              
              <Button
                asChild
                variant="outline"
                size="sm"
              >
                <Link href={`/resources/${resourceId}/edit`}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Link>
              </Button>
              
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </>
          )}
        </div>
      </div>
      
      {/* Resource Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {resource.subject && (
              <div>
                <h3 className="font-medium">Subject</h3>
                <p>{resource.subject}</p>
              </div>
            )}
            
            {resource.topic && (
              <div>
                <h3 className="font-medium">Topic</h3>
                <p>{resource.topic}</p>
              </div>
            )}
            
            {resource.tags && resource.tags.length > 0 && (
              <div>
                <h3 className="font-medium">Tags</h3>
                <div className="flex flex-wrap gap-1 mt-1">
                  {resource.tags.map(tag => (
                    <Badge key={tag} variant="secondary">
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {resource.url && (
              <div>
                <h3 className="font-medium">URL</h3>
                <a 
                  href={resource.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center"
                >
                  {resource.url}
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </div>
            )}
            
            {resource.fileUrl && (
              <div>
                <h3 className="font-medium">File</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Button asChild variant="outline" size="sm">
                    <a href={resource.fileUrl} download target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4 mr-2" />
                      Download File
                    </a>
                  </Button>
                  {resource.fileType && <span className="text-sm text-muted-foreground">{resource.fileType}</span>}
                  {resource.fileSize && <span className="text-sm text-muted-foreground">({Math.round(resource.fileSize / 1024)} KB)</span>}
                </div>
              </div>
            )}
            
            {resource.course && (
              <div>
                <h3 className="font-medium">Course</h3>
                <Link 
                  href={`/courses/${resource.course._id}`}
                  className="text-primary hover:underline"
                >
                  {resource.course.name || resource.course.code}
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <h3 className="font-medium">Owner</h3>
                <p className="text-sm text-muted-foreground">
                  {resource.owner?.name || 'Unknown user'}
                </p>
              </div>
            </div>
            
            {resource.createdAt && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <h3 className="font-medium">Created</h3>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(resource.createdAt), 'PPP')}
                  </p>
                </div>
              </div>
            )}
            
            {resource.sharedWith && resource.sharedWith.length > 0 && (
              <div>
                <h3 className="font-medium flex items-center gap-1">
                  <Share2 className="h-4 w-4" /> 
                  Shared With
                </h3>
                <ul className="mt-1 space-y-1">
                  {resource.sharedWith.map(share => (
                    <li key={share.user._id} className="text-sm flex items-center justify-between">
                      <span>{share.user.name || share.user.email}</span>
                      <Badge variant="outline" className="text-xs">
                        {share.permission === 'edit' ? 'Can edit' : 'View only'}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Resource</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this resource? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteResource}
              disabled={deleteResource.isPending}
            >
              {deleteResource.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Share Dialog */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Resource</DialogTitle>
            <DialogDescription>
              Share this resource with other users.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleShareResource}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="permission">Permission</Label>
                <Select 
                  value={sharePermission} 
                  onValueChange={setSharePermission}
                >
                  <SelectTrigger id="permission">
                    <SelectValue placeholder="Select Permission" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="view">View Only</SelectItem>
                    <SelectItem value="edit">Edit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsShareDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={shareResource.isPending}>
                {shareResource.isPending ? 'Sharing...' : 'Share'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
