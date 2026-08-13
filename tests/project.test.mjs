import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
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

test('corporate workflow documentation is complete', async () => {
  const [architecture, workflows, operations] = await Promise.all([
    read('docs/architecture.md'),
    read('docs/workflows.md'),
    read('docs/operations.md')
  ]);
  for (const name of ['Incoming Lead', 'CRM Demo API', 'Manager Reply', 'SLA Monitor', 'Critical Alerts', 'Daily Director Report']) {
    assert.match(workflows, new RegExp(name));
  }
  assert.match(architecture, /ожидание > 30 минут/);
  assert.match(operations, /Production checklist/);
});

test('sanitized n8n exports are complete and contain no credentials', async () => {
  const files = (await readdir(new URL('../workflows/', import.meta.url)))
    .filter(name => name.endsWith('.json'))
    .sort();
  assert.equal(files.length, 9);
  for (const file of files) {
    const text = await read(`workflows/${file}`);
    const workflow = JSON.parse(text);
    assert.equal(workflow.active, false);
    assert.ok(Array.isArray(workflow.nodes) && workflow.nodes.length > 0);
    assert.doesNotMatch(text, /"credentials"|"webhookId"|n8n\.vsellm\.info/);
  }
});
