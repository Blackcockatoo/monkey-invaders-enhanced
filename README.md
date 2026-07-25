# Monkey Invaders

Blue Snake Studios' arcade shooter. Hold the line against descending invaders,
clear the wave patterns, and break the boss encounters.

Built with React, TypeScript and Vite. The gameplay engine lives in
`client/src/game/MonkeyInvadersEngine.ts`.

## Where this is published

This repository deploys to `https://monkey-invaders-enhanced.vercel.app`.

> **Heads up:** the Blue Snake Studios site (`bss`) does *not* serve this build.
> It serves a separate, older standalone port checked in at
> `public/monkey-invaders.html`, which `/monkey-invaders` redirects to, and which
> has its own smoke tests written against that file's inline script.
>
> The two have diverged: the engine here has since gained bosses, extra enemy
> types, events, pickups, secrets and progression. Treat the vendored copy as a
> separate artifact — changes made here do not reach the site until that copy is
> deliberately regenerated and the `bss` smoke tests are updated to match.

Monkey Invaders is intentionally **not** part of the child-safe route surface,
so it is not reachable from MetaPet.school.

## Development

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Quality checks:

```bash
pnpm check          # tsc --noEmit
pnpm exec vite build
```

## Deployment

`vercel.json` pins the install and build commands and serves `dist/public`, with
immutable cache headers on hashed assets under `/assets/`.
