document.addEventListener("DOMContentLoaded", () => {

  const filterBtn = document.querySelector(".filter-button");
  const filterPanel = document.getElementById("filter-panel");
  const searchInput = document.querySelector(".search-input");
  const edibleBtn = document.getElementById("pill-edible");
  const nonEdibleBtn = document.getElementById("pill-non-edible");
  const favouritesBtn = document.getElementById("pill-favourites");
  const clearBtn = document.getElementById("clear-filters");

  let edibleFilter = "all";
  let favouritesOnly = false;

  function getCards() {
    return document.querySelectorAll(".plant-card");
  }

  // ── Toggle filter panel ──────────────────────────────────────
  filterBtn.addEventListener("click", () => {
    filterPanel.classList.toggle("d-none");
  });

  // ── Apply all filters ────────────────────────────────────────
  function applyFilters() {
    const query = searchInput.value.trim().toLowerCase();

    getCards().forEach(card => {
      const isEdible = card.dataset.edible === "true";
      const isFavourite = card.dataset.favourite === "true";
      const name = card.dataset.name;
      const description = card.dataset.description;

      const matchesSearch = !query || name.includes(query) || description.includes(query);
      const matchesEdible =
        edibleFilter === "all" ||
        (edibleFilter === "edible" && isEdible) ||
        (edibleFilter === "non-edible" && !isEdible);
      const matchesFavourite = !favouritesOnly || isFavourite;

      card.style.display = matchesSearch && matchesEdible && matchesFavourite ? "" : "none";
    });
  }

  // ── Edible — toggles off if already active ───────────────────
  edibleBtn.addEventListener("click", () => {
    if (edibleFilter === "edible") {
      edibleFilter = "all";
      edibleBtn.classList.remove("active");
    } else {
      edibleFilter = "edible";
      edibleBtn.classList.add("active");
      nonEdibleBtn.classList.remove("active");
    }
    applyFilters();
  });

  // ── Non edible — toggles off if already active ───────────────
  nonEdibleBtn.addEventListener("click", () => {
    if (edibleFilter === "non-edible") {
      edibleFilter = "all";
      nonEdibleBtn.classList.remove("active");
    } else {
      edibleFilter = "non-edible";
      nonEdibleBtn.classList.add("active");
      edibleBtn.classList.remove("active");
    }
    applyFilters();
  });

  // ── Favourites — toggles off if already active ───────────────
  favouritesBtn.addEventListener("click", () => {
    favouritesOnly = !favouritesOnly;
    favouritesBtn.classList.toggle("active", favouritesOnly);
    applyFilters();
  });

  // ── Show Favourites button only when ≥1 bookmarked ───────────
  function updateFavouriteFilterVisibility() {
    const hasFavourite = [...getCards()].some(c => c.dataset.favourite === "true");
    if (hasFavourite) {
      favouritesBtn.classList.remove("d-none");
    } else {
      favouritesBtn.classList.add("d-none");
      favouritesOnly = false;
      favouritesBtn.classList.remove("active");
    }
  }

  updateFavouriteFilterVisibility();

  // ── Search ───────────────────────────────────────────────────
  searchInput.addEventListener("input", applyFilters);

  // ── Clear all filters ────────────────────────────────────────
  clearBtn.addEventListener("click", () => {
    edibleFilter = "all";
    favouritesOnly = false;
    searchInput.value = "";
    edibleBtn.classList.remove("active");
    nonEdibleBtn.classList.remove("active");
    favouritesBtn.classList.remove("active");
    applyFilters();
    filterPanel.classList.add("d-none");
  });

  // ── Bookmark — persist to DB ─────────────────────────────────
  document.querySelectorAll(".save-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const plantId = btn.dataset.id;
      const current = btn.dataset.favourite === "true";

      try {
        const response = await fetch("/info/favourite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: plantId, favourite: !current })
        });

        if (!response.ok) throw new Error("Failed");

        btn.dataset.favourite = String(!current);
        btn.classList.toggle("saved", !current);

        const card = btn.closest(".plant-card");
        card.dataset.favourite = String(!current);

        updateFavouriteFilterVisibility();
        applyFilters();

      } catch (err) {
        console.error("Favourite update failed", err);
      }
    });
  });

});