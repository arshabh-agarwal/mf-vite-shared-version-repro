import * as React from 'react';
import { createRoot } from 'react-dom/client';

export function mount(el) {
  createRoot(el).render(React.createElement('p', null, `remote React: ${React.version}`));
}

export { React };
