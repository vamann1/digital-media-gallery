// =============================================================================
// Data-driven arrangement + geometry config for the archive.
//
// Nothing about the spatial layout is hardcoded in the scene — it is generated
// from this file. Adding a fourth medium is a one-line edit to TOWERS; the ring
// re-forms (triangle -> square -> pentagon ...) and every tower keeps exactly
// two pathways to its ring-neighbours.
//
// Angle convention matches the scene / camera: a direction angle `phi` maps to
// the world XZ vector (sin phi, cos phi). Face i of a hexagon has outward-normal
// angle `rotationOffset + i * (2PI / WALLS)`.
// =============================================================================

// ---- per-level hexagon geometry (carried over from the prototype) ----
export const GEOMETRY = {
  WALLS:   6,      // faces per hexagon level
  UNIT_W:  4.3,    // usable interior width of one face
  ROWS:    3,      // shelf rows per face
  BOARD:   0.05,   // shelf board thickness
  UNIT_H:  3.3,    // interior height of one level
  DEPTH:   0.5,    // shelf depth
  APOTHEM: 3.95,   // tower centre -> face plane
  LEVEL_H: 4.75,   // vertical spacing between levels (UNIT_H + gap)
  EYE:     1.5,    // eye height
  ROAM:    2.55,   // how far from a tower centre you can walk
};

// ---- face roles ----
export const FACE_ROLE = {
  SHELF:    'shelf',    // holds media (outward, faces the void)
  PATHWAY:  'pathway',  // walkable bridge to a ring-neighbour tower
  RESERVED: 'reserved', // faces the courtyard; purpose TBD (signage / directory / stats)
};

// ---- the towers, one per medium, in ring order ----
export const TOWERS = [
  { id:'books',  medium:'book',  label:'Books',  source:'Goodreads' },
  { id:'films',  medium:'film',  label:'Films',  source:'Letterboxd' },
  { id:'albums', medium:'album', label:'Albums', source:'RateYourMusic' },
];

// ---- ring layout ----
export const RING = {
  RADIUS: 7,    // world distance from origin (courtyard centre) to each tower centre
};

// Rough shelving capacity per row, by medium — drives how many floors a tower
// needs (floors are sequential capacity buckets for now, no ordering). Books
// file thin edge-out; face-out covers are wider so fewer fit.
export const PER_ROW = { book: 18, film: 6, album: 6 };

// -----------------------------------------------------------------------------
// Geometry helpers
// -----------------------------------------------------------------------------
const TWO_PI = Math.PI * 2;
const norm = (a) => ((a % TWO_PI) + TWO_PI) % TWO_PI;
function angDelta(a, b) {           // smallest absolute angle between a and b
  const d = norm(a - b);
  return d > Math.PI ? TWO_PI - d : d;
}

// Assign a role to every face of one tower.
//
// Design rule (honours the 2 pathways + 1 reserved + 3 shelves model):
//   - the RESERVED face points at the courtyard (ring centre), i.e. angle Theta+PI
//   - the two faces flanking it (+/- one face step) are PATHWAYS toward neighbours
//   - the opposite three faces are SHELVES, facing outward into the void
// The tower's hexagon is rotated so a face lands exactly on the courtyard
// direction. Pathways therefore aim at neighbours exactly at N=6 and within
// ~30deg at N=3 (the bridge angles over the small difference).
function faceRolesFor(theta, walls) {
  const step = TWO_PI / walls;
  const courtyard = norm(theta + Math.PI);           // toward ring centre
  const rotationOffset = norm(courtyard % step);      // put a face on `courtyard`
  const roles = [];
  let reservedFace = 0, best = Infinity;
  for (let i = 0; i < walls; i++) {
    const faceAngle = norm(rotationOffset + i * step);
    if (angDelta(faceAngle, courtyard) < best) { best = angDelta(faceAngle, courtyard); reservedFace = i; }
    roles.push({ index: i, angle: faceAngle, role: FACE_ROLE.SHELF });
  }
  roles[reservedFace].role = FACE_ROLE.RESERVED;
  roles[(reservedFace + 1) % walls].role = FACE_ROLE.PATHWAY;
  roles[(reservedFace - 1 + walls) % walls].role = FACE_ROLE.PATHWAY;
  return { rotationOffset, roles };
}

// Full computed layout: call with the config above (or overrides) to get, per
// tower, its ring position, hexagon rotation, and per-face roles. This is the
// single source of truth the scene will consume in the multi-tower step.
export function towerLayout(towers = TOWERS, ringRadius = RING.RADIUS, walls = GEOMETRY.WALLS) {
  const n = towers.length;
  return towers.map((t, i) => {
    const theta = (i / n) * TWO_PI;
    const centre = { x: Math.sin(theta) * ringRadius, z: Math.cos(theta) * ringRadius };
    const neighbours = n > 1 ? [ (i + 1) % n, (i - 1 + n) % n ] : [];
    const { rotationOffset, roles } = faceRolesFor(theta, walls);
    return {
      ...t,
      index: i,
      theta,                                   // ring angle of this tower
      centre,                                  // world XZ of the tower centre
      rotationOffset,                          // yaw applied to the hexagon
      neighbours,                              // indices of the two ring-neighbours
      faces: roles,                            // [{ index, angle, role }] x WALLS
      shelfFaces:   roles.filter(r => r.role === FACE_ROLE.SHELF).map(r => r.index),
      pathwayFaces: roles.filter(r => r.role === FACE_ROLE.PATHWAY).map(r => r.index),
      reservedFace: roles.find(r => r.role === FACE_ROLE.RESERVED).index,
    };
  });
}

// Convenience: how many items a single level can hold (shelf faces * rows).
// Floor count per tower is derived from item count / this, since floors are
// currently just sequential capacity buckets (no ordering).
export function levelCapacityFaces(walls = GEOMETRY.WALLS) {
  return towerLayout(TOWERS, RING.RADIUS, walls)[0].shelfFaces.length;
}
