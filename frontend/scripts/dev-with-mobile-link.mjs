import { spawn } from "child_process";
import { createRequire } from "module";
import os from "os";
import path from "path";

const require = createRequire(import.meta.url);

const host = process.env.VITE_HOST || "0.0.0.0";
const port = process.env.VITE_PORT || process.env.PORT || "5173";
const extraArgs = process.argv.slice(2);

function getMobileUrls() {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter((network) => network && network.family === "IPv4" && !network.internal)
    .map((network) => `http://${network.address}:${port}/`);
}

console.log("");
console.log("BananaControl frontend");
console.log(`- Desktop: http://localhost:${port}/`);

const mobileUrls = getMobileUrls();

if (mobileUrls.length > 0) {
  mobileUrls.forEach((url) => {
    console.log(`- Celular: ${url}`);
  });
} else {
  console.log("- Celular: nenhum IP de rede local encontrado");
}

console.log("");
console.log("Abra o link Celular em um dispositivo conectado na mesma rede Wi-Fi.");
console.log("");

const vitePackageJson = require.resolve("vite/package.json");
const viteBin = path.join(path.dirname(vitePackageJson), "bin", "vite.js");
const child = spawn(process.execPath, [viteBin, "--host", host, "--port", port, ...extraArgs], {
  stdio: "inherit"
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
