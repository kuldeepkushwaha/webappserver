const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 8080 });

let androidSocket = null;
let webSocket = null;

wss.on("connection", (ws) => {

    ws.on("message", (data) => {
        const msg = JSON.parse(data.toString());

        // ---- REGISTER CLIENT ----
        if (msg.type === "register") {
            if (msg.role === "android") {
                androidSocket = ws;
                console.log("Android connected");
            } else if (msg.role === "web") {
                webSocket = ws;
                console.log("Web connected");
            }
            return;
        }

        // ---- TOUCH : WEB → ANDROID ONLY ----
        if (msg.type === "touch") {
            if (androidSocket && androidSocket.readyState === WebSocket.OPEN) {
                androidSocket.send(JSON.stringify(msg));
                console.log("Touch forwarded to Android:", msg);
            } else {
                console.log("Android socket not connected");
            }
            return;
        }

        // ---- WEBRTC SIGNALS ----
        if (ws === androidSocket && webSocket) {
            webSocket.send(JSON.stringify(msg));
        } else if (ws === webSocket && androidSocket) {
            androidSocket.send(JSON.stringify(msg));
        }
    });

    ws.on("close", () => {
        if (ws === androidSocket) androidSocket = null;
        if (ws === webSocket) webSocket = null;
    });
});

console.log("Signaling server running on ws://localhost:8080");
