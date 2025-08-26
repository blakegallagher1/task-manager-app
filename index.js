const http = require('http');
const url = require('url');

let tasks = {};
let currentId = 1;

function sendResponse(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const method = req.method;
  const path = parsedUrl.pathname;

  if (method === 'GET' && path === '/') {
    sendResponse(res, 200, { message: 'Task Manager API is running' });
  } else if (method === 'GET' && path === '/tasks') {
    const tasksArray = Object.entries(tasks).map(([id, task]) => ({ id: Number(id), ...task }));
    sendResponse(res, 200, tasksArray);
  } else if (method === 'POST' && path === '/tasks') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const taskData = JSON.parse(body);
        if (!taskData.title || !taskData.description) {
          sendResponse(res, 400, { error: 'Title and description are required' });
          return;
        }
        const id = currentId++;
        tasks[id] = { title: taskData.title, description: taskData.description, completed: false };
        sendResponse(res, 201, { id, ...tasks[id] });
      } catch (e) {
        sendResponse(res, 400, { error: 'Invalid JSON' });
      }
    });
  } else if (path.startsWith('/tasks/') && ['GET', 'PUT', 'DELETE'].includes(method)) {
    const id = path.split('/')[2];
    if (!tasks[id]) {
      sendResponse(res, 404, { error: 'Task not found' });
      return;
    }
    if (method === 'GET') {
      sendResponse(res, 200, { id: Number(id), ...tasks[id] });
    } else if (method === 'PUT') {
      let body = '';
      req.on('data', chunk => { body += chunk.toString(); });
      req.on('end', () => {
        try {
          const updates = JSON.parse(body);
          tasks[id] = { ...tasks[id], ...updates };
          sendResponse(res, 200, { id: Number(id), ...tasks[id] });
        } catch (e) {
          sendResponse(res, 400, { error: 'Invalid JSON' });
        }
      });
    } else if (method === 'DELETE') {
      delete tasks[id];
      sendResponse(res, 204, {});
    }
  } else {
    sendResponse(res, 404, { error: 'Not found' });
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
