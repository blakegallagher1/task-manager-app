const fs = require('fs');
const path = require('path');
// Data file path outside src directory
const dataFile = path.join(__dirname, '..', 'tasks.json');

function loadTasks() {
  try {
    const data = fs.readFileSync(dataFile, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return {};
  }
}

function saveTasks(tasks) {
  fs.writeFileSync(dataFile, JSON.stringify(tasks, null, 2), 'utf8');
}

module.exports = { loadTasks, saveTasks };
