// filter.js — all filter logic for the info page

document.addEventListener("DOMContentLoaded", () => {
  const filterBtn = document.querySelector(".filter-button");
  const filterPanel = document.getElementById("filter-panel");
  const searchInput = document.querySelector(".search-input");
  const cards = () => document.querySelectorAll(".plant-card");

  // ── Toggle filter panel ──────────────────────────────────────
  filterBtn.addEventListener("click", () => {
    filterPanel.classList.toggle("d-none");
  });

  // ── Save / Favourite icon click ──────────────────────────────
  document.querySelectorAll(".save-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const plantId = btn.dataset.id;
      const isFav = btn.dataset.favourite === "true";

      try {
        const res = await fetch("/info/favourite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: plantId, favourite: !isFav }),
        });

        if (res.ok) {
          // Flip state locally without a page reload
          btn.dataset.favourite = String(!isFav);
          btn.classList.toggle("saved", !isFav);
          btn.title = !isFav ? "Remove from favourites" : "Save to favourites";

          // Show/hide the Favourites filter option
          syncFavouriteFilterOption();
        }
      } catch (err) {
        console.error("Failed to update favourite:", err);
      }
    });
  });

  // ── Show "Favourites" filter chip only when ≥1 plant is saved ─
  function syncFavouriteFilterOption() {
    const hasFav = [...document.querySelectorAll(".save-btn")].some(
      (b) => b.dataset.favourite === "true"
    );
    const favOption = document.getElementById("filter-favourites-wrap");
    if (favOption) favOption.classList.toggle("d-none", !hasFav);
  }

  // Run on load in case the page already has favourites
  syncFavouriteFilterOption();

  // ── Apply filters ────────────────────────────────────────────
  function applyFilters() {
    const edibleChecked = document.getElementById("filter-edible")?.checked;
    const favChecked = document.getElementById("filter-favourites")?.checked;
    const query = searchInput.value.trim().toLowerCase();

    cards().forEach((card) => {
      const isEdible = card.dataset.edible === "true";
      const isFav = card.dataset.favourite === "true";
      const name = card.dataset.name.toLowerCase();
      const description = card.dataset.description.toLowerCase();

      const passesEdible = !edibleChecked || isEdible;
      const passesFav = !favChecked || isFav;
      const passesSearch =
        !query || name.includes(query) || description.includes(query);

      card.style.display =
        passesEdible && passesFav && passesSearch ? "" : "none";
    });
  }

  // Wire up filter checkboxes
  document
    .getElementById("filter-edible")
    ?.addEventListener("change", applyFilters);
  document
    .getElementById("filter-favourites")
    ?.addEventListener("change", applyFilters);

  // Wire up search input
  searchInput.addEventListener("input", applyFilters);

  // Clear filters button
  document.getElementById("clear-filters")?.addEventListener("click", () => {
    document.getElementById("filter-edible").checked = false;
    const favCb = document.getElementById("filter-favourites");
    if (favCb) favCb.checked = false;
    searchInput.value = "";
    applyFilters();
    filterPanel.classList.add("d-none");
  });
});