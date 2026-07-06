const token = require('jsonwebtoken').sign({id: 'test'}, 'Janahan@2006');
global.fetch('http://localhost:5002/api/run', {
    method:'POST',
    body:JSON.stringify({code:'cout << "hello";', language: 'cpp'}),
    headers:{
        'Content-Type':'application/json',
        'Authorization': 'Bearer '+token
    }
}).then(r=>r.text()).then(console.log).catch(console.error);
