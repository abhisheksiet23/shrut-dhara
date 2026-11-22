// Read-only production smoke check: route rewrites, exact source/audio bytes, ranges and shell identity.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const origin = process.env.DEPLOYMENT_URL ?? 'https://shrutdhara.vercel.app';
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const results = [];
async function check(path, expected) {
  const response = await fetch(origin + path);
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (expected && sha(bytes) !== sha(expected)) throw new Error(`${path}: deployed bytes differ`);
  results.push({ path, status: response.status, sha256: sha(bytes), bytes: bytes.length });
  return bytes;
}

const id = 'acharanga:1:1:jacobi1884:1:1';
const localShell = await readFile('web/dist/shrutdhara/browser/index.html');
for (const path of ['/', '/study', '/library', `/read/${id}`, `/listen/${id}`, '/listen/commentary', '/preview/read/fixture:reflection:1', '/settings']) {
  await check(path, localShell);
}
const main = localShell.toString().match(/src="(main-[^"]+\.js)"/)[1];
await check('/' + main, await readFile('web/dist/shrutdhara/browser/' + main));
await check('/sw.js', await readFile('web/dist/shrutdhara/browser/sw.js'));
for (const path of ['/content/shastraparijna-v2/study.json', '/narration/meaning-v1/manifest.json', '/narration/meaning-v1/credits.txt', '/narration/meaning-v1/transcript.txt']) {
  await check(path, await readFile('web/public' + path));
}
const manifest = JSON.parse(await readFile('web/public/narration/meaning-v1/manifest.json', 'utf8'));
for (const part of manifest.parts) {
  const bytes = await check(part.url, await readFile('web/public' + part.url));
  if (bytes.length !== part.bytes || sha(bytes) !== part.sha256) throw new Error('Manifest integrity mismatch');
  const response = await fetch(origin + part.url, { headers: { Range: 'bytes=0-1023' } });
  if (response.status !== 206 || (await response.arrayBuffer()).byteLength !== 1024) throw new Error(`${part.url}: range request failed`);
}
await mkdir('docs/evidence/sutra-journey', { recursive: true });
await writeFile('docs/evidence/sutra-journey/deployment.json', JSON.stringify({ origin, checkedAt: new Date().toISOString(), main, audioRanges: 7, results }, null, 2) + '\n');
console.log(`${origin}: ${results.length} exact-byte checks and 7 audio ranges passed; ${main}`);
