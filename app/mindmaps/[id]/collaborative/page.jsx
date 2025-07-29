'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useRealtimeCollaboration } from '@/lib/realtimeCollaboration';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Share2, Trash2, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { use, useCallback, useEffect, useRef, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Panel,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges
} from 'reactflow';
import 'reactflow/dist/style.css';

// Custom node types
const nodeTypes = {};

export default function CollaborativeMindmapPage({ params }) {
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
  const [userId, setUserId] = useState(null);
  
  // Fetch user info
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await fetch('/api/auth/session');
        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            setUserId(data.user.id);
          }
        }
      } catch (error) {
        console.error('Failed to fetch user info:', error);
      }
    };
    
    fetchUserInfo();
  }, []);
  
  // Real-time collaboration
  // This hook manages real-time collaboration features like adding, updating, and deleting nodes and edges
  const {
    connected,
    activeUsers,
    error: collabError,
    addNode: addNodeRealtime,
    updateNode: updateNodeRealtime,
    deleteNode: deleteNodeRealtime,
    addEdge: addEdgeRealtime,
    updateEdge: updateEdgeRealtime,
    deleteEdge: deleteEdgeRealtime,
    subscribeToChanges,
  } = useRealtimeCollaboration(mindmapId, userId);
  
  // Subscribe to real-time collaboration events
  useEffect(() => {
    if (!userId) return;
    
    const unsubscribe = subscribeToChanges({
      onNodeAdded: (node) => {
        setNodes((nodes) => [...nodes, node]);
        toast({ title: 'Node added by collaborator', duration: 2000 });
      },
      onNodeUpdated: (nodeId, updates) => {
        setNodes((nodes) => 
          nodes.map((node) => 
            node.id === nodeId ? { ...node, ...updates } : node
          )
        );
      },
      onNodeDeleted: (nodeId) => {
        setNodes((nodes) => nodes.filter((node) => node.id !== nodeId));
        toast({ title: 'Node deleted by collaborator', duration: 2000 });
      },
      onEdgeAdded: (edge) => {
        setEdges((edges) => [...edges, edge]);
      },
      onEdgeUpdated: (edgeId, updates) => {
        setEdges((edges) => 
          edges.map((edge) => 
            edge.id === edgeId ? { ...edge, ...updates } : edge
          )
        );
      },
      onEdgeDeleted: (edgeId) => {
        setEdges((edges) => edges.filter((edge) => edge.id !== edgeId));
      },
    });
    
    return unsubscribe;
  }, [userId, subscribeToChanges, toast]);
  
  // Show connection status
  useEffect(() => {
    if (connected) {
      toast({ 
        title: 'Connected to collaboration server', 
        description: 'You can now collaborate in real-time',
        duration: 3000 
      });
    }
  }, [connected, toast]);
  
  // Show error if connection fails
  useEffect(() => {
    if (collabError) {
      toast({ 
        title: 'Collaboration error', 
        description: collabError,
        variant: 'destructive',
        duration: 5000 
      });
    }
  }, [collabError, toast]);
  
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
  
  // Handle node changes with real-time sync
  const onNodesChange = useCallback((changes) => {
    changes.forEach(change => {
      if (change.type === 'add' && change.item) {
        addNodeRealtime(change.item);
      } else if (change.type === 'remove' && change.id) {
        deleteNodeRealtime(change.id);
      } else if (change.type === 'position' && change.id && change.position) {
        updateNodeRealtime(change.id, { position: change.position });
      }
    });
    
    setNodes((nds) => applyNodeChanges(changes, nds));
  }, [addNodeRealtime, updateNodeRealtime, deleteNodeRealtime]);
  
  // Handle edge changes with real-time sync
  const onEdgesChange = useCallback((changes) => {
    changes.forEach(change => {
      if (change.type === 'remove' && change.id) {
        deleteEdgeRealtime(change.id);
      }
    });
    
    setEdges((eds) => applyEdgeChanges(changes, eds));
  }, [deleteEdgeRealtime]);
  
  // Handle connections with real-time sync
  const onConnect = useCallback((connection) => {
    const newEdge = {
      ...connection,
      id: `edge-${connection.source}-${connection.target}`,
    };
    addEdgeRealtime(newEdge);
    setEdges((eds) => addEdge(connection, eds));
  }, [addEdgeRealtime]);
  
  // Add new node with real-time sync
  const addNode = () => {
    const newId = `node-${Date.now()}`;
    const newNode = {
      id: newId,
      type: 'default',
      data: { label: 'New Node' },
      position: {
        x: Math.random() * 400,
        y: Math.random() * 400,
      },
    };
    
    addNodeRealtime(newNode);
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
          {/* Collaborators Panel */}
          <Button variant="outline" size="sm" className="flex items-center">
            <Users className="h-4 w-4 mr-2" />
            {activeUsers?.length || 0} {activeUsers?.length === 1 ? 'User' : 'Users'}
            {connected && <span className="h-2 w-2 bg-green-500 rounded-full ml-2"></span>}
          </Button>
          
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
          <Panel position="bottom-left">
            {connected ? (
              <Badge variant="outline" className="bg-green-100">
                <span className="h-2 w-2 bg-green-500 rounded-full mr-2"></span>
                Connected
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-red-100">
                <span className="h-2 w-2 bg-red-500 rounded-full mr-2"></span>
                Disconnected
              </Badge>
            )}
          </Panel>
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
