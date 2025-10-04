"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const wss = new ws_1.WebSocketServer({ port: 8080 });
const subscriptions = {};
wss.on('connection', function connection(userSocket) {
    const id = randomId();
    subscriptions[id] = {
        ws: userSocket,
        rooms: []
    };
    userSocket.on('message', function message(data) {
        var _a;
        const parsedMessage = JSON.parse(data);
        if (parsedMessage.type === "subscribe") {
            (_a = subscriptions[id]) === null || _a === void 0 ? void 0 : _a.rooms.push(parsedMessage.room);
        }
        if (parsedMessage.type === "sendMessage") {
            const roomId = parsedMessage.roomId;
            const message = parsedMessage.message;
            console.log('roomId', roomId);
            console.log('message', message);
            Object.keys(subscriptions).forEach((key) => {
                // @ts-ignore
                const { ws, rooms } = subscriptions[key];
                if (rooms.includes(roomId)) {
                    ws.send(`message from room ${roomId}: ${message}`);
                }
            });
        }
        // console.log('received: %s', data);
        // userSocket.send('hey you sent this message to me: '+ data);
    });
});
function randomId() {
    return Math.random();
}
//# sourceMappingURL=index.js.map