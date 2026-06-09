#!/usr/bin/env tsx
import * as fs from "fs";
import * as path from "path";

const API_BASE = "https://apihub.agnes-ai.com/v1/videos";
const API_KEY = process.env.AGNES_API_KEY;

if (!API_KEY) {
  console.error("Error: AGNES_API_KEY environment variable is not set");
  process.exit(1);
}

interface TaskResult {
  status: string;
  progress: number;
  video_url?: string;
  remixed_from_video_id?: string;
  error?: { message: string };
  [key: string]: unknown;
}

// CLI argument parsing
function parseArgs(argv: string[]): {
  taskId: string;
  interval: number;
  maxRetries: number;
} {
  const args: Record<string, string | string[]> = {};
  const positional: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith("--")) {
        args[key] = next;
        i++;
      } else {
        args[key] = true;
      }
    } else if (arg.startsWith("-")) {
      const key = arg.slice(1);
      const next = argv[i + 1];
      if (next && !next.startsWith("-")) {
        args[key] = next;
        i++;
      } else {
        args[key] = true;
      }
    } else {
      positional.push(arg);
    }
  }

  // Check for config file
  const configFile = args["config"] || args["c"];
  if (configFile) {
    const configPath = path.resolve(configFile as string);
    if (!fs.existsSync(configPath)) {
      console.error(`Error: config file not found: ${configPath}`);
      process.exit(1);
    }
    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    return {
      taskId: config.task_id || "",
      interval: Number(args["interval"]) || 3,
      maxRetries: Number(args["max-retries"]) || 600,
    };
  }

  const taskId = positional[0] || (args["task-id"] as string) || "";
  if (!taskId) {
    console.error("Error: task_id is required");
    console.error(
      "Usage: poll_video.ts <task_id> [options]\nOptions: --interval <seconds> --max-retries <count>"
    );
    process.exit(1);
  }

  return {
    taskId,
    interval: Number(args["interval"]) || 3,
    maxRetries: Number(args["max-retries"]) || 600,
  };
}

async function pollTask(
  taskId: string,
  interval: number,
  maxRetries: number
): Promise<TaskResult> {
  let retries = 0;

  while (retries < maxRetries) {
    const res = await fetch(`${API_BASE}/${taskId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
      },
    });

    if (!res.ok) {
      const text = await res.text();
      let errMsg: string;
      try {
        const json = JSON.parse(text);
        errMsg = json.error?.message || text;
      } catch {
        errMsg = text;
      }

      if (res.status === 404) {
        throw new Error(`Task not found: ${taskId} (${errMsg})`);
      }
      throw new Error(`API error ${res.status}: ${errMsg}`);
    }

    const data = await res.json() as TaskResult;
    retries++;

    // Print progress (overwrite same line)
    process.stdout.write(
      `\rStatus: ${data.status} | Progress: ${data.progress}%`
    );

    if (data.status === "completed") {
      console.log(); // newline after progress
      return data;
    }

    if (data.status === "failed") {
      console.log();
      const errorMsg = data.error?.message || "Unknown error";
      throw new Error(`Task failed: ${errorMsg}`);
    }

    if (retries >= maxRetries) {
      console.log();
      throw new Error(
        `Timed out after ${maxRetries * interval}s (${maxRetries} retries). Current status: ${data.status}`
      );
    }

    await new Promise((resolve) => setTimeout(resolve, interval * 1000));
  }

  throw new Error("Should not reach here");
}

async function main() {
  const { taskId, interval, maxRetries } = parseArgs(process.argv.slice(2));

  console.log(`Polling task: ${taskId} (interval: ${interval}s, max retries: ${maxRetries})`);

  const result = await pollTask(taskId, interval, maxRetries);

  // Output the result as JSON
  const output: Record<string, unknown> = {
    status: result.status,
    progress: result.progress,
  };

  const videoUrl = result.remixed_from_video_id || result.video_url;
  if (videoUrl) {
    output.video_url = videoUrl;
  }

  // Add other useful fields
  if (result.seconds) output.seconds = result.seconds;
  if (result.size) output.size = result.size;
  if (result.id) output.id = result.id;

  console.log("\n" + JSON.stringify(output, null, 2));
}

main().catch((err) => {
  console.error("\nError:", err.message);
  process.exit(1);
});
