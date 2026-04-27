import { spawn } from "node:child_process";

const children = [];
let isShuttingDown = false;

function shutdown(code = 0) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  for (const child of children) {
    if (!child.killed) {
      child.kill("SIGINT");
    }
  }

  process.exit(code);
}

function runWorkspaceDev(workspace) {
  const command =
    process.platform === "win32"
      ? `npm.cmd run dev -w ${workspace}`
      : `npm run dev -w ${workspace}`;

  const child = spawn(command, {
    stdio: "inherit",
    env: process.env,
    shell: true
  });

  children.push(child);

  child.on("exit", (code) => {
    if (typeof code === "number" && code !== 0) {
      shutdown(code);
    }
  });
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

runWorkspaceDev("apps/api");
runWorkspaceDev("apps/web");
