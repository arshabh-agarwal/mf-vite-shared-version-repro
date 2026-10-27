# mf-vite-shared-version-repro

With `@module-federation/vite` 1.23.5, a remote doesn't reuse the host's copy of a non-singleton shared package, even when the host's version satisfies the remote's `requiredVersion`. It only reuses the host's copy when the two installed versions are exactly the same.

- `host/` installs `react@19.3.1` and shares `react` and `react-dom` with `singleton: false`.
- `remote/` installs `react@19.0.0` and shares them with `singleton: false, requiredVersion: '^19.0.0'`.

19.3.1 satisfies `^19.0.0`, so the remote should get the host's React. The runtime agrees: the remote's `loadShare('react')` resolves to 19.3.1. The remote's code still binds to its own bundled 19.0.0.

## Run

```bash
pnpm install
pnpm build
pnpm start
```

Open http://localhost:4173. The page prints:

```json
{
  "hostReact": "19.3.1",
  "remoteReact": "19.0.0",
  "runtimePicksForRemote": "19.3.1",
  "sameCopy": false
}
```

`runtimePicksForRemote` is what `@module-federation/runtime` resolves for the remote's `react`. `remoteReact` is the React the remote's code actually imported.

Expected: `remoteReact` is `19.3.1` and `sameCopy` is `true`.

## Control

Install the same version in the remote, and it reuses the host's copy:

```bash
pnpm --filter mf-repro-remote add react@19.3.1 react-dom@19.3.1
pnpm build && pnpm start
```

```json
{
  "hostReact": "19.3.1",
  "remoteReact": "19.3.1",
  "runtimePicksForRemote": "19.3.1",
  "sameCopy": true
}
```
