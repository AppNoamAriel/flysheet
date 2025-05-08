let leafletMap;

document.addEventListener('DOMContentLoaded', async () => {
    await initLeafletMap();
});

async function initLeafletMap() {
    const boundsMetropole = L.latLngBounds(
        [41.2, -5.5], // Sud-Ouest
        [51.5, 9.5]   // Nord-Est
    );

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
    const departementCoords = await resCoords.json();
dfddd
    // Zoom automatiquement sur les départements 01 à 95
    const codesMetropole = Object.keys(departementCoords)
        .filter(code => {
            const num = parseInt(code, 10);
            return num >= 1 && num <= 95;
        });

    const latLngs = codesMetropole.map(code => {
        const [lng, lat] = departementCoords[code];
        return [lat, lng];
    });

    const focusBounds = L.latLngBounds(latLngs);
    leafletMap.fitBounds(focusBounds);


    await displayCampagnesOnMap();
}



async function displayCampagnesOnMap() {
    try {
        const resCoords = await fetch('/data/departementsCoords.json');
        const departementCoords = await resCoords.json();

        const resData = await fetch('/api/campagnes');
        const data = await resData.json();

        if (!data.status || !Array.isArray(data.data)) return;

        const deptMap = {};
        const colors = ['#e74c3c', '#3498db', '#2ecc71', '#9b59b6', '#f39c12', '#1abc9c', '#e67e22'];
        const colorMap = {};
        let colorIndex = 0;

        data.data.forEach(c => {
            if (!colorMap[c.nom]) colorMap[c.nom] = colors[colorIndex++ % colors.length];
            c.departements.forEach(dep => {
                const code = dep.padStart(2, '0');
                if (!deptMap[code]) deptMap[code] = [];
                deptMap[code].push({ nom: c.nom, id: c._id, color: colorMap[c.nom] });
            });
        });

        for (const [depCode, [lng, lat]] of Object.entries(departementCoords)) {
            const campagnes = deptMap[depCode] || [];

            const label = L.marker([lat, lng], {
                icon: L.divIcon({
                    className: 'dept-number-label',
                    html: `<div class="dep-badge ${campagnes.length ? 'taken' : 'free'}" data-dep="${depCode}">${depCode}</div>`,
                    iconSize: [20, 20],
                    iconAnchor: [10, 10]
                }),
                interactive: true
            }).addTo(leafletMap);

            label.on('click', () => {
                const popupContent = `
          <b>Département ${depCode}</b><br/>
          ${campagnes.length > 0
                    ? campagnes.map(c => `
                <div style="display: flex; align-items: center;">
                  <span style="color:${c.color}; font-weight: bold;">• ${c.nom}</span>
                </div>
            `).join('')
                    : "<i>Aucune campagne active</i>"
                }
        `;
                L.popup({ offset: [0, -12] })
                    .setLatLng([lat, lng])
                    .setContent(popupContent)
                    .openOn(leafletMap);
            });
        }
    } catch (err) {
        console.error("Erreur chargement campagnes sur la carte :", err);
    }
}
