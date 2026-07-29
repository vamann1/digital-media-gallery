# The Tower — a spatial media archive

A personal media archive rendered as an explorable 3D space, evolving into a published
website (blog first, possibly a public platform later). Books, films and albums — pulled
from Goodreads / Letterboxd / RateYourMusic exports and manual entry — displayed as objects
on shelves inside hexagonal wireframe towers in a starfield.

Not just a tracker and not just a gallery — both.

## Status

Early. A working single-file prototype lives in `starter_files/tower-gallery.html`.
Architecture for the full build is being decided — see below.

## Architecture (in progress)

- **Frontend** — three.js (r128) for the 3D towers, kept vanilla. UI shell / menu / admin
  built on a light framework (TBD). Vite build step.
- **Backend** — Java + PostgreSQL. CRUD, CSV import + re-sync, cover-fetch pipeline,
  auth (later, for multi-user).
- **Publishing** — GitHub Pages serves a static read-only export (JSON + cover images)
  generated from the database. The Java backend + Postgres run locally as the data engine
  for now; a hosted deployment comes if/when this becomes a public platform.

## Data sources

Raw exports live in `sources/` (Goodreads CSV, RateYourMusic CSV, full Letterboxd export).
Covers are fetched **offline** via a metadata pipeline (Open Library / Google Books for
books, TMDb for films, MusicBrainz + Cover Art Archive for albums) — never at page load.

## Spatial model

Three hexagonal towers (one per medium) arranged in an equilateral triangle, joined by
walkable pathways. Per hexagon level: 2 faces are pathways to the other towers, 1 face
(between them) is reserved, 3 faces hold shelves. Only 3 levels of the active tower render
at once (current ±1); tower skeletons always render.
