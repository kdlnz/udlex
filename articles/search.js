(async function(){
  let articles = [];
  try {
    const dataRes = await fetch('/articles/search/index.json');
    articles = await dataRes.json();
  } catch (e) {
    // fallback to monolithic json for older setups
    const fallback = await fetch('/articles/articles.json');
    articles = await fallback.json();
  }

  const searchInput = document.getElementById('search-input');
  const sortType = document.getElementById('sort-type');
  const sortDescBtn = document.getElementById('sort-desc');
  const sortAscBtn = document.getElementById('sort-asc');
  const catToggleAll = document.getElementById('cat-toggle-all');
  const catCheckboxes = () => Array.from(document.querySelectorAll('.cat-checkbox'));
  const categoryToggle = document.getElementById('category-toggle');
  const categoryPopup = document.getElementById('category-popup');
  const results = document.getElementById('results');

  let sortDirection = 'asc';

  function renderList(list) {
    results.innerHTML = '';
    if (!list.length) { results.innerHTML = '<p>No results</p>'; return; }
    list.forEach(a => {
      const el = document.createElement('article');
      el.className = 'article-item';
      el.innerHTML = `
        <h3><a href="categories/${a.category}/${a.slug}.html">${a.title}</a></h3>
        <p class="meta">
          <span class="date">${a.date || ''}</span>
          ${a.author ? ' • <span class="author">By ' + a.author + '</span>' : ''}
        </p>
        <p class="excerpt">${a.excerpt}</p>
        <p class="tags">${(a.tags || []).map(t => '<span class="tag">' + t + '</span>').join(' ')}</p>
      `;
      results.appendChild(el);
    });
  }

  function matchQuery(a, q) {
    q = q.toLowerCase().trim();
    if (!q) return true;
    if (a.title.toLowerCase().includes(q)) return true;
    if (a.excerpt.toLowerCase().includes(q)) return true;
    if (a.tags.join(' ').toLowerCase().includes(q)) return true;
    return false;
  }

  function getSelectedCategories() {
    // return explicit selected categories array (may be empty)
    return catCheckboxes().filter(cb => cb.checked).map(cb => cb.value);
  }

  function applyFilters() {
    let list = articles.slice();
    const q = searchInput.value || '';
    const selCats = getSelectedCategories();
    // filter by categories (if not null)
    list = list.filter(a => (selCats === null || selCats.includes(a.category)) && matchQuery(a, q));

    // sorting
    const type = sortType.value;
    const dir = sortDirection === 'desc' ? -1 : 1;
    if (type === 'date') list.sort((x,y) => (new Date(x.date) - new Date(y.date)) * dir * -1);
    if (type === 'title') list.sort((x,y) => x.title.localeCompare(y.title) * dir);
    if (type === 'author') list.sort((x,y) => ((x.author||'').localeCompare(y.author||'')) * dir);

    renderList(list);
  }

  searchInput.addEventListener('input', applyFilters);
  sortType.addEventListener('change', applyFilters);
  sortDescBtn.addEventListener('click', () => { sortDirection = 'desc'; applyFilters(); });
  sortAscBtn.addEventListener('click', () => { sortDirection = 'asc'; applyFilters(); });

  // category controls logic: toggle all behavior
  // popup toggle
  categoryToggle.addEventListener('click', (e) => {
    const open = !categoryPopup.hasAttribute('hidden');
    if (open) categoryPopup.setAttribute('hidden', ''); else categoryPopup.removeAttribute('hidden');
  });

  // clicking outside popup closes it
  document.addEventListener('click', (e) => {
    if (!categoryPopup) return;
    if (categoryPopup.hasAttribute('hidden')) return;
    if (e.target === categoryToggle || categoryToggle.contains(e.target)) return;
    if (categoryPopup.contains(e.target)) return;
    categoryPopup.setAttribute('hidden', '');
  });
  // ESC closes
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') categoryPopup.setAttribute('hidden', ''); });

  function getCheckboxes() { return catCheckboxes(); }

  catToggleAll.addEventListener('click', () => {
    const boxes = getCheckboxes();
    const anyChecked = boxes.some(b => b.checked);
    if (anyChecked) boxes.forEach(b => b.checked = false);
    else boxes.forEach(b => b.checked = true);
    applyFilters();
  });

  function wireCatBoxes() {
    const boxes = getCheckboxes();
    boxes.forEach(cb => cb.removeEventListener && cb.removeEventListener('change', applyFilters));
    boxes.forEach(cb => cb.addEventListener('change', () => {
  // keep explicit selection; do nothing special here (empty selection allowed)
  // if user checks all boxes they can later use Toggle All to clear them
      applyFilters();
    }));
  }

  // initial wiring
  wireCatBoxes();

  // initial
  applyFilters();
})();
