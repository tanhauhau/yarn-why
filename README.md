# yarn-why

> Lite version of `yarn why` that reads from `yarn.lock`

## Why not `yarn why`?

`yarn why` will go through your `package.json` and make network calls to build your dependency tree, before telling you why your package is installed.

- Solely based on `yarn.lock`, does not care if it is out of sync with `package.json`.
