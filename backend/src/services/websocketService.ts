import { WebSocketServer, WebSocket } from 'ws';

let wss: WebSocketServer;

export const initializeWebSocket = (server: any) => {
  try {
    wss = new WebSocketServer({ server });
    console.log('WebSocket server initialized.');

    wss.on('connection', (ws: WebSocket, req) => {
      console.log('Client connected to WebSocket from IP:', req.socket.remoteAddress);
      ws.on('message', (message) => {
        console.log('Received message from client:', message.toString());
      });
      ws.on('close', (code, reason) => {
        console.log(`Client disconnected from WebSocket: Code ${code}, Reason: ${reason ? reason.toString() : 'N/A'}`);
      });
      ws.on('error', (error) => {
        console.error('WebSocket client error:', error);
      });
      ws.send(JSON.stringify({ status: 'connected', message: 'Welcome!' }));
    });

    wss.on('error', (error) => {
      console.error('WebSocket server error:', error);
    });

  } catch (error) {
    console.error('Failed to initialize WebSocket server:', error);
  }
};

export const broadcast = (data: any) => {
  if (!wss) {
    console.log('[Broadcast] WebSocket server not initialized. Skipping broadcast.');
    return;
  }

  const clientCount = wss.clients.size;
  console.log(`[Broadcast] Attempting to broadcast to ${clientCount} client(s).`);

  if (clientCount === 0) {
    return;
  }

  wss.clients.forEach((client) => {
    console.log(`[Broadcast] Checking client. ReadyState: ${client.readyState}`);
    if (client.readyState === WebSocket.OPEN) {
      try {
        const jsonData = JSON.stringify(data);
        client.send(jsonData);
        console.log(`[Broadcast] Sent data to client: ${jsonData}`);
      } catch (error) {
        console.error('[Broadcast] Error sending data to client:', error);
      }
    } else {
      console.log('[Broadcast] Client not open. Skipping.');
    }
  });
};