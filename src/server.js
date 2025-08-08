const https = require('https');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const { getStorage } = require('./storage'); // 使用可插拔存储

const storage = getStorage();

const server = https.createServer({
  // 生产环境使用 Let's Encrypt 证书（Render 自动处理，此处留空）
}, (req, res) => {
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not a WebSocket endpoint' }));
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  ws.on('message', (data) => {
    try {
      const { action, key, value, token } = JSON.parse(data.toString());
      
      // 简单认证（生产环境应使用 JWT）
      if (token !== process.env.API_TOKEN) {
        ws.send(JSON.stringify({ status: 'error', message: 'Unauthorized' }));
        return;
      }

      switch (action) {
        case 'set':
          storage.set(key, value);
          ws.send(JSON.stringify({ status: 'success', action: 'set', key }));
          break;
          
        case 'get':
          const result = storage.has(key) 
            ? { value: storage.get(key) } 
            : { error: 'Key not found' };
          ws.send(JSON.stringify({ status: 'success', action: 'get', key, ...result }));
          break;
          
        case 'delete':
          const deleted = storage.delete(key);
          ws.send(JSON.stringify({ 
            status: 'success', 
            action: 'delete', 
            key,
            result: deleted ? 'deleted' : 'not_found' 
          }));
          break;
          
        default:
          ws.send(JSON.stringify({ status: 'error', message: 'Invalid action' }));
      }
    } catch (e) {
      ws.send(JSON.stringify({ status: 'error', message: 'Invalid JSON format' }));
    }
  });
});

// Render 需要监听 0.0.0.0 和动态端口
const PORT = process.env.PORT || 8443;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`WSS Cloud Variables Server running on wss://0.0.0.0:${PORT}`);
});
