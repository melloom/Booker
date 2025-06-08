import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Scheduler from '../components/Scheduler.vue'
import AdminDashboard from '../components/AdminDashboard.vue'
import SlotManagementDashboard from '../components/slot-management/SlotManagementDashboard.vue'
import { getAuth } from 'firebase/auth'
import { getUserRole } from '../services/auth-service'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: { requiresAuth: false }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: AdminDashboard,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/scheduler',
    name: 'Scheduler',
    component: Scheduler,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/slots',
    name: 'SlotManagement',
    component: SlotManagementDashboard,
    meta: { requiresAuth: true, requiresAdmin: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  console.log('Navigation to:', to.name);
  const auth = getAuth();
  const isAuthenticated = !!auth.currentUser;

  // If route doesn't require auth, allow access
  if (!to.meta.requiresAuth) {
    next();
    return;
  }

  // If not authenticated, redirect to home
  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting to home');
    next({ name: 'Home' });
    return;
  }

  try {
    const userRole = await getUserRole();
    console.log('User role:', userRole);

    // If route requires admin and user is not admin, redirect to scheduler
    if (to.meta.requiresAdmin && userRole !== 'admin') {
      console.log('Not admin, redirecting to scheduler');
      next({ name: 'Scheduler' });
      return;
    }

    // Allow access to the requested route
    next();
  } catch (error) {
    console.error('Error checking user role:', error);
    // If there's an error checking the role, redirect to home
    next({ name: 'Home' });
  }
})

export default router 