import { cp, mkdir, rm } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const output = new URL('dist/', root);
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

// Publish only website files, excluding repository and local tooling data.
for (const path of ['index.html', '404.html', 'impressum.html', 'styles.css', 'script.js', 'not-found.js', 'img', 'src']) {
  await cp(new URL(path, root), new URL(path, output), { recursive: true });
}
