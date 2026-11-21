import { build } from 'esbuild';
import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const output = 'dist/shrutdhara/browser';
const manifest = [];
async function collect(directory, prefix = '') {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relative = prefix + entry.name;
    if (relative === 'audio' || relative === 'sw.js') continue;
    if (entry.isDirectory()) await collect(path.join(directory, entry.name), relative + '/');
    else if (/\.(html|js|css|ttf|svg|png|ico|webmanifest|json|txt)$/.test(relative)) {
      const bytes = await readFile(path.join(directory, entry.name));
      if (bytes.length > 2 * 1024 * 1024) throw new Error(`Shell asset too large: ${relative}`);
      manifest.push({ url: '/' + relative, revision: createHash('sha256').update(bytes).digest('hex') });
    }
  }
}
await collect(output);
manifest.sort((a, b) => a.url.localeCompare(b.url));
const result = await build({ entryPoints: ['worker/sw.ts'], bundle: true, minify: true, target: 'es2022', format: 'iife', write: false });
const worker = result.outputFiles[0].text;
if (worker.split('self.__WB_MANIFEST').length !== 2) throw new Error('Expected one worker manifest placeholder.');
await writeFile(path.join(output, 'sw.js'), worker.replace('self.__WB_MANIFEST', JSON.stringify(manifest)));
console.log(`Offline worker prepared: ${manifest.length} shell/content/font assets. Audio requires explicit saving.`);
