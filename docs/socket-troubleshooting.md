# Socket.IO Real-Time Collaboration Troubleshooting Guide

This document provides guidance for troubleshooting issues with the Socket.IO real-time collaboration feature.

## Common Error: "io is not a function"

This error typically occurs when there's an issue with how Socket.IO is imported. The error message `TypeError: (0 , __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$socket$2e$io$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__.io) is not a function` indicates that the Socket.IO client library is not being properly imported.

### Fix:

1. **Correct Import**: Use the default import for socket.io-client:
   ```javascript
   // INCORRECT:
   import { io } from 'socket.io-client';
   
   // CORRECT:
   import io from 'socket.io-client';
   ```

2. **Use the Socket Module**: Prefer using our socket.js module which properly handles the socket lifecycle:
   ```javascript
   import { getSocket, initializeSocket } from '@/lib/socket';
   
   // Get or initialize a socket
   const socket = getSocket({
     auth: { userId: 'user123' }
   });
   ```

## Connection Issues

If your Socket.IO connections are failing to establish:

1. **Check the Server Route**: Ensure the Socket.IO server is properly initialized in `/app/api/socket/route.js`.

2. **Check Network Tab**: Look in your browser's developer tools network tab for socket connection attempts.

3. **Enable Debug Mode**: Add this code to see detailed Socket.IO logs:
   ```javascript
   // Add to your client code before initializing the socket
   localStorage.debug = '*';
   ```

4. **Verify Middleware**: Make sure authentication middleware isn't blocking connections.

## Real-Time Update Issues

If real-time updates aren't working correctly:

1. **Room Joining**: Verify that clients are properly joining rooms:
   ```javascript
   socket.emit('join-mindmap', { mindmapId, userId });
   ```

2. **Event Listeners**: Ensure all event listeners are properly set up and not being removed prematurely.

3. **Event Emission**: Check that events are being emitted with the correct payload structure.

## Performance Optimization

To improve Socket.IO performance:

1. **Debounce Updates**: Use debouncing for frequent updates to reduce network traffic.

2. **Targeted Events**: Send updates only to relevant users instead of broadcasting to everyone.

3. **Binary Data**: Consider using binary transmission for large data payloads.

## Server Errors

If you're seeing server-side Socket.IO errors:

1. **Check Logs**: Look for error messages in the server console.

2. **Middleware Errors**: Verify authentication middleware is working correctly.

3. **Memory Leaks**: Make sure to clean up socket connections and remove event listeners.

## Client Disconnections

If clients are frequently disconnecting:

1. **Connection Options**: Adjust reconnection settings:
   ```javascript
   const socket = io({
     reconnectionAttempts: 5,
     reconnectionDelay: 1000,
     timeout: 10000
   });
   ```

2. **Network Issues**: Check for network instability or firewall issues.

3. **Server Load**: Ensure the server isn't overloaded, which can cause connection drops.
