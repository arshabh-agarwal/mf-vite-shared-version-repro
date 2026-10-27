import * as React from 'react';
import { createRoot } from 'react-dom/client';

function HostApp() {
  const [ready, setReady] = React.useState(false);
  React.useEffect(() => setReady(true), []);
  return React.createElement('p', { id: 'host-hooks' }, `host React: ${React.version}, hooks ${ready ? 'ok' : 'pending'}`);
}

createRoot(document.getElementById('host')).render(React.createElement(HostApp));

const remote = await import('remote/App');
remote.mount(document.getElementById('remote'));

const waitForHooks = async () => {
  for (let i = 0; i < 100; i++) {
    const host = document.getElementById('host-hooks')?.textContent ?? '';
    const remote = document.getElementById('remote-hooks')?.textContent ?? '';
    if (host.endsWith('hooks ok') && remote.endsWith('hooks ok')) return true;
    await new Promise((r) => setTimeout(r, 50));
  }
  return false;
};

const result = {
  hostReact: React.version,
  remoteReact: remote.React.version,
  sameCopy: remote.React.createElement === React.createElement,
  hooksWork: await waitForHooks(),
};
document.getElementById('result').textContent = JSON.stringify(result, null, 2);
