const WebSocket = require("ws");
const http = require("http");

// Use the port provided by the hosting environment, or fallback to 8080
const port = process.env.PORT || 8080;
const server = http.createServer();
const wss = new WebSocket.Server({ server });

let androidClient = null;
let webClient = null;

wss.on("connection", ws => {
  console.log("New client connected");
  ws.on("message", msg => {
    const data = JSON.parse(msg);
    if (data.type === "register_android") androidClient = ws;
    if (data.type === "register_web") webClient = ws;

    // Forwarding logic...
    if (data.type === "offer" && webClient) webClient.send(msg);
    if (data.type === "answer" && androidClient) androidClient.send(msg);
    if (data.type === "icecandidate") {
      if (ws === androidClient && webClient) webClient.send(msg);
      if (ws === webClient && androidClient) androidClient.send(msg);
    }
  });
});

server.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
