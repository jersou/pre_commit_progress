#!/usr/bin/env -S deno run -A

await new Promise((resolve) => setTimeout(resolve, 2000));
console.log("ok 6");
