// Firstly we'll need to import the fs library
var fs = require('fs');
const path = require('path');

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const currentMonth = monthNames[new Date().getMonth()];
// iso string and a \n newline character
const info = function (msg, id) {
  var message = new Date().toISOString() + ' : ' + JSON.stringify(msg) + ' : ' + id + '\n';
  if (!fs.existsSync('logger/' + currentMonth + '-info.txt')) {
    fs.createWriteStream('logger/' + currentMonth + '-info.txt');
  }
  fs.appendFile('logger/' + currentMonth + '-info.txt', message, (err) => {
  });
};

const debug = function (msg, id) {
  var message = new Date().toISOString() + ' : ' + JSON.stringify(msg) + ' : ' + id + '\n';
  if (!fs.existsSync('logger/' + currentMonth + '-debug.txt')) {
    fs.createWriteStream('logger/' + currentMonth + '-debug.txt');
  }
  fs.appendFileSync('logger/' + currentMonth + '-debug.txt', message);
};

const error = function (msg, id) {
  var message = new Date().toISOString() + ' : ' + JSON.stringify(msg) + ' : ' + id + '\n';
  if (!fs.existsSync('logger/' + currentMonth + '-error.txt')) {
    fs.createWriteStream('logger/' + currentMonth + '-error.txt');
  }
  fs.appendFileSync('logger/' + currentMonth + '-error.txt', message);
};

const projectError = function (msg, id) {
  var message = new Date().toISOString() + ' : ' + JSON.stringify(msg) + ' : ' + id + '\n';
  const logDirectory = path.join(__dirname, '../projectLogger');
  if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory, { recursive: true });
  }
  if (!fs.existsSync('projectLogger/' + currentMonth + '-error.txt')) {
    fs.createWriteStream('projectLogger/' + currentMonth + '-error.txt');
  }
  fs.appendFileSync('projectLogger/' + currentMonth + '-error.txt', message);
};
module.exports = {
  info,
  debug,
  error,
  projectError
};
