// Wishlist state
let wishlistCards = [];
let persistedCards = [];
let isLocked = true;
let passwordHash = null;

// Lock state
window.isLocked = true;

// Initialize
async function initWishlist() {
  // Check lock state
  const lockState = localStorage.getItem('wishlistLocked');
  isLocked = lockState === null || lockState === '1';
  window.isLocked = isLocked;
  
  await loadWishlist();
  updateLockUI();
  setupEventListeners();
}

// Load persisted wishlist from git
async function loadPersistedWishlist() {
  try {
    const response = await fetch(`data/wishlist.json?t=${Date.now()}`);
    if (response.ok) {
      const data = await response.json();
      persistedCards = data.cards || [];
      return persistedCards;
    }
  } catch (e) {
    console.log('No persisted wishlist file found');
  }
  return [];
}

// Load password hash
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

// Fetch cards from Scryfall by ID
async function fetchCardsFromScryfall(scryfallIds) {
  const cards = [];
  const batchSize = 75;
  
  for (let i = 0; i < scryfallIds.length; i += batchSize) {
    const batch = scryfallIds.slice(i, i + batchSize);
    try {
      const response = await fetch('https://api.scryfall.com/cards/collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifiers: batch.map(id => ({ id })) })
      });
      
      if (response.ok) {
        const data = await response.json();
        for (const card of data.data) {
          const usdPrice = card.prices?.usd || card.prices?.usd_foil || card.prices?.usd_etched || '0';
          cards.push({
            name: card.name,
            scryfallId: card.id,
            setCode: card.set.toUpperCase(),
            setName: card.set_name,
            collectorNumber: card.collector_number,
            rarity: card.rarity,
            foil: 'normal',
            quantity: 1,
            price: parseFloat(card.prices?.usd || '0'),
            currency: 'USD',
            scryfallPrices: card.prices,
            imageUrl: card.image_uris?.normal || card.card_faces?.[0]?.image_uris?.normal,
            types: card.type_line,
            colors: card.colors || [],
            keywords: card.keywords || [],
            manaCost: card.mana_cost || '',
            cmc: card.cmc || 0
          });
        }
      }
      
      if (i + batchSize < scryfallIds.length) {
        await new Promise(r => setTimeout(r, 100));
      }
    } catch (e) {
      console.error('Failed to fetch batch:', e);
    }
  }
  
  return cards;
}

// Load wishlist
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
  
  applyFilters();
}

// Render wishlist
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
  
  const nameCounts = {};
  filteredCollection.forEach(c => {
    const key = c.oracle_id || c.name;
    nameCounts[key] = (nameCounts[key] || 0) + 1;
  });
  
  container.innerHTML = filteredCollection.map(card => {
    let html = renderCardHTML(card, nameCounts);
    
    if (!isLocked) {
      html += `<button class="remove-card" data-id="${card.scryfallId}">✕</button>`;
    }
    
    return html;
  }).join('');
  
  // Load images
  container.querySelectorAll('.card-image-wrapper').forEach(wrapper => {
    const card = wrapper.closest('.card');
    const img = wrapper.querySelector('.card-image');
    const id = card.dataset.scryfallId;
    fetchCardImage(id).then(url => { if (url) img.src = url; });
  });
  
  setupCardInteractions(container);
  
  if (!isLocked) {
    document.querySelectorAll('.remove-card').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        removeFromWishlist(btn.dataset.id);
      });
    });
  }
  
  updateStats();
}

// Add to wishlist
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
  const ids = wishlistCards.map(c => c.scryfallId);
  localStorage.setItem('wishlist', JSON.stringify(ids));
  
  collection = [...wishlistCards];
  applyFilters();
  showNotification(`✓ Added ${card.name}`);
}

// Remove from wishlist
function removeFromWishlist(scryfallId) {
  wishlistCards = wishlistCards.filter(c => c.scryfallId !== scryfallId);
  const ids = wishlistCards.map(c => c.scryfallId);
  localStorage.setItem('wishlist', JSON.stringify(ids));
  
  collection = [...wishlistCards];
  applyFilters();
  showNotification('✓ Card removed');
}

// Download wishlist
function downloadWishlist() {
  const data = {
    cards: wishlistCards.map(c => ({
      scryfallId: c.scryfallId,
      addedAt: new Date().toISOString()
    })),
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

// Clear wishlist
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

// Search Scryfall
async function searchScryfall(query) {
  if (!query) return [];
  
  try {
    const response = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}&order=usd&dir=desc`);
    if (response.ok) {
      const data = await response.json();
      return data.data || [];
    }
  } catch (e) {
    console.error('Search failed:', e);
  }
  return [];
}

// Show search modal
function showSearchModal() {
  const modal = document.getElementById('search-modal');
  const input = document.getElementById('scryfall-search');
  const results = document.getElementById('search-results');
  
  modal.classList.remove('hidden');
  input.value = '';
  results.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Type to search...</p>';
  input.focus();
  
  let timeout;
  input.oninput = () => {
    clearTimeout(timeout);
    timeout = setTimeout(async () => {
      const query = input.value.trim();
      if (!query) {
        results.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Type to search...</p>';
        return;
      }
      
      results.innerHTML = '<p style="text-align: center;">Searching...</p>';
      const cards = await searchScryfall(query);
      
      if (cards.length === 0) {
        results.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No results found</p>';
        return;
      }
      
      results.innerHTML = cards.slice(0, 20).map(card => {
        const usdPrice = card.prices?.usd || card.prices?.usd_foil || '0';
        const inWishlist = wishlistCards.some(c => c.scryfallId === card.id);
        return `
          <div class="search-result" data-card='${JSON.stringify({
            name: card.name,
            scryfallId: card.id,
            setCode: card.set.toUpperCase(),
            setName: card.set_name,
            collectorNumber: card.collector_number,
            rarity: card.rarity,
            foil: 'normal',
            quantity: 1,
            price: parseFloat(usdPrice),
            currency: 'USD',
            scryfallPrices: card.prices,
            imageUrl: card.image_uris?.normal || card.card_faces?.[0]?.image_uris?.normal,
            types: card.type_line,
            colors: card.colors || [],
            keywords: card.keywords || [],
            manaCost: card.mana_cost || '',
            cmc: card.cmc || 0
          })}'>
            <img src="${card.image_uris?.small || card.card_faces?.[0]?.image_uris?.small}" alt="${card.name}" style="width: 60px; height: 84px; border-radius: 4px;">
            <div style="flex: 1;">
              <strong>${card.name}</strong>
              <div style="font-size: 0.9em; color: var(--text-secondary);">${card.set_name} • ${card.rarity}</div>
            </div>
            <div style="text-align: right;">
              <strong>$${usdPrice}</strong>
              ${inWishlist ? '<div style="color: var(--success); font-size: 0.9em;">✓ In Wishlist</div>' : ''}
            </div>
          </div>
        `;
      }).join('');
      
      document.querySelectorAll('.search-result').forEach(el => {
        el.addEventListener('click', () => {
          const card = JSON.parse(el.dataset.card);
          addToWishlist(card);
        });
      });
    }, 300);
  };
  
  document.getElementById('search-close').onclick = () => {
    modal.classList.add('hidden');
  };
  
  modal.onclick = (e) => {
    if (e.target === modal) modal.classList.add('hidden');
  };
}

// Password verification
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyPassword(password) {
  const hash = await hashPassword(password);
  return hash === passwordHash;
}

// Show password modal
function showPasswordModal() {
  const modal = document.getElementById('password-modal');
  const input = document.getElementById('password-input');
  const error = document.getElementById('password-error');
  
  modal.classList.remove('hidden');
  input.value = '';
  error.classList.add('hidden');
  input.focus();
  
  const submit = async () => {
    const password = input.value;
    if (!password) return;
    
    if (await verifyPassword(password)) {
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
  input.onkeypress = (e) => {
    if (e.key === 'Enter') submit();
  };
  document.getElementById('password-cancel').onclick = () => {
    modal.classList.add('hidden');
  };
  modal.onclick = (e) => {
    if (e.target === modal) modal.classList.add('hidden');
  };
}

// Toggle lock
async function toggleLock() {
  if (isLocked) {
    showPasswordModal();
  } else {
    isLocked = true;
    window.isLocked = true;
    localStorage.setItem('wishlistLocked', '1');
    updateLockUI();
    showNotification('🔒 Wishlist locked');
    location.reload();
  }
}

// Update lock UI
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

// Update stats
function updateStats() {
  const count = filteredCollection.length;
  const value = filteredCollection.reduce((sum, c) => sum + getCardPrice(c) * c.quantity, 0);
  
  document.getElementById('total-cards').textContent = count;
  document.getElementById('total-value').textContent = formatPrice(value, 'USD');
}

// Setup event listeners
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
  
  document.getElementById('toggle-lock').addEventListener('click', toggleLock);
  document.getElementById('search-cards').addEventListener('click', showSearchModal);
  document.getElementById('download-wishlist').addEventListener('click', downloadWishlist);
  document.getElementById('clear-wishlist').addEventListener('click', clearWishlist);
  
  document.getElementById('search').addEventListener('input', applyFilters);
  document.getElementById('set-filter').addEventListener('input', applyFilters);
  document.getElementById('rarity-filter').addEventListener('change', applyFilters);
  document.getElementById('type-filter').addEventListener('change', applyFilters);
  document.getElementById('color-filter').addEventListener('change', applyFilters);
  document.getElementById('sort').addEventListener('change', applyFilters);
  document.getElementById('clear-filters').addEventListener('click', () => {
    document.getElementById('search').value = '';
    document.getElementById('set-filter').value = '';
    document.getElementById('rarity-filter').value = '';
    document.getElementById('type-filter').value = '';
    document.getElementById('color-filter').value = '';
    document.getElementById('sort').value = 'price-desc';
    if (priceSlider) priceSlider.set([0, maxPriceValue]);
    applyFilters();
  });
  
  // Setup price slider
  if (wishlistCards.length > 0) {
    maxPriceValue = Math.ceil(Math.max(...wishlistCards.map(c => getCardPrice(c))));
    if (maxPriceValue < 10) maxPriceValue = 10;
    
    const slider = document.getElementById('price-slider');
    if (slider && !priceSlider) {
      priceSlider = noUiSlider.create(slider, {
        start: [0, maxPriceValue],
        connect: true,
        range: { min: 0, max: maxPriceValue },
        step: 0.01,
        format: { to: v => v.toFixed(2), from: v => parseFloat(v) }
      });
      priceSlider.on('change', applyFilters);
    }
  }
}

function onFiltersApplied() {
  renderWishlist();
}

// Initialize on load
document.addEventListener('DOMContentLoaded', initWishlist);
