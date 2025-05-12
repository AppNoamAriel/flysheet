let subcategoriesMap = {};

document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('addFlysheetBtn').addEventListener('click', handleAddFlysheet);

  await loadSubcategories(); // charge sous-catégories dans les selects
  await loadTable();         // charge le tableau
  setupFilters();            // initialise les filtres
});

async function loadSubcategories() {
  try {
    const res = await fetch('/api/subcategories');
    const data = await res.json();
    const subSelect = document.getElementById('type');
    const filterSelect = document.getElementById('typeFilter');

    subSelect.innerHTML = '';
    filterSelect.innerHTML = '<option value="all">Tous</option>';

    data.data.forEach(sub => {
      subcategoriesMap[sub._id] = sub.nom;

      // Pour ajout de campagne
      const opt1 = document.createElement('option');
      opt1.value = sub._id;
      opt1.textContent = sub.nom;
      subSelect.appendChild(opt1);

      // Pour filtre — ID dans value
      const opt2 = document.createElement('option');
      opt2.value = sub._id; // <-- valeur = ID
      opt2.textContent = sub.nom;
      filterSelect.appendChild(opt2);
    });
  } catch (err) {
    console.error("Erreur chargement sous-catégories :", err);
  }
}


function setupFilters() {
  document.getElementById('typeFilter').addEventListener('change', filterTable);
  document.getElementById('goalFilter').addEventListener('change', filterTable);
  document.getElementById('nameFilter').addEventListener('input', filterTable);
  document.getElementById('resetFilters').addEventListener('click', () => {
    document.getElementById('typeFilter').value = 'all';
    document.getElementById('goalFilter').value = 'all';
    document.getElementById('nameFilter').value = '';
    filterTable();
  });
}

function filterTable() {
  const type = document.getElementById('typeFilter').value;
  const goal = document.getElementById('goalFilter').value;
  const nom = document.getElementById('nameFilter').value.trim();

  const filters = {};
  if (type !== 'all') filters.typeProduit = type;
  if (goal !== 'all') filters.objectif = goal;
  if (nom) filters.nom = nom;

  loadTable(filters);
}

async function handleAddFlysheet() {
  const nom = document.getElementById('nom').value.trim();
  const url = document.getElementById('urlInput').value.trim();
  const typeProduit = document.getElementById('type').value;
  const objectifInput = document.getElementById('objectif').value.trim();
  const departementsInput = document.getElementById('departements')?.value.trim() || '';
  const departements = [...new Set(departementsInput.split(',').map(dep => dep.trim()).filter(Boolean))];
  const pile = document.getElementById('pile').value === 'true';
  const objectif = pile ? 0 : parseInt(objectifInput, 10);

  if (!nom || !url || (!pile && isNaN(objectif))) {
    return alert("Erreur : Champs manquants ou invalides.");
  }

  try {
    const res = await fetch('/api/campagnes/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nom, url, typeProduit, objectif, departements, pile })
    });
    const data = await res.json();

    if (data.status) {
      await loadTable();
      document.getElementById('nom').value = '';
      document.getElementById('urlInput').value = '';
      document.getElementById('type').value = '';
      document.getElementById('objectif').value = '';
      document.getElementById('departements').value = '';
      document.getElementById('pile').value = 'false';
    } else {
      alert("Erreur : " + data.message);
    }
  } catch (err) {
    console.error("Erreur ajout campagne:", err);
    alert("Erreur interne serveur");
  }
}

async function loadTable(filters = {}) {
  const tableBody = document.getElementById('flysheetTableBody');
  tableBody.innerHTML = '';

  try {
    const query = new URLSearchParams(filters).toString();
    const url = query ? `/api/campagnes?${query}` : '/api/campagnes';
    const res = await fetch(url);
    const data = await res.json();

    if (!data.status || !Array.isArray(data.data)) return;

    const filtered = data.data.filter(flysheet => {
      const nomMatch = !filters.nom || flysheet.nom.toLowerCase().includes(filters.nom.toLowerCase());

      const typeId =
          typeof flysheet.typeProduit === 'object'
              ? flysheet.typeProduit._id
              : flysheet.typeProduit;

      const typeMatch = !filters.typeProduit || typeId === filters.typeProduit;

      const progress = flysheet.objectif > 0
          ? (flysheet.valide || 0) / flysheet.objectif * 100
          : 0;

      let goalMatch = true;
      if (filters.objectif && filters.objectif !== 'all') {
        const [min, max] = filters.objectif.split('-').map(Number);
        goalMatch = progress >= min && progress <= max;
      }


      return nomMatch && typeMatch && goalMatch;
    });

    filtered.forEach(renderFlysheetRow);
    attachEtatHandlers();
  } catch (err) {
    console.error("Erreur lors du chargement des campagnes :", err);
  }
}


function renderFlysheetRow(flysheet) {
  const tableBody = document.getElementById('flysheetTableBody');
  const row = document.createElement('tr');
  row.dataset.id = flysheet._id;

  const progress = flysheet.objectif > 0
      ? Math.min(100, Math.round((flysheet.valide / flysheet.objectif) * 100))
      : 0;
  const color = getProgressColor(progress);

  const typeProduitNom =
      typeof flysheet.typeProduit === 'object'
          ? flysheet.typeProduit.nom
          : subcategoriesMap[flysheet.typeProduit] || '—';

  row.innerHTML = `
    <td><a href="${flysheet.url}" class="invisible-link" target="_blank">${flysheet.pile ? `${typeProduitNom} (Pile)` : flysheet.nom}</a></td>
    <td>${flysheet.pile ? '' : (flysheet.valide || 0)}</td>
    <td>${flysheet.invalide || 0}</td>
    <td>${flysheet.tel || 0}</td>
    <td>${flysheet.unique || 0}</td>
    <td>${flysheet.installer || 0}</td>
    <td>${(flysheet.departements || []).map(d => d.padStart(2, '0')).sort().join(', ')}</td>
    <td>${typeProduitNom}</td>
    <td>${flysheet.pile ? '' : `
      <div class="goal-wrapper">
        <input type="number" class="editable-goal" value="${flysheet.objectif}" min="1" />
        <div class="progress-bar-container">
          <div class="progress-bar" style="width: ${progress}%; background-color: ${color};"></div>
        </div>
        <span class="goal-display">(${progress}%)</span>
      </div>
    `}</td>
    <td>${flysheet.pile ? '' : `
      <button class="play-pause-btn ${flysheet.etat ? 'pause' : 'play'}" data-id="${flysheet._id}">
        <span class="material-symbols-outlined">${flysheet.etat ? 'pause' : 'play_arrow'}</span>
      </button>
    `}</td>
    <td><button class="delete-btn"><span class="material-symbols-outlined">cancel</span></button></td>
    <td><button class="download-btn"><span class="material-symbols-outlined">download</span></button></td>
  `;

  tableBody.appendChild(row);
}

function getProgressColor(progress) {
  if (progress <= 25) return '#e74c3c';
  if (progress <= 75) return '#f39c12';
  return '#2ecc71';
}

function attachEtatHandlers() {
  const tableBody = document.getElementById('flysheetTableBody');
  const clone = tableBody.cloneNode(true);
  tableBody.parentNode.replaceChild(clone, tableBody);

  clone.addEventListener('click', async (e) => {
    const row = e.target.closest('tr');
    if (!row) return;
    const id = row.dataset.id;
    if (!id) return;

    if (e.target.closest('.download-btn')) {
      window.open(`/api/campagnes/${id}/download`, '_blank');
      return;
    }

    if (e.target.closest('.delete-btn')) {
      if (!confirm("Confirmer la suppression de cette campagne ?")) return;
      try {
        const res = await fetch(`/api/campagnes/${id}/delete`, { method: 'DELETE' });
        const data = await res.json();
        if (data.status) row.remove();
        else alert("Erreur : " + (data.message || "Suppression échouée"));
      } catch (err) {
        console.error("Erreur suppression :", err);
        alert("Erreur serveur");
      }
      return;
    }

    if (e.target.closest('.play-pause-btn')) {
      const button = e.target.closest('.play-pause-btn');
      const icon = button.querySelector('.material-symbols-outlined');

      try {
        const res = await fetch(`/api/campagnes/toggle/${id}`, { method: 'PATCH' });
        const data = await res.json();
        if (res.ok) {
          const isPaused = data.etat;
          button.classList.toggle('play', !isPaused);
          button.classList.toggle('pause', isPaused);
          icon.textContent = isPaused ? 'pause' : 'play_arrow';
        } else {
          alert("Erreur changement état");
        }
      } catch (err) {
        console.error("Erreur toggle :", err);
      }
    }
  });

  clone.addEventListener('keydown', async (e) => {
    if (e.target.classList.contains('editable-goal') && e.key === 'Enter') {
      e.preventDefault();
      const row = e.target.closest('tr');
      const id = row.dataset.id;
      const newGoal = parseInt(e.target.value, 10);

      if (isNaN(newGoal) || newGoal <= 0) return alert("Erreur : objectif invalide.");
      if (!confirm("Modifier l'objectif ?")) return;

      try {
        const res = await fetch('/api/campagnes/update-objectif', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, objectif: newGoal })
        });

        const data = await res.json();
        if (!data.status) throw new Error(data.message || "Erreur serveur");

        const current = parseInt(row.querySelector('td:nth-child(2)')?.textContent || 0, 10);
        const progress = Math.min(100, Math.round((current / newGoal) * 100));
        const bar = row.querySelector('.progress-bar');
        const display = row.querySelector('.goal-display');

        if (bar) bar.style.width = `${progress}%`;
        if (bar) bar.style.backgroundColor = getProgressColor(progress);
        if (display) display.textContent = `(${progress}%)`;

        alert("Objectif mis à jour !");
      } catch (err) {
        console.error(err);
        alert("Erreur mise à jour objectif.");
      }
    }
  });
}
