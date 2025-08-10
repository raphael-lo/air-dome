import { WebSocketServer, WebSocket } from 'ws';

let wss: WebSocketServer;

export const initializeWebSocket = (server: any) => {
  wss = new WebSocketServer({ server });

  wss.on('connection', (ws: WebSocket) => {
    console.log('Client connected');
    ws.on('close', () => {
      console.log('Client disconnected');
    });
  });
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
