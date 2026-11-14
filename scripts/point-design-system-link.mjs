// One-off: point Arkiv's "Design System" link (under More links) at the page on aalok.space
// instead of GitHub. Changes nothing else.
//
//   Run it (PowerShell):  $env:SANITY_WRITE_TOKEN="..."; node scripts/point-design-system-link.mjs
//
// SANITY_WRITE_TOKEN: a token with Editor rights, from sanity.io/manage → API → Tokens.
// The project and dataset come from .env.local.

import { readFileSync } from "fs";

const NEW_URL = "https://aalok.space/works/arkiv/design-system";
const OLD_URL_PART = "github.com/aalokok/arkiv/blob/master/docs/design-system.md";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => /^NEXT_PUBLIC_SANITY_(PROJECT_ID|DATASET)=/.test(l))
    .map((l) => l.split("=")),
);
const projectId = env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = env.NEXT_PUBLIC_SANITY_DATASET;
const token = process.env.SANITY_WRITE_TOKEN;
if (!projectId || !dataset) throw new Error("Run this from the repo root: the project and dataset come from .env.local.");
if (!token) throw new Error("Set SANITY_WRITE_TOKEN first (a token with Editor rights).");

const api = `https://${projectId}.api.sanity.io/v2024-01-01/data`;
const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

// The Arkiv project, published and any unpublished draft.
const query = encodeURIComponent(`*[_type == "project" && slug.current == "arkiv"]{ _id, moreLinks }`);
const found = await fetch(`${api}/query/${dataset}?query=${query}&perspective=raw`, { headers }).then((r) => r.json());
if (found.error) throw new Error(found.error.description ?? JSON.stringify(found.error));

const mutations = [];
for (const doc of found.result ?? []) {
  for (const link of doc.moreLinks ?? []) {
    if (link.url?.includes(OLD_URL_PART)) {
      mutations.push({ patch: { id: doc._id, set: { [`moreLinks[_key=="${link._key}"].url`]: NEW_URL } } });
      console.log(`${doc._id}: "${link.label}" → ${NEW_URL}`);
    }
  }
}
if (!mutations.length) {
  console.log("Nothing to change: no More links entry points at the GitHub design system.");
  process.exit(0);
}

const res = await fetch(`${api}/mutate/${dataset}`, { method: "POST", headers, body: JSON.stringify({ mutations }) });
const out = await res.json();
if (!res.ok) throw new Error(out.error?.description ?? JSON.stringify(out));
console.log(`Done: ${mutations.length} link(s) updated.`);
