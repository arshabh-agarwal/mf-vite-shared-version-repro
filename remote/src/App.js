import * as React from 'react';
import { createRoot } from 'react-dom/client';

function RemoteApp() {
  const [ready, setReady] = React.useState(false);
  React.useEffect(() => setReady(true), []);
  return React.createElement('p', { id: 'remote-hooks' }, `remote React: ${React.version}, hooks ${ready ? 'ok' : 'pending'}`);
}

export function mount(el) {
  createRoot(el).render(React.createElement(RemoteApp));
}

export { React };
