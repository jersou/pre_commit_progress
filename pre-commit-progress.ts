/* usage :
 * ```ts
 * import { runPreCommit } from "https://deno.land/x/pre_commit_progress@v0.1.0/pre-commit-progress.ts";
 * import { fromFileUrl, normalize } from "https://deno.land/std@0.158.0/path/mod.ts";
 * import { setCwd } from "https://deno.land/x/shell_stream@v1.1.0/Stream.ts";
 * setCwd(dirname(fromFileUrl(import.meta.url)));
 * await runPreCommit([
 *   { cmd: `deno fmt --check --ignore="vendor,npm"`, useStderr: true },
 *   { cmd: `deno lint --ignore="vendor,npm"`, useStderr: true },
 *   { cmd: `deno test -A --ignore="vendor,npm"`, useStderr: false },
 * ]);
 * ```
 * The commands are run only if there are staged file in their cwd
 *
 * ----
 *
 * import { runToString } from "https://deno.land/x/shell_stream@v1.1.0/Stream.ts";
 * await runPreCommit([
 *   { cmd: `deno fmt --check --ignore="vendor,npm"`, useStderr: true },
 *   { cmd: `deno lint --ignore="vendor,npm"`, useStderr: true },
 *   { cmd: `deno test -A --ignore="vendor,npm"`, useStderr: false },
 * ], { maxParallel: 2, diffRef: await runToString("git merge-base origin/develop HEAD") });
 *
 */
import {
  bgBrightBlue,
  bgBrightYellow,
  bgGreen,
  bgRed,
  black,
} from "https://deno.land/std@0.158.0/fmt/colors.ts";
import {
  run,
  runKo,
  RunOptions,
  RunStream,
  sanitize,
  Stream,
} from "https://deno.land/x/shell_stream@v1.1.0/mod.ts";

import { groupBy } from "https://deno.land/std@0.158.0/collections/group_by.ts";

type RunPreCommitData = {
  cwd?: string;
  diffPath?: string;
  cmd: string[] | string;
};

export type RunPreCommitOption = {
  checkGitDiff?: boolean;
  stagedCheck?: boolean;
  diffRef?: string;
  maxParallel?: number;
};

const ok = (s: string) => console.error(bgGreen(black(s)));
const err = (s: string) => console.error(bgRed(black(s)));

function printError() {
  err("");
  err("                                                                 ");
  err("                                                                 ");
  err("                              ERROR                              ");
  err("                                                                 ");
  err("                                                                 ");
  err("");
}

export function onSuccess() {
  ok("");
  ok("                                                                 ");
  ok("                                                                 ");
  ok("                               OK                                ");
  ok("                                                                 ");
  ok("                                                                 ");
}

async function pathHasDiff(path: string, stagedCheck = true, diffRef = "") {
  return await runKo(
    `git diff ${
      stagedCheck ? "--cached" : ""
    } --exit-code ${diffRef} -- ${path} `,
    { stderr: "null", stdout: "null" },
  );
}

export function getTimeStr() {
  return new Date().toISOString().substring(11, 23);
}

function getColor(status: boolean | null | undefined) {
  switch (status) {
    case true:
      return (msg: string) => bgGreen(black(msg));
    case false:
      return bgRed;
    case undefined:
      return (msg: string) => bgBrightYellow(black(msg));
    case null:
      return bgBrightBlue;
  }
}

function getIcon(status: boolean | null | undefined) {
  switch (status) {
    case true:
      return "✅";
    case false:
      return "❌";
    case undefined:
      return "⏩";
    case null:
      return "⏳";
  }
}

function getStatusStr(runs: RunStream[]) {
  const groups = groupBy(runs, (run: RunStream) => run.opt?.cwd || run.cwd);
  return Object.entries(groups).map(([path, subRuns]) => {
    return [
      `📂 ${path}`,
      ...(subRuns || []).map((run) => {
        const status = run.process ? run.processStatus?.success : null;
        return `  ${getIcon(status)} ` +
          getColor(status)(`${run.processCmd.join(" ")}`);
      }),
    ].join("\n");
  }).join("\n");
}

function printStatus(runs: RunStream[]) {
  const out = getStatusStr(runs);
  console.clear();
  console.log(out);
}

function hideCursor() {
  Deno.stdout.writeSync(new TextEncoder().encode("\u001B[?25l"));
}

function showCursor() {
  Deno.stdout.writeSync(new TextEncoder().encode("\u001B[?25h"));
}

export async function runPreCommit(
  runData: RunPreCommitData[],
  opt?: RunPreCommitOption,
) {
  hideCursor();
  const runs: RunStream[] = [];
  for (const data of runData) {
    if (
      (opt?.checkGitDiff === false) ||
      await pathHasDiff(
        data.diffPath ?? data.cwd ?? ".",
        opt?.stagedCheck,
        opt?.diffRef ?? "",
      )
    ) {
      const runOptions: RunOptions = {
        cwd: data.cwd ?? ".",
        allowFail: true,
        output: "merged",
        mergedTransform: {
          stdout: (s) => `[${getTimeStr()}] ${s}`,
          stderr: (s) => `[${bgRed(getTimeStr())}] ${s}`,
        },
      };
      runs.push(run(data.cmd, runOptions));
    }
  }

  Stream.resetProcessCount();
  Stream.subscribeProcessEvent(() => printStatus(runs));

  const errors = await Stream.fromArray(runs)
    .mapAwaitParallel(async (s) => ({
      stream: s,
      out: await s.toString().then((out) => out.trim()),
    }), opt?.maxParallel)
    .filter((streamData) => streamData.stream.processStatus?.success !== true)
    .toArray();

  showCursor();

  if (runs.every((run) => run.processStatus?.success)) {
    onSuccess();
  } else {
    console.clear();
    console.log("\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n");
    err("↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓");
    const statusStr = getStatusStr(runs);

    errors.forEach((data) => {
      if (data) {
        const cmd = data.stream.processCmd.join(" ");
        const cwd = data.stream.opt?.cwd || data.stream.cwd;
        console.error(`------------\nLog of : ${cmd}\nFrom   : ${cwd}\n`);
        console.error(data.out);
      }
    });
    console.error();
    console.log(statusStr);
    printError();
    Deno.exit(1);
  }
  sanitize();
}
