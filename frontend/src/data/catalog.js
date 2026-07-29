// Sample catalogue — development seed only.
// Superseded later by the CSV-parsed / DB-exported dataset. Every row must
// normalise to this render shape:
//   { medium, title, creator, year, rating, logged, source, hue, note }

export const CATALOG = [
  { medium:'book', title:'Pale Fire', creator:'Vladimir Nabokov', year:1962, rating:5, logged:'2026-01-14', source:'Goodreads', hue:14,  note:'A commentary that eats its own poem. Read the footnotes twice.' },
  { medium:'book', title:'The Left Hand of Darkness', creator:'Ursula K. Le Guin', year:1969, rating:5, logged:'2025-11-02', source:'Goodreads', hue:205, note:'Cold all the way through, in the best way.' },
  { medium:'book', title:'Invisible Cities', creator:'Italo Calvino', year:1972, rating:4.5, logged:'2026-03-20', source:'Goodreads', hue:38, note:'Fifty-five cities, one of them real.' },
  { medium:'book', title:'Stoner', creator:'John Williams', year:1965, rating:5, logged:'2025-08-11', source:'Goodreads', hue:26, note:'Quietly devastating. A whole life in 280 pages.' },
  { medium:'book', title:'Housekeeping', creator:'Marilynne Robinson', year:1980, rating:4, logged:'2026-02-27', source:'Goodreads', hue:190, note:'Water damage as a state of mind.' },
  { medium:'book', title:'The Rings of Saturn', creator:'W. G. Sebald', year:1995, rating:4.5, logged:'2025-09-30', source:'Goodreads', hue:96, note:'A walk that keeps falling into history.' },
  { medium:'book', title:'Beloved', creator:'Toni Morrison', year:1987, rating:5, logged:'2025-06-18', source:'Goodreads', hue:352, note:'The sentence-level control is unreal.' },
  { medium:'book', title:'Blood Meridian', creator:'Cormac McCarthy', year:1985, rating:4, logged:'2026-04-08', source:'Goodreads', hue:8, note:'Beautiful and unbearable in equal measure.' },
  { medium:'book', title:'The Master and Margarita', creator:'Mikhail Bulgakov', year:1967, rating:4.5, logged:'2025-12-21', source:'Goodreads', hue:330, note:'The cat gets the best lines.' },
  { medium:'book', title:'Autumn', creator:'Ali Smith', year:2016, rating:3.5, logged:'2026-05-15', source:'Goodreads', hue:30, note:'Written fast, reads faster.' },
  { medium:'book', title:'Piranesi', creator:'Susanna Clarke', year:2020, rating:4.5, logged:'2026-06-02', source:'Goodreads', hue:178, note:'The Beauty of the House is immeasurable.' },
  { medium:'book', title:'Solaris', creator:'Stanisław Lem', year:1961, rating:4, logged:'2025-10-07', source:'Goodreads', hue:212, note:'Contact as a failure of imagination.' },
  { medium:'book', title:'The Vegetarian', creator:'Han Kang', year:2007, rating:4, logged:'2026-01-29', source:'Goodreads', hue:120, note:'Three perspectives, none of them hers.' },
  { medium:'book', title:'A Visit from the Goon Squad', creator:'Jennifer Egan', year:2010, rating:3.5, logged:'2025-07-23', source:'Goodreads', hue:280, note:'The slide-deck chapter earns itself.' },
  { medium:'book', title:'Ficciones', creator:'Jorge Luis Borges', year:1944, rating:5, logged:'2026-02-11', source:'Goodreads', hue:44, note:'Every story is a library that contains it.' },
  { medium:'book', title:'Never Let Me Go', creator:'Kazuo Ishiguro', year:2005, rating:4.5, logged:'2025-09-04', source:'Goodreads', hue:168, note:'You know early. It does not help.' },
  { medium:'book', title:'The Dispossessed', creator:'Ursula K. Le Guin', year:1974, rating:4.5, logged:'2026-04-30', source:'Goodreads', hue:222, note:'Two worlds, one very long argument.' },
  { medium:'book', title:'Wolf Hall', creator:'Hilary Mantel', year:2009, rating:4, logged:'2025-11-19', source:'Goodreads', hue:340, note:'Present tense, permanent dread.' },
  { medium:'book', title:'Gilead', creator:'Marilynne Robinson', year:2004, rating:4, logged:'2026-03-06', source:'Goodreads', hue:52, note:'A letter from a father running out of time.' },
  { medium:'book', title:'Cloud Atlas', creator:'David Mitchell', year:2004, rating:3.5, logged:'2025-08-27', source:'Goodreads', hue:196, note:'Six nesting dolls. The middle one is the best.' },
  { medium:'book', title:'If on a Winter’s Night a Traveler', creator:'Italo Calvino', year:1979, rating:4, logged:'2026-05-28', source:'Goodreads', hue:20, note:'You, the reader, are the protagonist. Annoying. Works.' },
  { medium:'book', title:'The Remains of the Day', creator:'Kazuo Ishiguro', year:1989, rating:5, logged:'2025-12-09', source:'Goodreads', hue:34, note:'Restraint as a tragedy.' },
  { medium:'book', title:'Lincoln in the Bardo', creator:'George Saunders', year:2017, rating:4, logged:'2026-06-21', source:'Goodreads', hue:262, note:'A chorus of the dead, and it works.' },
  { medium:'book', title:'The Bell Jar', creator:'Sylvia Plath', year:1963, rating:4, logged:'2025-10-30', source:'Goodreads', hue:2, note:'Sharper than its reputation suggests.' },

  { medium:'film', title:'In the Mood for Love', creator:'Wong Kar-wai', year:2000, rating:5, logged:'2026-02-03', source:'Letterboxd', hue:348, note:'Nobody has ever filmed a corridor better.' },
  { medium:'film', title:'Stalker', creator:'Andrei Tarkovsky', year:1979, rating:4.5, logged:'2025-10-24', source:'Letterboxd', hue:88, note:'Two hours of walking. Held completely.' },
  { medium:'film', title:'Chungking Express', creator:'Wong Kar-wai', year:1994, rating:4.5, logged:'2026-04-17', source:'Letterboxd', hue:186, note:'California Dreamin’ on repeat for a week after.' },
  { medium:'film', title:'Paris, Texas', creator:'Wim Wenders', year:1984, rating:5, logged:'2025-07-09', source:'Letterboxd', hue:12, note:'The one-way mirror scene. That’s the whole film.' },
  { medium:'film', title:'Come and See', creator:'Elem Klimov', year:1985, rating:4.5, logged:'2026-01-20', source:'Letterboxd', hue:74, note:'Watched once. Will not watch again.' },
  { medium:'film', title:'Perfect Days', creator:'Wim Wenders', year:2023, rating:4.5, logged:'2026-06-14', source:'Letterboxd', hue:150, note:'A film about noticing. Left the cinema slower.' },
  { medium:'film', title:'Yi Yi', creator:'Edward Yang', year:2000, rating:5, logged:'2025-09-16', source:'Letterboxd', hue:206, note:'Three hours, one family, no filler.' },
  { medium:'film', title:'Portrait of a Lady on Fire', creator:'Céline Sciamma', year:2019, rating:4.5, logged:'2026-03-29', source:'Letterboxd', hue:24, note:'Page 28.' },
  { medium:'film', title:'Mulholland Drive', creator:'David Lynch', year:2001, rating:4, logged:'2025-11-27', source:'Letterboxd', hue:300, note:'Still not sure. That’s the point.' },
  { medium:'film', title:'Tampopo', creator:'Jūzō Itami', year:1985, rating:4, logged:'2026-05-05', source:'Letterboxd', hue:40, note:'Made me hungry and slightly emotional.' },
  { medium:'film', title:'The Handmaiden', creator:'Park Chan-wook', year:2016, rating:4.5, logged:'2025-08-02', source:'Letterboxd', hue:318, note:'Three acts, three betrayals, immaculate design.' },
  { medium:'film', title:'Close-Up', creator:'Abbas Kiarostami', year:1990, rating:4, logged:'2026-02-19', source:'Letterboxd', hue:60, note:'Documentary, reenactment, neither.' },
  { medium:'film', title:'Zama', creator:'Lucrecia Martel', year:2017, rating:4, logged:'2026-06-27', source:'Letterboxd', hue:110, note:'Waiting, rendered as a physical sensation.' },
  { medium:'film', title:'Days of Heaven', creator:'Terrence Malick', year:1978, rating:4.5, logged:'2025-09-22', source:'Letterboxd', hue:36, note:'Shot almost entirely at dusk. You can tell.' },
  { medium:'film', title:'Beau Travail', creator:'Claire Denis', year:1999, rating:4.5, logged:'2026-04-02', source:'Letterboxd', hue:196, note:'The last two minutes justify everything.' },
  { medium:'film', title:'Fallen Angels', creator:'Wong Kar-wai', year:1995, rating:4, logged:'2025-12-16', source:'Letterboxd', hue:270, note:'Wide lenses, small rooms, permanent night.' },

  { medium:'album', title:'Spiderland', creator:'Slint', year:1991, rating:5, logged:'2026-01-07', source:'RateYourMusic', hue:200, note:'Quiet, quiet, quiet, then the floor drops.' },
  { medium:'album', title:'Loveless', creator:'My Bloody Valentine', year:1991, rating:4.5, logged:'2025-10-15', source:'RateYourMusic', hue:330, note:'Guitars as weather.' },
  { medium:'album', title:'Bitches Brew', creator:'Miles Davis', year:1970, rating:4.5, logged:'2026-03-13', source:'RateYourMusic', hue:20, note:'Two sides of pure churn.' },
  { medium:'album', title:'Music Has the Right to Children', creator:'Boards of Canada', year:1998, rating:5, logged:'2025-06-25', source:'RateYourMusic', hue:44, note:'Nostalgia for a childhood that didn’t happen.' },
  { medium:'album', title:'Blonde', creator:'Frank Ocean', year:2016, rating:4.5, logged:'2026-04-24', source:'RateYourMusic', hue:174, note:'Grows every year.' },
  { medium:'album', title:'In Rainbows', creator:'Radiohead', year:2007, rating:4.5, logged:'2025-12-02', source:'RateYourMusic', hue:288, note:'The warmest thing they made.' },
  { medium:'album', title:'Fetch the Bolt Cutters', creator:'Fiona Apple', year:2020, rating:4.5, logged:'2026-05-21', source:'RateYourMusic', hue:8, note:'Recorded in a house and it sounds like it.' },
  { medium:'album', title:'Selected Ambient Works 85–92', creator:'Aphex Twin', year:1992, rating:4.5, logged:'2025-09-11', source:'RateYourMusic', hue:158, note:'Xtal on a train at night. Unbeatable.' },
  { medium:'album', title:'A Love Supreme', creator:'John Coltrane', year:1965, rating:5, logged:'2026-02-24', source:'RateYourMusic', hue:32, note:'Four parts, one prayer.' },
  { medium:'album', title:'The Glow Pt. 2', creator:'The Microphones', year:2001, rating:4, logged:'2025-07-30', source:'RateYourMusic', hue:104, note:'Recorded loud, mixed louder.' },
  { medium:'album', title:'Ege Bamyasi', creator:'Can', year:1972, rating:4, logged:'2026-06-09', source:'RateYourMusic', hue:64, note:'Vitamin C is the obvious pick and it’s still right.' },
  { medium:'album', title:'Rumours', creator:'Fleetwood Mac', year:1977, rating:4, logged:'2025-11-06', source:'RateYourMusic', hue:214, note:'A band falling apart in perfect harmony.' },
  { medium:'album', title:'Endtroducing.....', creator:'DJ Shadow', year:1996, rating:4.5, logged:'2026-03-02', source:'RateYourMusic', hue:242, note:'Built entirely from other records.' },
  { medium:'album', title:'Pink Moon', creator:'Nick Drake', year:1972, rating:4.5, logged:'2025-08-19', source:'RateYourMusic', hue:310, note:'Twenty-eight minutes, one voice, one guitar.' },
  { medium:'album', title:'Kid A', creator:'Radiohead', year:2000, rating:4, logged:'2026-05-11', source:'RateYourMusic', hue:190, note:'Sounded like the future, still does.' },
  { medium:'album', title:'To Pimp a Butterfly', creator:'Kendrick Lamar', year:2015, rating:5, logged:'2026-06-30', source:'RateYourMusic', hue:50, note:'Denser every listen.' }
];

// Legacy one-floor-per-medium grouping — used by the parity port only.
// The target model (three towers) is described in ./config or ../tower/config.
export const FLOORS = [
  { key:'book',  label:'Books',  source:'Goodreads' },
  { key:'film',  label:'Films',  source:'Letterboxd' },
  { key:'album', label:'Albums', source:'RateYourMusic' }
];
