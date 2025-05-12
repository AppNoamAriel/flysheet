window.initCategories = async () => {
    const username = sessionStorage.getItem("username");
    if (!sessionStorage.getItem("isLoggedIn") || !username) {
        return window.location.href = "/login.html";
    }

    try {
        const res = await fetch(`/api/users/check/${username}`);
        const data = await res.json();
        if (!data.exists) {
            alert("Ton compte a été supprimé.");
            sessionStorage.clear();
            return window.location.href = "/login.html";
        }
    } catch (err) {
        console.error("Erreur vérification utilisateur :", err);
        sessionStorage.clear();
        return window.location.href = "/login.html";
    }

    setupCategoryManagement();
    await loadCategoriesAndSubcategories();
};

async function loadCategoriesAndSubcategories() {
    const catList = document.getElementById('categoriesList');
    const subList = document.getElementById('subcategoriesList');
    catList.innerHTML = '';
    subList.innerHTML = '';

    const [resCat, resSub] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/subcategories')
    ]);

    const cats = (await resCat.json()).data;
    const subs = (await resSub.json()).data;

    // ▶️ Catégories
    cats.forEach(cat => {
        const li = document.createElement('li');
        li.classList.add('list-group-item');
        li.innerHTML = `
      <span class="category-name">${cat.nom}</span>
      <span class="action-icons">
        <button class="edit-cat" data-id="${cat._id}" data-nom="${cat.nom}" title="Modifier">✏️</button>
        <button class="delete-cat" data-id="${cat._id}" title="Supprimer">🗑️</button>
      </span>
    `;
        catList.appendChild(li);
    });

    // ▶️ Sous-catégories
    subs.forEach(sub => {
        const li = document.createElement('li');
        li.classList.add('list-group-item');
        li.innerHTML = `
      <span>
        <strong>${sub.nom}</strong>
        <span class="subcategory-name">(${sub.id_cat?.nom || '—'})</span>
      </span>
      <span class="action-icons">
        <button class="edit-sub" data-id="${sub._id}" data-nom="${sub.nom}" data-cat="${sub.id_cat?._id}" title="Modifier">✏️</button>
        <button class="delete-sub" data-id="${sub._id}" title="Supprimer">🗑️</button>
      </span>
    `;
        subList.appendChild(li);
    });

    // ▶️ Boutons
    catList.querySelectorAll('.delete-cat').forEach(btn => {
        btn.addEventListener('click', async () => {
            if (!confirm("Supprimer cette catégorie ?")) return;
            const res = await fetch(`/api/categories/${btn.dataset.id}`, { method: 'DELETE' });
            const data = await res.json();
            if (!data.status) return alert(data.message);
            await loadCategoriesAndSubcategories();
        });
    });

    catList.querySelectorAll('.edit-cat').forEach(btn => {
        btn.addEventListener('click', () => editCategory(btn.dataset.id, btn.dataset.nom));
    });

    subList.querySelectorAll('.delete-sub').forEach(btn => {
        btn.addEventListener('click', async () => {
            if (!confirm("Supprimer cette sous-catégorie ?")) return;
            const res = await fetch(`/api/subcategories/${btn.dataset.id}`, { method: 'DELETE' });
            const data = await res.json();
            if (!data.status) return alert(data.message);
            await loadCategoriesAndSubcategories();
        });
    });

    subList.querySelectorAll('.edit-sub').forEach(btn => {
        btn.addEventListener('click', () =>
            editSubcategory(btn.dataset.id, btn.dataset.nom, btn.dataset.cat)
        );
    });
}

async function editCategory(id, oldName) {
    const nom = prompt("Nouveau nom de la catégorie :", oldName);
    if (!nom || nom === oldName) return;
    await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom })
    });
    await loadCategoriesAndSubcategories();
}

async function editSubcategory(id, oldName, catId) {
    const nom = prompt("Nouveau nom de la sous-catégorie :", oldName);
    if (!nom || nom === oldName) return;
    await fetch(`/api/subcategories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom, id_cat: catId })
    });
    await loadCategoriesAndSubcategories();
}

async function setupCategoryManagement() {
    const categorySelect = document.getElementById('categorySelectForSub');
    const categoryInput = document.getElementById('newCategoryName');
    const subcategoryInput = document.getElementById('newSubcategoryName');

    document.getElementById('addCategoryBtn').addEventListener('click', async () => {
        const nom = categoryInput.value.trim();
        if (!nom) return alert("Nom requis.");
        const res = await fetch('/api/categories/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nom })
        });
        const data = await res.json();
        if (data.status) {
            categoryInput.value = '';
            await refreshCategorySelect();
            await loadCategoriesAndSubcategories();
        } else {
            alert("Erreur : " + data.message);
        }
    });

    document.getElementById('addSubcategoryBtn').addEventListener('click', async () => {
        const nom = subcategoryInput.value.trim();
        const id_cat = categorySelect.value;
        if (!nom || !id_cat) return alert("Champs manquants.");
        const res = await fetch('/api/subcategories/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nom, id_cat })
        });
        const data = await res.json();
        if (data.status) {
            subcategoryInput.value = '';
            await loadCategoriesAndSubcategories();
        } else {
            alert("Erreur : " + data.message);
        }
    });

    await refreshCategorySelect();
}

async function refreshCategorySelect() {
    const select = document.getElementById('categorySelectForSub');
    select.innerHTML = '<option value="">-- Choisir une catégorie --</option>';
    const res = await fetch('/api/categories');
    const data = await res.json();
    data.data.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat._id;
        opt.textContent = cat.nom;
        select.appendChild(opt);
    });
}
