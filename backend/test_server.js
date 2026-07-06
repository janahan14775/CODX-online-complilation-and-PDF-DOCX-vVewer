const fetch = require('node-fetch') || global.fetch;
fetch('http://localhost:5000/api/run', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({code: 'print("hello")', language: 'python'})
})
.then(r => r.text())
.then(console.log)
.catch(console.error);
