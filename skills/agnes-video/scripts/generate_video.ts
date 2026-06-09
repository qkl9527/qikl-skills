#!/usr/bin/env tsx
import * as fs from "fs";
import * as path from "path";

const API_BASE = "https://apihub.agnes-ai.com/v1/videos";
const API_KEY = process.env.AGNES_API_KEY;

if (!API_KEY) {
  console.error("Error: AGNES_API_KEY environment variable is not set");
  process.exit(1);
}

interface VideoRequest {
  model: string;
  prompt: string;
  image?: string;
  mode?: string;
  height?: number;
  width?: number;
  num_frames?: number;
  frame_rate?: number;
  negative_prompt?: string;
  seed?: number;
  extra_body?: { image?: string[]; mode?: string };
}

function validateNumFrames(n: number): void {
  if (n > 441) {
    throw new Error(`num_frames must be <= 441, got ${n}`);
  }
  const nVal = (n - 1) / 8;
  if (!Number.isInteger(nVal) || nVal <= 0) {
    const valid = [81, 121, 161, 201, 241, 281, 321, 361, 441];
    throw new Error(
      `num_frames must satisfy 8n+1 (e.g. ${valid.join(", ")}), got ${n}`
    );
  }
}

function normalizeNumFrames(n: number): number {
  // Round to nearest valid value
  const valid = [81, 121, 161, 201, 241, 281, 321, 361, 441];
  for (let i = valid.length - 1; i >= 0; i--) {
    if (valid[i] <= n) return valid[i];
  }
  return 81;
}

// CLI argument parsing
function parseArgs(argv: string[]): {
  prompt: string;
  image?: string;
  mode?: string;
  images?: string[];
  localImages?: string[];
  height: number;
  width: number;
  numFrames: number;
  frameRate: number;
  negativePrompt?: string;
  seed?: number;
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

  // Check for input file (JSON config)
  const configFile = args["config"] || args["c"];
  if (configFile) {
    const configPath = path.resolve(configFile as string);
    if (!fs.existsSync(configPath)) {
      console.error(`Error: config file not found: ${configPath}`);
      process.exit(1);
    }
    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    return {
      prompt: config.prompt || positional[0] || "",
      image: config.image || args["image"] || undefined,
      mode: config.mode || args["mode"] || undefined,
      images: config.images || args["images"] || undefined,
      localImages: config.localImages || args["localImages"] || undefined,
      height:
        config.height ||
        Number(args["height"]) ||
        Number(args["h"]) ||
        768,
      width:
        config.width ||
        Number(args["width"]) ||
        Number(args["w"]) ||
        1152,
      numFrames:
        config.num_frames ||
        Number(args["num-frames"]) ||
        Number(args["frames"]) ||
        Number(args["n"]) ||
        121,
      frameRate:
        config.frame_rate ||
        Number(args["frame-rate"]) ||
        Number(args["fps"]) ||
        Number(args["r"]) ||
        24,
      negativePrompt:
        config.negative_prompt ||
        args["negative-prompt"] ||
        args["np"] ||
        undefined,
      seed: config.seed
        ? Number(config.seed)
        : args["seed"]
          ? Number(args["seed"])
          : undefined,
    };
  }

  const prompt = positional[0] || (args["prompt"] as string) || "";
  if (!prompt) {
    console.error("Error: prompt is required");
    console.error(
      "Usage: generate_video.ts <prompt> [options]  or  generate_video.ts --config <file.json>"
    );
    process.exit(1);
  }

  const images = args["images"] || args["image-urls"] || undefined;
  const localImages =
    args["local-images"] || args["local-images"] || undefined;

  return {
    prompt,
    image:
      args["image"] || args["i"] || (args["image-url"] as string) || undefined,
    mode: (args["mode"] as string) || undefined,
    images:
      typeof images === "string" ? images.split(",").map((s) => s.trim()) : images,
    localImages:
      typeof localImages === "string"
        ? localImages.split(",").map((s) => s.trim())
        : localImages,
    height: Number(args["height"]) || Number(args["h"]) || 768,
    width: Number(args["width"]) || Number(args["w"]) || 1152,
    numFrames:
      Number(args["num-frames"]) ||
      Number(args["frames"]) ||
      Number(args["n"]) ||
      121,
    frameRate:
      Number(args["frame-rate"]) ||
      Number(args["fps"]) ||
      Number(args["r"]) ||
      24,
    negativePrompt:
      args["negative-prompt"] || args["np"] || undefined,
    seed: args["seed"] ? Number(args["seed"]) : undefined,
  };
}

async function createTask(req: VideoRequest): Promise<{ task_id: string }> {
  const normalized: VideoRequest = { ...req };

  // Validate and normalize num_frames
  if (normalized.num_frames && normalized.num_frames > 81) {
    normalized.num_frames = normalizeNumFrames(normalized.num_frames);
  }
  if (normalized.num_frames) {
    validateNumFrames(normalized.num_frames);
  }

  const body: Record<string, unknown> = {
    model: normalized.model || "agnes-video-v2.0",
    prompt: normalized.prompt,
  };

  if (normalized.image) {
    body["image"] = normalized.image;
  }

  if (normalized.mode) {
    body["mode"] = normalized.mode;
  }

  if (normalized.width) body["width"] = normalized.width;
  if (normalized.height) body["height"] = normalized.height;
  if (normalized.num_frames) body["num_frames"] = normalized.num_frames;
  if (normalized.frame_rate) body["frame_rate"] = normalized.frame_rate;
  if (normalized.negative_prompt) body["negative_prompt"] = normalized.negative_prompt;
  if (normalized.seed !== undefined) body["seed"] = normalized.seed;

  // extra_body for multi-image or keyframe mode
  const extraBody: Record<string, unknown> = {};
  if (normalized.extra_body?.image) {
    extraBody["image"] = normalized.extra_body.image;
  }
  if (normalized.extra_body?.mode) {
    extraBody["mode"] = normalized.extra_body.mode;
  }
  if (Object.keys(extraBody).length > 0) {
    body["extra_body"] = extraBody;
  }

  console.log(body)

  const res = await fetch(API_BASE, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
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
    throw new Error(`API error ${res.status}: ${errMsg}`);
  }

  const data = await res.json();
  const taskId = data.task_id || data.id;
  if (!taskId) {
    throw new Error("No task_id in response: " + JSON.stringify(data));
  }

  return { task_id: taskId };
}

async function main() {
  const argv = process.argv.slice(2);
  const {
    prompt,
    image,
    mode,
    images,
    localImages,
    height,
    width,
    numFrames,
    frameRate,
    negativePrompt,
    seed,
  } = parseArgs(argv);

  const request: VideoRequest = {
    model: "agnes-video-v2.0",
    prompt,
    image,
    mode,
    height,
    width,
    num_frames: numFrames,
    frame_rate: frameRate,
    negative_prompt: negativePrompt,
    seed,
  };

  // Build extra_body.image from images or localImages
  const allImages: string[] = [];
  if (images && Array.isArray(images)) {
    allImages.push(...images);
  }
  if (localImages && Array.isArray(localImages)) {
    // These are uploaded URLs (should be pre-resolved by upload script)
    allImages.push(...localImages);
  }
  if (allImages.length > 0) {
    if (!request.extra_body) request.extra_body = {};
    request.extra_body.image = allImages;

    // If localImages were provided, infer keyframe mode
    if (localImages && Array.isArray(localImages) && localImages.length > 0) {
      if (!request.mode) request.mode = "keyframes";
      if (!request.extra_body) request.extra_body = {};
      request.extra_body.mode = "keyframes";
    }
  }

  console.log("Creating video task...");
  const result = await createTask(request);
  console.log(JSON.stringify({ task_id: result.task_id }));
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
