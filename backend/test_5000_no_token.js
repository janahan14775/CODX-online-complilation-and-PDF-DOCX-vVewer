const fetch = require('node-fetch') || global.fetch;
fetch('http://localhost:5000/api/run', {
    method:'POST',
    body:JSON.stringify({code:'cout << "hello";', language: 'cpp'}),
    headers:{
        'Content-Type':'application/json'
    }
}).then(r=>r.text()).then(console.log).catch(console.error);
