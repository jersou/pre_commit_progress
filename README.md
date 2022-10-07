
Pre-commit script :
- run commands in parallel
- run commands only if file is staged (default) or changed
- run command in parallel conditionally of change

## Options
```typescript
type RunPreCommitData = {
    cwd?: string;
    diffPath?: string;       // path to check and enable this check
    cmd: string[] | string;
};

export type RunPreCommitOption = {
    checkGitDiff?: boolean;   // default true, enable git diff check
    stagedCheck?: boolean;    // default true, check staged diff
    diffRef?: string;         // ex: git merge-base origin/develop HEAD
    maxParallel?: number;     // max parralel command
};
```

## Examples
```typescript
import { runPreCommit } from "../pre-commit-progress.ts";
import {
  fromFileUrl,
  normalize,
} from "https://deno.land/std@0.158.0/path/mod.ts";

const projetBasePath = normalize(fromFileUrl(import.meta.url) + "/../..");
await runPreCommit([
  { cwd: projetBasePath, cmd: `./example/ok1-1000.ts` },
  { cwd: projetBasePath, cmd: `./example/ok2-5000.ts` },
  { cwd: `${projetBasePath}/example`, cmd: `./ko1-6000.ts` },
  { cwd: `${projetBasePath}/example`, cmd: `./ok3-1000.ts` },
  { cwd: `${projetBasePath}/example`, cmd: `./ok5-1000.ts` },
  { cwd: `${projetBasePath}/.idea`, cmd: `../example/ok4-3000.ts` },
  { cwd: `${projetBasePath}/.idea`, cmd: `../example/ko2-1000.ts` },
  { cwd: `${projetBasePath}/.idea`, cmd: `../example/ok6-2000.ts` },
], { maxParallel: 3, checkGitDiff: false });
```

### Example OK

![example-ok](./example/example-ok.svg)

### Example KO

![example-ok](./example/example-ko.svg)
