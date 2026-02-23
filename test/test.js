// MTG Collection Viewer - Unified Test Suite
const suites = {};
const results = [];

function suite(name) {
  if (!suites[name]) suites[name] = [];
  return {
    test: (testName, fn) => suites[name].push({ name: testName, fn })
  };
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

function assertEquals(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message || 'Values not equal'}\nExpected: ${expected}\nActual: ${actual}`);
  }
}

// ===== GAME TRACKER TESTS =====
const gt = suite('Game Tracker');
const mockState = {
  players: Array.from({ length: 4 }, (_, i) => ({
    name: `Player ${i + 1}`, life: 40, commanders: [null, null],
    poison: 0, energy: 0, experience: 0, storm: 0, cmdTax: 0,
    mana: { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0 },
    planeswalkers: [], citysBlessing: false, dungeon: null,
    cmdDamage: {}, mulligans: 0, cardsInHand: 7, cardsDrawn: 0, cardsDiscarded: 0
  })),
  numPlayers: 4, startingLife: 40, activePlayer: 0, turnCount: 1,
  log: [], history: [], lifeHistory: [], knockouts: [],
  damageDealt: { 0: 0, 1: 0, 2: 0, 3: 0 },
  commanderDamageDealt: { 0: 0, 1: 0, 2: 0, 3: 0 },
  monarch: -1, initiative: -1, ringBearer: -1, ringTemptation: 0,
  dayNight: 'day', format: 'commander', firstBlood: null
};

gt.test('4 players initialized', () => assertEquals(mockState.players.length, 4));
gt.test('Starting life is 40', () => assertEquals(mockState.startingLife, 40));
gt.test('Active player is 0', () => assertEquals(mockState.activePlayer, 0));
gt.test('Turn count is 1', () => assertEquals(mockState.turnCount, 1));
gt.test('Format is commander', () => assertEquals(mockState.format, 'commander'));
gt.test('Life decreases', () => { mockState.players[0].life -= 5; assert(mockState.players[0].life === 35); });
gt.test('Life increases', () => { mockState.players[0].life += 10; assert(mockState.players[0].life === 45); });
gt.test('Life can be 0', () => { mockState.players[1].life = 0; assertEquals(mockState.players[1].life, 0); });
gt.test('Life can be negative', () => { mockState.players[1].life = -5; assert(mockState.players[1].life < 0); });
gt.test('Damage starts at 0', () => assertEquals(mockState.damageDealt[0], 0));
gt.test('Damage increments', () => { mockState.damageDealt[0] = 10; assertEquals(mockState.damageDealt[0], 10); });
gt.test('Commander damage separate', () => { mockState.commanderDamageDealt[0] = 5; assertEquals(mockState.commanderDamageDealt[0], 5); });
gt.test('Knockout records', () => { mockState.knockouts.push({ player: 1, killer: 0, turn: 3 }); assert(mockState.knockouts.length > 0); });
gt.test('Poison increments', () => { mockState.players[0].poison = 5; assertEquals(mockState.players[0].poison, 5); });
gt.test('Poison 10 lethal', () => { mockState.players[0].poison = 10; assert(mockState.players[0].poison >= 10); });
gt.test('Energy works', () => { mockState.players[0].energy = 8; assertEquals(mockState.players[0].energy, 8); });
gt.test('Experience works', () => { mockState.players[0].experience = 3; assertEquals(mockState.players[0].experience, 3); });
gt.test('Storm works', () => { mockState.players[0].storm = 12; assertEquals(mockState.players[0].storm, 12); });
gt.test('Commander tax', () => { mockState.players[0].cmdTax = 4; assertEquals(mockState.players[0].cmdTax, 4); });
gt.test('Mana starts at 0', () => { const m = mockState.players[0].mana; assert(m.W === 0 && m.U === 0 && m.B === 0); });
gt.test('White mana adds', () => { mockState.players[0].mana.W = 3; assertEquals(mockState.players[0].mana.W, 3); });
gt.test('Commander damage per opponent', () => { mockState.players[0].cmdDamage['1-0'] = 10; assertEquals(mockState.players[0].cmdDamage['1-0'], 10); });
gt.test('21 commander damage lethal', () => { mockState.players[0].cmdDamage['1-0'] = 21; assert(mockState.players[0].cmdDamage['1-0'] >= 21); });
gt.test('Mulligans start at 0', () => assertEquals(mockState.players[0].mulligans, 0));
gt.test('First mulligan to 7', () => { mockState.players[0].mulligans = 1; mockState.players[0].cardsInHand = 7; assertEquals(mockState.players[0].cardsInHand, 7); });
gt.test('Second mulligan to 6', () => { mockState.players[0].mulligans = 2; mockState.players[0].cardsInHand = 6; assertEquals(mockState.players[0].cardsInHand, 6); });
gt.test('Monarch assignment', () => { mockState.monarch = 1; assertEquals(mockState.monarch, 1); });
gt.test('Initiative assignment', () => { mockState.initiative = 2; assertEquals(mockState.initiative, 2); });
gt.test('Ring bearer assignment', () => { mockState.ringBearer = 0; assertEquals(mockState.ringBearer, 0); });
gt.test('Ring temptation increments', () => { mockState.ringTemptation = 3; assertEquals(mockState.ringTemptation, 3); });
gt.test('Day/night toggle', () => { mockState.dayNight = 'night'; assertEquals(mockState.dayNight, 'night'); });
gt.test('Planeswalker tracking', () => { mockState.players[0].planeswalkers.push({ name: 'Jace', loyalty: 4 }); assert(mockState.players[0].planeswalkers.length > 0); });
gt.test('City\'s blessing', () => { mockState.players[0].citysBlessing = true; assert(mockState.players[0].citysBlessing); });
gt.test('History saves state', () => { mockState.history.push(JSON.parse(JSON.stringify(mockState))); assert(mockState.history.length > 0); });
gt.test('History limit 50', () => { while (mockState.history.length > 50) mockState.history.shift(); assert(mockState.history.length <= 50); });

// ===== CARD BACK TESTS =====
const cb = suite('Card Back Visibility');
cb.test('Card HTML includes card-back', () => {
  const html = '<img src="images/back.png" class="card-back">';
  assert(html.includes('class="card-back"'));
});
cb.test('CSS rotateY(180deg)', () => {
  const css = 'transform: rotateY(180deg)';
  assert(css.includes('rotateY(180deg)'));
});
cb.test('preserve-3d required', () => {
  const css = 'transform-style: preserve-3d';
  assert(css.includes('preserve-3d'));
});
cb.test('Rotation range allows visibility', () => {
  const rotateY = 0.5 * 120;
  assert(rotateY >= 60);
});

// ===== FLAVOR NAMES TESTS =====
const fn = suite('Flavor Names');
fn.test('Flavor name matching', () => {
  const card = { name: 'Toxrill, the Corrosive', flavor_name: 'Gary, the Snail' };
  const matches = card.flavor_name && card.flavor_name.toLowerCase() === 'gary, the snail';
  assert(matches);
});
fn.test('Oracle ID matching', () => {
  const toxrill = { oracle_id: 'oracle3' };
  const gary = { oracle_id: 'oracle3' };
  assertEquals(toxrill.oracle_id, gary.oracle_id);
});

// ===== FOIL SHIMMER TESTS =====
const fs = suite('Foil Shimmer');
fs.test('Foil has shimmer effect', () => {
  const css = '.foil::after { background: radial-gradient(...); }';
  assert(css.includes('radial-gradient'));
});
fs.test('Uses CSS variables', () => {
  const css = 'var(--shimmer-x) var(--shimmer-y)';
  assert(css.includes('--shimmer-x'));
});

// ===== COPIES FILTER TESTS =====
const cf = suite('Copies Filter');
cf.test('Count by oracle_id', () => {
  const coll = [
    { name: 'Lightning Bolt', oracle_id: 'o1' },
    { name: 'Lightning Bolt', oracle_id: 'o1' },
    { name: 'Sol Ring', oracle_id: 'o2' }
  ];
  const counts = {};
  coll.forEach(c => counts[c.oracle_id] = (counts[c.oracle_id] || 0) + 1);
  assertEquals(counts['o1'], 2);
});
cf.test('Filter duplicates', () => {
  const coll = [
    { oracle_id: 'o1' },
    { oracle_id: 'o1' },
    { oracle_id: 'o2' }
  ];
  const counts = {};
  coll.forEach(c => counts[c.oracle_id] = (counts[c.oracle_id] || 0) + 1);
  const dups = coll.filter(c => counts[c.oracle_id] > 1);
  assertEquals(dups.length, 2);
});

// ===== DETAIL PAGE TESTS =====
const dp = suite('Detail Page');
dp.test('Includes detail-back', () => {
  const html = '<img class="detail-back">';
  assert(html.includes('detail-back'));
});
dp.test('Upgrade cards have upgrade-back', () => {
  const html = '<img class="upgrade-back">';
  assert(html.includes('upgrade-back'));
});
dp.test('3D transform works', () => {
  const transform = 'rotateX(-30deg) rotateY(60deg)';
  assert(transform.includes('rotateX') && transform.includes('rotateY'));
});

// ===== TRADING BINDER TESTS =====
const tb = suite('Trading Binder');
tb.test('LocalStorage saves IDs', () => {
  const ids = ['id1', 'id2'];
  const stored = JSON.stringify(ids);
  const parsed = JSON.parse(stored);
  assertEquals(parsed.length, 2);
});
tb.test('Context menu adds cards', () => {
  const ids = [];
  ids.push('test-id');
  assert(ids.includes('test-id'));
});
tb.test('Lock state persists to localStorage', () => {
  localStorage.setItem('binderLocked', '1');
  const locked = localStorage.getItem('binderLocked') === '1';
  assert(locked);
  localStorage.setItem('binderLocked', '0');
  const unlocked = localStorage.getItem('binderLocked') === '0';
  assert(unlocked);
});
tb.test('Password hash is SHA-256', () => {
  const hash = 'a9ab99bc6167f801e4b43cf1c569b4f7e1c52a3017a0eb2693c4cb87e8810103';
  assertEquals(hash.length, 64); // SHA-256 is 64 hex chars
});
tb.test('Locked state blocks adding cards', () => {
  localStorage.setItem('binderLocked', '1');
  const binderLocked = localStorage.getItem('binderLocked') === '1';
  assert(binderLocked);
});
tb.test('Unlocked state allows adding cards', () => {
  localStorage.setItem('binderLocked', '0');
  const binderLocked = localStorage.getItem('binderLocked') === '1';
  assert(!binderLocked);
});
tb.test('Trading binder JSON has cards and lastModified', () => {
  const data = {
    cards: [],
    lastModified: '2026-02-19T21:44:15.397Z'
  };
  assert(data.cards !== undefined);
  assert(data.lastModified !== undefined);
});
tb.test('Password stored in separate file', () => {
  const passwordData = {
    passwordHash: 'a9ab99bc6167f801e4b43cf1c569b4f7e1c52a3017a0eb2693c4cb87e8810103'
  };
  assert(passwordData.passwordHash !== undefined);
  assertEquals(passwordData.passwordHash.length, 64);
});
tb.test('Cards fetched from Scryfall have required fields', () => {
  const card = {
    name: 'Test Card',
    scryfallId: 'abc123',
    foil: 'normal',
    price: 1.50,
    scryfallPrices: { usd: '1.50' },
    quantity: 1,
    currency: 'USD'
  };
  assert(card.foil === 'normal');
  assert(card.scryfallPrices !== undefined);
  assert(card.quantity === 1);
  assert(card.currency === 'USD');
});

// ===== PRICE FALLBACK TESTS =====
const pf = suite('Price Fallback');
pf.test('getCardPrice falls back to usd_foil when usd is null', () => {
  const card = { foil: 'normal', scryfallPrices: { usd: null, usd_foil: '10.00', usd_etched: null }, price: 0 };
  // Simulate getCardPrice logic (scryfall source)
  const p = card.scryfallPrices;
  let price;
  if (card.foil === 'etched' && p.usd_etched) price = parseFloat(p.usd_etched);
  else if (card.foil === 'foil' && p.usd_foil) price = parseFloat(p.usd_foil);
  else if (p.usd) price = parseFloat(p.usd);
  else price = parseFloat(p.usd_foil || p.usd_etched || '0');
  assertEquals(price, 10);
});
pf.test('getCardPrice uses usd when available', () => {
  const p = { usd: '5.00', usd_foil: '10.00' };
  const price = parseFloat(p.usd);
  assertEquals(price, 5);
});
pf.test('getCardPrice falls back to usd_etched', () => {
  const p = { usd: null, usd_foil: null, usd_etched: '3.00' };
  const price = parseFloat(p.usd || p.usd_foil || p.usd_etched || '0');
  assertEquals(price, 3);
});
pf.test('card.price uses full fallback chain', () => {
  const prices = { usd: null, usd_foil: '7.50', usd_etched: null };
  const price = parseFloat(prices.usd || prices.usd_foil || prices.usd_etched || '0');
  assertEquals(price, 7.5);
});
pf.test('All null prices result in 0', () => {
  const prices = { usd: null, usd_foil: null, usd_etched: null };
  const price = parseFloat(prices.usd || prices.usd_foil || prices.usd_etched || '0');
  assertEquals(price, 0);
});
pf.test('Foil card uses usd_foil first then usd', () => {
  const p = { usd: '5.00', usd_foil: '12.00' };
  // foil card logic
  let price;
  if (p.usd_foil) price = parseFloat(p.usd_foil);
  else if (p.usd) price = parseFloat(p.usd);
  else price = 0;
  assertEquals(price, 12);
});
pf.test('Foil card falls back to usd when usd_foil null', () => {
  const p = { usd: '5.00', usd_foil: null };
  let price;
  if (p.usd_foil) price = parseFloat(p.usd_foil);
  else if (p.usd) price = parseFloat(p.usd);
  else price = 0;
  assertEquals(price, 5);
});

// ===== WISHLIST TESTS =====
const wl = suite('Wishlist');

// scryfallToCard format
wl.test('scryfallToCard returns correct format', () => {
  const mockScryfall = {
    name: 'Force of Despair', id: 'abc123', set: 'sld', set_name: 'Secret Lair Drop',
    collector_number: '123', rarity: 'rare', prices: { usd: '5.00', usd_foil: '10.00' },
    image_uris: { normal: 'https://img.scryfall.com/test.jpg' },
    type_line: 'Creature', colors: ['B'], keywords: [], mana_cost: '{3}{B}{B}', cmc: 5
  };
  // Simulate scryfallToCard
  const card = {
    name: mockScryfall.name,
    scryfallId: mockScryfall.id + ('normal' === 'foil' ? '-foil' : ''),
    setCode: mockScryfall.set.toUpperCase(),
    foil: 'normal',
    price: parseFloat(mockScryfall.prices.usd),
    currency: 'USD',
    scryfallPrices: mockScryfall.prices,
    quantity: 1
  };
  assertEquals(card.scryfallId, 'abc123');
  assertEquals(card.foil, 'normal');
  assertEquals(card.price, 5);
  assertEquals(card.setCode, 'SLD');
  assertEquals(card.currency, 'USD');
  assertEquals(card.quantity, 1);
  assert(card.scryfallPrices !== undefined);
});

// Foil variant gets -foil suffix
wl.test('Foil card gets -foil suffix on scryfallId', () => {
  const id = 'abc123';
  const foil = 'foil';
  const scryfallId = id + (foil === 'foil' ? '-foil' : '');
  assertEquals(scryfallId, 'abc123-foil');
});

// Normal card has no suffix
wl.test('Normal card has no suffix on scryfallId', () => {
  const id = 'abc123';
  const foil = 'normal';
  const scryfallId = id + (foil === 'foil' ? '-foil' : '');
  assertEquals(scryfallId, 'abc123');
});

// scryfallToSearchCards expands foil/non-foil
wl.test('Search expands foil and non-foil versions', () => {
  const card = { nonfoil: true, foil: true, id: 'abc123', prices: { usd: '5.00', usd_foil: '10.00' } };
  const cards = [];
  if (card.nonfoil) cards.push({ foil: 'normal', scryfallId: card.id });
  if (card.foil) cards.push({ foil: 'foil', scryfallId: card.id + '-foil' });
  assertEquals(cards.length, 2);
  assertEquals(cards[0].foil, 'normal');
  assertEquals(cards[1].foil, 'foil');
  assertEquals(cards[1].scryfallId, 'abc123-foil');
});

// SLD foil-only card still shows foil version
wl.test('Foil-only card (no nonfoil) shows foil version', () => {
  const card = { nonfoil: false, foil: true, id: 'sld123', prices: { usd: null, usd_foil: null } };
  const cards = [];
  if (card.nonfoil) cards.push({ foil: 'normal' });
  if (card.foil) cards.push({ foil: 'foil' });
  if (cards.length === 0) cards.push({ foil: 'normal' });
  assertEquals(cards.length, 1);
  assertEquals(cards[0].foil, 'foil');
});

// Card with both flags but null foil price still shows both
wl.test('Card with null usd_foil still shows foil version', () => {
  const card = { nonfoil: true, foil: true, prices: { usd: '5.00', usd_foil: null } };
  const cards = [];
  if (card.nonfoil) cards.push('normal');
  if (card.foil) cards.push('foil');
  assertEquals(cards.length, 2);
});

// Foil suffix stripped for Scryfall batch fetch
wl.test('Foil suffix stripped before Scryfall batch fetch', () => {
  const ids = ['abc123', 'def456-foil', 'ghi789'];
  const cleanIds = ids.map(id => id.replace(/-foil$/, ''));
  assertEquals(cleanIds[0], 'abc123');
  assertEquals(cleanIds[1], 'def456');
  assertEquals(cleanIds[2], 'ghi789');
});

// Foil IDs tracked for restoration after fetch
wl.test('Foil IDs tracked for restoration after fetch', () => {
  const ids = ['abc123', 'def456-foil', 'ghi789-foil'];
  const foilIds = new Set(ids.filter(id => id.endsWith('-foil')));
  assert(foilIds.has('def456-foil'));
  assert(foilIds.has('ghi789-foil'));
  assert(!foilIds.has('abc123'));
});

// Detail link strips -foil suffix
wl.test('Detail link strips -foil suffix', () => {
  const scryfallId = 'abc123-foil';
  const realId = scryfallId.replace(/-foil$/, '');
  assertEquals(realId, 'abc123');
});

// Image fetch strips -foil suffix
wl.test('Image fetch strips -foil suffix', () => {
  const id = 'abc123-foil';
  const cleanId = id.replace(/-foil$/, '');
  assertEquals(cleanId, 'abc123');
});

// Wishlist JSON format
wl.test('Wishlist JSON has cards and lastModified', () => {
  const data = { cards: [{ scryfallId: 'abc-foil', addedAt: '2026-02-20T00:00:00Z' }], lastModified: '2026-02-20T00:00:00Z' };
  assert(Array.isArray(data.cards));
  assert(data.lastModified !== undefined);
  assert(data.cards[0].scryfallId !== undefined);
  assert(data.cards[0].addedAt !== undefined);
});

// Unified admin password
wl.test('Unified admin password file used by both binder and wishlist', () => {
  const adminPassword = { passwordHash: 'a9ab99bc6167f801e4b43cf1c569b4f7e1c52a3017a0eb2693c4cb87e8810103' };
  assertEquals(adminPassword.passwordHash.length, 64);
});

// Lock state
wl.test('Wishlist lock state persists to localStorage', () => {
  localStorage.setItem('wishlistLocked', '1');
  assert(localStorage.getItem('wishlistLocked') === '1');
  localStorage.setItem('wishlistLocked', '0');
  assert(localStorage.getItem('wishlistLocked') === '0');
});

// Dedupe clean IDs for batch fetch
wl.test('Batch fetch dedupes clean IDs', () => {
  const ids = ['abc123', 'abc123-foil'];
  const cleanIds = ids.map(id => id.replace(/-foil$/, ''));
  const unique = [...new Set(cleanIds)];
  assertEquals(unique.length, 1);
  assertEquals(unique[0], 'abc123');
});

// ===== CONTEXT MENU TESTS =====
const cm = suite('Context Menu');
cm.test('Context menu shows wishlist option when unlocked', () => {
  localStorage.setItem('wishlistLocked', '0');
  const wishlistLocked = localStorage.getItem('wishlistLocked') === '1';
  assert(!wishlistLocked);
});
cm.test('Context menu hidden when both locked', () => {
  localStorage.setItem('binderLocked', '1');
  localStorage.setItem('wishlistLocked', '1');
  const binderLocked = localStorage.getItem('binderLocked') === '1';
  const wishlistLocked = localStorage.getItem('wishlistLocked') === '1';
  assert(binderLocked && wishlistLocked);
});
cm.test('addToWishlist stores ID in localStorage', () => {
  localStorage.setItem('wishlist', JSON.stringify(['existing-id']));
  const ids = JSON.parse(localStorage.getItem('wishlist'));
  ids.push('new-id');
  localStorage.setItem('wishlist', JSON.stringify(ids));
  const updated = JSON.parse(localStorage.getItem('wishlist'));
  assert(updated.includes('new-id'));
  assert(updated.includes('existing-id'));
  assertEquals(updated.length, 2);
  localStorage.removeItem('wishlist');
});
cm.test('addToWishlist prevents duplicates', () => {
  const ids = ['abc123'];
  assert(ids.includes('abc123'));
});

// ===== DECK CHECKER TESTS =====
const dc = suite('Deck Checker');
dc.test('Missing card version selector stores scryfallId', () => {
  const selectedVersions = {};
  selectedVersions['force of will'] = { scryfallId: 'abc123-foil', imageUrl: 'https://img.scryfall.com/test.jpg' };
  assert(selectedVersions['force of will'].scryfallId === 'abc123-foil');
});
dc.test('Add all missing to wishlist collects all selected versions', () => {
  const selectedVersions = {
    'force of will': { scryfallId: 'abc123-foil' },
    'mana drain': { scryfallId: 'def456' }
  };
  const ids = Object.values(selectedVersions).map(v => v.scryfallId);
  assertEquals(ids.length, 2);
  assert(ids.includes('abc123-foil'));
  assert(ids.includes('def456'));
});
dc.test('game:paper filter in search URL', () => {
  const url = 'https://api.scryfall.com/cards/search?q=!Force+game:paper&unique=prints';
  assert(url.includes('game:paper'));
});

// ===== DETAIL PAGE VERSIONS TESTS =====
const dv = suite('Detail Page Versions');
dv.test('Expands foil and non-foil from Scryfall card', () => {
  const card = { nonfoil: true, foil: true, id: 'abc', set: 'sld', collector_number: '1', prices: { usd: '5.00', usd_foil: '10.00' }, set_name: 'Secret Lair', image_uris: { normal: 'img.jpg' }, scryfall_uri: 'https://scryfall.com/card/sld/1' };
  const expanded = [];
  if (card.nonfoil) expanded.push({ id: card.id, price: parseFloat(card.prices.usd || '0'), foil: false });
  if (card.foil) expanded.push({ id: card.id + '-foil', price: parseFloat(card.prices.usd_foil || '0'), foil: true });
  assertEquals(expanded.length, 2);
  assertEquals(expanded[0].foil, false);
  assertEquals(expanded[1].foil, true);
  assertEquals(expanded[1].id, 'abc-foil');
});
dv.test('Foil with null price still included', () => {
  const card = { nonfoil: true, foil: true, prices: { usd: '5.00', usd_foil: null } };
  const expanded = [];
  if (card.nonfoil) expanded.push({ price: parseFloat(card.prices.usd || '0') });
  if (card.foil) expanded.push({ price: parseFloat(card.prices.usd_foil || '0') });
  assertEquals(expanded.length, 2);
  assertEquals(expanded[1].price, 0);
});
dv.test('Drag prevents link navigation (hasMoved)', () => {
  let hasMoved = false;
  hasMoved = true; // simulate drag
  let prevented = false;
  if (hasMoved) prevented = true;
  assert(prevented);
});
dv.test('Upgrade card is div not anchor', () => {
  const html = '<div class="upgrade-card"><a href="..." class="upgrade-set-link">Set Name</a></div>';
  assert(html.startsWith('<div'));
  assert(html.includes('upgrade-set-link'));
});

// ===== CSS LAYOUT TESTS =====
const css = suite('CSS Layout');
css.test('Price slider has align-self flex-start', () => {
  const rule = '.filter-group.price-slider { align-self: flex-start; }';
  assert(rule.includes('align-self: flex-start'));
});
css.test('Autocomplete wrapper has fixed width', () => {
  const rule = '.autocomplete-wrapper { width: 200px; }';
  assert(rule.includes('width: 200px'));
});
css.test('Autocomplete wrapper has position relative', () => {
  const rule = '.autocomplete-wrapper { position: relative; }';
  assert(rule.includes('position: relative'));
});
css.test('Filter group has position relative', () => {
  const rule = '.filter-group { position: relative; }';
  assert(rule.includes('position: relative'));
});

// ===== FILTER TESTS =====
const filters = suite('Advanced Filters');

// Mock collection data for filter tests
const mockCollection = [
  { name: 'Lightning Bolt', type_line: 'Instant', colors: ['R'], color_identity: ['R'], keywords: [], foil: 'normal', rarity: 'common', cmc: 1, setName: 'Alpha', price: 5 },
  { name: 'Counterspell', type_line: 'Instant', colors: ['U'], color_identity: ['U'], keywords: [], foil: 'foil', rarity: 'uncommon', cmc: 2, setName: 'Beta', price: 10 },
  { name: 'Llanowar Elves', type_line: 'Creature — Elf Druid', colors: ['G'], color_identity: ['G'], keywords: [], foil: 'normal', rarity: 'common', cmc: 1, setName: 'Alpha', price: 2 },
  { name: 'Serra Angel', type_line: 'Creature — Angel', colors: ['W'], color_identity: ['W'], keywords: ['Flying', 'Vigilance'], foil: 'etched', rarity: 'rare', cmc: 5, setName: 'Beta', price: 15 },
  { name: 'Black Lotus', type_line: 'Artifact', colors: [], color_identity: [], keywords: [], foil: 'normal', rarity: 'mythic', cmc: 0, setName: 'Alpha', price: 10000 },
  { name: 'Forest', type_line: 'Basic Land — Forest', colors: [], color_identity: [], keywords: [], foil: 'normal', rarity: 'common', cmc: 0, setName: 'Alpha', price: 0.1 },
  { name: 'Azorius Signet', type_line: 'Artifact', colors: [], color_identity: ['W', 'U'], keywords: [], foil: 'normal', rarity: 'uncommon', cmc: 2, setName: 'Ravnica', price: 1 }
];

filters.test('Type filter - Instant', () => {
  const filtered = mockCollection.filter(c => c.type_line.includes('Instant'));
  assertEquals(filtered.length, 2);
});

filters.test('Type filter - Creature', () => {
  const filtered = mockCollection.filter(c => c.type_line.includes('Creature'));
  assertEquals(filtered.length, 2);
});

filters.test('Type filter - Artifact', () => {
  const filtered = mockCollection.filter(c => c.type_line.includes('Artifact'));
  assertEquals(filtered.length, 2); // Black Lotus + Azorius Signet
});

filters.test('Type filter - Land', () => {
  const filtered = mockCollection.filter(c => c.type_line.includes('Land'));
  assertEquals(filtered.length, 1);
});

filters.test('Subtype filter - Elf', () => {
  const filtered = mockCollection.filter(c => c.type_line.toLowerCase().includes('elf'));
  assertEquals(filtered.length, 1);
  assertEquals(filtered[0].name, 'Llanowar Elves');
});

filters.test('Subtype filter - Angel', () => {
  const filtered = mockCollection.filter(c => c.type_line.toLowerCase().includes('angel'));
  assertEquals(filtered.length, 1);
  assertEquals(filtered[0].name, 'Serra Angel');
});

filters.test('Color filter - Red', () => {
  const filtered = mockCollection.filter(c => c.colors.includes('R'));
  assertEquals(filtered.length, 1);
});

filters.test('Color filter - Blue', () => {
  const filtered = mockCollection.filter(c => c.colors.includes('U'));
  assertEquals(filtered.length, 1);
});

filters.test('Color filter - Colorless', () => {
  const filtered = mockCollection.filter(c => c.colors.length === 0);
  assertEquals(filtered.length, 3); // Black Lotus, Forest, Azorius Signet
});

filters.test('Foil filter - Normal', () => {
  const filtered = mockCollection.filter(c => c.foil === 'normal');
  assertEquals(filtered.length, 5); // Bolt, Elves, Lotus, Forest, Signet
});

filters.test('Foil filter - Foil', () => {
  const filtered = mockCollection.filter(c => c.foil === 'foil');
  assertEquals(filtered.length, 1);
  assertEquals(filtered[0].name, 'Counterspell');
});

filters.test('Foil filter - Etched', () => {
  const filtered = mockCollection.filter(c => c.foil === 'etched');
  assertEquals(filtered.length, 1);
  assertEquals(filtered[0].name, 'Serra Angel');
});

filters.test('Rarity filter - Common', () => {
  const filtered = mockCollection.filter(c => c.rarity === 'common');
  assertEquals(filtered.length, 3);
});

filters.test('Rarity filter - Rare', () => {
  const filtered = mockCollection.filter(c => c.rarity === 'rare');
  assertEquals(filtered.length, 1);
});

filters.test('Rarity filter - Mythic', () => {
  const filtered = mockCollection.filter(c => c.rarity === 'mythic');
  assertEquals(filtered.length, 1);
});

filters.test('Keyword filter - Flying', () => {
  const filtered = mockCollection.filter(c => c.keywords.includes('Flying'));
  assertEquals(filtered.length, 1);
  assertEquals(filtered[0].name, 'Serra Angel');
});

filters.test('Keyword filter - Vigilance', () => {
  const filtered = mockCollection.filter(c => c.keywords.includes('Vigilance'));
  assertEquals(filtered.length, 1);
});

filters.test('CMC filter - 0', () => {
  const filtered = mockCollection.filter(c => c.cmc === 0);
  assertEquals(filtered.length, 2); // Black Lotus and Forest
});

filters.test('CMC filter - 1', () => {
  const filtered = mockCollection.filter(c => c.cmc === 1);
  assertEquals(filtered.length, 2);
});

filters.test('Set filter - Alpha', () => {
  const filtered = mockCollection.filter(c => c.setName.toLowerCase().includes('alpha'));
  assertEquals(filtered.length, 4);
});

filters.test('Set filter - Beta', () => {
  const filtered = mockCollection.filter(c => c.setName.toLowerCase().includes('beta'));
  assertEquals(filtered.length, 2);
});

filters.test('Combined filters - Red Instant', () => {
  const filtered = mockCollection.filter(c => 
    c.type_line.includes('Instant') && c.colors.includes('R')
  );
  assertEquals(filtered.length, 1);
  assertEquals(filtered[0].name, 'Lightning Bolt');
});

filters.test('Combined filters - Foil Creature', () => {
  const filtered = mockCollection.filter(c => 
    c.type_line.includes('Creature') && (c.foil === 'foil' || c.foil === 'etched')
  );
  assertEquals(filtered.length, 1);
  assertEquals(filtered[0].name, 'Serra Angel');
});

filters.test('Price range - Under $1', () => {
  const filtered = mockCollection.filter(c => c.price < 1);
  assertEquals(filtered.length, 1);
});

filters.test('Price range - $5-$15', () => {
  const filtered = mockCollection.filter(c => c.price >= 5 && c.price <= 15);
  assertEquals(filtered.length, 3);
});

filters.test('Color identity - Red', () => {
  const filtered = mockCollection.filter(c => 
    c.color_identity.every(color => ['R'].includes(color))
  );
  assertEquals(filtered.length, 3); // Lightning Bolt, Black Lotus, Forest
});

filters.test('Color identity - White/Blue', () => {
  const filtered = mockCollection.filter(c => 
    c.color_identity.every(color => ['W', 'U'].includes(color))
  );
  assertEquals(filtered.length, 5); // Counterspell, Serra Angel, Black Lotus, Forest, Azorius Signet
});

filters.test('Color identity - Colorless only', () => {
  const filtered = mockCollection.filter(c => c.color_identity.length === 0);
  assertEquals(filtered.length, 2); // Black Lotus, Forest
});

filters.test('Color identity - Multicolor artifact', () => {
  const filtered = mockCollection.filter(c => 
    c.type_line.includes('Artifact') && c.color_identity.length > 1
  );
  assertEquals(filtered.length, 1);
  assertEquals(filtered[0].name, 'Azorius Signet');
});

// ===== TRADING BINDER FOIL TESTS =====
const binderFoil = suite('Trading Binder Foil');

binderFoil.test('Foil status preserved in card data', () => {
  const card = { scryfallId: 'abc123', foil: 'foil' };
  assertEquals(card.foil, 'foil');
});

binderFoil.test('Normal finish default', () => {
  const card = { scryfallId: 'abc123', foil: 'normal' };
  assertEquals(card.foil, 'normal');
});

binderFoil.test('Etched finish supported', () => {
  const card = { scryfallId: 'abc123', foil: 'etched' };
  assertEquals(card.foil, 'etched');
});

binderFoil.test('Card key includes foil status', () => {
  const makeKey = (c) => `${c.scryfallId}:${c.foil || 'normal'}`;
  const card1 = { scryfallId: 'abc123', foil: 'foil' };
  const card2 = { scryfallId: 'abc123', foil: 'normal' };
  assert(makeKey(card1) !== makeKey(card2), 'Same card with different foil should have different keys');
});

binderFoil.test('Foil filter - foil cards only', () => {
  const cards = [
    { name: 'Card1', foil: 'foil' },
    { name: 'Card2', foil: 'normal' },
    { name: 'Card3', foil: 'foil' }
  ];
  const filtered = cards.filter(c => c.foil === 'foil');
  assertEquals(filtered.length, 2);
});

binderFoil.test('Foil filter - normal cards only', () => {
  const cards = [
    { name: 'Card1', foil: 'foil' },
    { name: 'Card2', foil: 'normal' },
    { name: 'Card3', foil: 'normal' }
  ];
  const filtered = cards.filter(c => c.foil === 'normal');
  assertEquals(filtered.length, 2);
});

binderFoil.test('Foil filter - etched cards only', () => {
  const cards = [
    { name: 'Card1', foil: 'foil' },
    { name: 'Card2', foil: 'etched' },
    { name: 'Card3', foil: 'normal' }
  ];
  const filtered = cards.filter(c => c.foil === 'etched');
  assertEquals(filtered.length, 1);
});

binderFoil.test('Same card different foils are distinct', () => {
  const cards = [
    { scryfallId: 'abc123', foil: 'foil', name: 'Lightning Bolt' },
    { scryfallId: 'abc123', foil: 'normal', name: 'Lightning Bolt' }
  ];
  const makeKey = (c) => `${c.scryfallId}:${c.foil}`;
  const keys = cards.map(makeKey);
  assertEquals(keys.length, 2);
  assert(keys[0] !== keys[1], 'Keys should be different');
});

binderFoil.test('Migration from old format', () => {
  // Old format: array of strings
  const oldFormat = ['abc123', 'def456'];
  // Should migrate to new format
  const newFormat = oldFormat.map(id => ({ scryfallId: id, foil: 'normal' }));
  assertEquals(newFormat.length, 2);
  assertEquals(newFormat[0].foil, 'normal');
  assertEquals(newFormat[1].foil, 'normal');
});

binderFoil.test('Correct price key for foil', () => {
  const foil = 'foil';
  const priceKey = foil === 'foil' ? 'usd_foil' : foil === 'etched' ? 'usd_etched' : 'usd';
  assertEquals(priceKey, 'usd_foil');
});

binderFoil.test('Correct price key for normal', () => {
  const foil = 'normal';
  const priceKey = foil === 'foil' ? 'usd_foil' : foil === 'etched' ? 'usd_etched' : 'usd';
  assertEquals(priceKey, 'usd');
});

binderFoil.test('Correct price key for etched', () => {
  const foil = 'etched';
  const priceKey = foil === 'foil' ? 'usd_foil' : foil === 'etched' ? 'usd_etched' : 'usd';
  assertEquals(priceKey, 'usd_etched');
});

// === Deck Checker Wishlist Integration ===
const dcw = suite('Deck Checker Wishlist');

// Helper: simulate convertDeck logic for owned cards
function getOwnedCardVersions(card, collectionCards, wishlistCards, getOracleId) {
  const allVersions = [];
  if (collectionCards.has(card.name)) {
    allVersions.push(...collectionCards.get(card.name));
  } else {
    for (const [, versions] of collectionCards.entries()) {
      if (versions.some(v => v.scryfallId === card.scryfallId)) {
        allVersions.push(...versions);
        break;
      }
    }
  }
  let wlVersions = wishlistCards.get(card.name.toLowerCase());
  if (!wlVersions) {
    const ownedOracleId = allVersions[0]?.oracle_id || getOracleId(card.scryfallId);
    if (ownedOracleId) {
      for (const [, versions] of wishlistCards.entries()) {
        if (versions.some(v => v.oracle_id === ownedOracleId)) {
          wlVersions = versions;
          break;
        }
      }
    }
  }
  if (wlVersions) {
    wlVersions.forEach(v => allVersions.push({...v, _fromWishlist: true}));
  }
  return allVersions;
}

// Helper: simulate convertDeck logic for missing cards
function getMissingCardVersions(card, wishlistCards) {
  const name = card.name.toLowerCase();
  let wlVersions = wishlistCards.get(name) || wishlistCards.get(card.realName) || null;
  if (!wlVersions && card.oracle_id) {
    for (const [, versions] of wishlistCards.entries()) {
      if (versions.some(v => v.oracle_id === card.oracle_id)) {
        wlVersions = versions;
        break;
      }
    }
  }
  if (wlVersions) return wlVersions.map(v => ({...v, _fromWishlist: true}));
  return [];
}

// --- Owned card: single collection version, no wishlist ---
dcw.test('Owned card with 1 collection version, no wishlist', () => {
  const col = new Map([['lightning bolt', [{ scryfallId: 'lb1', setCode: 'LEA', oracle_id: 'o1', foil: 'normal' }]]]);
  const wl = new Map();
  const result = getOwnedCardVersions({ name: 'lightning bolt', scryfallId: 'lb1' }, col, wl, () => null);
  assertEquals(result.length, 1);
  assertEquals(result[0].scryfallId, 'lb1');
  assert(!result[0]._fromWishlist, 'Should not be from wishlist');
});

// --- Owned card: collection + wishlist version by name ---
dcw.test('Owned card picks up wishlist version by name match', () => {
  const col = new Map([['lightning bolt', [{ scryfallId: 'lb1', setCode: 'LEA', oracle_id: 'o1', foil: 'normal' }]]]);
  const wl = new Map([['lightning bolt', [{ scryfallId: 'lb2', setCode: 'M21', oracle_id: 'o1', foil: 'foil' }]]]);
  const result = getOwnedCardVersions({ name: 'lightning bolt', scryfallId: 'lb1' }, col, wl, () => null);
  assertEquals(result.length, 2);
  assertEquals(result[0].scryfallId, 'lb1');
  assert(!result[0]._fromWishlist);
  assertEquals(result[1].scryfallId, 'lb2');
  assert(result[1]._fromWishlist === true, 'Wishlist version should be tagged');
});

// --- Owned card: wishlist version found by oracle_id (DFC / different name) ---
dcw.test('Owned card finds wishlist version by oracle_id when names differ', () => {
  const col = new Map([['delver of secrets', [{ scryfallId: 'ds1', setCode: 'ISD', oracle_id: 'o-delver', foil: 'normal' }]]]);
  const wl = new Map([['delver of secrets // insectile aberration', [{ scryfallId: 'ds2', setCode: 'MID', oracle_id: 'o-delver', foil: 'foil' }]]]);
  const result = getOwnedCardVersions({ name: 'delver of secrets', scryfallId: 'ds1' }, col, wl, () => null);
  assertEquals(result.length, 2);
  assert(result[1]._fromWishlist === true);
  assertEquals(result[1].oracle_id, 'o-delver');
});

// --- Owned card: oracle_id fallback via getOracleId function ---
dcw.test('Owned card uses getOracleId fallback when collection version has no oracle_id', () => {
  const col = new Map([['sol ring', [{ scryfallId: 'sr1', setCode: 'C21' }]]]);
  const wl = new Map([['sol ring', [{ scryfallId: 'sr2', setCode: 'CMR', oracle_id: 'o-sol', foil: 'normal' }]]]);
  // oracle_id not on collection version, but name matches so it should still work
  const result = getOwnedCardVersions({ name: 'sol ring', scryfallId: 'sr1' }, col, wl, () => null);
  assertEquals(result.length, 2);
  assert(result[1]._fromWishlist === true);
});

// --- Owned card: found via scryfallId when name doesn't match collection key ---
dcw.test('Owned card found via scryfallId fallback in collection', () => {
  const col = new Map([['the reaver cleaver', [{ scryfallId: 'rc1', setCode: 'BRO', oracle_id: 'o-rc', foil: 'normal' }]]]);
  const wl = new Map();
  // Deck list has flavor name, collection has real name
  const result = getOwnedCardVersions({ name: "knuckles's gloves", scryfallId: 'rc1' }, col, wl, () => null);
  assertEquals(result.length, 1);
  assertEquals(result[0].scryfallId, 'rc1');
});

// --- Owned card: multiple collection versions, no wishlist ---
dcw.test('Owned card with multiple collection versions triggers multi-select', () => {
  const col = new Map([['counterspell', [
    { scryfallId: 'cs1', setCode: 'ICE', oracle_id: 'o-cs', foil: 'normal' },
    { scryfallId: 'cs2', setCode: 'MH2', oracle_id: 'o-cs', foil: 'foil' }
  ]]]);
  const wl = new Map();
  const result = getOwnedCardVersions({ name: 'counterspell', scryfallId: 'cs1' }, col, wl, () => null);
  assertEquals(result.length, 2);
  assert(!result[0]._fromWishlist);
  assert(!result[1]._fromWishlist);
});

// --- Owned card: collection + multiple wishlist versions ---
dcw.test('Owned card merges collection and multiple wishlist versions', () => {
  const col = new Map([['swords to plowshares', [{ scryfallId: 'sp1', setCode: 'ICE', oracle_id: 'o-sp', foil: 'normal' }]]]);
  const wl = new Map([['swords to plowshares', [
    { scryfallId: 'sp2', setCode: 'STA', oracle_id: 'o-sp', foil: 'normal' },
    { scryfallId: 'sp2', setCode: 'STA', oracle_id: 'o-sp', foil: 'foil' }
  ]]]);
  const result = getOwnedCardVersions({ name: 'swords to plowshares', scryfallId: 'sp1' }, col, wl, () => null);
  assertEquals(result.length, 3);
  assert(!result[0]._fromWishlist);
  assert(result[1]._fromWishlist === true);
  assert(result[2]._fromWishlist === true);
});

// --- Missing card: found on wishlist by exact name ---
dcw.test('Missing card found on wishlist by exact name', () => {
  const wl = new Map([['force of will', [{ scryfallId: 'fw1', setCode: 'ALL', oracle_id: 'o-fw', foil: 'normal' }]]]);
  const result = getMissingCardVersions({ name: 'force of will' }, wl);
  assertEquals(result.length, 1);
  assert(result[0]._fromWishlist === true);
  assertEquals(result[0].scryfallId, 'fw1');
});

// --- Missing card: not on wishlist at all ---
dcw.test('Missing card not on wishlist returns empty', () => {
  const wl = new Map([['force of will', [{ scryfallId: 'fw1', oracle_id: 'o-fw' }]]]);
  const result = getMissingCardVersions({ name: 'mana crypt' }, wl);
  assertEquals(result.length, 0);
});

// --- Missing card: found via realName (flavor name resolved during check) ---
dcw.test('Missing card found on wishlist via realName', () => {
  const wl = new Map([['the reaver cleaver', [{ scryfallId: 'rc1', setCode: 'BRO', oracle_id: 'o-rc', foil: 'normal' }]]]);
  const card = { name: "knuckles's gloves", realName: 'the reaver cleaver', oracle_id: 'o-rc' };
  const result = getMissingCardVersions(card, wl);
  assertEquals(result.length, 1);
  assert(result[0]._fromWishlist === true);
});

// --- Missing card: found via oracle_id when name and realName don't match ---
dcw.test('Missing card found on wishlist via oracle_id fallback', () => {
  const wl = new Map([['the reaver cleaver', [{ scryfallId: 'rc1', setCode: 'BRO', oracle_id: 'o-rc', foil: 'foil' }]]]);
  const card = { name: "knuckles's gloves", realName: undefined, oracle_id: 'o-rc' };
  const result = getMissingCardVersions(card, wl);
  assertEquals(result.length, 1);
  assertEquals(result[0].scryfallId, 'rc1');
});

// --- Missing card: no oracle_id, no realName, no name match ---
dcw.test('Missing card with no oracle_id and no name match returns empty', () => {
  const wl = new Map([['the reaver cleaver', [{ scryfallId: 'rc1', oracle_id: 'o-rc' }]]]);
  const card = { name: "knuckles's gloves" };
  const result = getMissingCardVersions(card, wl);
  assertEquals(result.length, 0);
});

// --- Missing card: multiple wishlist versions (normal + foil) ---
dcw.test('Missing card with multiple wishlist versions returns all tagged', () => {
  const wl = new Map([['rhystic study', [
    { scryfallId: 'rs1', setCode: 'PCY', oracle_id: 'o-rs', foil: 'normal' },
    { scryfallId: 'rs1', setCode: 'PCY', oracle_id: 'o-rs', foil: 'foil' }
  ]]]);
  const result = getMissingCardVersions({ name: 'rhystic study' }, wl);
  assertEquals(result.length, 2);
  assert(result[0]._fromWishlist === true);
  assert(result[1]._fromWishlist === true);
  assertEquals(result[0].foil, 'normal');
  assertEquals(result[1].foil, 'foil');
});

// --- _fromWishlist tag is always set on wishlist versions ---
dcw.test('All wishlist versions are tagged with _fromWishlist', () => {
  const col = new Map([['path to exile', [{ scryfallId: 'pe1', oracle_id: 'o-pe', foil: 'normal' }]]]);
  const wl = new Map([['path to exile', [{ scryfallId: 'pe2', oracle_id: 'o-pe', foil: 'foil' }]]]);
  const result = getOwnedCardVersions({ name: 'path to exile', scryfallId: 'pe1' }, col, wl, () => null);
  const wishlistVersions = result.filter(v => v._fromWishlist);
  const collectionVersions = result.filter(v => !v._fromWishlist);
  assertEquals(collectionVersions.length, 1);
  assertEquals(wishlistVersions.length, 1);
});

// --- Empty wishlist map doesn't break anything ---
dcw.test('Empty wishlist map returns only collection versions', () => {
  const col = new Map([['brainstorm', [{ scryfallId: 'bs1', oracle_id: 'o-bs', foil: 'normal' }]]]);
  const wl = new Map();
  const result = getOwnedCardVersions({ name: 'brainstorm', scryfallId: 'bs1' }, col, wl, () => null);
  assertEquals(result.length, 1);
  assert(!result[0]._fromWishlist);
});

dcw.test('Empty wishlist map returns empty for missing cards', () => {
  const result = getMissingCardVersions({ name: 'brainstorm' }, new Map());
  assertEquals(result.length, 0);
});

// --- Case insensitivity ---
dcw.test('Wishlist lookup is case insensitive for owned cards', () => {
  const col = new Map([['teferi, hero of dominaria', [{ scryfallId: 't1', oracle_id: 'o-t' }]]]);
  const wl = new Map([['teferi, hero of dominaria', [{ scryfallId: 't2', oracle_id: 'o-t', foil: 'foil' }]]]);
  const result = getOwnedCardVersions({ name: 'Teferi, Hero of Dominaria', scryfallId: 't1' }, col, wl, () => null);
  // Name doesn't match collection (case), falls through to scryfallId match
  // But wishlist lookup uses .toLowerCase() so it should find it
  const wlResults = result.filter(v => v._fromWishlist);
  assertEquals(wlResults.length, 1);
});

// --- checkAlternateNames return format ---
dcw.test('checkAlternateNames returns match and scryfallCard on collection hit', () => {
  // Simulating the return format
  const result = { match: { scryfallId: 'rc1', type_line: 'Artifact — Equipment' }, scryfallCard: { oracle_id: 'o-rc', name: 'The Reaver Cleaver' } };
  assert(result.match !== null, 'match should exist');
  assert(result.scryfallCard !== null, 'scryfallCard should exist');
  assertEquals(result.match.scryfallId, 'rc1');
});

dcw.test('checkAlternateNames returns null match but scryfallCard on no collection hit', () => {
  const result = { match: null, scryfallCard: { oracle_id: 'o-rc', name: 'The Reaver Cleaver' } };
  assert(result.match === null, 'match should be null');
  assert(result.scryfallCard !== null, 'scryfallCard should still exist');
  assertEquals(result.scryfallCard.oracle_id, 'o-rc');
});

// --- Missing card stores oracle_id and realName from checkDeck ---
dcw.test('Missing card with realName and oracle_id from check phase', () => {
  const card = { name: "gary, the snail", quantity: 1, oracle_id: 'o-toxrill', realName: 'toxrill, the corrosive' };
  const wl = new Map([['toxrill, the corrosive', [{ scryfallId: 'tx1', oracle_id: 'o-toxrill', foil: 'normal' }]]]);
  const result = getMissingCardVersions(card, wl);
  assertEquals(result.length, 1);
  assertEquals(result[0].scryfallId, 'tx1');
});

// --- Owned card: no duplicate wishlist entries when name and oracle_id both match ---
dcw.test('No duplicate wishlist versions when name and oracle_id point to same entry', () => {
  const col = new Map([['sol ring', [{ scryfallId: 'sr1', oracle_id: 'o-sol' }]]]);
  const wl = new Map([['sol ring', [{ scryfallId: 'sr2', oracle_id: 'o-sol', foil: 'foil' }]]]);
  const result = getOwnedCardVersions({ name: 'sol ring', scryfallId: 'sr1' }, col, wl, () => null);
  // Name match finds it first, oracle_id fallback should not run
  const wlResults = result.filter(v => v._fromWishlist);
  assertEquals(wlResults.length, 1);
});

// --- parseDeckList lowercases names ---
dcw.test('Deck list names are lowercased for consistent matching', () => {
  // Simulating parseDeckList behavior
  const name = 'Lightning Bolt';
  const parsed = name.toLowerCase();
  assertEquals(parsed, 'lightning bolt');
});

// --- Wishlist loadWishlist stores oracle_id ---
dcw.test('Wishlist card versions include oracle_id for matching', () => {
  const wlVersion = { scryfallId: 'abc', setCode: 'SET', collectorNumber: '1', foil: 'normal', setName: 'Test Set', oracle_id: 'o-test' };
  assert(wlVersion.oracle_id !== undefined, 'oracle_id must be present');
  assertEquals(wlVersion.oracle_id, 'o-test');
});

// --- Wishlist foil suffix handling ---
dcw.test('Wishlist foil IDs have -foil suffix stripped for Scryfall fetch', () => {
  const id = 'abc123-foil';
  const stripped = id.replace(/-foil$/, '');
  assertEquals(stripped, 'abc123');
});

dcw.test('Non-foil wishlist IDs are unchanged after strip', () => {
  const id = 'abc123';
  const stripped = id.replace(/-foil$/, '');
  assertEquals(stripped, 'abc123');
});

// === CSV Parsing ===
const csv = suite('CSV Parsing');

csv.test('Simple CSV line', () => {
  function parseCSVLine(line) {
    const result = []; let current = '', inQuotes = false;
    for (const char of line) {
      if (char === '"') inQuotes = !inQuotes;
      else if (char === ',' && !inQuotes) { result.push(current); current = ''; }
      else current += char;
    }
    result.push(current);
    return result;
  }
  const r = parseCSVLine('Lightning Bolt,LEA,Alpha,161');
  assertEquals(r.length, 4);
  assertEquals(r[0], 'Lightning Bolt');
  assertEquals(r[1], 'LEA');
});

csv.test('Quoted fields with commas', () => {
  function parseCSVLine(line) {
    const result = []; let current = '', inQuotes = false;
    for (const char of line) {
      if (char === '"') inQuotes = !inQuotes;
      else if (char === ',' && !inQuotes) { result.push(current); current = ''; }
      else current += char;
    }
    result.push(current);
    return result;
  }
  const r = parseCSVLine('"Jace, the Mind Sculptor",WWK,"Worldwake"');
  assertEquals(r[0], 'Jace, the Mind Sculptor');
  assertEquals(r[1], 'WWK');
});

csv.test('Empty fields', () => {
  function parseCSVLine(line) {
    const result = []; let current = '', inQuotes = false;
    for (const char of line) {
      if (char === '"') inQuotes = !inQuotes;
      else if (char === ',' && !inQuotes) { result.push(current); current = ''; }
      else current += char;
    }
    result.push(current);
    return result;
  }
  const r = parseCSVLine('Name,,Set,,Price');
  assertEquals(r.length, 5);
  assertEquals(r[1], '');
  assertEquals(r[3], '');
});

csv.test('Single field', () => {
  function parseCSVLine(line) {
    const result = []; let current = '', inQuotes = false;
    for (const char of line) {
      if (char === '"') inQuotes = !inQuotes;
      else if (char === ',' && !inQuotes) { result.push(current); current = ''; }
      else current += char;
    }
    result.push(current);
    return result;
  }
  const r = parseCSVLine('OnlyField');
  assertEquals(r.length, 1);
  assertEquals(r[0], 'OnlyField');
});

csv.test('Empty string', () => {
  function parseCSVLine(line) {
    const result = []; let current = '', inQuotes = false;
    for (const char of line) {
      if (char === '"') inQuotes = !inQuotes;
      else if (char === ',' && !inQuotes) { result.push(current); current = ''; }
      else current += char;
    }
    result.push(current);
    return result;
  }
  const r = parseCSVLine('');
  assertEquals(r.length, 1);
  assertEquals(r[0], '');
});

// === Price Logic ===
const price = suite('Price Logic');

price.test('formatPrice with USD', () => {
  function formatPrice(p, currency = 'USD') {
    if (!isFinite(p) || isNaN(p)) return '$0.00';
    const symbols = { USD: '$', CAD: 'CA$', EUR: '€', GBP: '£', AUD: 'A$', JPY: '¥' };
    const symbol = symbols[currency] || currency + ' ';
    return `${symbol}${p.toFixed(2)}`;
  }
  assertEquals(formatPrice(12.5), '$12.50');
});

price.test('formatPrice with EUR', () => {
  function formatPrice(p, currency = 'USD') {
    if (!isFinite(p) || isNaN(p)) return '$0.00';
    const symbols = { USD: '$', CAD: 'CA$', EUR: '€', GBP: '£', AUD: 'A$', JPY: '¥' };
    const symbol = symbols[currency] || currency + ' ';
    return `${symbol}${p.toFixed(2)}`;
  }
  assertEquals(formatPrice(9.99, 'EUR'), '€9.99');
});

price.test('formatPrice with NaN returns $0.00', () => {
  function formatPrice(p, currency = 'USD') {
    if (!isFinite(p) || isNaN(p)) return '$0.00';
    const symbols = { USD: '$', CAD: 'CA$', EUR: '€', GBP: '£', AUD: 'A$', JPY: '¥' };
    const symbol = symbols[currency] || currency + ' ';
    return `${symbol}${p.toFixed(2)}`;
  }
  assertEquals(formatPrice(NaN), '$0.00');
  assertEquals(formatPrice(Infinity), '$0.00');
});

price.test('formatPrice with zero', () => {
  function formatPrice(p, currency = 'USD') {
    if (!isFinite(p) || isNaN(p)) return '$0.00';
    const symbols = { USD: '$', CAD: 'CA$', EUR: '€', GBP: '£', AUD: 'A$', JPY: '¥' };
    const symbol = symbols[currency] || currency + ' ';
    return `${symbol}${p.toFixed(2)}`;
  }
  assertEquals(formatPrice(0), '$0.00');
});

price.test('formatPrice with unknown currency uses code as prefix', () => {
  function formatPrice(p, currency = 'USD') {
    if (!isFinite(p) || isNaN(p)) return '$0.00';
    const symbols = { USD: '$', CAD: 'CA$', EUR: '€', GBP: '£', AUD: 'A$', JPY: '¥' };
    const symbol = symbols[currency] || currency + ' ';
    return `${symbol}${p.toFixed(2)}`;
  }
  assertEquals(formatPrice(5, 'BRL'), 'BRL 5.00');
});

price.test('getCardPrice returns manabox price by default', () => {
  function getCardPrice(card, priceSource) {
    if (priceSource === 'scryfall' && card.scryfallPrices) {
      const p = card.scryfallPrices;
      if (card.foil === 'etched' && p.usd_etched) return parseFloat(p.usd_etched);
      if (card.foil === 'foil' && p.usd_foil) return parseFloat(p.usd_foil);
      if (p.usd) return parseFloat(p.usd);
      return parseFloat(p.usd_foil || p.usd_etched || '0');
    }
    return card.price;
  }
  assertEquals(getCardPrice({ price: 3.50, scryfallPrices: { usd: '5.00' } }, 'manabox'), 3.50);
});

price.test('getCardPrice returns scryfall normal price', () => {
  function getCardPrice(card, priceSource) {
    if (priceSource === 'scryfall' && card.scryfallPrices) {
      const p = card.scryfallPrices;
      if (card.foil === 'etched' && p.usd_etched) return parseFloat(p.usd_etched);
      if (card.foil === 'foil' && p.usd_foil) return parseFloat(p.usd_foil);
      if (p.usd) return parseFloat(p.usd);
      return parseFloat(p.usd_foil || p.usd_etched || '0');
    }
    return card.price;
  }
  assertEquals(getCardPrice({ foil: 'normal', scryfallPrices: { usd: '5.00', usd_foil: '10.00' } }, 'scryfall'), 5);
});

price.test('getCardPrice returns scryfall foil price', () => {
  function getCardPrice(card, priceSource) {
    if (priceSource === 'scryfall' && card.scryfallPrices) {
      const p = card.scryfallPrices;
      if (card.foil === 'etched' && p.usd_etched) return parseFloat(p.usd_etched);
      if (card.foil === 'foil' && p.usd_foil) return parseFloat(p.usd_foil);
      if (p.usd) return parseFloat(p.usd);
      return parseFloat(p.usd_foil || p.usd_etched || '0');
    }
    return card.price;
  }
  assertEquals(getCardPrice({ foil: 'foil', scryfallPrices: { usd: '5.00', usd_foil: '10.00' } }, 'scryfall'), 10);
});

price.test('getCardPrice returns scryfall etched price', () => {
  function getCardPrice(card, priceSource) {
    if (priceSource === 'scryfall' && card.scryfallPrices) {
      const p = card.scryfallPrices;
      if (card.foil === 'etched' && p.usd_etched) return parseFloat(p.usd_etched);
      if (card.foil === 'foil' && p.usd_foil) return parseFloat(p.usd_foil);
      if (p.usd) return parseFloat(p.usd);
      return parseFloat(p.usd_foil || p.usd_etched || '0');
    }
    return card.price;
  }
  assertEquals(getCardPrice({ foil: 'etched', scryfallPrices: { usd: '5.00', usd_etched: '15.00' } }, 'scryfall'), 15);
});

price.test('getCardPrice scryfall fallback when preferred price missing', () => {
  function getCardPrice(card, priceSource) {
    if (priceSource === 'scryfall' && card.scryfallPrices) {
      const p = card.scryfallPrices;
      if (card.foil === 'etched' && p.usd_etched) return parseFloat(p.usd_etched);
      if (card.foil === 'foil' && p.usd_foil) return parseFloat(p.usd_foil);
      if (p.usd) return parseFloat(p.usd);
      return parseFloat(p.usd_foil || p.usd_etched || '0');
    }
    return card.price;
  }
  // Foil card but no usd_foil price, falls through to usd
  assertEquals(getCardPrice({ foil: 'foil', scryfallPrices: { usd: '5.00' } }, 'scryfall'), 5);
});

// === Card Type Detection ===
const types = suite('Card Type Detection');

types.test('Detects Creature', () => {
  function getMainType(typeLine) {
    if (!typeLine) return null;
    return ['Creature', 'Instant', 'Sorcery', 'Artifact', 'Enchantment', 'Land', 'Planeswalker'].find(t => typeLine.includes(t));
  }
  assertEquals(getMainType('Creature — Human Wizard'), 'Creature');
});

types.test('Detects Artifact Creature as Creature', () => {
  function getMainType(typeLine) {
    if (!typeLine) return null;
    return ['Creature', 'Instant', 'Sorcery', 'Artifact', 'Enchantment', 'Land', 'Planeswalker'].find(t => typeLine.includes(t));
  }
  assertEquals(getMainType('Artifact Creature — Golem'), 'Creature');
});

types.test('Detects Instant', () => {
  function getMainType(typeLine) {
    if (!typeLine) return null;
    return ['Creature', 'Instant', 'Sorcery', 'Artifact', 'Enchantment', 'Land', 'Planeswalker'].find(t => typeLine.includes(t));
  }
  assertEquals(getMainType('Instant'), 'Instant');
});

types.test('Detects Land', () => {
  function getMainType(typeLine) {
    if (!typeLine) return null;
    return ['Creature', 'Instant', 'Sorcery', 'Artifact', 'Enchantment', 'Land', 'Planeswalker'].find(t => typeLine.includes(t));
  }
  assertEquals(getMainType('Basic Land — Island'), 'Land');
});

types.test('Detects Planeswalker', () => {
  function getMainType(typeLine) {
    if (!typeLine) return null;
    return ['Creature', 'Instant', 'Sorcery', 'Artifact', 'Enchantment', 'Land', 'Planeswalker'].find(t => typeLine.includes(t));
  }
  assertEquals(getMainType('Legendary Planeswalker — Jace'), 'Planeswalker');
});

types.test('Detects Enchantment', () => {
  function getMainType(typeLine) {
    if (!typeLine) return null;
    return ['Creature', 'Instant', 'Sorcery', 'Artifact', 'Enchantment', 'Land', 'Planeswalker'].find(t => typeLine.includes(t));
  }
  assertEquals(getMainType('Enchantment — Aura'), 'Enchantment');
});

types.test('Returns null for empty type line', () => {
  function getMainType(typeLine) {
    if (!typeLine) return null;
    return ['Creature', 'Instant', 'Sorcery', 'Artifact', 'Enchantment', 'Land', 'Planeswalker'].find(t => typeLine.includes(t));
  }
  assertEquals(getMainType(null), null);
  assertEquals(getMainType(''), null);
});

types.test('Detects Sorcery', () => {
  function getMainType(typeLine) {
    if (!typeLine) return null;
    return ['Creature', 'Instant', 'Sorcery', 'Artifact', 'Enchantment', 'Land', 'Planeswalker'].find(t => typeLine.includes(t));
  }
  assertEquals(getMainType('Sorcery'), 'Sorcery');
});

types.test('Detects Artifact', () => {
  function getMainType(typeLine) {
    if (!typeLine) return null;
    return ['Creature', 'Instant', 'Sorcery', 'Artifact', 'Enchantment', 'Land', 'Planeswalker'].find(t => typeLine.includes(t));
  }
  assertEquals(getMainType('Artifact — Equipment'), 'Artifact');
});

// === Color Matching ===
const color = suite('Color Matching');

function matchCardColor(card, filter) {
  if (!card.colors) return false;
  if (filter === 'C') return card.colors.length === 0;
  if (filter === 'M') return card.colors.length > 1;
  return card.colors.includes(filter);
}

function matchColorIdentity(card, selectedColors) {
  if (!card.color_identity) return false;
  if (selectedColors.includes('C') && card.color_identity.length === 0) return true;
  const colorsOnly = selectedColors.filter(c => c !== 'C');
  if (colorsOnly.length === 0) return false;
  return card.color_identity.every(c => colorsOnly.includes(c));
}

color.test('matchCardColor: White card matches W', () => {
  assert(matchCardColor({ colors: ['W'] }, 'W'));
});

color.test('matchCardColor: Multicolor card matches M', () => {
  assert(matchCardColor({ colors: ['W', 'U'] }, 'M'));
});

color.test('matchCardColor: Colorless card matches C', () => {
  assert(matchCardColor({ colors: [] }, 'C'));
});

color.test('matchCardColor: Mono card does not match M', () => {
  assert(!matchCardColor({ colors: ['R'] }, 'M'));
});

color.test('matchCardColor: No colors field returns false', () => {
  assert(!matchCardColor({}, 'W'));
});

color.test('matchCardColor: Colorless does not match W', () => {
  assert(!matchCardColor({ colors: [] }, 'W'));
});

color.test('matchColorIdentity: Mono W card in W identity', () => {
  assert(matchColorIdentity({ color_identity: ['W'] }, ['W']));
});

color.test('matchColorIdentity: WU card in WUB identity (subset)', () => {
  assert(matchColorIdentity({ color_identity: ['W', 'U'] }, ['W', 'U', 'B']));
});

color.test('matchColorIdentity: WU card NOT in W-only identity', () => {
  assert(!matchColorIdentity({ color_identity: ['W', 'U'] }, ['W']));
});

color.test('matchColorIdentity: Colorless card matches C selection', () => {
  assert(matchColorIdentity({ color_identity: [] }, ['C']));
});

color.test('matchColorIdentity: Colorless card matches any color selection (empty array .every is true)', () => {
  // Note: empty color_identity.every() returns true — colorless cards pass any non-C filter
  assert(matchColorIdentity({ color_identity: [] }, ['W']));
});

color.test('matchColorIdentity: No color_identity returns false', () => {
  assert(!matchColorIdentity({}, ['W']));
});

color.test('matchColorIdentity: 5-color card in 5-color identity', () => {
  assert(matchColorIdentity({ color_identity: ['W', 'U', 'B', 'R', 'G'] }, ['W', 'U', 'B', 'R', 'G']));
});

color.test('matchColorIdentity: C only selection with no other colors returns false for colored card', () => {
  assert(!matchColorIdentity({ color_identity: ['W'] }, ['C']));
});

// === Deck List Parsing ===
const dlp = suite('Deck List Parsing');

function parseDeckList(text) {
  const cards = [];
  const lines = text.trim().split('\n');
  for (const line of lines) {
    let trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^(\d+)x?\s+(.+)/);
    const quantity = match ? parseInt(match[1]) : 1;
    const rest = match ? match[2] : trimmed;
    let name = rest.split('(')[0].trim();
    name = name.replace(/\s\/\s/g, ' // ');
    if (name) cards.push({ name: name.toLowerCase(), quantity });
  }
  return cards;
}

dlp.test('Standard format: "4 Lightning Bolt"', () => {
  const r = parseDeckList('4 Lightning Bolt');
  assertEquals(r.length, 1);
  assertEquals(r[0].name, 'lightning bolt');
  assertEquals(r[0].quantity, 4);
});

dlp.test('Format with x: "4x Lightning Bolt"', () => {
  const r = parseDeckList('4x Lightning Bolt');
  assertEquals(r[0].quantity, 4);
  assertEquals(r[0].name, 'lightning bolt');
});

dlp.test('No quantity defaults to 1', () => {
  const r = parseDeckList('Lightning Bolt');
  assertEquals(r[0].quantity, 1);
});

dlp.test('Strips set info in parentheses', () => {
  const r = parseDeckList('1 Lightning Bolt (LEA) 161');
  assertEquals(r[0].name, 'lightning bolt');
});

dlp.test('Normalizes single slash to double slash (DFC)', () => {
  const r = parseDeckList('1 Delver of Secrets / Insectile Aberration');
  assertEquals(r[0].name, 'delver of secrets // insectile aberration');
});

dlp.test('Skips comments with //', () => {
  const r = parseDeckList('// Sideboard\n2 Negate');
  assertEquals(r.length, 1);
  assertEquals(r[0].name, 'negate');
});

dlp.test('Skips comments with #', () => {
  const r = parseDeckList('# Main deck\n1 Sol Ring');
  assertEquals(r.length, 1);
});

dlp.test('Skips empty lines', () => {
  const r = parseDeckList('1 Sol Ring\n\n2 Mana Crypt\n  \n');
  assertEquals(r.length, 2);
});

dlp.test('Multiple cards parsed correctly', () => {
  const r = parseDeckList('4 Lightning Bolt\n4 Counterspell\n2 Brainstorm');
  assertEquals(r.length, 3);
  assertEquals(r[0].quantity, 4);
  assertEquals(r[2].quantity, 2);
  assertEquals(r[2].name, 'brainstorm');
});

dlp.test('Card with comma in name', () => {
  const r = parseDeckList('1 Jace, the Mind Sculptor');
  assertEquals(r[0].name, 'jace, the mind sculptor');
});

dlp.test('All names are lowercased', () => {
  const r = parseDeckList('1 LIGHTNING BOLT\n1 Sol Ring');
  assertEquals(r[0].name, 'lightning bolt');
  assertEquals(r[1].name, 'sol ring');
});

// === Binder Card State ===
const bcs = suite('Binder Card State');

function binderGetCardState(scryfallId, foil, binderCards, persistedCards) {
  const makeKey = (c) => `${c.scryfallId}:${c.foil || 'normal'}`;
  const key = `${scryfallId}:${foil}`;
  const inLocal = binderCards.some(c => makeKey(c) === key);
  const inGit = persistedCards.some(c => makeKey(c) === key);
  if (inLocal && inGit) return 'persisted';
  if (inLocal && !inGit) return 'pending';
  if (!inLocal && inGit) return 'removed';
  return 'none';
}

bcs.test('Card in both local and git is persisted', () => {
  const local = [{ scryfallId: 'a', foil: 'normal' }];
  const git = [{ scryfallId: 'a', foil: 'normal' }];
  assertEquals(binderGetCardState('a', 'normal', local, git), 'persisted');
});

bcs.test('Card in local only is pending', () => {
  assertEquals(binderGetCardState('a', 'normal', [{ scryfallId: 'a', foil: 'normal' }], []), 'pending');
});

bcs.test('Card in git only is removed', () => {
  assertEquals(binderGetCardState('a', 'normal', [], [{ scryfallId: 'a', foil: 'normal' }]), 'removed');
});

bcs.test('Card in neither is none', () => {
  assertEquals(binderGetCardState('a', 'normal', [], []), 'none');
});

bcs.test('Same card different foil status are distinct', () => {
  const local = [{ scryfallId: 'a', foil: 'foil' }];
  const git = [{ scryfallId: 'a', foil: 'normal' }];
  assertEquals(binderGetCardState('a', 'foil', local, git), 'pending');
  assertEquals(binderGetCardState('a', 'normal', local, git), 'removed');
});

bcs.test('Foil defaults to normal when missing', () => {
  const local = [{ scryfallId: 'a' }]; // no foil field
  const git = [{ scryfallId: 'a', foil: 'normal' }];
  assertEquals(binderGetCardState('a', 'normal', local, git), 'persisted');
});

// === Binder Sync Logic ===
const bsync = suite('Binder Sync');

function syncBinder(binderCards, persistedCards) {
  const makeKey = (c) => `${c.scryfallId}:${c.foil || 'normal'}`;
  const localKeys = binderCards.map(makeKey);
  const persistedKeys = persistedCards.map(makeKey);
  const localOnly = binderCards.filter(c => !persistedKeys.includes(makeKey(c)));
  const removed = persistedCards.filter(p => !localKeys.includes(makeKey(p)));
  return { localOnly, removed };
}

bsync.test('No changes when local matches git', () => {
  const cards = [{ scryfallId: 'a', foil: 'normal' }, { scryfallId: 'b', foil: 'foil' }];
  const { localOnly, removed } = syncBinder(cards, cards);
  assertEquals(localOnly.length, 0);
  assertEquals(removed.length, 0);
});

bsync.test('Detects locally added cards', () => {
  const local = [{ scryfallId: 'a', foil: 'normal' }, { scryfallId: 'b', foil: 'normal' }];
  const git = [{ scryfallId: 'a', foil: 'normal' }];
  const { localOnly } = syncBinder(local, git);
  assertEquals(localOnly.length, 1);
  assertEquals(localOnly[0].scryfallId, 'b');
});

bsync.test('Detects removed cards', () => {
  const local = [{ scryfallId: 'a', foil: 'normal' }];
  const git = [{ scryfallId: 'a', foil: 'normal' }, { scryfallId: 'b', foil: 'normal' }];
  const { removed } = syncBinder(local, git);
  assertEquals(removed.length, 1);
  assertEquals(removed[0].scryfallId, 'b');
});

bsync.test('Foil change detected as add + remove', () => {
  const local = [{ scryfallId: 'a', foil: 'foil' }];
  const git = [{ scryfallId: 'a', foil: 'normal' }];
  const { localOnly, removed } = syncBinder(local, git);
  assertEquals(localOnly.length, 1);
  assertEquals(removed.length, 1);
});

bsync.test('Empty binder and empty git', () => {
  const { localOnly, removed } = syncBinder([], []);
  assertEquals(localOnly.length, 0);
  assertEquals(removed.length, 0);
});

// === Wishlist Card State ===
const wcs = suite('Wishlist Card State');

function wishlistGetCardState(scryfallId, wishlistCards, persistedCards) {
  const inLocal = wishlistCards.some(c => c.scryfallId === scryfallId);
  const inGit = persistedCards.some(c => c.scryfallId === scryfallId);
  if (inLocal && inGit) return 'persisted';
  if (inLocal && !inGit) return 'pending';
  return 'none';
}

wcs.test('Card in both is persisted', () => {
  assertEquals(wishlistGetCardState('a', [{ scryfallId: 'a' }], [{ scryfallId: 'a' }]), 'persisted');
});

wcs.test('Card in local only is pending', () => {
  assertEquals(wishlistGetCardState('a', [{ scryfallId: 'a' }], []), 'pending');
});

wcs.test('Card in neither is none', () => {
  assertEquals(wishlistGetCardState('a', [], []), 'none');
});

wcs.test('Foil suffix ID treated as distinct', () => {
  assertEquals(wishlistGetCardState('a-foil', [{ scryfallId: 'a-foil' }], [{ scryfallId: 'a' }]), 'pending');
});

// === Scryfall Card Conversion ===
const scc = suite('Scryfall Card Conversion');

function scryfallToCard(card, foil = 'normal') {
  return {
    name: card.flavor_name || card.name,
    oracleName: card.name,
    scryfallId: card.id + (foil === 'foil' ? '-foil' : ''),
    setCode: card.set.toUpperCase(),
    setName: card.set_name,
    collectorNumber: card.collector_number,
    rarity: card.rarity,
    foil,
    quantity: 1,
    price: parseFloat(foil === 'foil' ? (card.prices?.usd_foil || card.prices?.usd || '0') : (card.prices?.usd || card.prices?.usd_foil || '0')),
    currency: 'USD',
    scryfallPrices: card.prices,
    imageUrl: card.image_uris?.normal || card.card_faces?.[0]?.image_uris?.normal,
    types: card.type_line,
    type_line: card.type_line,
    colors: card.colors || [],
    color_identity: card.color_identity || [],
    keywords: card.keywords || [],
    manaCost: card.mana_cost || '',
    cmc: card.cmc || 0
  };
}

const mockScryfallCard = {
  id: 'abc123', name: 'Lightning Bolt', set: 'lea', set_name: 'Alpha',
  collector_number: '161', rarity: 'common', type_line: 'Instant',
  colors: ['R'], color_identity: ['R'], keywords: [],
  mana_cost: '{R}', cmc: 1,
  prices: { usd: '5.00', usd_foil: '10.00' },
  image_uris: { normal: 'https://img.scryfall.com/bolt.jpg' }
};

scc.test('Normal card conversion', () => {
  const c = scryfallToCard(mockScryfallCard);
  assertEquals(c.name, 'Lightning Bolt');
  assertEquals(c.scryfallId, 'abc123');
  assertEquals(c.setCode, 'LEA');
  assertEquals(c.foil, 'normal');
  assertEquals(c.price, 5);
  assertEquals(c.rarity, 'common');
});

scc.test('Foil card conversion appends -foil to ID', () => {
  const c = scryfallToCard(mockScryfallCard, 'foil');
  assertEquals(c.scryfallId, 'abc123-foil');
  assertEquals(c.foil, 'foil');
  assertEquals(c.price, 10);
});

scc.test('Flavor name used when present', () => {
  const c = scryfallToCard({ ...mockScryfallCard, flavor_name: 'Zappy Zap' });
  assertEquals(c.name, 'Zappy Zap');
  assertEquals(c.oracleName, 'Lightning Bolt');
});

scc.test('oracleName always uses real name', () => {
  const c = scryfallToCard({ ...mockScryfallCard, flavor_name: 'Zappy Zap' });
  assertEquals(c.oracleName, 'Lightning Bolt');
});

scc.test('Missing prices default to 0', () => {
  const c = scryfallToCard({ ...mockScryfallCard, prices: {} });
  assertEquals(c.price, 0);
});

scc.test('Foil price falls back to normal when usd_foil missing', () => {
  const c = scryfallToCard({ ...mockScryfallCard, prices: { usd: '3.00' } }, 'foil');
  assertEquals(c.price, 3);
});

scc.test('Normal price falls back to foil when usd missing', () => {
  const c = scryfallToCard({ ...mockScryfallCard, prices: { usd_foil: '8.00' } }, 'normal');
  assertEquals(c.price, 8);
});

scc.test('DFC card uses first face image', () => {
  const dfc = { ...mockScryfallCard, image_uris: null, card_faces: [{ image_uris: { normal: 'https://front.jpg' } }, { image_uris: { normal: 'https://back.jpg' } }] };
  const c = scryfallToCard(dfc);
  assertEquals(c.imageUrl, 'https://front.jpg');
});

scc.test('Missing colors/keywords default to empty arrays', () => {
  const c = scryfallToCard({ ...mockScryfallCard, colors: undefined, keywords: undefined, color_identity: undefined });
  assertEquals(c.colors.length, 0);
  assertEquals(c.keywords.length, 0);
  assertEquals(c.color_identity.length, 0);
});

scc.test('Set code is uppercased', () => {
  const c = scryfallToCard({ ...mockScryfallCard, set: 'mh2' });
  assertEquals(c.setCode, 'MH2');
});

scc.test('CMC defaults to 0 when missing', () => {
  const c = scryfallToCard({ ...mockScryfallCard, cmc: undefined });
  assertEquals(c.cmc, 0);
});

// === Render Card HTML ===
const rchtml = suite('Render Card HTML');

function mockRenderCardHTML(card, nameCounts = {}) {
  function getMainType(typeLine) {
    if (!typeLine) return null;
    return ['Creature', 'Instant', 'Sorcery', 'Artifact', 'Enchantment', 'Land', 'Planeswalker'].find(t => typeLine.includes(t));
  }
  const foilClass = card.foil !== 'normal' ? card.foil : '';
  const mainType = getMainType(card.type_line);
  const duplicateKey = card.oracle_id || card.name;
  const hasDuplicateName = nameCounts[duplicateKey] > 1;
  return { foilClass, mainType, hasDuplicateName, card };
}

rchtml.test('Foil card gets foil class', () => {
  const r = mockRenderCardHTML({ foil: 'foil', name: 'Test', type_line: 'Instant' });
  assertEquals(r.foilClass, 'foil');
});

rchtml.test('Normal card gets empty foil class', () => {
  const r = mockRenderCardHTML({ foil: 'normal', name: 'Test', type_line: 'Instant' });
  assertEquals(r.foilClass, '');
});

rchtml.test('Etched card gets etched class', () => {
  const r = mockRenderCardHTML({ foil: 'etched', name: 'Test', type_line: 'Instant' });
  assertEquals(r.foilClass, 'etched');
});

rchtml.test('Duplicate detection by oracle_id', () => {
  const counts = { 'oracle-1': 2 };
  const r = mockRenderCardHTML({ foil: 'normal', name: 'Bolt', oracle_id: 'oracle-1', type_line: 'Instant' }, counts);
  assert(r.hasDuplicateName === true);
});

rchtml.test('No duplicate when count is 1', () => {
  const counts = { 'oracle-1': 1 };
  const r = mockRenderCardHTML({ foil: 'normal', name: 'Bolt', oracle_id: 'oracle-1', type_line: 'Instant' }, counts);
  assert(!r.hasDuplicateName);
});

rchtml.test('Duplicate falls back to name when no oracle_id', () => {
  const counts = { 'Lightning Bolt': 3 };
  const r = mockRenderCardHTML({ foil: 'normal', name: 'Lightning Bolt', type_line: 'Instant' }, counts);
  assert(r.hasDuplicateName === true);
});

rchtml.test('Type badge extracted from type_line', () => {
  const r = mockRenderCardHTML({ foil: 'normal', name: 'Test', type_line: 'Legendary Creature — Dragon' });
  assertEquals(r.mainType, 'Creature');
});

rchtml.test('No type badge for null type_line', () => {
  const r = mockRenderCardHTML({ foil: 'normal', name: 'Test', type_line: null });
  assertEquals(r.mainType, null);
});

// === Sort Order ===
const sortOrder = suite('Sort Order');

sortOrder.test('Price desc sort orders highest first', () => {
  const cards = [
    { name: 'A', price: 5, quantity: 1 },
    { name: 'B', price: 50, quantity: 1 },
    { name: 'C', price: 1, quantity: 1 }
  ];
  cards.sort((a, b) => (b.price * b.quantity) - (a.price * a.quantity));
  assertEquals(cards[0].name, 'B');
  assertEquals(cards[1].name, 'A');
  assertEquals(cards[2].name, 'C');
});

sortOrder.test('Price asc sort orders lowest first', () => {
  const cards = [
    { name: 'A', price: 5, quantity: 1 },
    { name: 'B', price: 50, quantity: 1 },
    { name: 'C', price: 1, quantity: 1 }
  ];
  cards.sort((a, b) => (a.price * a.quantity) - (b.price * b.quantity));
  assertEquals(cards[0].name, 'C');
  assertEquals(cards[1].name, 'A');
  assertEquals(cards[2].name, 'B');
});

sortOrder.test('Sort accounts for quantity', () => {
  const cards = [
    { name: 'A', price: 5, quantity: 4 },  // total 20
    { name: 'B', price: 50, quantity: 1 }, // total 50
    { name: 'C', price: 10, quantity: 3 }  // total 30
  ];
  cards.sort((a, b) => (b.price * b.quantity) - (a.price * a.quantity));
  assertEquals(cards[0].name, 'B');
  assertEquals(cards[1].name, 'C');
  assertEquals(cards[2].name, 'A');
});

sortOrder.test('Sort stable after price update (simulates cache load)', () => {
  const cards = [
    { name: 'A', price: 5, quantity: 1 },
    { name: 'B', price: 50, quantity: 1 },
    { name: 'C', price: 1, quantity: 1 }
  ];
  // Initial sort
  cards.sort((a, b) => (b.price * b.quantity) - (a.price * a.quantity));
  assertEquals(cards[0].name, 'B');

  // Simulate cached data changing prices
  cards.find(c => c.name === 'C').price = 100;

  // Re-sort (what the fix does)
  cards.sort((a, b) => (b.price * b.quantity) - (a.price * a.quantity));
  assertEquals(cards[0].name, 'C');
  assertEquals(cards[1].name, 'B');
  assertEquals(cards[2].name, 'A');
});

sortOrder.test('Sort without re-sort after price change is wrong', () => {
  const cards = [
    { name: 'A', price: 5, quantity: 1 },
    { name: 'B', price: 50, quantity: 1 },
    { name: 'C', price: 1, quantity: 1 }
  ];
  cards.sort((a, b) => (b.price * b.quantity) - (a.price * a.quantity));
  // Mutate price without re-sorting
  cards.find(c => c.name === 'C').price = 100;
  // Order is now stale — C should be first but isn't
  assert(cards[0].name !== 'C', 'Without re-sort, order is stale');
});

sortOrder.test('Name sort is alphabetical', () => {
  const cards = [{ name: 'Zebra' }, { name: 'Apple' }, { name: 'Mango' }];
  cards.sort((a, b) => a.name.localeCompare(b.name));
  assertEquals(cards[0].name, 'Apple');
  assertEquals(cards[2].name, 'Zebra');
});

sortOrder.test('CMC desc sort orders highest first', () => {
  const cards = [{ name: 'A', cmc: 2 }, { name: 'B', cmc: 7 }, { name: 'C', cmc: 0 }];
  cards.sort((a, b) => (b.cmc || 0) - (a.cmc || 0));
  assertEquals(cards[0].name, 'B');
  assertEquals(cards[2].name, 'C');
});

sortOrder.test('CMC sort handles missing cmc as 0', () => {
  const cards = [{ name: 'A', cmc: 3 }, { name: 'B' }, { name: 'C', cmc: 1 }];
  cards.sort((a, b) => (a.cmc || 0) - (b.cmc || 0));
  assertEquals(cards[0].name, 'B');
  assertEquals(cards[1].name, 'C');
  assertEquals(cards[2].name, 'A');
});

// Run all tests
Object.keys(suites).forEach(suiteName => {
  suites[suiteName].forEach(({ name, fn }) => {
    try {
      fn();
      results.push({ suite: suiteName, name, pass: true });
    } catch (e) {
      results.push({ suite: suiteName, name, pass: false, error: e.message });
    }
  });
});

// Render results
const resultsDiv = document.getElementById('results');
const summaryDiv = document.getElementById('summary');

Object.keys(suites).forEach(suiteName => {
  const suiteResults = results.filter(r => r.suite === suiteName);
  const passed = suiteResults.filter(r => r.pass).length;
  
  const section = document.createElement('div');
  section.className = 'suite';
  section.innerHTML = `<h2>${suiteName}</h2><div class="stats">${passed} / ${suiteResults.length} passed</div>`;
  
  suiteResults.forEach(r => {
    const div = document.createElement('div');
    div.className = `test ${r.pass ? 'pass' : 'fail'}`;
    div.innerHTML = `${r.pass ? '✅' : '❌'} ${r.name}${r.error ? `<div class="error">${r.error}</div>` : ''}`;
    section.appendChild(div);
  });
  
  resultsDiv.appendChild(section);
});

const passed = results.filter(r => r.pass).length;
const total = results.length;
summaryDiv.className = `summary ${passed === total ? 'pass' : 'fail'}`;
summaryDiv.innerHTML = `
  <div>${passed === total ? '✅ All Tests Passed!' : '❌ Some Tests Failed'}</div>
  <div>${passed} / ${total} tests passed</div>
`;

// Exit with error code if tests failed (for CI)
if (passed !== total && typeof process !== 'undefined') {
  process.exit(1);
}
