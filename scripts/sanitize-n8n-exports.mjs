import {mkdir, readFile, readdir, writeFile} from 'node:fs/promises';
import path from 'node:path';

const [sourceDir, targetDir = 'workflows'] = process.argv.slice(2);
if (!sourceDir) throw new Error('Usage: node scripts/sanitize-n8n-exports.mjs <source-dir> [target-dir]');

const slugs = new Map([
  ['AI Sales Monitor — Analyze Dialogues', 'analyze-dialogues'],
  ['AI Sales Monitor — CRM Demo API', 'crm-demo-api'],
  ['AI Sales Monitor — Mock CRM', 'mock-crm'],
  ['AI Sales Monitor — Critical Alerts', 'critical-alerts'],
  ['AI Sales Monitor — Daily Report', 'daily-report'],
  ['AI Sales Monitor — Incoming Lead', 'incoming-lead'],
  ['AI Sales Monitor — Manager Reply', 'manager-reply'],
  ['AI Sales Monitor — SLA Monitor', 'sla-monitor'],
  ['AI Sales Monitor — Daily Director Report', 'daily-director-report'],
]);

const replacePrivateStrings = value => {
  if (typeof value !== 'string') return value;
  return value
    .replace(/https?:\/\/n8n\.[\w.-]+/gi, '__CONFIGURE_N8N_BASE_URL__')
    .replace(/\b\d{9,14}\b/g, '000000000');
};

function walk(value) {
  if (Array.isArray(value)) return value.map(walk);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, walk(child)]));
  }
  return replacePrivateStrings(value);
}

function sanitizeNode(sourceNode) {
  const node = walk(structuredClone(sourceNode));
  delete node.credentials;
  delete node.webhookId;

  const parameters = node.parameters ?? {};
  if (node.type === 'n8n-nodes-base.telegram' && /^-?\d+$/.test(String(parameters.chatId ?? ''))) {
    parameters.chatId = '__CONFIGURE_TELEGRAM_CHAT_ID__';
  }
  if (parameters.dataTableId?.value) {
    parameters.dataTableId.value = '__CONFIGURE_DATA_TABLE_ID__';
    parameters.dataTableId.cachedResultName = 'Configure your n8n data table';
  }
  if (parameters.documentId?.value) {
    parameters.documentId.value = '__CONFIGURE_GOOGLE_SHEET_ID__';
    parameters.documentId.cachedResultName = 'Configure your Google Sheet';
    delete parameters.documentId.cachedResultUrl;
  }
  if (parameters.workflowId?.value) {
    parameters.workflowId.value = '__CONFIGURE_WORKFLOW_ID__';
    parameters.workflowId.cachedResultName = 'Configure the target workflow';
  }
  return node;
}

await mkdir(targetDir, {recursive: true});
const sourceFiles = (await readdir(sourceDir)).filter(name => name.endsWith('.json')).sort();
let written = 0;

for (const sourceFile of sourceFiles) {
  const workflow = JSON.parse(await readFile(path.join(sourceDir, sourceFile), 'utf8'));
  const slug = slugs.get(workflow.name);
  if (!slug) continue;
  const sanitized = {
    name: workflow.name,
    nodes: workflow.nodes.map(sanitizeNode),
    connections: walk(workflow.connections ?? {}),
    settings: walk(workflow.settings ?? {executionOrder: 'v1'}),
    active: false,
  };
  await writeFile(path.join(targetDir, `${slug}.json`), `${JSON.stringify(sanitized, null, 2)}\n`, {mode: 0o644});
  written += 1;
}

if (written !== slugs.size) throw new Error(`Expected ${slugs.size} workflows, wrote ${written}`);
process.stdout.write(`Sanitized workflows: ${written}\n`);

