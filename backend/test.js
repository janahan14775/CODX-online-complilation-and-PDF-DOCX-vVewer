const jwt = require('jsonwebtoken');
require('dotenv').config();
const token = jwt.sign({id: 'test'}, process.env.JWT_SECRET || 'Janahan@2006');
fetch('http://localhost:5000/api/run', {
    method: 'POST',
    body: JSON.stringify({code: 'cout << "hello";', language: 'cpp'}),
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
    }
})
.then(r => r.text())
.then(console.log)
.catch(console.error);
