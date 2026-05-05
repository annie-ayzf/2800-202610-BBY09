// const http = require("http");

// const PORT = process.env.PORT || 3000;

// const requestHandler = (req, res) => {
//   res.writeHead(200, { "Content-Type": "text/plain" });
//   res.end("Hello, world!");
// };

// const server = http.createServer(requestHandler);

// server.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });


const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;

// Serve everything inside /public
app.use(express.static(__dirname + '/public'));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
