const WebSocket = require("ws");
const http = require("http");

const port = process.env.PORT || 10000;
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
            console.log("Received:", data.type, "from", ws === androidClient ? "Android" : "Web");
                // ---- TOUCH FORWARDING (ADD ONLY THIS) ----
                // ---- TOUCH FORWARDING ----
                if (data.type === "touch") {
                    if (androidClient && androidClient.readyState === WebSocket.OPEN) {
                        androidClient.send(msg.toString());
                        console.log("Touch forwarded to Android", data);
                    } else {
                        console.log("Android not connected for touch");
                    }
                    return;
                }

            //scroll
            if (data.type === "scroll") {
                if (androidClient && androidClient.readyState === WebSocket.OPEN) {
                    androidClient.send(msg.toString());
                    console.log("Scroll forwarded to Android", data);
                }
                return;
            }
            
            // Register clients
            if (data.type === "register_android") {
                androidClient = ws;
                console.log("Android client registered");
            }
            
            if (data.type === "register_web") {
                webClient = ws;
                console.log("Web client registered");
            }

            // IMPORTANT: Forward request_offer from web to android
            if (data.type === "request_offer" && androidClient) {
                console.log("Forwarding request_offer to Android");
                androidClient.send(msg.toString());
            }

            // Forward signaling messages
            if (data.type === "offer" && webClient) {
                console.log("Forwarding offer to Web");
                webClient.send(msg.toString());
            }
            
            if (data.type === "answer" && androidClient) {
                console.log("Forwarding answer to Android");
                androidClient.send(msg.toString());
            }
            
            if (data.type === "icecandidate") {
                if (ws === androidClient && webClient) {
                    console.log("Forwarding ICE candidate from Android to Web");
                    webClient.send(msg.toString());
                }
                if (ws === webClient && androidClient) {
                    console.log("Forwarding ICE candidate from Web to Android");
                    androidClient.send(msg.toString());
                }
            }
        } catch (e) {
            console.error("Error parsing message:", e);
        }
    });

    ws.on("close", () => {
        if (ws === androidClient) {
            console.log("Android client disconnected");
            androidClient = null;
        }
        if (ws === webClient) {
            console.log("Web client disconnected");
            webClient = null;
        }
    });

    ws.on("error", (error) => {
        console.error("WebSocket error:", error);
    });
});

server.listen(port, "0.0.0.0", () => {
    console.log(`Signaling Server listening on port ${port}`);
});


