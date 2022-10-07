#!/usr/bin/env -S deno run -A

await new Promise((resolve) => setTimeout(resolve, 1000));
console.log("ok 1");
