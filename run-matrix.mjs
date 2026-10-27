// Builds and serves the host and remote for each combination below, and checks which React each
// side runs against what Module Federation's share resolution should give it:
// - version-first: each side gets the highest registered version, if it satisfies that side's
//   requiredVersion, and otherwise a registered version that does.
// - loaded-first: a side reuses a copy that's already loaded (the host's) if it satisfies that
//   side's requiredVersion.
//
//   node run-matrix.mjs
//
// It reinstalls React in host/ and remote/ for each case, and puts the default versions back when
// it finishes.
import { execFileSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import { chromium } from 'playwright';

// expected: [host React, remote React] per strategy.
const CASES = [
  {
    name: 'Same version',
    host: ['19.3.1', '^19.3.1'],
    remote: ['19.3.1', '^19.3.1'],
    expected: { 'version-first': ['19.3.1', '19.3.1'], 'loaded-first': ['19.3.1', '19.3.1'] },
  },
  {
    name: 'Host newer (minor)',
    host: ['19.3.1', '^19.3.1'],
    remote: ['19.0.0', '^19.0.0'],
    expected: { 'version-first': ['19.3.1', '19.3.1'], 'loaded-first': ['19.3.1', '19.3.1'] },
  },
  {
    name: 'Host newer (patch)',
    host: ['19.3.1', '^19.3.1'],
    remote: ['19.3.0', '^19.3.0'],
    expected: { 'version-first': ['19.3.1', '19.3.1'], 'loaded-first': ['19.3.1', '19.3.1'] },
  },
  {
    name: 'Remote newer, host range allows it',
    host: ['19.0.0', '^19.0.0'],
    remote: ['19.3.1', '^19.0.0'],
    expected: { 'version-first': ['19.3.1', '19.3.1'], 'loaded-first': ['19.0.0', '19.0.0'] },
  },
  {
    name: 'Remote needs newer than host',
    host: ['19.0.0', '~19.0.0'],
    remote: ['19.3.1', '^19.3.0'],
    expected: { 'version-first': ['19.0.0', '19.3.1'], 'loaded-first': ['19.0.0', '19.3.1'] },
  },
  {
    name: 'Different majors',
    host: ['18.3.1', '^18.3.1'],
    remote: ['19.3.1', '^19.0.0'],
    expected: { 'version-first': ['18.3.1', '19.3.1'], 'loaded-first': ['18.3.1', '19.3.1'] },
  },
];
const STRATEGIES = ['version-first', 'loaded-first'];

const RESTORE = ['host/package.json', 'remote/package.json', 'pnpm-lock.yaml'].map((file) => [
  file,
  fs.readFileSync(file, 'utf-8'),
]);

const run = (cmd, args, env = {}) =>
  execFileSync(cmd, args, { stdio: 'pipe', env: { ...process.env, ...env } });

function installReact(pkg, version) {
  run('pnpm', ['--filter', pkg, 'add', `react@${version}`, `react-dom@${version}`]);
}

async function waitFor(url) {
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`${url} did not start`);
}

async function runCase(browser, { host, remote }, strategy) {
  installReact('mf-repro-host', host[0]);
  installReact('mf-repro-remote', remote[0]);
  const env = {
    SHARE_STRATEGY: strategy,
    HOST_REQUIRED_VERSION: host[1],
    REMOTE_REQUIRED_VERSION: remote[1],
  };
  run('pnpm', ['--filter', 'mf-repro-remote', 'build'], env);
  run('pnpm', ['--filter', 'mf-repro-host', 'build'], env);

  const servers = ['host', 'remote'].map((dir) =>
    spawn('pnpm', ['exec', 'vite', 'preview'], { cwd: dir, stdio: 'ignore', detached: true })
  );
  try {
    await waitFor('http://localhost:4173');
    await waitFor('http://localhost:4174/mf-manifest.json');
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('http://localhost:4173');
    await page.waitForFunction(
      () => document.getElementById('result').textContent !== 'loading...',
      null,
      { timeout: 15000 }
    );
    const result = JSON.parse(await page.textContent('#result'));
    await page.close();
    return { ...result, errors };
  } finally {
    for (const server of servers) process.kill(-server.pid, 'SIGTERM');
  }
}

const browser = await chromium.launch();
const rows = [];
try {
  for (const testCase of CASES) {
    for (const strategy of STRATEGIES) {
      const result = await runCase(browser, testCase, strategy);
      const [host, remote] = testCase.expected[strategy];
      const pass =
        result.hostReact === host && result.remoteReact === remote && result.errors.length === 0;
      rows.push({ ...testCase, strategy, ...result, pass });
      console.log(`${pass ? 'PASS' : 'FAIL'}  ${testCase.name} (${strategy})`, result);
    }
  }
} finally {
  await browser.close();
  for (const [file, contents] of RESTORE) fs.writeFileSync(file, contents);
  run('pnpm', ['install']);
}

const table = [
  '| Case | Host installs (range) | Remote installs (range) | Strategy | Expected (host / remote) | Actual (host / remote) | One copy | Result |',
  '| --- | --- | --- | --- | --- | --- | --- | --- |',
  ...rows.map(
    (r) =>
      `| ${r.name} | ${r.host[0]} (\`${r.host[1]}\`) | ${r.remote[0]} (\`${r.remote[1]}\`) | \`${r.strategy}\` | ${r.expected[r.strategy].join(' / ')} | ${r.hostReact} / ${r.remoteReact} | ${r.sameCopy ? 'yes' : 'no'} | ${r.pass ? 'as expected' : '**wrong**'} |`
  ),
].join('\n');
fs.writeFileSync('results.md', `${table}\n`);
console.log(`\n${table}`);
