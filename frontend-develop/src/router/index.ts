import { createRouter, createWebHistory } from "vue-router";
import LoginView from "@/views/LoginView.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      name: "login",
      component: LoginView,
    },
    {
      path: "/onboarding",
      name: "onboarding",
      component: () => import("@/views/OnboardingView.vue"),
    },
    {
      path: "/",
      component: () => import("@/layouts/MainLayout.vue"),
      children: [
        {
          path: "dashboard",
          name: "dashboard",
          component: () => import("@/views/DashboardView.vue"),
        },
        {
          path: "meal-register",
          name: "meal-register",
          component: () => import("@/views/MealRegisterView.vue"),
        },
        {
          path: "exercise-register",
          name: "exercise-register",
          component: () => import("@/views/ExerciseRegisterView.vue"),
        },
        {
          path: "stats-analysis",
          name: "stats-analysis",
          component: () => import("@/views/StatsAnalysisView.vue"),
        },
        {
          path: "community",
          name: "community",
          component: () => import("@/views/CommunityView.vue"),
        },
        {
          path: "community/:id",
          name: "community-detail",
          component: () => import("@/views/CommunityDetailView.vue"),
        },

        {
          path: "challenge-list",
          name: "challenge-list",
          component: () => import("@/views/ChallengeListView.vue"),
        },
        {
          path: "challenge-detail/:id",
          name: "challenge-detail",
          component: () => import("@/views/ChallengeDetailView.vue"),
        },
        {
          path: "challenge-create",
          name: "challenge-create",
          component: () => import("@/views/ChallengeCreateView.vue"),
        },
        {
          path: "users/:id",
          name: "user-profile",
          component: () => import("@/views/UserProfileView.vue"),
        },
        {
          path: "mypage",
          name: "mypage",
          component: () => import("@/views/MyPageView.vue"),
        },
      ],
    },
  ],
});

export default router;
