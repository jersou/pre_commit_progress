#!/usr/bin/env -S deno run -A
// termtosvg -c ./example-ok.ts -D 5000 -t window_frame_js -g 66x16 ./example-ok.svg
import { runPreCommit } from "../pre-commit-progress.ts";
import {
  fromFileUrl,
  normalize,
} from "https://deno.land/std@0.158.0/path/mod.ts";

const projetBasePath = normalize(fromFileUrl(import.meta.url) + "/../..");
await runPreCommit([
  { cwd: projetBasePath, cmd: `./example/ok1-1000.ts` },
  { cwd: projetBasePath, cmd: `./example/ok2-5000.ts` },
  { cwd: `${projetBasePath}/example`, cmd: `./ok3-1000.ts` },
  { cwd: `${projetBasePath}/example`, cmd: `./ok5-1000.ts` },
  { cwd: `${projetBasePath}/.idea`, cmd: `../example/ok4-3000.ts` },
  { cwd: `${projetBasePath}/.idea`, cmd: `../example/ok6-2000.ts` },
], { maxParallel: 3, checkGitDiff: false });
