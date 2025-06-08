import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import Vue3Toastify, { toast } from 'vue3-toastify';
import 'vue3-toastify/dist/index.css';
import '@fortawesome/fontawesome-free/css/all.css';
import './assets/main.css';
import './firebase'; // Import Firebase initialization

// Create Vue app after Firebase initialization
const app = createApp(App);

// Mount the app
app.use(createPinia());
app.use(router);
app.use(Vue3Toastify, {
  autoClose: 3000,
  position: toast.POSITION.TOP_RIGHT
});
app.mount('#app');

// Log router initialization
console.log('Router initialized:', router); 