// Client-side search logic for Admin Search page
// Depends on window.initialPeople injected by the server

(function () {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const resultsGrid = $('#resultsGrid');
  const noResults = $('#noResults');
  const yearTypeRadios = $$('input[name="yearType"]');
  const yearSelect = $('#yearSelect');
  const batchSelect = $('#batchSelect');
  const nameInput = $('#nameInput');
  const emailInput = $('#emailInput');
  const rollInput = $('#rollInput');
  const cityInput = $('#cityInput');
  const stateInput = $('#stateInput');
  const courseChips = $('#courseChips');
  const deptChips = $('#deptChips');
  const genderChips = $('#genderChips');
  const applyBtn = $('#applyFiltersBtn');
  const resetBtn = $('#resetFiltersBtn');

  const state = {
    selectedCourses: new Set(),
    selectedDepts: new Set(),
    selectedGenders: new Set(),
  };

  function toggleChip(e) {
    const btn = e.target.closest('button');
    if (!btn) return;
    btn.classList.toggle('active');
    const val = btn.dataset.value;
    const set = btn.parentElement === courseChips
      ? state.selectedCourses
      : btn.parentElement === deptChips
        ? state.selectedDepts
        : state.selectedGenders;
    if (btn.classList.contains('active')) set.add(val); else set.delete(val);
  }

  courseChips.addEventListener('click', toggleChip);
  deptChips.addEventListener('click', toggleChip);
  genderChips.addEventListener('click', toggleChip);

  function parseBatchRange(batchStr) {
    if (!batchStr) return null;
    const m = batchStr.match(/(\d{4})\D+(\d{4})/);
    if (!m) return null;
    return { start: Number(m[1]), end: Number(m[2]) };
  }

  function applyFilters() {
    const data = Array.isArray(window.initialPeople) ? window.initialPeople : [];
    const type = yearTypeRadios.find(r => r.checked)?.value || 'passing';
    const yearVal = Number(yearSelect.value) || null;
    const batchVal = batchSelect.value || '';
    const batch = parseBatchRange(batchVal);
    const nameQ = (nameInput.value || '').trim().toLowerCase();
    const emailQ = (emailInput.value || '').trim().toLowerCase();
    const rollQ = (rollInput.value || '').trim().toLowerCase();
    const cityQ = (cityInput.value || '').trim().toLowerCase();
    const stateQ = (stateInput.value || '').trim().toLowerCase();

    const courses = state.selectedCourses;
    const depts = state.selectedDepts;
    const genders = state.selectedGenders;

    const out = data.filter(p => {
      if (yearVal && (p.yearType !== type || p.year !== yearVal)) return false;
      if (batch && (!p.batch || !p.batch.includes(`${batch.start}`) || !p.batch.includes(`${batch.end}`))) return false;
      if (courses.size && !courses.has(p.course)) return false;
      if (depts.size && !depts.has(p.dept)) return false;
      if (genders.size && !genders.has(p.gender)) return false;
      if (cityQ && (!p.city || p.city.toLowerCase() !== cityQ)) return false;
      if (stateQ && (!p.state || p.state.toLowerCase() !== stateQ)) return false;
      if (nameQ && (!p.name || !p.name.toLowerCase().includes(nameQ))) return false;
      if (emailQ && (!p.email || !p.email.toLowerCase().includes(emailQ))) return false;
      if (rollQ && (!p.roll || !p.roll.toLowerCase().includes(rollQ))) return false;
      return true;
    });

    renderResults(out);
  }

  function resetFilters() {
    yearTypeRadios.forEach(r => r.checked = r.value === 'passing');
    yearSelect.value = '';
    batchSelect.value = '';
    nameInput.value = '';
    emailInput.value = '';
    rollInput.value = '';
    cityInput.value = '';
    stateInput.value = '';

    state.selectedCourses.clear();
    state.selectedDepts.clear();
    state.selectedGenders.clear();
    [...$$('.chips button')].forEach(b => b.classList.remove('active'));

    renderResults(window.initialPeople || []);
  }

  function renderResults(items) {
    resultsGrid.innerHTML = '';
    noResults.style.display = items.length ? 'none' : 'block';
    if (!items.length) return;

    const frag = document.createDocumentFragment();
    items.forEach(p => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <img class="avatar" src="${p.avatar}" alt="${p.name}"/>
        <div class="meta">
          <h3>${p.name}</h3>
          <p>${p.course} • ${p.dept} • ${p.batch || ''}</p>
          <p>${p.city || ''}${p.city && p.state ? ', ' : ''}${p.state || ''}</p>
        </div>
        <div class="actions">
          <a class="btn" href="/alumni/${encodeURIComponent(p.email)}">View Profile</a>
        </div>`;
      frag.appendChild(card);
    });
    resultsGrid.appendChild(frag);
  }

  applyBtn.addEventListener('click', applyFilters);
  resetBtn.addEventListener('click', resetFilters);

  // Initial render
  renderResults(window.initialPeople || []);
})();