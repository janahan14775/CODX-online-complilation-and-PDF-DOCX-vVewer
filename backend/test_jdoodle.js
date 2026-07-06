require('dotenv').config();
const fetch = require('node-fetch') || global.fetch; // Node 18+ has global fetch
const payload = {
  clientId: process.env.JDOODLE_CLIENT_ID,
  clientSecret: process.env.JDOODLE_CLIENT_SECRET,
  script: "#include <stdio.h>\nint main(){printf(\"hello world\"); return 0;}",
  language: "c",
  versionIndex: "5"
};
fetch('https://api.jdoodle.com/v1/execute', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
