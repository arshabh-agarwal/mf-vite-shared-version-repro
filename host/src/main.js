import * as React from 'react';
import { createRoot } from 'react-dom/client';

createRoot(document.getElementById('host')).render(
  React.createElement('p', null, `host React: ${React.version}`)
);

const remote = await import('remote/App');
remote.mount(document.getElementById('remote'));

const result = {
  hostReact: React.version,
  remoteReact: remote.React.version,
  sameCopy: remote.React.createElement === React.createElement,
};
document.getElementById('result').textContent = JSON.stringify(result, null, 2);
