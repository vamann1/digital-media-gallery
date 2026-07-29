// One-off dev seed: parse the raw CSV exports in ../sources into a single
// normalised catalog.json the gallery can read. Throwaway — the real importer
// will be the Java backend. Run: `node pipeline/seed.mjs`
//
// Output shape per item:
//   { medium, title, creator, year, rating, logged, source, hue, note }

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const SRC = join(here, '..', 'sources');
const OUT = join(here, '..', 'frontend', 'src', 'data', 'catalog.json');

// ---- RFC-4180-ish CSV parser (handles quotes, escaped quotes, embedded newlines)
function parseCSV(text) {
  const rows = [];
  let row = [], field = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false;
      } else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\r') { /* skip */ }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function readTable(path) {
  const rows = parseCSV(readFileSync(path, 'utf8'));
  const head = rows.shift().map((h) => h.trim());
  return rows
    .filter((r) => r.length > 1)
    .map((r) => Object.fromEntries(head.map((h, i) => [h, (r[i] ?? '').trim()])));
}

const hueOf = (s) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % 360;
};
const year4 = (s) => { const m = String(s).match(/\d{4}/); return m ? +m[0] : null; };
const isoFromDMY = (s) => {
  const m = String(s).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : '';
};

// ---- Goodreads (books) — consumed = the "read" shelf only
function books() {
  return readTable(join(SRC, 'goodreads_library_export.csv'))
    .filter((r) => r['Exclusive Shelf'] === 'read')
    .map((r) => ({
      medium: 'book',
      title: r.Title,
      creator: r.Author,
      year: year4(r['Original Publication Year'] || r['Year Published']),
      rating: +r['My Rating'] || 0,
      logged: isoFromDMY(r['Date Read']) || isoFromDMY(r['Date Added']),
      source: 'Goodreads',
      hue: hueOf(r.Title),
      note: r['My Review'] || '',
    }));
}

// ---- RateYourMusic (albums) — Rating is 1..10 half-stars
function albums() {
  return readTable(join(SRC, 'vamann-music-export.csv')).map((r) => {
    const artist = `${r['First Name'] || ''} ${r['Last Name'] || ''}`.replace(/\s+/g, ' ').trim();
    const raw = +r.Rating || 0;
    return {
      medium: 'album',
      title: r.Title,
      creator: artist,
      year: year4(r.Release_Date),
      rating: raw > 0 ? Math.min(5, raw / 2) : 0,
      logged: isoFromDMY(r['Purchase Date']) || '',
      source: 'RateYourMusic',
      hue: hueOf(r.Title),
      note: '',
    };
  });
}

// ---- Letterboxd (films) — merge watched + ratings + diary + reviews on the URI
function films() {
  const dir = join(SRC, readdirSync(SRC).find((d) => d.startsWith('letterboxd-')));
  const by = new Map();
  const touch = (uri, name, year, date) => {
    if (!by.has(uri)) by.set(uri, { title: name, year: year4(year), rating: 0, logged: date || '', note: '' });
    return by.get(uri);
  };
  for (const r of readTable(join(dir, 'watched.csv'))) touch(r['Letterboxd URI'], r.Name, r.Year, r.Date);
  for (const r of readTable(join(dir, 'ratings.csv'))) {
    const f = touch(r['Letterboxd URI'], r.Name, r.Year, r.Date);
    if (r.Rating) f.rating = +r.Rating;
  }
  for (const r of readTable(join(dir, 'diary.csv'))) {
    const f = touch(r['Letterboxd URI'], r.Name, r.Year, r.Date);
    if (r['Watched Date']) f.logged = r['Watched Date'];
    if (r.Rating && !f.rating) f.rating = +r.Rating;
  }
  for (const r of readTable(join(dir, 'reviews.csv'))) {
    const f = touch(r['Letterboxd URI'], r.Name, r.Year, r.Date);
    if (r.Review) f.note = r.Review;
  }
  return [...by.values()].map((f) => ({
    medium: 'film',
    title: f.title,
    creator: '',                 // Letterboxd export has no director; TMDb pass fills this later
    year: f.year,
    rating: f.rating,
    logged: f.logged,
    source: 'Letterboxd',
    hue: hueOf(f.title),
    note: f.note,
  }));
}

const all = [...books(), ...albums(), ...films()].filter((d) => d.title);
writeFileSync(OUT, JSON.stringify(all));

const by = (m) => all.filter((d) => d.medium === m).length;
console.log(`wrote ${all.length} items -> ${OUT}`);
console.log(`  books ${by('book')}  albums ${by('album')}  films ${by('film')}`);
console.log(`  missing year: ${all.filter((d) => !d.year).length}  unrated: ${all.filter((d) => !d.rating).length}  no logged date: ${all.filter((d) => !d.logged).length}`);
