const WebSocket = require("ws");
const http = require("http");

const port = process.env.PORT || 8080;
const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end("Signaling Server is Running");
});

const wss = new WebSocket.Server({ server });
let androidClient = null;
let webClient = null;

wss.on("connection", (ws) => {
    console.log("New connection established");

    ws.on("message", (msg) => {
        try {
            const data = JSON.parse(msg);
            console.log("Received:", data.type);

            if (data.type === "register_android") androidClient = ws;
            if (data.type === "register_web") webClient = ws;

            // Forward signaling messages
            if (data.type === "offer" && webClient) webClient.send(msg.toString());
            if (data.type === "answer" && androidClient) androidClient.send(msg.toString());
            if (data.type === "icecandidate") {
                if (ws === androidClient && webClient) webClient.send(msg.toString());
                if (ws === webClient && androidClient) androidClient.send(msg.toString());
            }
        } catch (e) {
            console.error("Error parsing message:", e);
        }
    });

    ws.on("close", () => {
        if (ws === androidClient) androidClient = null;
        if (ws === webClient) webClient = null;
    });
});

server.listen(port, () => console.log(`Server listening on port ${port}`));
