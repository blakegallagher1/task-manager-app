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
        const risk = data.risk || 'medium';
        const simulationResults = simulatePortfolio(portfolio, risk, 20, 1000);
        const plan = generateActionPlan(risk);
        const recs = generatePillarRecommendations(portfolio, risk);
        const summary = {
          averageIRR: simulationResults.averageIRR,
          irrs: simulationResults.irrs,
          multiples: simulationResults.multiples,
          bestMultiple: simulationResults.bestMultiple,
          worstMultiple: simulationResults.worstMultiple,
          meanMultiple: simulationResults.meanMultiple
        };
        sendResponse(res, 200, { summary, actionPlan: plan, recommendations: recs });
      } catch (err) {
        sendResponse(res, 400, { error: 'Invalid JSON' });
      }
    });
  } else if (method === 'GET' && path === '/tasks') {
    sendResponse(res, 200, Object.values(tasks));
  } else if (method === 'GET' && path.startsWith('/tasks/')) {
    const id = path.split('/')[2];
    const task = tasks[id];
    if (task) {
      sendResponse(res, 200, task);
    } else {
      sendResponse(res, 404, { error: 'Task not found' });
    }
  } else if (method === 'POST' && path === '/tasks') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const id = currentId++;
        const task = { id, ...data };
        tasks[id] = task;
        saveTasks(tasks);
        sendResponse(res, 201, task);
      } catch (err) {
        sendResponse(res, 400, { error: 'Invalid JSON' });
      }
    });
  } else if (method === 'PUT' && path.startsWith('/tasks/')) {
    const id = path.split('/')[2];
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        if (tasks[id]) {
          tasks[id] = { id: parseInt(id), ...data };
          saveTasks(tasks);
          sendResponse(res, 200, tasks[id]);
        } else {
          sendResponse(res, 404, { error: 'Task not found' });
        }
      } catch (err) {
        sendResponse(res, 400, { error: 'Invalid JSON' });
      }
    });
  } else if (method === 'DELETE' && path.startsWith('/tasks/')) {
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
  console.log(`Server running on port ${PORT}`);
});
