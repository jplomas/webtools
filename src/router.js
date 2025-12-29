import { createRouter, createWebHashHistory } from "vue-router";

export default new createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/",
      name: "dashboard",
      component: () => import("./views/Dashboard.vue"),
      meta: {
        title: "QRL Web Tools",
      },
    },
    {
      path: "/wallet",
      name: "wallet",
      component: () => import("./components/tools/WalletGenerator.vue"),
      meta: {
        title: "Wallet Generator - QRL Web Tools",
      },
    },
    {
      path: "/mnemonic",
      name: "mnemonic",
      component: () => import("./components/tools/MnemonicTester.vue"),
      meta: {
        title: "Mnemonic Tester - QRL Web Tools",
      },
    },
    {
      path: "/address",
      name: "address",
      component: () => import("./components/tools/AddressInfo.vue"),
      meta: {
        title: "Address Information - QRL Web Tools",
      },
    },
    {
      path: "/hexseed",
      name: "hexseed",
      component: () => import("./components/tools/HexseedValidator.vue"),
      meta: {
        title: "Hexseed Validator - QRL Web Tools",
      },
    },
    {
      path: "/about",
      name: "about",
      component: () => import("./views/About.vue"),
      meta: {
        title: "About - QRL Web Tools",
      },
    },
    {
      path: "/docs",
      name: "docs",
      component: () => import("./views/Docs.vue"),
      meta: {
        title: "Documentation - QRL Web Tools",
      },
    },
  ],
  linkActiveClass: "active",
});
