import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/auth";
import Login from "../pages/Login/Login.vue";
import Categories from "../pages/Categories/Categories.vue";
import Items from "../pages/Items/Items.vue";
import Lending from "../pages/Lending/Lending.vue";
import Settings from "../pages/Settings/Settings.vue";
import Главная from "../pages/Dashboard.vue";
import Layout from "../components/Layout/Layout.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/login",
      name: "Login",
      component: Login,
      meta: { guest: true },
    },
    {
      path: "/",
      component: Layout,
      meta: { requiresAuth: true },
      children: [
        {
          path: "",
          name: "Главная",
          component: Главная,
        },
        {
          path: "categories",
          name: "Categories",
          component: Categories,
        },
        {
          path: "items",
          name: "Items",
          component: Items,
        },
        {
          path: "lending",
          name: "Lending",
          component: Lending,
        },
        {
          path: "settings",
          name: "Settings",
          component: Settings,
        },
      ],
    },
  ],
});

router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore();

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    if (authStore.refreshToken && !authStore.accessToken) {
      const success = await authStore.refreshAccessToken();
      if (success) {
        next();
      } else {
        next("/login");
      }
    } else {
      next("/login");
    }
  } else if (to.meta.guest && authStore.isAuthenticated) {
    next("/");
  } else {
    next();
  }
});

export default router;
