// Wishlist state
let wishlistCards = [];
let persistedCards = [];
let localOnlyCards = [];
let removedCards = [];
let isLocked = true;
let passwordHash = null;

window.isLocked = true;

async function initWishlist() {
  // Clear stats immediately to prevent flash of collection data
  collection = [];
  filteredCollection = [];
  updateStats();
  
  const lockState = localStorage.getItem('wishlistLocked');
  isLocked = lockState === null || lockState === '1';
  window.isLocked = isLocked;
  
  await loadWishlist();
  updateLockUI();
  setupEventListeners();
}

async function loadPersistedWishlist() {
  try {
    const response = await fetch(`data/wishlist.json?t=${Date.now()}`);
    if (response.ok) {
      const data = await response.json();
      persistedCards = data.cards || [];
    }
  } catch (e) {
    console.log('No persisted wishlist file found');
  }
}

async function loadPasswordHash() {
  try {
    const response = await fetch(`data/admin-password.json?t=${Date.now()}`);
    if (response.ok) {
      const data = await response.json();
      passwordHash = data.passwordHash || null;
    }
  } catch (e) {
    console.log('No password file found');
  }
}

async function fetchCardsFromScryfall(scryfallIds) {
  const cards = [];
  const batchSize = 75;
  // Track which IDs are foil
  const foilIds = new Set(scryfallIds.filter(id => id.endsWith('-foil')));
  const cleanIds = scryfallIds.map(id => id.replace(/-foil$/, ''));
  // Dedupe clean IDs
  const uniqueClean = [...new Set(cleanIds)];
  
  for (let i = 0; i < uniqueClean.length; i += batchSize) {
    const batch = uniqueClean.slice(i, i + batchSize);
    try {
      const response = await fetch('https://api.scryfall.com/cards/collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifiers: batch.map(id => ({ id })) })
      });
      
      if (response.ok) {
        const data = await response.json();
        for (const card of data.data) {
          // Add normal version if requested
          if (scryfallIds.includes(card.id)) {
            cards.push(scryfallToCard(card, 'normal'));
          }
          // Add foil version if requested
          if (foilIds.has(card.id + '-foil')) {
            cards.push(scryfallToCard(card, 'foil'));
          }
        }
      }
      
      if (i + batchSize < uniqueClean.length) {
        await new Promise(r => setTimeout(r, 100));
      }
    } catch (e) {
      console.error('Failed to fetch batch:', e);
    }
  }
  return cards;
}

// Convert Scryfall API card to our card format
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

// Expand into foil/non-foil for search results
function scryfallToSearchCards(card) {
  const cards = [];
  if (card.nonfoil) cards.push(scryfallToCard(card, 'normal'));
  if (card.foil) cards.push(scryfallToCard(card, 'foil'));
  return cards.length ? cards : [scryfallToCard(card)];
}

async function loadWishlist() {
  await loadPersistedWishlist();
  await loadPasswordHash();
  
  if (!isLocked) {
    const stored = localStorage.getItem('wishlist');
    if (stored) {
      try {
        const ids = JSON.parse(stored);
        wishlistCards = await fetchCardsFromScryfall(ids);
      } catch (e) {
        console.error('Failed to load wishlist:', e);
      }
    }
  }
  
  if (isLocked || wishlistCards.length === 0) {
    if (persistedCards.length > 0) {
      const ids = persistedCards.map(c => c.scryfallId);
      wishlistCards = await fetchCardsFromScryfall(ids);
      if (!isLocked) {
        localStorage.setItem('wishlist', JSON.stringify(ids));
      }
    }
  }
  
  collection = [...wishlistCards];
  filteredCollection = [...wishlistCards];
  syncWishlist();
  applyFilters();
}

// Sync state
function syncWishlist() {
  const localIds = wishlistCards.map(c => c.scryfallId);
  const persistedIds = persistedCards.map(c => c.scryfallId);
  localOnlyCards = wishlistCards.filter(c => !persistedIds.includes(c.scryfallId));
  removedCards = persistedCards.filter(p => !localIds.includes(p.scryfallId));
  updateSyncBanner();
}

function updateSyncBanner() {
  const banner = document.getElementById('sync-banner');
  if (!banner || isLocked) return;
  
  const addedCount = localOnlyCards.length;
  const removedCount = removedCards.length;
  const totalChanges = addedCount + removedCount;
  
  if (totalChanges > 0) {
    banner.classList.remove('hidden');
    let message = '⚠️ You have ';
    if (addedCount > 0 && removedCount > 0) {
      message += `<strong>${addedCount}</strong> added and <strong>${removedCount}</strong> removed cards`;
    } else if (addedCount > 0) {
      message += `<strong>${addedCount}</strong> unpersisted cards`;
    } else {
      message += `<strong>${removedCount}</strong> removed cards`;
    }
    const span = banner.querySelector('span');
    if (span) span.innerHTML = message;
  } else {
    banner.classList.add('hidden');
  }
}

function getCardState(scryfallId) {
  const inLocal = wishlistCards.some(c => c.scryfallId === scryfallId);
  const inGit = persistedCards.some(c => c.scryfallId === scryfallId);
  if (inLocal && inGit) return 'persisted';
  if (inLocal && !inGit) return 'pending';
  return 'none';
}

function renderWishlist() {
  const container = document.getElementById('wishlist-collection');
  const emptyState = document.getElementById('empty-state');
  
  if (filteredCollection.length === 0) {
    container.style.display = 'none';
    emptyState.style.display = 'block';
    updateStats();
    return;
  }
  
  container.style.display = 'grid';
  emptyState.style.display = 'none';
  
  container.innerHTML = filteredCollection.map(card => {
    let html = renderCardHTML(card, {});
    // Fix detail link: strip -foil suffix and open in new tab
    const realId = card.scryfallId.replace(/-foil$/, '');
    html = html.replace(`href="detail.html?id=${card.scryfallId}"`, `href="detail.html?id=${realId}" target="_blank"`);
    
    if (!isLocked) {
      const state = getCardState(card.scryfallId);
      const stateBadge = state === 'persisted' 
        ? '<span class="state-badge persisted" title="Persisted to git">✓</span>'
        : '<span class="state-badge pending" title="Not persisted yet">⚠️</span>';
      
      const lastDivIndex = html.lastIndexOf('</div>');
      html = html.substring(0, lastDivIndex) + 
        stateBadge +
        `<button class="remove-from-binder" data-id="${card.scryfallId}" title="Remove from wishlist">✕</button>` +
        html.substring(lastDivIndex);
    }
    
    return html;
  }).join('');
  
  // Load images
  container.querySelectorAll('.card-image-wrapper').forEach(wrapper => {
    const card = wrapper.closest('.card');
    const img = wrapper.querySelector('.card-image');
    const id = card.dataset.scryfallId.replace(/-foil$/, '');
    fetchCardImage(id).then(url => { if (url) img.src = url; });
  });
  
  setupCardInteractions(container);
  
  if (!isLocked) {
    container.querySelectorAll('.remove-from-binder').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        removeFromWishlist(btn.dataset.id);
      });
    });
  }
  
  updateStats();
}

function addToWishlist(card) {
  if (isLocked) {
    showNotification('🔒 Unlock wishlist to add cards');
    return;
  }
  if (wishlistCards.some(c => c.scryfallId === card.scryfallId)) {
    showNotification('Card already in wishlist');
    return;
  }
  wishlistCards.push(card);
  localStorage.setItem('wishlist', JSON.stringify(wishlistCards.map(c => c.scryfallId)));
  collection = [...wishlistCards];
  syncWishlist();
  applyFilters();
  showNotification(`✓ Added ${card.name}`);
}

function removeFromWishlist(scryfallId) {
  wishlistCards = wishlistCards.filter(c => c.scryfallId !== scryfallId);
  localStorage.setItem('wishlist', JSON.stringify(wishlistCards.map(c => c.scryfallId)));
  collection = [...wishlistCards];
  syncWishlist();
  applyFilters();
  showNotification('✓ Card removed');
}

function downloadWishlist() {
  const data = {
    cards: wishlistCards.map(c => ({ scryfallId: c.scryfallId, addedAt: new Date().toISOString() })),
    lastModified: new Date().toISOString()
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'wishlist.json';
  a.click();
  URL.revokeObjectURL(url);
  showNotification('💾 Wishlist downloaded');
}

function exportMoxfield() {
  if (!wishlistCards.length) return showNotification('Wishlist is empty');
  const lines = wishlistCards.map(c => {
    const name = c.oracleName || c.name;
    return `${c.quantity} ${name}`;
  });
  const text = lines.join('\n');
  navigator.clipboard.writeText(text).then(() => {
    showNotification(`📋 Copied ${wishlistCards.length} cards to clipboard`);
  }).catch(() => {
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
    showNotification(`📋 Copied ${wishlistCards.length} cards to clipboard`);
  });
}

function clearWishlist() {
  if (confirm('Clear all cards from wishlist?')) {
    wishlistCards = [];
    localStorage.setItem('wishlist', JSON.stringify([]));
    collection = [];
    filteredCollection = [];
    renderWishlist();
    showNotification('✓ Wishlist cleared');
  }
}

// === SEARCH ===

async function searchScryfall(query, sortBy = 'usd', setFilter = '') {
  if (!query) return [];
  const dir = sortBy === 'name' ? 'asc' : 'desc';
  let q = query;
  if (setFilter) q += ` set:${setFilter}`;
  try {
    const response = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(q)}+game:paper&unique=prints&order=${sortBy}&dir=${dir}`);
    if (response.ok) {
      const data = await response.json();
      return (data.data || []).flatMap(card => scryfallToSearchCards(card));
    }
  } catch (e) {
    console.error('Search failed:', e);
  }
  return [];
}

function showSearchModal() {
  const modal = document.getElementById('search-modal');
  const input = document.getElementById('scryfall-search');
  const sortSelect = document.getElementById('search-sort');
  const setFilter = document.getElementById('search-set-filter');
  const results = document.getElementById('search-results');
  
  modal.classList.remove('hidden');
  input.value = '';
  setFilter.value = '';
  sortSelect.value = 'usd';
  results.innerHTML = '<p style="text-align:center;color:var(--text-secondary);padding:40px;">Search for any Magic card...</p>';
  input.focus();
  
  // Store search results for add buttons
  let searchCardMap = {};
  
  let timeout;
  const doSearch = () => {
    clearTimeout(timeout);
    timeout = setTimeout(async () => {
      const query = input.value.trim();
      if (!query) {
        results.innerHTML = '<p style="text-align:center;color:var(--text-secondary);padding:40px;">Search for any Magic card...</p>';
        return;
      }
      
      results.innerHTML = '<p style="text-align:center;padding:40px;">Searching...</p>';
      const cards = await searchScryfall(query, sortSelect.value, setFilter.value.trim());
      
      if (cards.length === 0) {
        results.innerHTML = '<p style="text-align:center;color:var(--text-secondary);padding:40px;">No results found</p>';
        return;
      }
      
      // Group by oracle name
      const grouped = {};
      cards.forEach(c => {
        const key = c.oracleName || c.name;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(c);
      });
      
      searchCardMap = {};
      
      results.innerHTML = Object.entries(grouped).slice(0, 10).map(([oracleName, versions]) => {
        const displayName = versions[0].name !== oracleName ? `${versions[0].name} <span style="color:var(--text-secondary);font-size:0.85em;">(${oracleName})</span>` : oracleName;
        return `
        <div class="search-group">
          <div class="search-group-name">${displayName} <span style="color:var(--text-secondary);">(${versions.length} version${versions.length > 1 ? 's' : ''})</span></div>
          <div class="collection">${versions.map(cardObj => {
            const baseId = cardObj.scryfallId.replace(/-foil$/, '');
            const inWishlist = wishlistCards.some(c => c.scryfallId === cardObj.scryfallId || c.scryfallId.replace(/-foil$/, '') === baseId);
            searchCardMap[cardObj.scryfallId] = cardObj;
            let html = renderCardHTML(cardObj, {});
            const realId = cardObj.scryfallId.replace(/-foil$/, '');
            html = html.replace(`href="detail.html?id=${cardObj.scryfallId}"`, `href="detail.html?id=${realId}" target="_blank"`);
            return `<div class="search-card-wrapper" data-scryfall-id="${cardObj.scryfallId}" style="display:flex;flex-direction:column;">
              <div style="flex:1;">${html}</div>
              ${inWishlist 
                ? '<div class="version-added">✓ In Wishlist</div>' 
                : '<button class="btn btn-small add-to-wishlist-btn" style="width:100%;margin-top:5px;">+ Add to Wishlist</button>'}
            </div>`;
          }).join('')}</div>
        </div>
      `}).join('');
      
      // Load images
      results.querySelectorAll('.card-image-wrapper').forEach(wrapper => {
        const card = wrapper.closest('.card');
        const img = wrapper.querySelector('.card-image');
        const id = card.dataset.scryfallId.replace(/-foil$/, '');
        fetchCardImage(id).then(url => { if (url) img.src = url; });
      });
      
      // Setup drag interactions
      setupCardInteractions(results);
      
      // Add button handlers
      results.querySelectorAll('.add-to-wishlist-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          e.preventDefault();
          const wrapper = btn.closest('.search-card-wrapper');
          const id = wrapper.dataset.scryfallId;
          const card = searchCardMap[id];
          if (card) {
            addToWishlist(card);
            btn.outerHTML = '<div class="version-added">✓ Added</div>';
          }
        });
      });
    }, 300);
  };
  
  input.oninput = doSearch;
  sortSelect.onchange = doSearch;
  let cachedSets = null;
  setFilter.oninput = async () => {
    const val = setFilter.value.trim().toLowerCase();
    const dropdown = document.getElementById('set-search-autocomplete');
    if (!val || val.length < 2) {
      dropdown.innerHTML = '';
      dropdown.classList.remove('show');
      doSearch();
      return;
    }
    
    if (!cachedSets) {
      try {
        const r = await fetch('https://api.scryfall.com/sets');
        const data = await r.json();
        cachedSets = (data.data || []).filter(s => s.set_type !== 'token' && s.set_type !== 'memorabilia');
      } catch (e) { cachedSets = []; }
    }
    
    const matches = cachedSets.filter(s => 
      s.name.toLowerCase().includes(val) || s.code.toLowerCase().includes(val)
    ).slice(0, 8);
    
    if (matches.length === 0) {
      dropdown.innerHTML = '';
      dropdown.classList.remove('show');
      doSearch();
      return;
    }
    
    dropdown.innerHTML = matches.map(s => 
      `<div class="autocomplete-item" data-code="${s.code}">
        <span>${s.name}</span>
        <span style="color: var(--text-secondary); margin-left: 10px;">${s.code.toUpperCase()}</span>
      </div>`
    ).join('');
    dropdown.classList.add('show');
    
    dropdown.querySelectorAll('.autocomplete-item').forEach(item => {
      item.addEventListener('click', () => {
        setFilter.value = item.dataset.code;
        dropdown.innerHTML = '';
        dropdown.classList.remove('show');
        doSearch();
      });
    });
    
    doSearch();
  };
  
  document.getElementById('search-close').onclick = () => modal.classList.add('hidden');
  
  // Close on overlay click, but not after dragging a card
  let modalMouseDownTarget = null;
  modal.addEventListener('mousedown', (e) => { modalMouseDownTarget = e.target; });
  modal.addEventListener('mouseup', (e) => {
    if (e.target === modal && modalMouseDownTarget === modal) {
      modal.classList.add('hidden');
    }
  });
}

// === PASSWORD ===

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyPassword(password) {
  return (await hashPassword(password)) === passwordHash;
}

function showPasswordModal() {
  const modal = document.getElementById('password-modal');
  const input = document.getElementById('password-input');
  const error = document.getElementById('password-error');
  
  modal.classList.remove('hidden');
  input.value = '';
  error.classList.add('hidden');
  input.focus();
  
  const submit = async () => {
    if (!input.value) return;
    if (await verifyPassword(input.value)) {
      isLocked = false;
      window.isLocked = false;
      localStorage.setItem('wishlistLocked', '0');
      modal.classList.add('hidden');
      showNotification('🔓 Wishlist unlocked');
      location.reload();
    } else {
      error.classList.remove('hidden');
      input.value = '';
      input.focus();
    }
  };
  
  document.getElementById('password-submit').onclick = submit;
  input.onkeypress = (e) => { if (e.key === 'Enter') submit(); };
  document.getElementById('password-cancel').onclick = () => modal.classList.add('hidden');
  modal.onclick = (e) => { if (e.target === modal) modal.classList.add('hidden'); };
}

function toggleLock() {
  if (isLocked) {
    showPasswordModal();
  } else {
    isLocked = true;
    window.isLocked = true;
    localStorage.setItem('wishlistLocked', '1');
    showNotification('🔒 Wishlist locked');
    location.reload();
  }
}

function updateLockUI() {
  const btn = document.getElementById('toggle-lock');
  const searchBtn = document.getElementById('search-cards');
  const downloadBtn = document.getElementById('download-wishlist');
  const clearBtn = document.getElementById('clear-wishlist');
  
  if (isLocked) {
    btn.textContent = '🔒 Unlock Wishlist';
    searchBtn.style.display = 'none';
    downloadBtn.style.display = 'none';
    clearBtn.style.display = 'none';
  } else {
    btn.textContent = '🔓 Lock Wishlist';
    searchBtn.style.display = 'inline-block';
    downloadBtn.style.display = 'inline-block';
    clearBtn.style.display = 'inline-block';
  }
}

function updateStats() {
  const count = filteredCollection.length;
  const value = filteredCollection.reduce((sum, c) => sum + getCardPrice(c) * c.quantity, 0);
  document.getElementById('total-cards').textContent = count;
  document.getElementById('total-value').textContent = formatPrice(value, 'USD');
}

function onFiltersApplied() {
  renderWishlist();
}

function setupEventListeners() {
  // Menu toggle
  const menuToggle = document.getElementById('menu-toggle');
  const menuDropdown = document.getElementById('menu-dropdown');
  const menuOverlay = document.getElementById('menu-overlay');
  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      menuDropdown.classList.toggle('active');
      menuOverlay.classList.toggle('active');
    });
    menuOverlay.addEventListener('click', () => {
      menuDropdown.classList.remove('active');
      menuOverlay.classList.remove('active');
    });
  }
  
  // Filters toggle
  document.getElementById('filters-toggle')?.addEventListener('click', function() {
    this.classList.toggle('expanded');
    document.getElementById('filters-content').classList.toggle('collapsed');
    const icon = this.querySelector('.toggle-icon');
    if (icon) icon.textContent = this.classList.contains('expanded') ? '▼' : '▶';
  });
  
  document.getElementById('toggle-lock').addEventListener('click', toggleLock);
  document.getElementById('search-cards').addEventListener('click', showSearchModal);
  document.getElementById('download-wishlist').addEventListener('click', downloadWishlist);
  document.getElementById('export-moxfield').addEventListener('click', exportMoxfield);
  document.getElementById('clear-wishlist').addEventListener('click', clearWishlist);
  
  // Sync banner buttons
  document.getElementById('download-sync')?.addEventListener('click', downloadWishlist);
  document.getElementById('sync-from-git')?.addEventListener('click', async () => {
    if (confirm('Reset wishlist to match git? Local changes will be lost.')) {
      const ids = persistedCards.map(c => c.scryfallId);
      wishlistCards = await fetchCardsFromScryfall(ids);
      localStorage.setItem('wishlist', JSON.stringify(ids));
      collection = [...wishlistCards];
      filteredCollection = [...wishlistCards];
      syncWishlist();
      renderWishlist();
      showNotification('✓ Wishlist reset to match git');
    }
  });
  
  // Filter listeners
  document.getElementById('search').addEventListener('input', applyFilters);
  document.getElementById('set-filter')?.addEventListener('input', applyFilters);
  document.getElementById('rarity-filter').addEventListener('change', applyFilters);
  document.getElementById('foil-filter')?.addEventListener('change', applyFilters);
  document.getElementById('type-filter').addEventListener('change', applyFilters);
  document.getElementById('subtype-filter')?.addEventListener('input', applyFilters);
  document.getElementById('color-filter').addEventListener('change', applyFilters);
  document.getElementById('keyword-filter')?.addEventListener('change', applyFilters);
  document.getElementById('sort').addEventListener('change', applyFilters);
  
  // Color identity checkboxes
  document.querySelectorAll('.color-checkboxes input').forEach(cb => {
    cb.addEventListener('change', applyFilters);
  });
  
  document.getElementById('clear-filters').addEventListener('click', () => {
    document.getElementById('search').value = '';
    document.getElementById('set-filter').value = '';
    document.getElementById('rarity-filter').value = '';
    if (document.getElementById('foil-filter')) document.getElementById('foil-filter').value = '';
    document.getElementById('type-filter').value = '';
    if (document.getElementById('subtype-filter')) document.getElementById('subtype-filter').value = '';
    document.getElementById('color-filter').value = '';
    if (document.getElementById('keyword-filter')) document.getElementById('keyword-filter').value = '';
    document.getElementById('sort').value = 'price-desc';
    document.querySelectorAll('.color-checkboxes input').forEach(cb => cb.checked = false);
    if (priceSlider) priceSlider.set([0, maxPriceValue]);
    applyFilters();
  });
  
  // Price slider
  if (wishlistCards.length > 0) {
    maxPriceValue = Math.ceil(Math.max(...wishlistCards.map(c => getCardPrice(c))));
    if (maxPriceValue < 10) maxPriceValue = 10;
    
    const slider = document.getElementById('price-range');
    if (slider && !priceSlider) {
      priceSlider = noUiSlider.create(slider, {
        start: [0, maxPriceValue],
        connect: true,
        range: { min: 0, max: maxPriceValue },
        step: 0.01,
        format: { to: v => v.toFixed(2), from: v => parseFloat(v) }
      });
      priceSlider.on('update', (values) => {
        document.getElementById('price-min-val').textContent = values[0];
        document.getElementById('price-max-val').textContent = values[1];
      });
      priceSlider.on('change', applyFilters);
    }
  }
  
  // Populate keyword filter
  const keywords = new Set();
  wishlistCards.forEach(c => (c.keywords || []).forEach(k => keywords.add(k)));
  const kwSelect = document.getElementById('keyword-filter');
  if (kwSelect) {
    [...keywords].sort().forEach(k => {
      const opt = document.createElement('option');
      opt.value = k;
      opt.textContent = k;
      kwSelect.appendChild(opt);
    });
  }
}

document.addEventListener('DOMContentLoaded', initWishlist);
