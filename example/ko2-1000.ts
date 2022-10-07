#!/usr/bin/env -S deno run -A

await new Promise((resolve) => setTimeout(resolve, 1000));
console.log("ko 2 stdout");
console.error("ko 2 stderr");
Deno.exit(2);
