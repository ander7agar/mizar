<template>
   <div
      id="messageBox"
      ref="root"
      class="box-100"
   >
      <h3>
         <span class="toggle-select"><i
            class="mdi"
            :class="[checkIcon(checkStatus)]"
            @click="toggleCheck(checkStatus)"
         /></span><span>{{ t('word.server_message', 2) }}</span>
      </h3>
      <div class="tools-box">
         <div class="round-button green-bg" @click="showAdd">
            <span>{{ t('message.addMessage') }}</span>
            <i class="mdi mdi-plus" />
         </div>
      </div>
      <ul id="messageList">
         <li v-for="(message, index) in sortedMessages" :key="index">
            <label class="radio">
               <input
                  v-model="activeMessage"
                  :value="message.name"
                  name="custom_message"
                  type="radio"
                  @change="updateMessages"
               >
               <div class="radio-block" />
               <span
                  class="mdi"
                  :class="[message.format === 'hex' ? 'mdi-hexadecimal' : 'mdi-format-text']"
                  :title="message.format"
               />
               <span>{{ truncate(message.name, 25, '...') }}</span>
            </label>
            <i
               class="mdi mdi-pencil editMessage"
               :title="t('message.editMessage', { message: message.name })"
               @click="showEdit(index)"
            />
            <i
               class="mdi mdi-close deleteMessage"
               :title="t('message.deleteMessage', { message: message.name })"
               @click="deleteMessage(index)"
            />
         </li>
      </ul>
   </div>
</template>

<script setup lang="ts">
import { ServerMessage } from 'common/interfaces';
import { ref, computed, onUpdated, PropType } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps({
   messageList: Array as PropType<ServerMessage[]>
});

const activeMessage = ref('')

const { t } = useI18n();

const root = ref(null);

const emit = defineEmits([
   'update-messages',
   'show-add-message',
   'show-edit-message',
   'delete-message',
   'toggle-message-check'
]);

const checkStatus = computed(() => {
   const checked = props.messageList.filter((message) => {
      return message.enabled;
   });
   if (props.messageList.length === checked.length)
      return 2;
   else if (checked.length > 0)
      return 1;
   else
      return 0;
});

const sortedMessages = computed(() => {
   const localMessagesList = props.messageList;
   return localMessagesList.sort((a, b) => (a.name < b.name ? -1 : (a.name > b.name ? 1 : 0)));
});

const truncate = (text: string, length: number, suffix: string) => {
   if (!text) {
       return '-';
   }
   if (text.length <= length) suffix = '';
   return text.substring(0, length) + suffix;
};

const updateMessages = () => {
    console.log('UpdateMessages', props.messageList);
   emit('update-messages', activeMessage);
};

const showAdd = () => {
   emit('show-add-message');
};

const showEdit = (index: number) => {
   emit('show-edit-message', index);
};
const deleteMessage = (index: number) => {
   emit('delete-message', index);
};

const checkIcon = (status: number) => {
   switch (status) {
      case 0:
         return 'mdi-checkbox-blank-outline';
      case 1:
         return 'mdi-minus-box';
      case 2:
         return 'mdi-checkbox-marked';
   }
};

const toggleCheck = (status: number) => {
   emit('toggle-message-check', status);
};

onUpdated(() => {
   const elem = root.value;
   elem.scrollTop = elem.scrollHeight;
});
</script>
