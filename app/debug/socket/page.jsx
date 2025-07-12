'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getSocket } from '@/lib/socket';
import { useEffect, useState } from 'react';

export default function SocketDebugPage() {
  const [status, setStatus] = useState('disconnected');
  const [socketId, setSocketId] = useState(null);
  const [events, setEvents] = useState([]);
  const [serverInfo, setServerInfo] = useState(null);
  const [error, setError] = useState(null);
  
  // Initialize socket on component mount
  useEffect(() => {
    // Get socket debug info from API
    fetch('/api/debug/socket')
      .then(res => res.json())
      .then(data => {
        setServerInfo(data);
      })
      .catch(err => {
        setError(`API error: ${err.message}`);
      });
      
    // Initialize socket with test user
    const socket = getSocket({
      auth: { 
        userId: 'test-user-' + Date.now().toString().slice(-6),
        token: 'debug-token'
      }
    });
    
    // Socket event listeners
    socket.on('connect', () => {
      setStatus('connected');
      setSocketId(socket.id);
      addEvent('connect', 'Socket connected');
    });
    
    socket.on('disconnect', (reason) => {
      setStatus('disconnected');
      addEvent('disconnect', `Socket disconnected: ${reason}`);
    });
    
    socket.on('connect_error', (err) => {
      setStatus('error');
      setError(`Connection error: ${err.message}`);
      addEvent('connect_error', `Connection error: ${err.message}`);
    });
    
    socket.on('error', (data) => {
      addEvent('error', `Server error: ${JSON.stringify(data)}`);
    });
    
    // Custom test events
    socket.on('test-response', (data) => {
      addEvent('test-response', `Received: ${JSON.stringify(data)}`);
    });
    
    return () => {
      // Clean up listeners
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('error');
      socket.off('test-response');
    };
  }, []);
  
  // Add event to the event log
  const addEvent = (type, message) => {
    setEvents(prev => [
      {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        type,
        message
      },
      ...prev.slice(0, 49) // Keep only last 50 events
    ]);
  };
  
  // Send a test event
  const sendTestEvent = () => {
    const socket = getSocket();
    if (socket && socket.connected) {
      socket.emit('test-event', { timestamp: new Date() });
      addEvent('test-event', 'Sent test event to server');
    } else {
      setError('Socket not connected');
    }
  };
  
  // Join a test mindmap room
  const joinTestMindmap = () => {
    const socket = getSocket();
    if (socket && socket.connected) {
      const mindmapId = 'test-mindmap-' + Date.now().toString().slice(-6);
      socket.emit('join-mindmap', { 
        mindmapId, 
        userId: socket.auth.userId 
      });
      addEvent('join-mindmap', `Joined mindmap: ${mindmapId}`);
    } else {
      setError('Socket not connected');
    }
  };
  
  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold mb-6">Socket.IO Debug</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Socket Status</CardTitle>
            <CardDescription>Current connection status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <span className="font-semibold">Status:</span>
                <span className={`ml-2 inline-block px-2 py-1 rounded text-sm ${
                  status === 'connected' ? 'bg-green-100 text-green-800' :
                  status === 'disconnected' ? 'bg-gray-100 text-gray-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {status}
                </span>
              </div>
              
              {socketId && (
                <div>
                  <span className="font-semibold">Socket ID:</span>
                  <span className="ml-2">{socketId}</span>
                </div>
              )}
              
              {error && (
                <div className="text-red-500">
                  <span className="font-semibold">Error:</span>
                  <span className="ml-2">{error}</span>
                </div>
              )}
              
              <div className="flex gap-2 mt-4">
                <Button onClick={sendTestEvent} disabled={status !== 'connected'}>
                  Send Test Event
                </Button>
                <Button onClick={joinTestMindmap} disabled={status !== 'connected'}>
                  Join Test Mindmap
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Server Info</CardTitle>
            <CardDescription>Socket.IO server details</CardDescription>
          </CardHeader>
          <CardContent>
            {serverInfo ? (
              <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs max-h-80">
                {JSON.stringify(serverInfo, null, 2)}
              </pre>
            ) : (
              <p>Loading server information...</p>
            )}
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Event Log</CardTitle>
            <CardDescription>Recent socket events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
              {events.length === 0 ? (
                <p className="text-gray-500">No events recorded yet</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="pb-2 pr-4">Time</th>
                      <th className="pb-2 pr-4">Type</th>
                      <th className="pb-2">Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map(event => (
                      <tr key={event.id} className="border-b border-gray-200">
                        <td className="py-2 pr-4 text-gray-500">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="py-2 pr-4">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs ${
                            event.type === 'connect' ? 'bg-green-100 text-green-800' :
                            event.type === 'disconnect' ? 'bg-yellow-100 text-yellow-800' :
                            event.type === 'error' || event.type === 'connect_error' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {event.type}
                          </span>
                        </td>
                        <td className="py-2">{event.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
