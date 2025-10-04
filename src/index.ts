import { WebSocketServer, WebSocket } from 'ws';

const wss = new WebSocketServer({ port: 8080 });

const subscriptions: {[key:string]: {
    ws : WebSocket,
    rooms: string[]
}} = {}


wss.on('connection', function connection(userSocket) {
  const id=randomId();
  subscriptions[id]={
    ws:userSocket,
    rooms:[]
  }

  userSocket.on('message', function message(data) {
    const parsedMessage = JSON.parse(data as unknown as string);
    if(parsedMessage.type==="subscribe"){
        subscriptions[id]?.rooms.push(parsedMessage.room);
    }
    if(parsedMessage.type==="sendMessage"){
        const roomId=parsedMessage.roomId;
        const message=parsedMessage.message;
        console.log('roomId', roomId);
        console.log('message', message);
        Object.keys(subscriptions).forEach((key)=>{
            // @ts-ignore
            const {ws, rooms}=subscriptions[key];
            if(rooms.includes(roomId)){
                ws.send(`message from room ${roomId}: ${message}`);
            }
        });
    }
    // console.log('received: %s', data);
    // userSocket.send('hey you sent this message to me: '+ data);
  });
});

function randomId(){
    return Math.random();
}