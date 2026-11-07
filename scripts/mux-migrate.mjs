// Gives every project video a Mux streaming copy, without re-uploading anything by hand.
//
// For each video that has no "Streaming copy (Mux)" yet, this asks Sanity's Mux add-on to
// pull the video from its Sanity link into Mux (the same thing the Studio's "upload from
// URL" does, using the Mux keys saved in the Studio), then fills in that video's field.
//
//   Preview, changes nothing:   node scripts/mux-migrate.mjs --dry-run
//   One project only:           node scripts/mux-migrate.mjs --project=Gensigils
//   Run it:                     SANITY_WRITE_TOKEN=... node scripts/mux-migrate.mjs
//
// SANITY_WRITE_TOKEN: a token with Editor rights, from sanity.io/manage → API → Tokens.
// Project ID and dataset are read from .env.local. Safe to run again: videos that already
// have a streaming copy are skipped.
//
// The script ends by running out rather than calling process.exit() after network calls,
// which can crash Node on Windows while connections are still closing.
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";

const MUX_API_VERSION = "2024-03-05"; // what sanity-plugin-mux-input uses
const PLUGIN_VERSION = "5.2.1";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const onlyProject = args.find((a) => a.startsWith("--project="))?.split("=")[1]?.toLowerCase();

function readEnvFile(path) {
  try {
    return Object.fromEntries(
      readFileSync(path, "utf8")
        .split(/\r?\n/)
        .filter((line) => /^\s*[A-Z_]+=/.test(line))
        .map((line) => {
          const i = line.indexOf("=");
          return [line.slice(0, i).trim(), line.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
        }),
    );
  } catch {
    return {};
  }
}

const fileEnv = readEnvFile(".env.local");
const env = (name) => process.env[name] || fileEnv[name];

const projectId = env("NEXT_PUBLIC_SANITY_PROJECT_ID");
const dataset = env("NEXT_PUBLIC_SANITY_DATASET");
const writeToken = process.env.SANITY_WRITE_TOKEN;
// Reading needs a token too (drafts are private): the write token, or else the site's read token.
const readToken = writeToken || env("SANITY_API_READ_TOKEN");

const api = `https://${projectId}.api.sanity.io/v${MUX_API_VERSION}`;

async function sanity(path, init = {}) {
  const token = init.method === "POST" ? writeToken : readToken;
  const res = await fetch(`${api}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...init.headers },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${init.method ?? "GET"} ${path.split("?")[0]} → ${res.status}: ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : null;
}

const name = (job) => `${job.title}: ${job.filename ?? job.url.split("/").pop()}`;

/** Every video in need of a streaming copy, grouped by file. A video in both a draft and its
 *  published version is sent to Mux once, and if either already has a copy the other reuses it. */
async function findJobs() {
  const videoFields = `{ _key, "url": asset->url, "filename": asset->originalFilename, "muxRef": mux.asset._ref }`;
  const query = `*[_type == "project"]{
    _id, title,
    "gallery": images[_type == "file" && defined(asset)] ${videoFields},
    "story": description[_type == "file" && defined(asset)] ${videoFields}
  }`;
  const { result: docs } = await sanity(`/data/query/${dataset}?query=${encodeURIComponent(query)}`);

  const jobs = new Map(); // url → { url, filename, title, existingRef, targets: [{ docId, field, key }] }
  for (const doc of docs) {
    if (onlyProject && !doc.title?.toLowerCase().includes(onlyProject)) continue;
    for (const [field, list] of [["images", doc.gallery], ["description", doc.story]]) {
      for (const v of list ?? []) {
        if (!v.url) continue;
        const job = jobs.get(v.url) ?? { url: v.url, filename: v.filename, title: doc.title, existingRef: null, targets: [] };
        if (v.muxRef) job.existingRef = v.muxRef;
        else job.targets.push({ docId: doc._id, field, key: v._key });
        jobs.set(v.url, job);
      }
    }
  }
  return [...jobs.values()].filter((job) => job.targets.length > 0);
}

/** Has Sanity's Mux add-on pull the video into Mux; returns the id of its Sanity record. */
async function createMuxAsset(job) {
  const uuid = randomUUID();
  const muxBody = {
    input: [{ type: "video", url: job.url }],
    advanced_playback_policies: [{ policy: "public" }],
    // "basic" is plenty for short silent loops and costs less to encode than "plus".
    video_quality: "basic",
    max_resolution_tier: "1080p",
  };
  const params = new URLSearchParams({
    muxBody: JSON.stringify(muxBody),
    filename: job.filename ?? job.url.split("/").pop(),
    sanityVersion: PLUGIN_VERSION,
  });
  const created = await sanity(`/addons/mux/assets/${dataset}?${params}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "MUX-Proxy-UUID": uuid },
  });
  return created?.results?.[0]?.document?._id ?? created?.results?.[0]?.id ?? uuid;
}

/** Points each copy of the video (draft and/or published) at the Mux record. */
async function linkMuxAsset(job, assetId) {
  const mutations = job.targets.map((t) => ({
    patch: {
      id: t.docId,
      set: {
        [`${t.field}[_key=="${t.key}"].mux`]: {
          _type: "mux.video",
          asset: { _type: "reference", _weak: true, _ref: assetId },
        },
      },
    },
  }));
  await sanity(`/data/mutate/${dataset}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mutations }),
  });
}

async function main() {
  if (!projectId || !dataset) {
    console.error("Run this from the repo root: NEXT_PUBLIC_SANITY_PROJECT_ID and NEXT_PUBLIC_SANITY_DATASET come from .env.local.");
    process.exitCode = 1;
    return;
  }
  if (!dryRun && !writeToken) {
    console.error("Set SANITY_WRITE_TOKEN first (or add --dry-run to just preview).");
    process.exitCode = 1;
    return;
  }

  const jobs = await findJobs();
  if (jobs.length === 0) {
    console.log("Nothing to do: every video already has a streaming copy.");
    return;
  }

  console.log(`${jobs.length} video(s) need a streaming copy${dryRun ? " (dry run, nothing will change)" : ""}:\n`);
  for (const job of jobs) {
    const where = job.targets.map(
      (t) => `${t.docId.startsWith("drafts.") ? "draft" : "published"} ${t.field === "images" ? "gallery" : "story"}`,
    );
    const reuse = job.existingRef ? ", reuses the copy its other version has" : "";
    console.log(`  ${name(job)}  (${where.join(", ")}${reuse})`);
  }
  if (dryRun) return;

  console.log("");
  let done = 0;
  for (const job of jobs) {
    try {
      await linkMuxAsset(job, job.existingRef ?? (await createMuxAsset(job)));
      done++;
      console.log(`  ✓ ${name(job)}`);
    } catch (err) {
      console.log(`  ✗ ${name(job)}\n    ${err.message}`);
      process.exitCode = 1;
    }
  }

  console.log(`\n${done} of ${jobs.length} done. Mux takes a minute or so to process each new one, and the`);
  console.log("site streams it from then on (a video may not play during that first minute).");
}

await main();
