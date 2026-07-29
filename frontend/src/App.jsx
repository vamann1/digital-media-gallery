import { useEffect, useRef, useState } from 'react';
import { createTowerScene } from './tower/scene.js';
import { CATALOG } from './data/catalog.js';

const MEDIUM_LABEL = { book: 'Book', film: 'Film', album: 'Album' };

function starStr(r) {
  const full = Math.floor(r), half = r % 1 >= 0.5;
  return '★'.repeat(full) + (half ? '½' : '') + '  ' + r.toFixed(1);
}

export default function App() {
  const stageRef = useRef(null);
  const ctrlRef = useRef(null);

  const [towers, setTowers] = useState([]);   // [{ id, label, medium, source, count, floorCount }]
  const [active, setActive] = useState(0);
  const [floor, setFloor] = useState(0);
  const [aimed, setAimed] = useState(null);
  const [selected, setSelected] = useState(null);
  const [entered, setEntered] = useState(false);   // has entered once → gate stays gone
  const [locked, setLocked] = useState(false);      // pointer captured → navigate mode

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctrl = createTowerScene({
      container: stageRef.current,
      catalog: CATALOG,
      reduced,
      callbacks: {
        onReady: ({ towers: t, active: a }) => { setTowers(t); setActive(a); },
        onTower: (i) => setActive(i),
        onLevel: (f) => setFloor(f),
        onAim: (item) => setAimed(item),
        onSelect: (item) => setSelected(item),
        onDeselect: () => setSelected(null),
        onLock: (isLocked) => setLocked(isLocked),
      },
    });
    ctrlRef.current = ctrl;
    return () => { ctrl.dispose(); ctrlRef.current = null; };
  }, []);

  const at = towers[active];

  return (
    <>
      <div id="stage" ref={stageRef} />

      <div className="plate">
        <h1>The Tower</h1>
        <div className="sub">
          {at
            ? `${at.label} · floor ${floor + 1} of ${at.floorCount} · ${at.count} ${at.label.toLowerCase()}`
            : 'Loading archive'}
        </div>
      </div>

      <div className="levels" role="group" aria-label="Choose tower">
        {towers.map((t, i) => (
          <button
            key={t.id}
            className="lv"
            aria-current={i === active}
            onClick={() => { ctrlRef.current?.setTower(i); }}
          >
            <span>{t.label}</span>
            <span className="bar" />
          </button>
        ))}
      </div>

      <div id="cross" className={locked ? (aimed ? 'on hit' : 'on') : ''}>
        <i className="h" /><i className="r" />
      </div>
      <div id="tip" className={locked && aimed ? 'on' : ''}>
        {aimed?.title}
        {aimed && <em>F</em>}
      </div>

      {entered && !locked && <div id="resume">Click to look around · Esc to release</div>}

      <div className="rail">
        <div className="keys">
          <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> move
          &nbsp;·&nbsp; <kbd>Q</kbd><kbd>E</kbd> floor
          &nbsp;·&nbsp; <kbd>F</kbd> / click select
          &nbsp;·&nbsp; <kbd>Esc</kbd> release
        </div>
        <div className="divider" />
        <button className="ghost" onClick={() => ctrlRef.current?.selectRandom()}>
          Pull one at random
        </button>
      </div>

      <div id="card" className={selected ? 'on' : ''} role="dialog" aria-label="Item details" aria-hidden={!selected}>
        <button id="close" aria-label="Close details" onClick={() => ctrlRef.current?.deselect()}>&times;</button>
        <div className="card-in">
          <div className="medium">{selected && MEDIUM_LABEL[selected.medium]}</div>
          <h2>{selected?.title}</h2>
          <p className="creator">{selected?.creator}</p>
          <div className="card-rule" />
          <dl>
            <dt>Released</dt><dd>{selected?.year}</dd>
            <dt>Logged</dt><dd>{selected?.logged}</dd>
            <dt>Rating</dt><dd className="stars">{selected && starStr(selected.rating)}</dd>
            <dt>Source</dt><dd>{selected?.source}</dd>
          </dl>
          <p className="note">{selected?.note}</p>
        </div>
      </div>

      <div
        id="gate"
        className={entered ? 'gone' : ''}
        onClick={() => { setEntered(true); ctrlRef.current?.enter(); }}
      >
        <div>
          <h2>The Tower</h2>
          <div className="rule" />
          <p>Click to enter</p>
        </div>
      </div>
    </>
  );
}
