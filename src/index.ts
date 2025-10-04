import { WebSocketServer, WebSocket } from 'ws';
import { createClient } from 'redis';


const publishClient=createClient();
publishClient.connect();

const subscribeClient=createClient();
subscribeClient.connect();



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
        if(oneUserSubscribedToRoom(parsedMessage.room)){
            console.log("Subscribing to room ", parsedMessage.room);
            subscribeClient.subscribe(parsedMessage.room, (message)=>{
                const parsedMessage=JSON.parse(message);
                Object.keys(subscriptions).forEach((userId)=>{
                    // @ts-ignore
                    const {ws,rooms}=subscriptions[userId];
                    if(rooms.includes(parsedMessage.roomId)){
                        ws.send(parsedMessage.message);
                    }
                })
            })
        }
    }
    if(parsedMessage.type==="unsubscribe"){
        const roomToLeave=parsedMessage.room;
        // @ts-ignore
        subscriptions[id].rooms = subscriptions[id].rooms.filter((room)=>room!==roomToLeave);
        if(lastPersonLeftRoom(roomToLeave)){
            console.log("unsubscribing from room ", roomToLeave);
            subscribeClient.unsubscribe(roomToLeave);
        }
    }
    if(parsedMessage.type==="sendMessage"){
        const roomId=parsedMessage.roomId;
        const message=parsedMessage.message;
        
        publishClient.publish(roomId, JSON.stringify({
            type:"sendMessage",
            roomId: roomId,
            message: message
        }))
    }
  });
});

function randomId(){
    return Math.random();
}


function oneUserSubscribedToRoom(roomId: string){
    let totalInterestedPeople=0;
    Object.keys(subscriptions).map(userId=>{
        // @ts-ignore
        if(subscriptions[userId].rooms.includes(roomId)){
            totalInterestedPeople+=1;
        }
    })
    if(totalInterestedPeople===1){
        return true;
    }   
    return false;
}

function lastPersonLeftRoom(roomId: string){
    let totalInterestedPeople=0;
    Object.keys(subscriptions).map(userId=>{
        // @ts-ignore
        if(subscriptions[userId].rooms.includes(roomId)){
            totalInterestedPeople+=1;
        }
    })
    if(totalInterestedPeople===0){
        return true;
    }
    return false;
}