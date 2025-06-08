<template>
  <div id="app">
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
    </div>
    <div v-else-if="!isAuthenticated">
      <Login @login-success="handleLoginSuccess" />
    </div>
    <div v-else>
      <RouterView />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import Login from '@/components/Login.vue';
import { getUserRole } from '@/services/auth-service';

const router = useRouter();
const isAuthenticated = ref(false);
const userRole = ref(null);
const isLoading = ref(true);

// Set up auth state listener
onMounted(() => {
  const auth = getAuth();
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      isAuthenticated.value = true;
      try {
        userRole.value = await getUserRole();
        // If we're on the home page, redirect based on role
        if (router.currentRoute.value.name === 'Home') {
          if (userRole.value === 'admin') {
            await router.push({ name: 'Admin' });
          } else {
            await router.push({ name: 'Scheduler' });
          }
        }
      } catch (error) {
        console.error('Error getting user role:', error);
      }
    } else {
      isAuthenticated.value = false;
      userRole.value = null;
      // Only redirect to home if not already there
      if (router.currentRoute.value.name !== 'Home') {
        await router.push({ name: 'Home' });
      }
    }
    isLoading.value = false;
  });
});

const handleLoginSuccess = async (user) => {
  try {
    isAuthenticated.value = true;
    userRole.value = await getUserRole();
    
    // Let the router handle navigation based on the current route
    const currentRoute = router.currentRoute.value;
    if (currentRoute.name === 'Home') {
      // Only redirect from home page after login
      if (userRole.value === 'admin') {
        await router.push({ name: 'Admin' });
      } else {
        await router.push({ name: 'Scheduler' });
      }
    }
  } catch (error) {
    console.error('Error handling login success:', error);
    // If there's an error getting the role, log out the user
    const auth = getAuth();
    await auth.signOut();
    isAuthenticated.value = false;
    userRole.value = null;
    await router.push({ name: 'Home' });
  }
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f8fafc;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style> 