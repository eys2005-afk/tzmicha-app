# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A single-page Hebrew app for tracking Torah study and prayer points for four children. It reads from and writes to an external REST API hosted on Render. No build step — `index.html` is served directly.

## Architecture

The entire application is `index.html`. All logic is vanilla JS inside a `<script>` tag.

**External API** — `https://torah-points-webhook.onrender.com/points`

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/points` | Fetch all data: `{ totals, points, history }` |
| `POST` | `/reset` | Reset points. Body: `{ all: true }` or `{ child: "שמואל" }` |

The API is polled every 30 seconds via `setInterval(loadData, 30000)`.

**Data shape** returned by `GET /points`:
- `totals` — `{ "שמואל": 12, "יוסף": 7, ... }` — total points per child
- `points` — `{ "שמואל": { "תפילה": 5, "לימוד": 7 }, ... }` — breakdown by task
- `history` — array of `{ child, pts, tasks, time }` entries (most recent first)

**Children** are hardcoded in the `CHILDREN` constant (id, color, textColor for each of the 4 children: שמואל, יוסף, דוד, ידידיה).

**Prize trigger** — when any child reaches 50 points, a fullscreen overlay animation fires (once per session, tracked via `shownPrize` object).

**Admin panel** — accessed via the ⚙️ button with password `eys2005!`. Allows resetting all or individual children's points.

## Deployment

Static file — deploy anywhere that serves HTML (GitHub Pages, Netlify, etc.). No server or build process required.

To change the children list, update the `CHILDREN` array. To change the prize threshold, update the `checkPrize` function (currently `>= 50`).
