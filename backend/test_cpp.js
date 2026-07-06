const payload = {
  clientId: '9f4385c874ac89bb0390ff1cf9a549e6',
  clientSecret: 'b8d629116fd29fcb92c0a7f3c6e143d24e4293ccc650742d594b29f4e0afdc33',
  script: "#include <iostream>\nint main(){std::cout << \"hello world\"; return 0;}",
  language: "cpp",
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
