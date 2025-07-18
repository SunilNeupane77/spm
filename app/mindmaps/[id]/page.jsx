'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Share2, Trash2, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { use, useCallback, useEffect, useRef, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges
} from 'reactflow';
import 'reactflow/dist/style.css';

// Custom node types
const nodeTypes = {};

export default function MindmapDetail({ params }) {
  const unwrappedParams = use(params);
  const mindmapId = unwrappedParams.id;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  
  // State for nodes and edges
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [sharePermission, setSharePermission] = useState('view');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Fetch mindmap data
  const { data: mindmap, isLoading, error } = useQuery({
    queryKey: ['mindmaps', mindmapId],
    queryFn: async () => {
      const response = await fetch(`/api/mindmaps/${mindmapId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch mindmap');
      }
      return response.json();
    },
    refetchOnWindowFocus: false,
  });
  
  // Update mindmap mutation
  const updateMindmap = useMutation({
    mutationFn: async ({ nodes, edges }) => {
      const response = await fetch(`/api/mindmaps/${mindmapId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nodes,
          edges,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update mindmap');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Mindmap saved',
        description: 'Your changes have been saved successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['mindmaps', mindmapId] });
    },
    onError: (error) => {
      toast({
        title: 'Error saving mindmap',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Share mindmap mutation
  // This mutation handles sharing the mindmap with another user
  const shareMindmap = useMutation({
    mutationFn: async ({ email, permission }) => {
      const response = await fetch(`/api/mindmaps/${mindmapId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          permission,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to share mindmap');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Mindmap shared',
        description: `The mindmap has been shared with ${shareEmail}`,
      });
      setIsShareDialogOpen(false);
      setShareEmail('');
      queryClient.invalidateQueries({ queryKey: ['mindmaps', mindmapId] });
    },
    onError: (error) => {
      toast({
        title: 'Error sharing mindmap',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Delete mindmap mutation
  const deleteMindmap = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/mindmaps/${mindmapId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete mindmap');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Mindmap deleted',
        description: 'The mindmap has been deleted successfully',
      });
      router.push('/mindmaps');
      queryClient.invalidateQueries({ queryKey: ['mindmaps'] });
    },
    onError: (error) => {
      toast({
        title: 'Error deleting mindmap',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Initialize mindmap data
  useEffect(() => {
    if (mindmap) {
      if (mindmap.nodes && mindmap.nodes.length > 0) {
        setNodes(mindmap.nodes);
      } else {
        // Create default node if mindmap is empty
        setNodes([
          {
            id: '1',
            type: 'default',
            data: { label: mindmap.title || 'Main Idea' },
            position: { x: 250, y: 100 },
          },
        ]);
      }
      
      if (mindmap.edges && mindmap.edges.length > 0) {
        setEdges(mindmap.edges);
      }
    }
  }, [mindmap]);
  
  // Save current mindmap state
  const handleSave = () => {
    updateMindmap.mutate({ nodes, edges });
  };
  
  // Share mindmap with another user
  const handleShare = () => {
    if (!shareEmail) return;
    
    shareMindmap.mutate({
      email: shareEmail,
      permission: sharePermission,
    });
  };
  
  // Handle node changes
  const onNodesChange = useCallback((changes) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
  }, []);
  
  // Handle edge changes
  const onEdgesChange = useCallback((changes) => {
    setEdges((eds) => applyEdgeChanges(changes, eds));
  }, []);
  
  // Handle connections
  const onConnect = useCallback((connection) => {
    setEdges((eds) => addEdge(connection, eds));
  }, []);
  
  // Handle adding a new node
  const addNode = () => {
    const newId = (nodes.length + 1).toString();
    const newNode = {
      id: newId,
      type: 'default',
      data: { label: 'New Node' },
      position: {
        x: Math.random() * 400,
        y: Math.random() * 400,
      },
    };
    
    setNodes((nds) => [...nds, newNode]);
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[600px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6 text-center">
          <h2 className="text-xl font-semibold text-red-500">Error loading mindmap</h2>
          <p className="mt-2">{error.message}</p>
          <Button onClick={() => router.push('/mindmaps')} className="mt-4">
            Back to Mind Maps
          </Button>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold ml-2">{mindmap?.title}</h1>
          {mindmap?.course && (
            <Badge className="ml-2" style={{ backgroundColor: mindmap.course.color || undefined }}>
              {mindmap.course.code}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={addNode}>
            Add Node
          </Button>
          <Button variant="outline" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
          <Button variant="outline" onClick={() => setIsShareDialogOpen(true)}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" onClick={() => router.push(`/mindmaps/${mindmapId}/collaborative`)}>
            <Users className="h-4 w-4 mr-2" />
            Collaborate
          </Button>
          <Button variant="outline" onClick={() => setIsDeleteDialogOpen(true)}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>
      
      <div ref={reactFlowWrapper} className="h-[700px] border rounded-lg">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          onInit={setReactFlowInstance}
          fitView
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>
      
      {/* Share Dialog */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Mind Map</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                placeholder="Enter email address"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="permission">Permission</Label>
              <Select
                value={sharePermission}
                onValueChange={setSharePermission}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select permission" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">View only</SelectItem>
                  <SelectItem value="edit">Edit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsShareDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleShare} disabled={!shareEmail || shareMindmap.isPending}>
              {shareMindmap.isPending ? 'Sharing...' : 'Share'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Mind Map</DialogTitle>
          </DialogHeader>
          <p className="py-4">Are you sure you want to delete this mind map? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => deleteMindmap.mutate()} disabled={deleteMindmap.isPending}>
              {deleteMindmap.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
