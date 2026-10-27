# mf-vite-shared-version-repro

With `@module-federation/vite` 1.23.5 and `shareStrategy: 'version-first'` (the plugin's default), a non-singleton shared package is only shared when the host and remote installed exactly the same version. Whenever the versions differ, each side runs the copy it installed, even when one side's version satisfies the other's `requiredVersion`. With `loaded-first`, sharing works as expected.

Tracked in module-federation/vite#1503.

- `host/` shares `react` and `react-dom` with `singleton: false`.
- `remote/` exposes `./App`, and shares `react` and `react-dom` with `singleton: false`.
- Each side renders a component that calls `useState` and `useEffect`. The host's page prints the React version each side runs, whether they share one copy, and whether both components' hooks ran.

## Results

`pnpm matrix` builds and serves every combination below as a production build, and checks it in headless Chromium. A row is as expected when each side runs the version its share strategy specifies, the page has no errors, and both components' hooks ran.

| Case | Host installs (range) | Remote installs (range) | Strategy | Expected (host / remote) | Actual (host / remote) | One copy | Result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Same version | 19.3.1 (`^19.3.1`) | 19.3.1 (`^19.3.1`) | `version-first` | 19.3.1 / 19.3.1 | 19.3.1 / 19.3.1 | yes | as expected |
| Same version | 19.3.1 (`^19.3.1`) | 19.3.1 (`^19.3.1`) | `loaded-first` | 19.3.1 / 19.3.1 | 19.3.1 / 19.3.1 | yes | as expected |
| Host newer (minor) | 19.3.1 (`^19.3.1`) | 19.0.0 (`^19.0.0`) | `version-first` | 19.3.1 / 19.3.1 | 19.3.1 / 19.0.0 | no | **wrong** |
| Host newer (minor) | 19.3.1 (`^19.3.1`) | 19.0.0 (`^19.0.0`) | `loaded-first` | 19.3.1 / 19.3.1 | 19.3.1 / 19.3.1 | yes | as expected |
| Host newer (patch) | 19.3.1 (`^19.3.1`) | 19.3.0 (`^19.3.0`) | `version-first` | 19.3.1 / 19.3.1 | 19.3.1 / 19.3.0 | no | **wrong** |
| Host newer (patch) | 19.3.1 (`^19.3.1`) | 19.3.0 (`^19.3.0`) | `loaded-first` | 19.3.1 / 19.3.1 | 19.3.1 / 19.3.1 | yes | as expected |
| Remote newer, host range allows it | 19.0.0 (`^19.0.0`) | 19.3.1 (`^19.0.0`) | `version-first` | 19.3.1 / 19.3.1 | 19.0.0 / 19.3.1 | no | **wrong** |
| Remote newer, host range allows it | 19.0.0 (`^19.0.0`) | 19.3.1 (`^19.0.0`) | `loaded-first` | 19.0.0 / 19.0.0 | 19.0.0 / 19.0.0 | yes | as expected |
| Remote needs newer than host | 19.0.0 (`~19.0.0`) | 19.3.1 (`^19.3.0`) | `version-first` | 19.0.0 / 19.3.1 | 19.0.0 / 19.3.1 | no | as expected |
| Remote needs newer than host | 19.0.0 (`~19.0.0`) | 19.3.1 (`^19.3.0`) | `loaded-first` | 19.0.0 / 19.3.1 | 19.0.0 / 19.3.1 | no | as expected |
| Different majors | 18.3.1 (`^18.3.1`) | 19.3.1 (`^19.0.0`) | `version-first` | 18.3.1 / 19.3.1 | 18.3.1 / 19.3.1 | no | as expected |
| Different majors | 18.3.1 (`^18.3.1`) | 19.3.1 (`^19.0.0`) | `loaded-first` | 18.3.1 / 19.3.1 | 18.3.1 / 19.3.1 | no | as expected |

`pnpm matrix:dev` runs the same combinations on Vite dev servers. The results match:

| Case | Host installs (range) | Remote installs (range) | Strategy | Expected (host / remote) | Actual (host / remote) | One copy | Result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Same version | 19.3.1 (`^19.3.1`) | 19.3.1 (`^19.3.1`) | `version-first` | 19.3.1 / 19.3.1 | 19.3.1 / 19.3.1 | yes | as expected |
| Same version | 19.3.1 (`^19.3.1`) | 19.3.1 (`^19.3.1`) | `loaded-first` | 19.3.1 / 19.3.1 | 19.3.1 / 19.3.1 | yes | as expected |
| Host newer (minor) | 19.3.1 (`^19.3.1`) | 19.0.0 (`^19.0.0`) | `version-first` | 19.3.1 / 19.3.1 | 19.3.1 / 19.0.0 | no | **wrong** |
| Host newer (minor) | 19.3.1 (`^19.3.1`) | 19.0.0 (`^19.0.0`) | `loaded-first` | 19.3.1 / 19.3.1 | 19.3.1 / 19.3.1 | yes | as expected |
| Host newer (patch) | 19.3.1 (`^19.3.1`) | 19.3.0 (`^19.3.0`) | `version-first` | 19.3.1 / 19.3.1 | 19.3.1 / 19.3.0 | no | **wrong** |
| Host newer (patch) | 19.3.1 (`^19.3.1`) | 19.3.0 (`^19.3.0`) | `loaded-first` | 19.3.1 / 19.3.1 | 19.3.1 / 19.3.1 | yes | as expected |
| Remote newer, host range allows it | 19.0.0 (`^19.0.0`) | 19.3.1 (`^19.0.0`) | `version-first` | 19.3.1 / 19.3.1 | 19.0.0 / 19.3.1 | no | **wrong** |
| Remote newer, host range allows it | 19.0.0 (`^19.0.0`) | 19.3.1 (`^19.0.0`) | `loaded-first` | 19.0.0 / 19.0.0 | 19.0.0 / 19.0.0 | yes | as expected |
| Remote needs newer than host | 19.0.0 (`~19.0.0`) | 19.3.1 (`^19.3.0`) | `version-first` | 19.0.0 / 19.3.1 | 19.0.0 / 19.3.1 | no | as expected |
| Remote needs newer than host | 19.0.0 (`~19.0.0`) | 19.3.1 (`^19.3.0`) | `loaded-first` | 19.0.0 / 19.3.1 | 19.0.0 / 19.3.1 | no | as expected |
| Different majors | 18.3.1 (`^18.3.1`) | 19.3.1 (`^19.0.0`) | `version-first` | 18.3.1 / 19.3.1 | 18.3.1 / 19.3.1 | no | as expected |
| Different majors | 18.3.1 (`^18.3.1`) | 19.3.1 (`^19.0.0`) | `loaded-first` | 18.3.1 / 19.3.1 | 18.3.1 / 19.3.1 | no | as expected |

The expected values follow `@module-federation/runtime`'s share resolution (`getRegisteredShare` in `runtime-core`):

- With `version-first`, each side gets the highest registered version if it satisfies that side's `requiredVersion`. If it doesn't, the side gets a registered version that does.
- With `loaded-first`, a side reuses a copy that's already loaded, here the host's, if it satisfies that side's `requiredVersion`.

All three wrong rows are `version-first` rows where the versions differ but one copy would do. The remote should pick up the host's newer React in the first two. In the third, both sides should pick up the remote's newer React.

## Run one case

```bash
pnpm install
pnpm build
pnpm start
```

Open http://localhost:4173. By default, this is the "Host newer (minor)" case with `version-first`. The host installs 19.3.1 (`^19.3.1`) and the remote installs 19.0.0 (`^19.0.0`):

```json
{
  "hostReact": "19.3.1",
  "remoteReact": "19.0.0",
  "sameCopy": false,
  "hooksWork": true
}
```

`pnpm dev` serves the same case from Vite dev servers instead of a build.

`SHARE_STRATEGY`, `HOST_REQUIRED_VERSION` and `REMOTE_REQUIRED_VERSION` override the shared config at build time, for example `SHARE_STRATEGY=loaded-first pnpm build`.

## Run the matrix

```bash
pnpm install
pnpm exec playwright install chromium
pnpm matrix
pnpm matrix:dev
```

Each script reinstalls React in `host/` and `remote/` for every case, and restores the default versions when it finishes.
