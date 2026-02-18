# Trading Terminal

Live demo: https://trading-terminal-green.vercel.app/

Modern multi-panel trading terminal built with React, Zustand, and AG Grid.

## Features

- Desktop-first resizable layout:
  - Top bar with environment, live status, latency, global search, theme toggle.
  - Left watchlist with async streaming updates and pinned columns.
  - Center chart + time and sales.
  - Right order ticket with safety rails and risk checks.
  - Bottom blotter tabs for orders, fills, and positions.
- AG Grid advanced usage:
  - High-frequency async transactions for watchlist streaming.
  - Infinite row-model datasource for orders/fills (server-style paging, sorting, filtering).
  - Positions grouping by account/symbol with master-detail rows for fills + risk snapshots.
  - CSV export and saved grid views (column/filter/sort/pagination).
- Keyboard-first flow:
  - `/` or `Ctrl+K` to focus global search.
  - Enter from watchlist/search routes into order ticket.
  - Esc clears focused search input.
- Simulated market engine:
  - Tick stream, order lifecycle progression, fills, positions mark-to-market, risk snapshots.

## Tech Stack

- React 19 + TypeScript + Vite
- Zustand for app state
- AG Grid Community + Enterprise features
- react-resizable-panels for desktop terminal layout

## Run

```bash
npm install
npm run dev
```

## Production Build

```bash
npm run build
```

## Notes

- Enterprise features (row grouping/master-detail polish) use `ag-grid-enterprise`.
- If you have a production AG Grid license key, configure it in app bootstrap before release.
