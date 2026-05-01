import { createRouter, createWebHistory } from "vue-router";
import TicketsPage from "../pages/TicketsPage.vue";
import ScanPage from "../pages/ScanPage.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", redirect: "/admin/tickets" },
    { path: "/admin/tickets", component: TicketsPage },
    { path: "/scan", component: ScanPage },
  ],
});

export default router;
