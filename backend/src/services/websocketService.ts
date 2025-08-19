import { WebSocketServer, WebSocket } from 'ws';

let wss: WebSocketServer;

export const initializeWebSocket = (server: any) => {
  try {
    wss = new WebSocketServer({ server });

    wss.on('connection', (ws: WebSocket, req) => {
      ws.on('message', (message) => {
      });
      ws.on('close', (code, reason) => {
      });
      ws.on('error', (error) => {
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
    return;
  }

  const clientCount = wss.clients.size;

  if (clientCount === 0) {
    return;
  }

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        const jsonData = JSON.stringify(data);
        client.send(jsonData);
      } catch (error) {
        console.error('[Broadcast] Error sending data to client:', error);
      }
    } else {
    }
  });
};