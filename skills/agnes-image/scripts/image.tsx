#!/usr/bin/env tsx
/**
 * Agnes Image 2.1 Flash — CLI execution script
 *
 * Usage:
 *   tsx image.tsx --prompt "a cat" [--size 1024x1024] [--output out.png] [--timeout 120]
 *   tsx image.tsx --prompt "transform" --image "https://example.com/photo.jpg" [--size 1024x1024]
 *   tsx image.tsx --prompt "redesign" --local-image "/path/to/img.png" [--size 1024x1024]
 */

import { stdin, stdout } from "node:process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ImageItem {
  url: string | null;
  b64_json: string | null;
  revised_prompt: string | null;
  seed?: number;
}

interface ApiResponse {
  created?: number;
  data: ImageItem[];
  error?: { message: string; code?: string; type?: string };
}

// ---------------------------------------------------------------------------
// Arg parsing (no dependencies)
// ---------------------------------------------------------------------------

function parseArgs(argv: string[]): Record<string, string | string[]> {
  const args: Record<string, string | string[]> = {};
  let i = 0;
  while (i < argv.length) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      if (i + 1 < argv.length && !argv[i + 1].startsWith("--")) {
        i++;
        args[key] = argv[i];
      } else {
        // boolean flag or collect multiple --same-key
        const existing = args[key];
        if (Array.isArray(existing)) {
          existing.push("true");
          args[key] = existing;
        } else {
          args[key] = "true";
        }
      }
    }
    i++;
  }
  return args;
}

// ---------------------------------------------------------------------------
// Prompt expansion — makes short prompts more detailed
// ---------------------------------------------------------------------------

const PROMPT_TEMPLATES: Record<string, string[]> = {
  animal: [
    "A majestic [animal] in its natural habitat, detailed fur/feathers texture, cinematic lighting, shallow depth of field, photorealistic, high visual density",
  ],
  nature: [
    "A stunning [subject] landscape, dramatic sky with dynamic clouds, golden hour lighting, rich colors, wide-angle composition, ultra-detailed, photorealistic",
  ],
  portrait: [
    "A professional portrait of a person, soft studio lighting, neutral background, shallow depth of field, high-end editorial photography, skin texture details, 85mm lens look",
  ],
  product: [
    "A premium product photography shot of [subject] on a clean surface, soft diffused studio lighting, minimal shadows, neutral background, commercial aesthetic, ultra-detailed",
  ],
  architecture: [
    "An impressive architectural shot of [subject], dramatic perspective, golden hour lighting, clear sky, professional architectural photography, high detail, wide-angle",
  ],
  abstract: [
    "A visually striking abstract composition, dynamic shapes and colors, balanced composition, modern art style, high contrast, gallery-quality",
  ],
};

// Simple keyword heuristic for category
function categorizePrompt(prompt: string): string {
  const lp = prompt.toLowerCase();
  if (/cat|dog|bird|fish|horse|bear|lion|tiger|elephant|rabbit|animal/i.test(lp)) return "animal";
  if (/mountain|ocean|forest|beach|sunset|landscape|nature|flower|garden/i.test(lp)) return "nature";
  if (/person|woman|man|girl|boy|portrait|face|headshot/i.test(lp)) return "portrait";
  if (/product|bottle|phone|laptop|watch|jewelry|cosmetic|skincare/i.test(lp)) return "product";
  if (/building|house|interior|room|bridge|temple|cathedral/i.test(lp)) return "architecture";
  if (/abstract|pattern|texture|background|wallpaper|gradient/i.test(lp)) return "abstract";
  return "default";
}

function expandPrompt(prompt: string): string {
  // If prompt already looks detailed (has commas, long, or quality words), skip
  if (prompt.length > 60 || (prompt.match(/,/g) || []).length >= 2) {
    return prompt;
  }

  const category = categorizePrompt(prompt);
  const template = PROMPT_TEMPLATES[category]?.[0];

  if (!template) return prompt;

  // Replace [subject] or [animal] with the core of the prompt
  const core = prompt.split(/[,.\s]/).filter(Boolean)[0];
  return template.replace(/\[animal\]/g, core).replace(/\[subject\]/g, core).replace(/\[core\]/g, core);
}

// ---------------------------------------------------------------------------
// Upload a local image file → get a URL from the API
// ---------------------------------------------------------------------------

async function uploadLocalImage(filePath: string, apiKey: string): Promise<string> {
  const { spawn } = await import("node:child_process");

  return new Promise((resolve, reject) => {
    const cp = spawn(
      "curl",
      [
        "-s",
        "--max-time",
        "30",
        "https://apihub.agnes-ai.com/v1/images/upload",
        "-H",
        `Authorization: Bearer ${apiKey}`,
        "-F",
        `file=@ "${filePath}"`,
        "-F",
        "response_format=\"url\"",
      ],
    );

    let out = "";
    let err = "";
    cp.stdout.on("data", (d: Buffer) => (out += d.toString()));
    cp.stderr.on("data", (d: Buffer) => (err += d.toString()));
    cp.on("close", (code) => {
      if (code !== 0 || !out) {
        reject(new Error(`Upload failed (code ${code}): ${err || out}`));
        return;
      }
      try {
        const parsed = JSON.parse(out);
        resolve(parsed.url);
      } catch {
        reject(new Error(`Upload returned non-JSON: ${out.slice(0, 200)}`));
      }
    });
  });
}

// ---------------------------------------------------------------------------
// Make API call via child process curl (no external deps)
// ---------------------------------------------------------------------------

async function callApi(
  body: Record<string, unknown>,
  timeout: number,
  apiKey: string,
): Promise<ApiResponse> {
  const { spawn } = await import("node:child_process");

  // Serialize JSON body
  const jsonStr = JSON.stringify(body, null, 2);
  const jsonFile = `/tmp/agnes-image-body-${Date.now()}.json`;
  require("node:fs").writeFileSync(jsonFile, jsonStr);

  return new Promise((resolve, reject) => {
    const cp = spawn(
      "curl",
      [
        "-s",
        "--max-time",
        String(timeout),
        "https://apihub.agnes-ai.com/v1/images/generations",
        "-H",
        `Authorization: Bearer ${apiKey}`,
        "-H",
        "Content-Type: application/json",
        "-d",
        `@${jsonFile}`,
      ],
    );

    let out = "";
    let err = "";
    cp.stdout.on("data", (d: Buffer) => (out += d.toString()));
    cp.stderr.on("data", (d: Buffer) => (err += d.toString()));
    cp.on("close", () => {
      try {
        const parsed = JSON.parse(out) as ApiResponse;
        if (parsed.error) {
          reject(new Error(`API error: ${parsed.error.message} (code: ${parsed.error.code || "unknown"})`));
        } else {
          resolve(parsed);
        }
      } catch {
        reject(new Error(`Invalid API response: ${out.slice(0, 500)}`));
      }
      try {
        require("node:fs").unlinkSync(jsonFile);
      } catch {}
    });

    cp.on("error", (e: Error) => {
      try {
        require("node:fs").unlinkSync(jsonFile);
      } catch {}
      reject(e);
    });
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const rawArgs = parseArgs(process.argv.slice(2));

  // --prompt is required
  const promptInput = rawArgs.prompt;
  if (!promptInput || (Array.isArray(promptInput) && promptInput.length === 0)) {
    console.error("Error: --prompt is required");
    console.error('Usage: tsx image.tsx --prompt "your prompt" [--size 1024x768]');
    process.exit(1);
  }
  const prompt = Array.isArray(promptInput) ? promptInput.join(" ") : promptInput;

  // --size (optional, default 1024x1024)
  let size = Array.isArray(rawArgs.size) ? rawArgs.size[0] : rawArgs.size;
  if (!size) size = "1024x1024";

  // --timeout (default 120s)
  let timeout = Number(rawArgs.timeout) || 120;

  // --output (optional, save to file)
  const outputFile = rawArgs.output || null;

  // --image (URL input for img2img)
  const imageUrl = Array.isArray(rawArgs.image) ? rawArgs.image[0] : rawArgs.image;

  // --local-image (can be specified multiple times)
  const localImages = Array.isArray(rawArgs.local_image) ? rawArgs.local_image : rawArgs.local_image ? [rawArgs.local_image] : [];

  // Get API key
  const apiKey = process.env.AGNES_API_KEY;
  if (!apiKey) {
    console.error('Error: AGNES_API_KEY environment variable is required');
    process.exit(1);
  }

  // Expand prompt if short
  const finalPrompt = expandPrompt(prompt);

  // Upload local images if any
  const imageUrls: string[] = [];
  if (imageUrl) {
    imageUrls.push(imageUrl);
  }

  if (localImages.length > 0) {
    console.error(`Uploading ${localImages.length} local image(s)...`);
    for (const imgPath of localImages) {
      try {
        const url = await uploadLocalImage(imgPath, apiKey);
        imageUrls.push(url);
        console.error(`  Uploaded: ${imgPath} → ${url}`);
      } catch (e) {
        // Fallback to Data URI Base64
        console.error(`  Upload failed for ${imgPath}, falling back to Data URI Base64...`);
        try {
          const fs = await import("node:fs");
          const { Buffer } = await import("node:buffer");
          const data = fs.readFileSync(imgPath);
          const b64 = data.toString("base64");
          const mime = imgPath.endsWith(".png")
            ? "image/png"
            : imgPath.endsWith(".jpg") || imgPath.endsWith(".jpeg")
              ? "image/jpeg"
              : "image/png";
          imageUrls.push(`data:${mime};base64,${b64}`);
          console.error(`  Data URI: ${imgPath} → (base64)`);
        } catch (e2) {
          console.error(`  ERROR: Could not read ${imgPath}: ${e2}`);
          process.exit(1);
        }
      }
    }
  }

  // Build request body
  const isImg2Img = imageUrls.length > 0;

  let body: Record<string, unknown> = {
    model: "agnes-image-2.1-flash",
    prompt: finalPrompt,
    size,
  };

  if (isImg2Img) {
    body.extra_body = {
      image: imageUrls,
      response_format: "url",
    };
  } else {
    body.extra_body = {
      response_format: "url",
    };
  }

  console.error(`Generating image...`);
  console.error(`  Prompt: ${finalPrompt}`);
  console.error(`  Size: ${size}`);
  console.error(`  Mode: ${isImg2Img ? "image-to-image" : "text-to-image"}`);

  // Call API
  const response = await callApi(body, timeout, apiKey);

  // Extract result
  if (!response.data || response.data.length === 0) {
    console.error("Error: No data in response");
    process.exit(1);
  }

  const item = response.data[0];

  if (item.url) {
    if (outputFile) {
      // Download the image
      const { spawn } = await import("node:child_process");
      await new Promise<void>((resolve, reject) => {
        const cp = spawn("curl", [
          "-s",
          "-o",
          outputFile,
          "-L",
          item.url!,
        ]);
        cp.on("close", (code) => {
          if (code === 0) {
            console.error(`Saved to: ${outputFile}`);
            resolve();
          } else {
            reject(new Error(`Download failed (code ${code})`));
          }
        });
      });
    }
    console.log(item.url);
  } else if (item.b64_json) {
    if (outputFile) {
      const fs = await import("node:fs");
      const { Buffer } = await import("node:buffer");
      fs.writeFileSync(outputFile, Buffer.from(item.b64_json, "base64"));
      console.error(`Saved to: ${outputFile}`);
    }
    console.log(item.b64_json);
  } else {
    console.error("Error: No URL or Base64 in response data");
    console.error(JSON.stringify(response, null, 2));
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(`Error: ${e.message}`);
  process.exit(1);
});
