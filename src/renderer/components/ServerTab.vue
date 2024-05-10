<template>
   <div class="flex box-100">
      <div id="server" class="box-50">
         <transition name="fade">
            <NewPort
               v-show="popNewPort"
               :port-list="localPorts"
               @hide-add-port="hideAddPort"
               @create-port="createPort"
            />
         </transition>
         <transition name="fade">
            <NewMessage
               v-if="popNewMessage"
               @create-message="createMessage"
               @hide-add-message="hideAddMessage"
            />
         </transition>
         <transition name="fade">
            <EditMessage
               v-if="popEditMessage"
               :message="localMessages[idEditedMsg]"
               :index="idEditedMsg"
               @hide-edit-message="hideEditMessage"
               @edit-message="editMessage"
            />
         </transition>
         <form autocomplete="off" @submit.prevent="startServer">
            <fieldset :disabled="running !== 0">
               <Ports
                  ref="ports"
                  :port-list="localPorts"
                  @update-ports="updatePorts"
                  @show-add-port="showAddPort"
                  @delete-port="deletePort"
                  @toggle-port-check="togglePortCheck"
               />

               <Messages
                  ref="messages"
                  :message-list="localMessages"
                  @update-messages="updateMessages"
                  @show-add-message="showAddMessage"
                  @show-edit-message="showEditMessage"
                  @delete-message="deleteMessage"
               />
               <div class="flex box-100">
                  <div class="box-50">
                     <label class="checkbox">
                        <input
                           v-model="params.echo"
                           type="checkbox"
                        >
                        <div class="checkbox-block" />
                        <span>{{ t('message.echoServer') }}</span>
                     </label>
                     <label class="checkbox">
                        <input
                           v-model="params.trace"
                           type="checkbox"
                        >
                        <div class="checkbox-block" />
                        <span>{{ t('message.enableTrace') }}</span>
                     </label>
                  </div>
                  <div class="box-50">
                     <label class="checkbox">
                        <input
                           v-model="params.alertReset"
                           type="checkbox"
                        >
                        <div class="checkbox-block" />
                        <span>{{ t('message.alertEconnreset') }}</span>
                     </label>
                  </div>
               </div>
            </fieldset>
            <div class="buttons">
               <div v-if="running === 0" class="button-wrap">
                  <i class="mdi mdi-play white" />
                  <button class="confirm" type="submit">
                     {{ t('word.start') }}
                  </button>
               </div>
               <div v-if="running === 1" class="button-wrap">
                  <i class="mdi mdi-stop white" />
                  <button class="stop" @click="stopServer">
                     {{ t('word.stop') }}
                  </button>
               </div>
            </div>
         </form>
         <transition name="fade">
            <ServerTabReports
               v-if="reportList.length > 0"
               ref="reports"
               :reports="reportList"
               @reset-reports="resetReports"
            />
         </transition>
      </div><!-- /server -->
      <Console
         ref="console"
         :logs="slicedLogs"
      />
   </div>
</template>

<script setup lang="ts">
import { ref, computed, Ref, onBeforeUnmount } from 'vue';
import { storeToRefs } from 'pinia';
import Console from './BaseConsole.vue';
import Ports from './ServerTabPorts.vue';
import Messages from './ServerTabMessages.vue';
import NewPort from './ModalNewPort.vue';
import NewMessage from './ModalNewMessage.vue';
import EditMessage from './ModalEditMessage.vue';

import { ServerMessage, ServerPort } from 'common/interfaces';
import ServerTabReports from './ServerTabReports.vue';
import { ipcRenderer } from 'electron';
import { useServerStore } from '@/stores/server';
import { unproxify } from '../libs/unproxify';
import { useI18n } from 'vue-i18n';

const emit = defineEmits(['serverStatus']);
const { t } = useI18n();

const serverStore = useServerStore();

const { ports } = storeToRefs(serverStore);
const { messages } = storeToRefs(serverStore);
const { updatePorts: updateStorePorts, updateMessages: updateStoreMessages } = serverStore;

const running = ref(0);
const params = ref({
   trace: false,
   echo: false,
   alertReset: false
});
const logs = ref([]);
const reportList = ref([]);
const popNewPort = ref(false);
const popNewMessage = ref(false);
const popEditMessage = ref(false);
const idEditedMsg = ref(null);
const localPorts = ref(ports.value);
const localMessages = ref(messages.value);
const logsCache = ref([]);
const logsInterval: Ref<NodeJS.Timer> = ref(null);

const slicedLogs = computed(() => {
   if (logs.value.length > 500)
      return logs.value.slice(-500);
   return logs.value;
});

const startServer = (e: MouseEvent) => {
   e.preventDefault();
   running.value = 1;
   emit('serverStatus', running.value);
   const obj = {
      params: params.value,
      ports: localPorts.value.filter((port) => {
         return port.enabled === true;
      }),
      messages: localMessages.value.filter((message) => {
         return message.enabled === true;
      })
   };
   ipcRenderer.send('start-server', unproxify(obj));
};

const stopServer = (e: MouseEvent) => {
   e.preventDefault();
   ipcRenderer.send('stop-server');
};

const updatePorts = () => {
   updateStorePorts(localPorts.value);
};

const showAddPort = () => {
   popNewPort.value = true;
};

const hideAddPort = () => {
   popNewPort.value = false;
};

const createPort = (port: ServerPort) => {
   localPorts.value.push(port);
   popNewPort.value = false;
   updateStorePorts(localPorts.value);
};

const deletePort = (portId: number) => {
   localPorts.value.splice(portId, 1);
   updateStorePorts(localPorts.value);
};

const resetReports = () => {
   ipcRenderer.send('reset-reports');
};

// Messaggi
const createMessage = (message: ServerMessage) => {
   localMessages.value.push(message);
   popNewMessage.value = false;
   updateStoreMessages(localMessages.value);
};

const editMessage = (message: ServerMessage, index: number) => {
   popEditMessage.value = false;
   localMessages.value[index] = message;
   updateStoreMessages(localMessages.value);
};

const updateMessages = (activeMessage: any) => {
    for (let message of localMessages.value) {
        message.enabled = message.name === activeMessage.value;
    }

   updateStoreMessages(localMessages.value);
};

const showAddMessage = () => {
   popNewMessage.value = true;
};

const hideAddMessage = () => {
   popNewMessage.value = false;
};

const showEditMessage = (index: number) => {
   idEditedMsg.value = index;
   popEditMessage.value = true;
};

const hideEditMessage = () => {
   popEditMessage.value = false;
};

const deleteMessage = (messageId: number) => {
   localMessages.value.splice(messageId, 1);
   updateStoreMessages(localMessages.value);
};

const resetMessages = () => {
   ipcRenderer.send('reset-messages');
};

const togglePortCheck = (status: number) => {
   if (running.value !== 0) return;
   const enable = status === 0;
   localPorts.value.forEach((host) => {
      host.enabled = enable;
   });

   updateStorePorts(localPorts.value);
};

ipcRenderer.on('server-log', (event, data) => {
   const time = new Date().toLocaleString();
   const { message, color, params, i18n } = data;
   const log = {
      time: time,
      message,
      color,
      params,
      i18n
   };

   logsCache.value.push(log);
});

ipcRenderer.on('server-finish', (event, message) => {
   running.value = 0;
   reportList.value = [];
   emit('serverStatus', running.value);
   const time = new Date().toLocaleString();
   const log = {
      time: time,
      i18n: message,
      color: ''
   };

   logs.value.push(log);
});

ipcRenderer.on('report-server-list', (event, reports) => {
   reportList.value = reports;
});

logsInterval.value = setInterval(() => {
   if (logsCache.value.length) {
      logs.value.push(...logsCache.value);
      logsCache.value = [];
   }
}, 100);

onBeforeUnmount(() => {
   clearInterval(logsInterval.value);
   logsInterval.value = null;
});
</script>
