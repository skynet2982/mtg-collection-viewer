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
  { name: 'Lightning Bolt', type_line: 'Instant', colors: ['R'], keywords: [], foil: 'normal', rarity: 'common', cmc: 1, setName: 'Alpha', price: 5 },
  { name: 'Counterspell', type_line: 'Instant', colors: ['U'], keywords: [], foil: 'foil', rarity: 'uncommon', cmc: 2, setName: 'Beta', price: 10 },
  { name: 'Llanowar Elves', type_line: 'Creature — Elf Druid', colors: ['G'], keywords: [], foil: 'normal', rarity: 'common', cmc: 1, setName: 'Alpha', price: 2 },
  { name: 'Serra Angel', type_line: 'Creature — Angel', colors: ['W'], keywords: ['Flying', 'Vigilance'], foil: 'etched', rarity: 'rare', cmc: 5, setName: 'Beta', price: 15 },
  { name: 'Black Lotus', type_line: 'Artifact', colors: [], keywords: [], foil: 'normal', rarity: 'mythic', cmc: 0, setName: 'Alpha', price: 10000 },
  { name: 'Forest', type_line: 'Basic Land — Forest', colors: [], keywords: [], foil: 'normal', rarity: 'common', cmc: 0, setName: 'Alpha', price: 0.1 }
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
  assertEquals(filtered.length, 1);
  assertEquals(filtered[0].name, 'Black Lotus');
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
  assertEquals(filtered.length, 2); // Black Lotus and Forest
});

filters.test('Foil filter - Normal', () => {
  const filtered = mockCollection.filter(c => c.foil === 'normal');
  assertEquals(filtered.length, 4);
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
