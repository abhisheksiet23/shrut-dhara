import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';

const BASE = 'http://127.0.0.1:4181';
const FIRST = 'acharanga:1:1:jacobi1884:1:1';
const id = (number, section = 1) => `acharanga:1:1:jacobi1884:${section}:${number}`;
let server, browser;

before(async () => {
  server = spawn(process.execPath, ['scripts/serve.mjs'], {
    env: { ...process.env, PORT: '4181' },
    stdio: 'ignore',
  });
  for (let attempt = 0; attempt < 50; attempt++) {
    try {
      if ((await fetch(BASE)).ok) break;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  browser = await chromium.launch({
    ...(process.env.E2E_CHROME
      ? { executablePath: process.env.E2E_CHROME }
      : { channel: 'chrome' }),
    headless: true,
    args: ['--autoplay-policy=no-user-gesture-required', '--no-sandbox'],
  });
  await mkdir('../docs/evidence/sutra-journey', { recursive: true });
});

after(async () => {
  await browser?.close();
  server?.kill();
});

async function open(path = '/study', width = 390) {
  const context = await browser.newContext({ viewport: { width, height: 844 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  await page.goto(BASE + path);
  await page.locator('main h1').waitFor();
  return { context, page, errors };
}

async function saved(page) {
  return page.evaluate(async () => {
    const request = indexedDB.open('shrutdhara-v1');
    const db = await new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const result = await new Promise((resolve, reject) => {
      const read = db.transaction('personal').objectStore('personal').get('personal');
      read.onsuccess = () => resolve(read.result?.data);
      read.onerror = () => reject(read.error);
    });
    db.close();
    return result;
  });
}

describe('sutra study journey', () => {
  it('keeps an unavailable saved audio reference without silently opening the first sutra', async () => {
    const { context, page } = await open('/read/' + FIRST);
    await page.waitForFunction(async () => {
      const request = indexedDB.open('shrutdhara-v1');
      const db = await new Promise((resolve) => {
        request.onsuccess = () => resolve(request.result);
      });
      const transaction = db.transaction('personal', 'readwrite');
      const store = transaction.objectStore('personal');
      const envelope = await new Promise((resolve) => {
        const request = store.get('personal');
        request.onsuccess = () => resolve(request.result);
      });
      if (!envelope) {
        db.close();
        return false;
      }
      envelope.data.listening = {
        recordingId: 'shastraparijna:hindi-meaning:sample-v1',
        part: 99,
        seconds: 34,
      };
      store.put(envelope);
      await new Promise((resolve) => {
        transaction.oncomplete = resolve;
      });
      db.close();
      return true;
    });
    await page.goto(BASE + '/listen');
    await page
      .getByRole('heading', { name: 'This sutra reference is unavailable', exact: true })
      .waitFor();
    assert.equal((await saved(page)).listening.part, 99);
    assert.equal(
      await page.getByRole('button', { name: 'Play this sutra', exact: true }).count(),
      0,
    );
    await context.close();
  });

  it('shows the full source order, opens exact meaning and supports adjacent/history navigation', async () => {
    const { context, page, errors } = await open();
    assert.equal(await page.locator('.sutra-row').count(), 48);
    await page
      .locator('.sutra-row')
      .first()
      .getByRole('link', { name: 'Read', exact: true })
      .click();
    await page.getByRole('heading', { name: 'Sutra 1.1.1', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Next sutra', exact: true }).click();
    await page.getByRole('heading', { name: 'Sutra 1.1.2', exact: true }).waitFor();
    await page.goBack();
    await page.getByRole('heading', { name: 'Sutra 1.1.1', exact: true }).waitFor();
    await page.screenshot({
      path: '../docs/evidence/sutra-journey/reader-phone.png',
      fullPage: true,
    });
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
    );
    assert.deepEqual(errors, []);
    await context.close();
  });

  it('plays the same sutra, bridges to reading and preserves independent positions and bookmarks', async () => {
    const { context, page, errors } = await open('/listen/' + id(3));
    await page.getByRole('button', { name: 'Play this sutra', exact: true }).click();
    await page.waitForFunction(() =>
      document.querySelector('.player-status')?.textContent.includes('Playing'),
    );
    await page.getByRole('button', { name: 'Forward 15 seconds', exact: true }).click();
    await page.getByRole('button', { name: 'Pause audio', exact: true }).click();
    const position = (await saved(page)).listening;
    assert.equal(position.part, 2);
    await page.getByRole('button', { name: 'Bookmark this sutra', exact: true }).click();
    await page.getByRole('link', { name: 'Read this sutra', exact: true }).click();
    await page.getByRole('heading', { name: 'Sutra 1.1.3', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Next sutra', exact: true }).click();
    await page.getByRole('heading', { name: 'Sutra 1.1.4', exact: true }).waitFor();
    await page.locator('.mini-player .mini-title').click();
    await page.getByRole('heading', { name: 'Sutra 1.1.3', exact: true }).waitFor();
    const after = await saved(page);
    assert.equal(after.listening.part, 2);
    assert.ok(after.listening.seconds >= position.seconds - 1);
    assert.equal(after.reading.sutraId, id(4));
    assert.ok(after.bookmarks.some((bookmark) => bookmark.sutraId === id(3)));
    await page.reload();
    await page.getByRole('heading', { name: 'Sutra 1.1.3', exact: true }).waitFor();
    assert.match(await page.locator('.player-status').innerText(), /Paused/);
    assert.deepEqual(errors, []);
    await context.close();
  });

  it('replays the current unit, auto-advances with matching text and stops at the sample boundary', async () => {
    const { context, page, errors } = await open('/listen/' + FIRST);
    await page.getByRole('button', { name: 'Play this sutra', exact: true }).click();
    await page.waitForFunction(() =>
      document.querySelector('.player-status')?.textContent.includes('Playing'),
    );
    await page.getByRole('button', { name: 'Replay this sutra', exact: true }).click();
    assert.equal(await page.locator('main h1').innerText(), 'Sutra 1.1.1');
    await page.locator('#sutra-seek').fill('10');
    await page.locator('#sutra-seek').dispatchEvent('change');
    await page
      .getByRole('heading', { name: 'Sutra 1.1.2', exact: true })
      .waitFor({ timeout: 12000 });
    await page.getByRole('button', { name: 'Pause audio', exact: true }).click();
    await page.goto(BASE + '/listen/' + id(7));
    await page.getByRole('button', { name: 'Play this sutra', exact: true }).click();
    await page.waitForFunction(() =>
      document.querySelector('.player-status')?.textContent.includes('Playing'),
    );
    await page.locator('#sutra-seek').fill('28');
    await page.locator('#sutra-seek').dispatchEvent('change');
    await page.waitForFunction(
      () =>
        document.querySelector('.player-status')?.textContent.includes('End of the audio sample'),
      { timeout: 12000 },
    );
    await page.getByRole('button', { name: 'Next sutra', exact: true }).click();
    await page
      .getByRole('heading', { name: 'Audio is not ready for this sutra', exact: true })
      .waitFor();
    assert.equal(await page.locator('main h1').innerText(), 'Sutra 1.2.1');
    assert.deepEqual(errors, []);
    await context.close();
  });

  it('saves real meaning audio and reopens its deep link offline', async () => {
    const { context, page, errors } = await open('/listen/' + id(4));
    await page.getByRole('button', { name: 'Save audio sample', exact: true }).click();
    await page.getByRole('button', { name: 'Saved for offline', exact: true }).waitFor();
    await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
    await context.setOffline(true);
    await page.reload();
    await page.getByRole('button', { name: 'Play this sutra', exact: true }).click();
    await page.waitForFunction(() =>
      document.querySelector('.player-status')?.textContent.includes('Playing'),
    );
    assert.doesNotMatch(await page.locator('.player-status').innerText(), /streaming/);
    await page.getByRole('button', { name: 'Pause audio', exact: true }).click();
    await page.screenshot({
      path: '../docs/evidence/sutra-journey/listen-phone.png',
      fullPage: true,
    });
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
    );
    assert.deepEqual(errors, []);
    await context.close();
  });

  it('retains commentary time independently when switching recordings', async () => {
    const { context, page, errors } = await open('/listen/commentary');
    await page.locator('.queue-item').nth(3).locator('button.icon-button').click();
    await page.waitForFunction(() =>
      document.querySelector('.player-status')?.textContent.includes('Playing'),
    );
    await page.getByRole('button', { name: 'Pause audio', exact: true }).click();
    await page.getByRole('link', { name: 'Study contents', exact: false }).first().click();
    await page
      .locator('.sutra-row')
      .first()
      .getByRole('link', { name: 'Listen', exact: true })
      .click();
    await page.getByRole('button', { name: 'Play this sutra', exact: true }).click();
    await page.waitForFunction(() =>
      document.querySelector('.player-status')?.textContent.includes('Playing'),
    );
    await page.getByRole('button', { name: 'Pause audio', exact: true }).click();
    const state = await saved(page);
    assert.equal(state.listeningHistory['shastraparijna:hi:v1'].part, 3);
    await page
      .getByRole('link', { name: 'Earlier chapter commentary and saved position', exact: true })
      .click();
    await page.waitForFunction(() =>
      document.querySelector('.player-status')?.textContent.includes('Section 4 of 7'),
    );
    assert.deepEqual(errors, []);
    await context.close();
  });

  it('renders study and meaning layouts at desktop width with no overflow', async () => {
    const { context, page, errors } = await open('/study', 1440);
    await page.screenshot({
      path: '../docs/evidence/sutra-journey/contents-desktop.png',
      fullPage: true,
    });
    await page.goto(BASE + '/listen/' + id(5));
    await page.getByRole('heading', { name: 'Sutra 1.1.5', exact: true }).waitFor();
    await page.screenshot({
      path: '../docs/evidence/sutra-journey/listen-desktop.png',
      fullPage: true,
    });
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
    );
    assert.deepEqual(errors, []);
    await context.close();
  });
});
