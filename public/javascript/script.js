document.addEventListener('DOMContentLoaded', async () => {
  const username = sessionStorage.getItem("username");
  if (!sessionStorage.getItem("isLoggedIn") || !username) {
    return window.location.href = "/login.html";
  }

  try {
    const res = await fetch(`/api/users/check/${username}`);
    const data = await res.json();
    if (!data.exists) {
      alert("Tu ne peux plus accéder au tableau car ton compte a été supprimé.");
      sessionStorage.clear();
      return window.location.href = "/login.html";
    }
  } catch (error) {
    console.error("Erreur vérification utilisateur :", error);
    sessionStorage.clear();
    return window.location.href = "/login.html";
  }

  document.getElementById('addFlysheetBtn').addEventListener('click', handleAddFlysheet);

  // Attache les filtres
  document.getElementById('nameFilter').addEventListener('input', loadTable);
  document.getElementById('typeFilter').addEventListener('change', loadTable);
  document.getElementById('goalFilter').addEventListener('change', loadTable);
  document.getElementById('resetFilters').addEventListener('click', () => {
    document.getElementById('nameFilter').value = '';
    document.getElementById('typeFilter').value = 'all';
    document.getElementById('goalFilter').value = 'all';
    loadTable();
  });

  await loadTable();

  const authSection = document.getElementById('authSection');
  authSection.innerHTML = `
    <div class="user-menu">
      <button id="accountBtn" class="account-button" aria-label="Mon compte">
        <span class="material-symbols-outlined">account_circle</span>
      </button>
      <div class="user-dropdown" id="userDropdown">
        <a href="/compte.html" class="dropdown-btn">
          <span class="material-symbols-outlined">settings</span>
          <span>Gérer mes accès</span>
        </a>
        <button id="logoutBtn" class="dropdown-btn logout">
          <span class="material-symbols-outlined">logout</span>
          <span>Se déconnecter</span>
        </button>
      </div>
    </div>
  `;

  const accountBtn = document.getElementById('accountBtn');
  const dropdown = document.getElementById('userDropdown');

  accountBtn.addEventListener('click', () => {
    dropdown.classList.toggle('show');
  });

  document.addEventListener('click', (e) => {
    if (!authSection.contains(e.target)) {
      dropdown.classList.remove('show');
    }
  });

  document.getElementById('logoutBtn').addEventListener('click', () => {
    if (confirm("Es-tu sûr de vouloir te déconnecter ?")) {
      sessionStorage.clear();
      window.location.href = '/login.html';
    }
  });
});
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
      document.getElementById('type').value = 'PV';
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

async function loadTable() {
  const tableBody = document.getElementById('flysheetTableBody');

  const nom = document.getElementById('nameFilter').value;
  const typeProduit = document.getElementById('typeFilter').value;
  const objectif = document.getElementById('goalFilter').value;

  const query = new URLSearchParams();
  if (nom) query.append('nom', nom);
  if (typeProduit && typeProduit !== 'all') query.append('typeProduit', typeProduit);
  if (objectif && objectif !== 'all') query.append('objectif', objectif);

  try {
    const res = await fetch(`/api/campagnes?${query.toString()}`);
    const data = await res.json();

    if (!data.status || !Array.isArray(data.data)) return;

    tableBody.innerHTML = '';
    data.data.forEach(flysheet => renderFlysheetRow(flysheet));

    attachEtatHandlers();
    attachDownloadHandlers();
    attachDeleteHandlers();
    attachObjectifHandlers();
  } catch (err) {
    console.error("Erreur loadTable :", err);
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

  row.innerHTML = `
    <td><a href="${flysheet.url}" class="invisible-link" target="_blank">${flysheet.pile ? `${flysheet.typeProduit} (Pile)` : flysheet.nom}</a></td>
    <td>${flysheet.pile ? '' : (flysheet.valide || 0)}</td>
    <td>${flysheet.invalide || 0}</td>
    <td>${flysheet.tel || 0}</td>
    <td>${flysheet.unique || 0}</td>
    <td>${flysheet.installer || 0}</td>
    <td>${(flysheet.departements || []).map(d => d.padStart(2, '0')).sort().join(', ')}</td>
    <td>${flysheet.typeProduit}</td>
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
  document.querySelectorAll('.play-pause-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      if (!id) return;

      try {
        const res = await fetch(`/api/campagnes/toggle/${id}`, {
          method: 'PATCH'
        });
        const data = await res.json();

        if (data.status) {
          await loadTable();
        } else {
          alert("Erreur de mise à jour de l'état.");
        }
      } catch (err) {
        console.error("Erreur changement état :", err);
      }
    });
  });
}

function attachDownloadHandlers() {
  document.querySelectorAll('.download-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const row = btn.closest('tr');
      const id = row.dataset.id;
      if (!id) return alert("Erreur : ID introuvable pour l'export.");

      try {
        const res = await fetch(`/api/campagnes/${id}/download`);
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `campagne_${id}.xlsx`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Erreur lors du téléchargement :", error);
        alert("Erreur lors de l'export XLSX.");
      }
    });
  });
}

function attachDeleteHandlers() {
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const row = btn.closest('tr');
      const id = row.dataset.id;
      if (!id) return;

      if (!confirm("Supprimer cette campagne ?")) return;

      try {
        const res = await fetch(`/api/campagnes/${id}/delete`, {
          method: 'DELETE'
        });
        const data = await res.json();

        if (data.status) {
          row.remove();
        } else {
          alert("Erreur lors de la suppression.");
        }
      } catch (err) {
        console.error("Erreur suppression :", err);
        alert("Erreur serveur.");
      }
    });
  });
}

function attachObjectifHandlers() {
  document.querySelectorAll('.editable-goal').forEach(input => {
    input.addEventListener('change', async () => {
      const row = input.closest('tr');
      const id = row.dataset.id;
      const objectif = parseInt(input.value, 10);

      if (!id || isNaN(objectif)) return;

      try {
        const res = await fetch('/api/campagnes/update-objectif', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, objectif })
        });
        const data = await res.json();

        if (data.status) {
          alert("🎯 Objectif mis à jour !");
          await loadTable();
        } else {
          alert("Erreur lors de la mise à jour.");
        }
      } catch (err) {
        console.error("Erreur update objectif :", err);
        alert("Erreur serveur.");
      }
    });
  });
}
