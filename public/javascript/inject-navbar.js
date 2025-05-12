document.addEventListener("DOMContentLoaded", async () => {
    const navbarContainer = document.getElementById("navbarContainer");
    if (!navbarContainer) return;

    try {
        const res = await fetch("/content/navbar.html");
        const html = await res.text();
        navbarContainer.innerHTML = html;

        // Activer le lien courant
        const currentPath = window.location.pathname;
        if (currentPath.includes("index")) document.getElementById("link-tableau")?.classList.add("active");
        else if (currentPath.includes("map")) document.getElementById("link-carte")?.classList.add("active");
        else if (currentPath.includes("categories")) document.getElementById("link-categories")?.classList.add("active");

        // Logout
        document.getElementById("logoutBtn")?.addEventListener("click", () => {
            if (confirm("Es-tu sûr de vouloir te déconnecter ?")) {
                sessionStorage.clear();
                window.location.href = "/login.html";
            }
        });

        // ✅ Appelle initCategories si elle existe
        setTimeout(() => {
            if (typeof initCategories === "function") {
                initCategories();
            }
        }, 10); // petit délai pour laisser le DOM se stabiliser

    } catch (error) {
        console.error("Erreur chargement navbar :", error);
    }
});
