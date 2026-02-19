// Trading Binder
let binderCards = [];

// Load from localStorage or URL
async function loadBinder() {
  const params = new URLSearchParams(window.location.search);
  const shared = params.get('b'); // base64 encoded
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
    // Load from localStorage
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
  
  renderBinder();
}

function renderBinder() {
  const container = document.getElementById('binder-collection');
  const emptyState = document.getElementById('empty-state');
  
  if (binderCards.length === 0) {
    container.style.display = 'none';
    emptyState.style.display = 'block';
    filteredCollection = [];
    updateStats();
    return;
  }
  
  container.style.display = 'grid';
  emptyState.style.display = 'none';
  
  // Set filteredCollection to binderCards and apply filters
  collection = [...binderCards];
  filteredCollection = [...binderCards];
  applyFilters();
  
  // Count by oracle_id for duplicate badge
  const nameCounts = {};
  filteredCollection.forEach(c => {
    const key = c.oracle_id || c.name;
    nameCounts[key] = (nameCounts[key] || 0) + 1;
  });
  
  container.innerHTML = filteredCollection.map(card => {
    let html = renderCardHTML(card, nameCounts);
    // Add remove button before closing div
    const lastDivIndex = html.lastIndexOf('</div>');
    html = html.substring(0, lastDivIndex) + 
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
      removeFromBinder(btn.dataset.id);
    });
  });
  
  updateStats();
}

function removeFromBinder(scryfallId) {
  binderCards = binderCards.filter(c => c.scryfallId !== scryfallId);
  saveBinder();
  renderBinder();
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
  const ids = binderCards.map(c => c.scryfallId).join(',');
  // Compress using base64
  const compressed = btoa(ids);
  const url = `${window.location.origin}${window.location.pathname}?b=${compressed}`;
  return url;
}

async function onCollectionLoaded() {
  await loadBinder();
  
  document.getElementById('share-binder').addEventListener('click', async () => {
    if (binderCards.length === 0) {
      alert('Add some cards to your binder first!');
      return;
    }
    
    const url = generateShareLink();
    
    // Check URL length
    if (url.length > 2000) {
      alert(`Warning: Share link is very long (${url.length} characters). Some platforms may not support it.`);
    }
    
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
    if (confirm('Clear all cards from your trading binder?')) {
      binderCards = [];
      saveBinder();
      renderBinder();
    }
  });
}
