import { WebSocketServer, WebSocket } from 'ws';

let wss: WebSocketServer;

export const initializeWebSocket = (server: any) => {
  try {
    wss = new WebSocketServer({ server });
    console.log('WebSocket server initialized.');

    wss.on('connection', (ws: WebSocket, req) => { // Added 'req' for request details
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
      // Send a test message immediately to see if it goes through
      try {
        ws.send(JSON.stringify({ status: 'connected', message: 'Welcome!' }));
        console.log('Sent welcome message to client.');
      } catch (sendError) {
        console.error('Error sending welcome message:', sendError);
      }
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
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
};
