#!/usr/bin/env -S deno run -A

await new Promise((resolve) => setTimeout(resolve, 6000));
console.log("ko 1 stdout");
console.error("ko 1 stderr");
Deno.exit(1);
