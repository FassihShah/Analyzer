import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const output = path.resolve("reports/browser-check");
await mkdir(output, { recursive: true });
const targets = await (await fetch("http://localhost:9222/json")).json();
const target = targets.find((item) => item.type === "page");
if (!target) throw new Error("No Chrome page target available on port 9222.");

const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

let nextId = 1;
const pending = new Map();
const errors = [];
socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (message.method === "Runtime.exceptionThrown") errors.push(message.params.exceptionDetails.text);
  if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error") errors.push(message.params.args.map((arg) => arg.value || arg.description || "error").join(" "));
  if (!message.id) return;
  const entry = pending.get(message.id);
  if (!entry) return;
  pending.delete(message.id);
  if (message.error) entry.reject(new Error(message.error.message));
  else entry.resolve(message.result);
});

function send(method, params = {}) {
  const id = nextId++;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
}

await send("Page.enable");
await send("Runtime.enable");
const checks = [];
const routes = ["/", "/jobs", "/imports", "/applicants", "/emails", "/exports", "/analytics", "/login"];
for (const viewport of [{ name: "desktop", width: 1440, height: 1000, mobile: false }, { name: "mobile", width: 390, height: 844, mobile: true }]) {
  await send("Emulation.setDeviceMetricsOverride", { width: viewport.width, height: viewport.height, deviceScaleFactor: 1, mobile: viewport.mobile });
  for (const route of routes) {
    await send("Page.navigate", { url: `http://localhost:3100${route}` });
    await new Promise((resolve) => setTimeout(resolve, 1400));
    const response = await send("Runtime.evaluate", { expression: "({title:document.title,body:document.body.innerText,innerWidth:innerWidth,scrollWidth:document.documentElement.scrollWidth,hasOverlay:!!document.querySelector('[data-nextjs-dialog]')})", returnByValue: true });
    const page = response.result.value;
    const check = { viewport: viewport.name, route, title: page.title, hasContent: page.body.trim().length > 100, hasDemoLabel: route === "/login" ? page.body.includes("portfolio demo") : page.body.includes("Portfolio demo"), width: page.innerWidth, scrollWidth: page.scrollWidth, horizontalOverflow: page.scrollWidth > page.innerWidth + 1, hasOverlay: page.hasOverlay };
    checks.push(check);
    if (["/", "/applicants", "/login"].includes(route)) {
      const shot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
      const name = route === "/" ? "dashboard" : route.slice(1);
      await writeFile(path.join(output, `${name}-${viewport.name}.png`), Buffer.from(shot.data, "base64"));
    }
  }
}

socket.close();
const report = { checks, errors };
await writeFile(path.join(output, "summary.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report));
if (errors.length || checks.some((check) => !check.hasContent || !check.hasDemoLabel || check.horizontalOverflow || check.hasOverlay)) process.exitCode = 1;
