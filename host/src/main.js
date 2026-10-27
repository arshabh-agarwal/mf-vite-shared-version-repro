import * as React from 'react';
import { createRoot } from 'react-dom/client';

createRoot(document.getElementById('host')).render(
  React.createElement('p', null, `host React: ${React.version}`)
);

const remote = await import('remote/App');
remote.mount(document.getElementById('remote'));

// What the runtime's own share resolution picks for the remote's `react` (requiredVersion ^19.0.0).
const remoteInstance = window.__FEDERATION__.__INSTANCES__.find((i) => i.name === 'remote');
const runtimeReact = (await remoteInstance.loadShare('react'))();

const result = {
  hostReact: React.version,
  remoteReact: remote.React.version,
  runtimePicksForRemote: runtimeReact.version,
  sameCopy: remote.React === React || remote.React.createElement === React.createElement,
};
document.getElementById('result').textContent = JSON.stringify(result, null, 2);
