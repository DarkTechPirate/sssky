module.exports = {
  apps: [
    {
      name: "api",
      script: "index.js",
      exec_mode: "fork",
      instances: 1,
      max_memory_restart: "400M",
      node_args: ["--max-old-space-size=512"],
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "worker",
      script: "./workers/index.js",
      exec_mode: "fork",
      instances: 1,
      max_memory_restart: "600M",
      node_args: ["--max-old-space-size=768"],
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
