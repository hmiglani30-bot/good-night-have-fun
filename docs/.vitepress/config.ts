import { defineConfig } from "vitepress";

export default defineConfig({
  title: "gnhf",
  description:
    "Good Night, Have Fun — an agent-agnostic orchestrator that keeps your coding agents running while you sleep",
  base: "/gnhf/",

  head: [
    [
      "meta",
      {
        name: "keywords",
        content:
          "gnhf, coding agents, orchestrator, claude code, codex, autonomous coding, AI developer tools",
      },
    ],
  ],

  themeConfig: {
    logo: "/splash.png",

    nav: [
      { text: "Guide", link: "/guide/getting-started" },
      { text: "Configuration", link: "/guide/configuration" },
      { text: "Agents", link: "/guide/agents" },
      {
        text: "GitHub",
        link: "https://github.com/kunchenguid/gnhf",
      },
      {
        text: "Discord",
        link: "https://discord.gg/Wsy2NpnZDu",
      },
    ],

    sidebar: [
      {
        text: "Introduction",
        items: [{ text: "What is gnhf?", link: "/" }],
      },
      {
        text: "Guide",
        items: [
          { text: "Getting Started", link: "/guide/getting-started" },
          { text: "Configuration", link: "/guide/configuration" },
          { text: "Agents", link: "/guide/agents" },
          { text: "Advanced Usage", link: "/guide/advanced" },
        ],
      },
    ],

    socialLinks: [
      { icon: "github", link: "https://github.com/kunchenguid/gnhf" },
      { icon: "discord", link: "https://discord.gg/Wsy2NpnZDu" },
      { icon: "x", link: "https://x.com/kunchenguid" },
    ],

    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright 2025-present gnhf contributors",
    },

    search: {
      provider: "local",
    },
  },
});
