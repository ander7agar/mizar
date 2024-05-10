import {ServerMessage, ServerPort} from 'common/interfaces';
import { Server, ServerParams } from '../libs/Server';

const server = new Server(process);
let serverTimer: NodeJS.Timer;

process.on('message', (message: {event: string; ports: ServerPort[]; params: ServerParams, messages: ServerMessage[]}) => {
   switch (message.event) {
      case 'start':
         server.setPorts(message.ports);
         server.startServer(message.params);
         server.setMessages(message.messages)

         if (serverTimer === undefined) {
            serverTimer = setInterval(() => {
               server.getReports();
            }, 200);
         }
         break;
      case 'stop':
         server.stopServer(() => {
            if (serverTimer !== undefined) clearInterval(serverTimer);
            process.exit();
         });
         break;
      case 'reset':
         server.resetReports();
         break;
   }
});
