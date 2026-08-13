import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('the page loads every required asset in dependency order', async () => {
  const html = await read('index.html');
  const assets = ['styles.css', 'data.js', 'config.js', 'app.js'];
  for (const asset of assets) assert.match(html, new RegExp(asset.replace('.', '\\.')));
  assert.ok(html.indexOf('data.js') < html.indexOf('config.js'));
  assert.ok(html.indexOf('config.js') < html.indexOf('app.js'));
});

test('public configuration contains no deployed webhook host', async () => {
  const config = await read('config.js');
  assert.match(config, /n8nBaseUrl:''/);
  assert.doesNotMatch(config, /https?:\/\/[^'" ]+/);
});

test('demo data and CRM controls are present', async () => {
  const [data, app, html] = await Promise.all([read('data.js'), read('app.js'), read('index.html')]);
  assert.match(data, /const deals=/);
  assert.match(app, /health_check/);
  assert.match(app, /get_deals/);
  for (const id of ['search', 'mode', 'rows', 'aiRun', 'slaDemo']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
});

