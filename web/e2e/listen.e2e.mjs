// Real-browser regression checks for the listening journey.
// Needs a production build (npm run build) and Chrome. Run: npm run e2e
// Set E2E_CHROME to a Chrome/Chromium executable if the default "chrome" channel is not installed.
import { spawn } from 'node:child_process';
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';

const PORT = 4179;
const BASE = `http://127.0.0.1:${PORT}`;
let server, browser;

before(async () => {
  server = spawn(process.execPath, ['scripts/serve.mjs'], {
    env: { ...process.env, PORT: String(PORT) },
    stdio: 'ignore',
  });
  for (let attempt = 0; attempt < 50; attempt++) {
    try {
      if ((await fetch(BASE)).ok) break;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  browser = await chromium.launch({
    ...(process.env.E2E_CHROME ? { executablePath: process.env.E2E_CHROME } : { channel: 'chrome' }),
    headless: true,
    args: ['--autoplay-policy=no-user-gesture-required', '--no-sandbox'],
  });
});
after(async () => {
  await browser?.close();
  server?.kill();
});

async function open(path = '/listen/commentary') {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  await page.goto(BASE + path);
  await page.waitForSelector('.queue-item', { timeout: 15000 });
  return { context, page, errors };
}
const play = (page, index) =>
  page.locator('.queue-item').nth(index).locator('button.icon-button').click();
const status = (page) => page.locator('.player-status').innerText();
async function seekToEnd(page, margin = 3) {
  const slider = page.locator('#audio-seek');
  const max = Number(await slider.getAttribute('max'));
  await slider.fill(String(Math.max(0, Math.floor(max) - margin)));
  await slider.dispatchEvent('change');
}

describe('listening journey', () => {
  it('retains the earlier seven-section commentary as a separate journey', async () => {
    const { context, page, errors } = await open();
    assert.equal(new URL(page.url()).pathname, '/listen/commentary');
    assert.equal(await page.locator('.queue-item').count(), 7);
    assert.deepEqual(errors, []);
    await context.close();
  });

  it('plays a section and resumes it, paused, after reload', async () => {
    const { context, page } = await open();
    await play(page, 2);
    await page.waitForTimeout(3000);
    assert.match(await status(page), /Playing/);
    await page.reload();
    await page.waitForSelector('.queue-item');
    await page.waitForTimeout(800);
    assert.equal(await page.locator('.player-title h2').innerText(), 'अप्काय');
    assert.match(await status(page), /Paused/);
    await context.close();
  });

  it('keeps the mini-player when navigating inside the app', async () => {
    const { context, page } = await open();
    await play(page, 0);
    await page.waitForTimeout(1500);
    await page.locator('.mobile-nav a').first().click();
    await page.waitForSelector('.mini-player');
    await context.close();
  });

  it('hands over to the next section, and stops after the last', async () => {
    const { context, page } = await open();
    await play(page, 0);
    await page.waitForTimeout(1500);
    await seekToEnd(page);
    await page.waitForTimeout(6500);
    assert.match(await status(page), /Section 2 of 7/);
    assert.equal(await page.locator('.player-title h2').innerText(), 'पृथ्वीकाय');
    await play(page, 6);
    await page.waitForTimeout(1500);
    await seekToEnd(page);
    await page.waitForTimeout(6500);
    assert.match(await status(page), /All sections finished/);
    await context.close();
  });

  it('plays a saved section with the network off', async () => {
    const { context, page } = await open();
    await page.getByRole('button', { name: /Save for offline/ }).click();
    await page.waitForSelector("button:has-text('Saved for offline')", { timeout: 90000 });
    await page.waitForTimeout(1500);
    await context.setOffline(true);
    await page.reload();
    await page.waitForSelector('.queue-item', { timeout: 15000 });
    await play(page, 4);
    await page.waitForTimeout(3000);
    const text = await status(page);
    assert.match(text, /Playing/);
    assert.doesNotMatch(text, /streaming/);
    await context.close();
  });
});
