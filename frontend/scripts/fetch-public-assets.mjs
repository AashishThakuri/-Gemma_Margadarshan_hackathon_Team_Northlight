import { mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const repository =
  "https://raw.githubusercontent.com/AashishThakuri/-Gemma_Margadarshan_hackathon_Team_Northlight/main/frontend/public";

const assets = [
  "about-section-image.png",
  "feature-art-turntable-v1.png",
  "film-grain-35mm.png",
  "gemma-error-comparison.png",
  "og.png",
  "poster-art-right.png",
  "verse-landing.png",
  "verse-v2-training-data.png",
];

const publicDirectory = path.resolve("public");
await mkdir(publicDirectory, { recursive: true });

for (const asset of assets) {
  const destination = path.join(publicDirectory, asset);

  try {
    if ((await stat(destination)).size > 0) {
      continue;
    }
  } catch {
    // The direct Vercel upload excludes large binary assets, so fetch them below.
  }

  const response = await fetch(`${repository}/${asset}`);
  if (!response.ok) {
    throw new Error(`Unable to download ${asset}: ${response.status}`);
  }

  await writeFile(destination, Buffer.from(await response.arrayBuffer()));
}
