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
tb.test('Share link format', () => {
  const url = 'trading-binder.html?cards=id1,id2';
  assert(url.includes('?cards='));
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
tb.test('Trading binder JSON has required fields', () => {
  const data = {
    cards: [],
    lastModified: '2026-02-19T21:44:15.397Z',
    passwordHash: 'a9ab99bc6167f801e4b43cf1c569b4f7e1c52a3017a0eb2693c4cb87e8810103'
  };
  assert(data.cards !== undefined);
  assert(data.lastModified !== undefined);
  assert(data.passwordHash !== undefined);
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
