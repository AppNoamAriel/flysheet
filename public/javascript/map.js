let leafletMap;
let allCampagnes = [];
let subcategoriesByCategoryId = {};
let departementCoords = {};
let colorMap = {};
let colorIndex = 0;
let subcategoryLabels = {};

// DOM loaded

document.addEventListener('DOMContentLoaded', async () => {
    await initLeafletMap();
    await initCategories();
});

async function initCategories() {
    const [resCat, resSub] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/subcategories')
    ]);
    const categories = (await resCat.json()).data;
    const subcategories = (await resSub.json()).data;

    const catSelect = document.getElementById('categorie');
    const subSelect = document.getElementById('souscategorie');

    // Préparation mappings
    subcategoriesByCategoryId = {};
    subcategoryLabels = {};
    subcategories.forEach(sub => {
        const catId = sub.id_cat?._id;
        if (!catId) return;
        if (!subcategoriesByCategoryId[catId]) subcategoriesByCategoryId[catId] = [];
        subcategoriesByCategoryId[catId].push({ id: sub._id, nom: sub.nom });
        subcategoryLabels[sub._id] = sub.nom;
    });

    // Injecter options
    catSelect.innerHTML = categories.map(cat =>
        `<option value="${cat._id}">${cat.nom}</option>`).join('');

    subSelect.innerHTML = '';

    slimCategorie = new SlimSelect({
        select: '#categorie',
        placeholder: 'Choisir catégorie(s)',
        onChange: () => handleCategorieChange()
    });

    slimSousCategorie = new SlimSelect({
        select: '#souscategorie',
        placeholder: 'Choisir sous-catégorie(s)',
        onChange: () => handleSubcategorieChange()
    });
}

function handleCategorieChange() {
    const selectedCatIds = slimCategorie.selected();

    const subs = selectedCatIds.flatMap(id => subcategoriesByCategoryId[id] || []);

    slimSousCategorie.setData(subs.map(sub => ({ text: sub.nom, value: sub.id })));

    displayCampagnesOnMap(selectedCatIds, []); // vide = reset sous-filtres
}

function handleSubcategorieChange() {
    const selectedCatIds = slimCategorie.selected();
    const selectedSubIds = slimSousCategorie.selected();

    displayCampagnesOnMap(selectedCatIds, selectedSubIds);
}

async function initLeafletMap() {
    const boundsMetropole = L.latLngBounds([
        [41.2, -5.5], [51.5, 9.5]
    ]);

    leafletMap = L.map('map', {
        zoomControl: true,
        dragging: true,
        scrollWheelZoom: true,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
        minZoom: 6,
        maxZoom: 8,
        maxBounds: boundsMetropole,
        maxBoundsViscosity: 1.0
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap & Carto',
        subdomains: 'abcd'
    }).addTo(leafletMap);

    const resCoords = await fetch('/data/departementsCoords.json');
    departementCoords = await resCoords.json();

    leafletMap.fitBounds([
        [41.2, -5.0],
        [51.1, 9.3]
    ], {
        padding: [0, 0],
        maxZoom: 6
    });

    const resData = await fetch('/api/campagnes');
    const data = await resData.json();
    if (data.status && Array.isArray(data.data)) {
        allCampagnes = data.data;
    }

    displayCampagnesOnMap(); // Afficher tous les departements en vert par defaut
}

async function displayCampagnesOnMap(categoryIds = [], subcategoryIds = []) {
    leafletMap.eachLayer(layer => {
        if (layer instanceof L.Marker || layer instanceof L.Popup) leafletMap.removeLayer(layer);
    });

    colorMap = {};
    colorIndex = 0;
    const deptMap = {};
    const colors = ['#e74c3c', '#3498db', '#2ecc71', '#9b59b6', '#f39c12', '#1abc9c', '#e67e22'];

    const filtered = (subcategoryIds.length === 0 && categoryIds.length === 0)
        ? [] // Aucun filtre → aucune campagne → tous les départements = verts
        : allCampagnes.filter(c => {
            const subId = c.typeProduit?._id || c.typeProduit;

            if (subcategoryIds.length > 0) {
                return subcategoryIds.includes(subId);
            }

            if (categoryIds.length > 0) {
                return categoryIds.some(catId => (subcategoriesByCategoryId[catId] || []).some(sub => sub.id === subId));
            }

            return false;
        });

    filtered.forEach(c => {
        const subId = c.typeProduit?._id || c.typeProduit;
        const subLabel = subcategoryLabels[subId] || '—';

        if (!colorMap[c.nom]) {
            colorMap[c.nom] = colors[colorIndex % colors.length];
            colorIndex++;
        }

        c.departements.forEach(dep => {
            const code = dep.padStart(2, '0');
            if (!deptMap[code]) deptMap[code] = [];
            deptMap[code].push({
                nom: c.nom,
                id: c._id,
                color: colorMap[c.nom],
                souscategorie: subLabel
            });
        });
    });

    for (const [depCode, [lng, lat]] of Object.entries(departementCoords)) {
        const campagnes = deptMap[depCode] || [];

        const isTaken = campagnes.length > 0;

        const label = L.marker([lat, lng], {
            icon: L.divIcon({
                className: 'dept-number-label',
                html: `
                <div class="dep-badge ${isTaken ? 'taken' : 'free'}" data-dep="${depCode}">
                    ${depCode}
                </div>`,
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            }),
            interactive: true
        }).addTo(leafletMap);

        label.on('click', () => {
            const popupContent = `
            <b>Département ${depCode}</b><br/>
            ${
                campagnes.length > 0
                    ? campagnes.map(c => `
                    <div style="display: flex; align-items: center;">
                        <span style="color:${c.color}; font-weight: bold;">• ${c.nom}</span>
                        <span style="margin-left: 4px; font-style: italic;">(${c.souscategorie})</span>
                    </div>
                `).join('')
                    : "<i>Aucune campagne active</i>"
            }`;
            L.popup({ offset: [0, -12] })
                .setLatLng([lat, lng])
                .setContent(popupContent)
                .openOn(leafletMap);
        });
    }
    updateRecap(filtered);

}

function updateRecap(filteredCampaigns) {
    const categorySet = new Set();
    const subcategorySet = new Set();

    filteredCampaigns.forEach(c => {
        const subId = c.typeProduit?._id || c.typeProduit;
        subcategorySet.add(subId);

        const catId = c.typeProduit?.id_cat?._id || c.typeProduit?.id_cat;
        if (catId) categorySet.add(catId);
    });

    document.getElementById('countCategories').textContent = categorySet.size;
    document.getElementById('countSubcategories').textContent = subcategorySet.size;
}

