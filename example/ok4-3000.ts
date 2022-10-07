#!/usr/bin/env -S deno run -A

await new Promise((resolve) => setTimeout(resolve, 3000));
console.log("ok 4");
