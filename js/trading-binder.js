// Trading Binder
let binderCards = [];
let persistedCards = []; // Cards from git file
let localOnlyCards = []; // Cards in localStorage but not in git
let removedCards = []; // Cards in git but not in localStorage
let passwordHash = null; // Password hash from git file
let showOnlyPersisted = false; // Toggle for showing only persisted cards

// Check lock state from localStorage on page load
const storedLockState = localStorage.getItem('binderLocked');
let isLocked = storedLockState !== '0'; // Unlocked only if explicitly set to '0'

// Make isLocked available globally for shared.js
window.isLocked = isLocked;

// Hash password using SHA-256
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Check if password is correct
async function verifyPassword(password) {
  const hash = await hashPassword(password);
  return hash === passwordHash;
}

// Toggle lock state
async function toggleLock() {
  if (isLocked) {
    // Unlock - ask for password
    const password = prompt('Enter password to unlock binder:');
    if (!password) return;
    
    if (await verifyPassword(password)) {
      isLocked = false;
      window.isLocked = false;
      localStorage.setItem('binderLocked', '0');
      updateLockUI();
      showNotification('🔓 Binder unlocked');
      // Reload to show localStorage version
      location.reload();
    } else {
      showNotification('❌ Incorrect password');
    }
  } else {
    // Lock
    isLocked = true;
    window.isLocked = true;
    localStorage.setItem('binderLocked', '1');
    updateLockUI();
    showNotification('🔒 Binder locked');
    // Reload to show git version
    location.reload();
  }
}

function updateLockUI() {
  const lockBtn = document.getElementById('toggle-lock');
  const removeButtons = document.querySelectorAll('.remove-from-binder');
  const syncBanner = document.getElementById('sync-banner');
  const clearBtn = document.getElementById('clear-binder');
  const viewToggle = document.getElementById('view-toggle');
  
  // Update global lock state for other pages
  localStorage.setItem('binderLocked', isLocked ? '1' : '0');
  
  // Update menu indicator
  updateMenuLockIndicator();
  
  if (isLocked) {
    lockBtn.textContent = '🔒 Unlock Binder';
    lockBtn.classList.remove('unlocked');
    removeButtons.forEach(btn => btn.style.display = 'none');
    if (syncBanner) syncBanner.style.display = 'none';
    if (clearBtn) clearBtn.style.display = 'none';
    if (viewToggle) viewToggle.style.display = 'none';
  } else {
    lockBtn.textContent = '🔓 Lock Binder';
    lockBtn.classList.add('unlocked');
    removeButtons.forEach(btn => btn.style.display = 'block');
    if (syncBanner && (localOnlyCards.length > 0 || removedCards.length > 0)) {
      syncBanner.style.display = 'flex';
    }
    if (clearBtn) clearBtn.style.display = 'inline-block';
    if (viewToggle) viewToggle.style.display = 'flex';
  }
}

function updateMenuLockIndicator() {
  const menuItem = document.querySelector('.menu-item[href="trading-binder.html"]');
  if (!menuItem) return;
  
  const indicator = menuItem.querySelector('.admin-indicator') || document.createElement('span');
  indicator.className = 'admin-indicator';
  
  if (!isLocked) {
    indicator.textContent = ' 👤';
    indicator.title = 'Admin logged in';
    if (!menuItem.querySelector('.admin-indicator')) {
      menuItem.appendChild(indicator);
    }
  } else {
    indicator.remove();
  }
}

// Load persisted binder from git
async function loadPersistedBinder() {
  try {
    // Add cache-busting timestamp
    const response = await fetch(`data/trading-binder.json?t=${Date.now()}`);
    if (response.ok) {
      const data = await response.json();
      persistedCards = data.cards || [];
      passwordHash = data.passwordHash || null;
      return persistedCards;
    }
  } catch (e) {
    console.log('No persisted binder file found');
  }
  return [];
}

// Compare localStorage vs git and determine sync state
function syncBinder() {
  const localIds = binderCards.map(c => c.scryfallId);
  const persistedIds = persistedCards.map(c => c.scryfallId);
  
  // Cards in local but not in git
  localOnlyCards = binderCards.filter(c => !persistedIds.includes(c.scryfallId));
  
  // Cards in git but not in local
  removedCards = persistedCards.filter(p => !localIds.includes(p.scryfallId));
  
  updateSyncBanner();
}

function updateSyncBanner() {
  const banner = document.getElementById('sync-banner');
  if (!banner) return;
  
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
  const inLocal = binderCards.some(c => c.scryfallId === scryfallId);
  const inGit = persistedCards.some(c => c.scryfallId === scryfallId);
  
  if (inLocal && inGit) return 'persisted';
  if (inLocal && !inGit) return 'pending';
  if (!inLocal && inGit) return 'removed';
  return 'none';
}

// Load from localStorage or URL
async function loadBinder() {
  // First load persisted binder from git
  await loadPersistedBinder();
  
  const params = new URLSearchParams(window.location.search);
  const shared = params.get('b'); // base64 encoded (legacy)
  const legacyShared = params.get('cards'); // legacy format
  
  console.log('Loading binder, collection size:', collection.length);
  
  if (shared || legacyShared) {
    // Load from shared link
    try {
      let ids;
      if (shared) {
        // Decode base64
        const decoded = atob(shared);
        ids = decoded.split(',');
        console.log('Loading from compressed link:', ids.length, 'cards');
      } else {
        // Legacy format
        ids = legacyShared.split(',');
        console.log('Loading from legacy link:', ids.length, 'cards');
      }
      binderCards = collection.filter(c => ids.includes(c.scryfallId));
      localStorage.setItem('tradingBinder', JSON.stringify(ids));
    } catch (e) {
      console.error('Failed to load shared binder:', e);
    }
  } else {
    // Load from localStorage only if unlocked, otherwise load from git
    if (!isLocked) {
      const stored = localStorage.getItem('tradingBinder');
      console.log('LocalStorage tradingBinder:', stored);
      if (stored) {
        try {
          const ids = JSON.parse(stored);
          console.log('Loading from localStorage:', ids.length, 'IDs');
          binderCards = collection.filter(c => ids.includes(c.scryfallId));
          console.log('Matched cards:', binderCards.length);
        } catch (e) {
          console.error('Failed to load binder:', e);
        }
      }
    }
    
    // If locked or localStorage is empty, load from git
    if (isLocked || binderCards.length === 0) {
      if (persistedCards.length > 0) {
        console.log('Loading from git file:', persistedCards.length, 'cards');
        const ids = persistedCards.map(c => c.scryfallId);
        binderCards = collection.filter(c => ids.includes(c.scryfallId));
        // Only save to localStorage if unlocked
        if (!isLocked) {
          localStorage.setItem('tradingBinder', JSON.stringify(ids));
        }
      }
    }
  }
  
  // Set collection for filtering
  collection = [...binderCards];
  filteredCollection = [...binderCards];
  
  // Sync state
  syncBinder();
  
  renderBinder();
}

function renderBinder() {
  const container = document.getElementById('binder-collection');
  const emptyState = document.getElementById('empty-state');
  
  // Filter cards based on toggle when unlocked
  let cardsToShow = filteredCollection;
  if (!isLocked && showOnlyPersisted) {
    const persistedIds = persistedCards.map(c => c.scryfallId);
    cardsToShow = filteredCollection.filter(c => persistedIds.includes(c.scryfallId));
  }
  
  if (cardsToShow.length === 0) {
    container.style.display = 'none';
    emptyState.style.display = 'block';
    updateStats();
    return;
  }
  
  container.style.display = 'grid';
  emptyState.style.display = 'none';
  
  // Count by oracle_id for duplicate badge
  const nameCounts = {};
  cardsToShow.forEach(c => {
    const key = c.oracle_id || c.name;
    nameCounts[key] = (nameCounts[key] || 0) + 1;
  });
  
  container.innerHTML = cardsToShow.map(card => {
    let html = renderCardHTML(card, nameCounts);
    
    // Add state badge
    const state = getCardState(card.scryfallId);
    const stateBadge = state === 'persisted' 
      ? '<span class="state-badge persisted" title="Persisted to git">✓</span>'
      : '<span class="state-badge pending" title="Not persisted yet">⚠️</span>';
    
    // Add remove button before closing div
    const lastDivIndex = html.lastIndexOf('</div>');
    html = html.substring(0, lastDivIndex) + 
      stateBadge +
      `<button class="remove-from-binder" data-id="${card.scryfallId}" title="Remove from binder">✕</button>` +
      html.substring(lastDivIndex);
    return html;
  }).join('');
  
  // Load images
  container.querySelectorAll('.card-image-wrapper').forEach(wrapper => {
    const card = wrapper.closest('.card');
    const img = wrapper.querySelector('.card-image');
    const id = card.dataset.scryfallId;
    fetchCardImage(id).then(url => { if (url) img.src = url; });
  });
  
  // Setup interactions
  setupCardInteractions(container);
  
  // Remove buttons
  container.querySelectorAll('.remove-from-binder').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (isLocked) {
        showNotification('🔒 Binder is locked. Unlock to remove cards.');
        return;
      }
      removeFromBinder(btn.dataset.id);
    });
  });
  
  updateLockUI();
  updateStats();
}

function removeFromBinder(scryfallId) {
  binderCards = binderCards.filter(c => c.scryfallId !== scryfallId);
  saveBinder();
  // Reset collection and filteredCollection
  collection = [...binderCards];
  filteredCollection = [...binderCards];
  syncBinder();
  applyFilters();
  
  // Remind user to download if they have changes
  if (localOnlyCards.length > 0 || removedCards.length > 0) {
    showNotification('💾 Remember to download and commit the file to persist changes');
  }
}

function saveBinder() {
  const ids = binderCards.map(c => c.scryfallId);
  localStorage.setItem('tradingBinder', JSON.stringify(ids));
}

function updateStats() {
  const count = filteredCollection.length;
  const value = filteredCollection.reduce((sum, c) => sum + getCardPrice(c) * c.quantity, 0);
  const currency = getPriceSource() === 'scryfall' ? 'USD' : (binderCards[0]?.currency || 'USD');
  
  document.getElementById('total-cards').textContent = count;
  document.getElementById('total-value').textContent = formatPrice(value, currency);
}

function onFiltersApplied() {
  renderBinder();
}

function generateShareLink() {
  // New simple share link - just points to trading binder page
  return `${window.location.origin}${window.location.pathname}`;
}

function downloadBinderFile() {
  const data = {
    cards: binderCards.map(c => ({
      scryfallId: c.scryfallId,
      addedAt: new Date().toISOString()
    })),
    lastModified: new Date().toISOString()
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'trading-binder.json';
  a.click();
  URL.revokeObjectURL(url);
  
  showNotification('✓ File downloaded! Save to data/trading-binder.json and commit to git');
}

async function onCollectionLoaded() {
  await loadBinder();
  
  // Update UI based on initial lock state
  updateLockUI();
  
  // Setup price slider with binder-specific max value
  if (binderCards.length > 0) {
    maxPriceValue = Math.ceil(Math.max(...binderCards.map(c => getCardPrice(c))));
    if (maxPriceValue < 10) maxPriceValue = 10;
    
    // Destroy existing slider if it exists
    if (priceSlider) {
      priceSlider.destroy();
      priceSlider = null;
    }
    
    setupPriceSlider();
  }
  
  document.getElementById('toggle-lock').addEventListener('click', toggleLock);
  
  document.getElementById('view-toggle').addEventListener('click', () => {
    showOnlyPersisted = !showOnlyPersisted;
    const btn = document.getElementById('view-toggle');
    btn.textContent = showOnlyPersisted ? '📋 Show All Cards' : '✓ Show Persisted Only';
    renderBinder();
  });
  
  document.getElementById('download-binder').addEventListener('click', downloadBinderFile);
  
  document.getElementById('sync-from-git').addEventListener('click', () => {
    if (confirm('Reset local binder to match git? This will discard local changes.')) {
      const ids = persistedCards.map(c => c.scryfallId);
      binderCards = collection.filter(c => ids.includes(c.scryfallId));
      localStorage.setItem('tradingBinder', JSON.stringify(ids));
      collection = [...binderCards];
      filteredCollection = [...binderCards];
      syncBinder();
      renderBinder();
      showNotification('✓ Binder reset to match git');
    }
  });
  
  document.getElementById('share-binder').addEventListener('click', async () => {
    if (binderCards.length === 0) {
      alert('Add some cards to your binder first!');
      return;
    }
    
    // Check if all cards are persisted
    if (localOnlyCards.length > 0) {
      alert(`Warning: You have ${localOnlyCards.length} unpersisted cards. Download and commit the file first for others to see all cards.`);
    }
    
    const url = generateShareLink();
    
    try {
      await navigator.clipboard.writeText(url);
      const btn = document.getElementById('share-binder');
      const original = btn.textContent;
      btn.textContent = '✓ Link Copied!';
      setTimeout(() => btn.textContent = original, 2000);
    } catch (e) {
      prompt('Copy this link:', url);
    }
  });
  
  document.getElementById('clear-binder').addEventListener('click', () => {
    if (binderCards.length === 0) return;
    if (isLocked) {
      showNotification('🔒 Binder is locked. Unlock to clear.');
      return;
    }
    if (confirm('Clear all cards from your trading binder?')) {
      binderCards = [];
      saveBinder();
      collection = [];
      filteredCollection = [];
      syncBinder();
      renderBinder();
    }
  });
}

// Setup filters toggle on page load
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('filters-toggle')?.addEventListener('click', function() {
    this.classList.toggle('expanded');
    document.getElementById('filters-content').classList.toggle('collapsed');
  });
});
