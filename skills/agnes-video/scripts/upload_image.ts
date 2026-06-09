#!/usr/bin/env tsx
/**
 * Upload local image file(s) to Agnes API and return URL(s).
 *
 * Supports:
 * - Single file: upload_image.ts /path/to/image.png
 * - Multiple files: upload_image.ts /path/a.png /path/b.png
 * - From stdin (base64 encoded): cat image.png | upload_image.ts --stdin
 * - From config file: upload_image.ts --config config.json
 *
 * Usage:
 *   upload_image.ts <file1> [file2 ...]
 *   upload_image.ts --config config.json
 *   cat image.png | upload_image.ts --stdin
 *
 * Output: JSON array of URLs
 *   ["https://storage.googleapis.com/.../image1.png", "..."]
 */
import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";

const API_KEY = process.env.AGNES_API_KEY;

if (!API_KEY) {
  console.error("Error: AGNES_API_KEY environment variable is not set");
  process.exit(1);
}

interface UploadResult {
  url: string;
  file?: string;
}

function parseArgs(argv: string[]): {
  files: string[];
  stdin: boolean;
  config?: string;
} {
  const args: Record<string, string | boolean | string[]> = {};
  const positional: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--stdin" || arg === "-s") {
      args["stdin"] = true;
    } else if (arg === "--config" || arg === "-c") {
      args["config"] = argv[++i];
    } else if (arg.startsWith("--") || arg.startsWith("-")) {
      const key = arg.startsWith("--") ? arg.slice(2) : arg.slice(1);
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
  if (args["config"]) {
    const configPath = path.resolve(args["config"] as string);
    if (!fs.existsSync(configPath)) {
      console.error(`Error: config file not found: ${configPath}`);
      process.exit(1);
    }
    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    const files = config.files || config.local_images || config.images || [];
    return { files: files.map((f: string) => path.resolve(f)), stdin: false };
  }

  const stdin = args["stdin"] === true;
  if (stdin) {
    return { files: [], stdin: true };
  }

  if (positional.length === 0) {
    console.error("Error: at least one file path is required, or use --stdin");
    console.error(
      'Usage: upload_image.ts <file1> [file2 ...]  or  upload_image.ts --stdin  or  upload_image.ts --config config.json'
    );
    process.exit(1);
  }

  return {
    files: positional.map((f) => path.resolve(f)),
    stdin: false,
  };
}

async function uploadFile(filePath: string): Promise<UploadResult> {
  const resolvedPath = path.resolve(filePath);

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`File not found: ${resolvedPath}`);
  }

  const stat = fs.statSync(resolvedPath);
  if (!stat.isFile()) {
    throw new Error(`Not a file: ${resolvedPath}`);
  }

  const buffer = fs.readFileSync(resolvedPath);

  // Build multipart form data
  const boundary = `----AgnesUploadFormBoundary${Date.now()}${Math.random()}`;
  const contentType = determineContentType(resolvedPath);

  let body = "";
  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="file"; filename="${path.basename(resolvedPath)}"\r\n`;
  body += `Content-Type: ${contentType}\r\n\r\n`;
  const bodyPrefix = Buffer.from(body, "utf-8");

  const trailer = `\r\n--${boundary}--\r\n`;

  const fullBody = Buffer.concat([bodyPrefix, buffer, Buffer.from(trailer)]);

  const res = await fetch("https://apihub.agnes-ai.com/v1/images/upload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
    },
    body: fullBody,
  });

  if (!res.ok) {
    const text = await res.text();
    let errMsg: string;
    try {
      const json = JSON.parse(text);
      errMsg = json.error?.message || json.message || text;
    } catch {
      errMsg = text;
    }
    throw new Error(
      `Upload failed for ${resolvedPath}: HTTP ${res.status} - ${errMsg}`
    );
  }

  const data = await res.json();
  const url = data.url || data.image_url || data.images?.[0]?.url;

  if (!url) {
    throw new Error(
      `Upload succeeded but no URL returned for ${resolvedPath}: ${JSON.stringify(data)}`
    );
  }

  return { url, file: resolvedPath };
}

async function uploadFromStdin(): Promise<UploadResult> {
  const chunks: Buffer[] = [];

  const rl = readline.createInterface({
    input: process.stdin,
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    // Try to detect base64 or binary
    const cleaned = line.replace(/[\r\n\s]/g, "");
    if (cleaned.length > 0) {
      chunks.push(Buffer.from(cleaned, "base64"));
    }
  }

  if (chunks.length === 0) {
    throw new Error("No data received on stdin");
  }

  const buffer = Buffer.concat(chunks);

  // Upload with a generic filename
  const boundary = `----AgnesUploadFormBoundary${Date.now()}${Math.random()}`;
  const contentType = "image/png"; // default for stdin

  let body = "";
  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="file"; filename="stdin_image.png"\r\n`;
  body += `Content-Type: ${contentType}\r\n\r\n`;
  const bodyPrefix = Buffer.from(body, "utf-8");

  const trailer = `\r\n--${boundary}--\r\n`;

  const fullBody = Buffer.concat([bodyPrefix, buffer, Buffer.from(trailer)]);

  const res = await fetch("https://apihub.agnes-ai.com/v1/images/upload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
    },
    body: fullBody,
  });

  if (!res.ok) {
    const text = await res.text();
    let errMsg: string;
    try {
      const json = JSON.parse(text);
      errMsg = json.error?.message || json.message || text;
    } catch {
      errMsg = text;
    }
    throw new Error(`Stdin upload failed: HTTP ${res.status} - ${errMsg}`);
  }

  const data = await res.json();
  const url = data.url || data.image_url || data.images?.[0]?.url;

  if (!url) {
    throw new Error(
      `Upload succeeded but no URL returned from stdin: ${JSON.stringify(data)}`
    );
  }

  return { url };
}

function determineContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const map: Record<string, string> = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".bmp": "image/bmp",
    ".tiff": "image/tiff",
    ".svg": "image/svg+xml",
  };
  return map[ext] || "image/png";
}

async function main() {
  const { files, stdin } = parseArgs(process.argv.slice(2));

  let results: UploadResult[] = [];

  if (stdin) {
    const result = await uploadFromStdin();
    results.push(result);
  } else if (files.length > 0) {
    for (const file of files) {
      const result = await uploadFile(file);
      results.push(result);
    }
  }

  // Output just the URLs as a JSON array
  const urls = results.map((r) => r.url);
  console.log(JSON.stringify(urls));
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
