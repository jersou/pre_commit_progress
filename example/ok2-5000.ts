#!/usr/bin/env -S deno run -A

await new Promise((resolve) => setTimeout(resolve, 5000));
console.log("ok 2");
