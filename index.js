const http = require('http');
const url = require('url');
const { simulatePortfolio, generateActionPlan, generatePillarRecommendations } = require('./src/simulator.js');
const { loadTasks, saveTasks } = require('./src/storage.js');

// Load existing tasks from storage and set currentId
let tasks = loadTasks();
let currentId = Object.keys(tasks).length ? Math.max(...Object.keys(tasks).map(id => parseInt(id))) + 1 : 1;

function sendResponse(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const method = req.method;
  const path = parsedUrl.pathname;

  if (method === 'GET' && path === '/') {
    sendResponse(res, 200, { message: 'Legacy Vision API is running' });
  } else if (method === 'POST' && path === '/simulate') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const portfolio = data.portfolio || {};
        const risk = data.riskTolerance || 'medium';
        const horizon = data.horizonYears || 20;
        const trials = data.trials || 500;
        const sim = simulatePortfolio(portfolio, risk, horizon, trials);
        const plan = generateActionPlan(risk);
        const recs = generatePillarRecommendations(portfolio, risk);
        sendResponse(res, 200, { summary: sim.summary, plan, recommendations: recs });
      } catch (e) {
        sendResponse(res, 400, { error: 'Invalid JSON' });
      }
    });
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
        tasks[id] = taskData;
        saveTasks(tasks);
        sendResponse(res, 201, { id, ...taskData });
      } catch (e) {
        sendResponse(res, 400, { error: 'Invalid JSON' });
      }
    });
  } else if (method === 'GET' && /^\/tasks\/\d+$/.test(path)) {
    const id = path.split('/')[2];
    const task = tasks[id];
    if (task) {
      sendResponse(res, 200, { id: Number(id), ...task });
    } else {
      sendResponse(res, 404, { error: 'Task not found' });
    }
  } else if (method === 'PUT' && /^\/tasks\/\d+$/.test(path)) {
    const id = path.split('/')[2];
    if (!tasks[id]) {
      sendResponse(res, 404, { error: 'Task not found' });
      return;
    }
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const taskData = JSON.parse(body);
        if (!taskData.title || !taskData.description) {
          sendResponse(res, 400, { error: 'Title and description are required' });
          return;
        }
        tasks[id] = taskData;
        saveTasks(tasks);
        sendResponse(res, 200, { id: Number(id), ...taskData });
      } catch (e) {
        sendResponse(res, 400, { error: 'Invalid JSON' });
      }
    });
  } else if (method === 'DELETE' && /^\/tasks\/\d+$/.test(path)) {
    const id = path.split('/')[2];
    if (tasks[id]) {
      delete tasks[id];
      saveTasks(tasks);
      sendResponse(res, 200, { message: 'Task deleted' });
    } else {
      sendResponse(res, 404, { error: 'Task not found' });
    }
  } else {
    sendResponse(res, 404, { error: 'Not found' });
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
