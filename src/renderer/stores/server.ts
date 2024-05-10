import { defineStore } from 'pinia';
import * as ElectronStore from 'electron-store';
import { ServerMessage, ServerPort } from 'common/interfaces';

const persistentStore = new ElectronStore({ name: 'server' });

export const useServerStore = defineStore('server', {
   state: () => ({
      ports: persistentStore.get('ports', [{
         enabled: true,
         port: 8080
      }]) as ServerPort[],
      messages: persistentStore.get('messages', [{
         enabled: false,
         message: ''
      }]) as ServerMessage[]
   }),
   actions: {
      updatePorts (payload: ServerPort[]) {
         this.ports = payload;
         persistentStore.set('ports', this.ports);
      },
      updateMessages (payload: ServerMessage[]) {
         this.messages = payload;
         persistentStore.set('messages', this.messages);
      }

   }
});
