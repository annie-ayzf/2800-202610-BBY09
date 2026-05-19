document.addEventListener("DOMContentLoaded", () => {

  /* Element references */
  const filterBtn = document.querySelector(".filter-button");
  const filterPanel = document.getElementById("filter-panel");
  const searchInput = document.querySelector(".search-input");
  const edibleBtn = document.getElementById("pill-edible");
  const nonEdibleBtn = document.getElementById("pill-non-edible");
  const favouritesBtn = document.getElementById("pill-favourites");
  const clearBtn = document.getElementById("clear-filters");

  /* Filter state */
  let edibleFilter = "all";   // "all" | "edible" | "non-edible"
  let favouritesOnly = false;

  /* Helpers */

  /** Returns all plant cards currently in the DOM. */
  const getCards = () => document.querySelectorAll(".plant-card");

  /**
   * Toggles a pill button between active and a given value,
   * reverting to "all" when the same pill is clicked again (deselect).
   */
  function toggleEdiblePill(clicked, self, other) {
    if (edibleFilter === clicked) {
      edibleFilter = "all";
      self.classList.remove("active");
    } else {
      edibleFilter = clicked;
      self.classList.add("active");
      other.classList.remove("active");
    }
  }

  /* Core filter logic */

  /**
   * Reads current state (search query, edible filter, favourites toggle)
   * and shows/hides each card accordingly.
   *
   * Each card carries data-* attributes set server-side in info.ejs:
   *   data-edible, data-favourite, data-name, data-description
   */
  function applyFilters() {
    const query = searchInput.value.trim().toLowerCase();

    getCards().forEach(card => {
      const isEdible = card.dataset.edible === "true";
      const isFavourite = card.dataset.favourite === "true";
      const name = card.dataset.name;
      const description = card.dataset.description;

      const matchesSearch = !query || name.includes(query) || description.includes(query);
      const matchesEdible  =
        edibleFilter === "all"        ||
        (edibleFilter === "edible"     &&  isEdible) ||
        (edibleFilter === "non-edible" && !isEdible);
      const matchesFavourite = !favouritesOnly || isFavourite;

      card.style.display = (matchesSearch && matchesEdible && matchesFavourite) ? "" : "none";
    });
  }

  /**
   * Shows the Favourites pill only when at least one card is bookmarked.
   * If none are bookmarked the pill hides and the favourites filter resets.
   */
  function updateFavouritePillVisibility() {
    const hasFavourite = [...getCards()].some(c => c.dataset.favourite === "true");

    if (hasFavourite) {
      favouritesBtn.classList.remove("d-none");
    } else {
      favouritesBtn.classList.add("d-none");
      favouritesOnly = false;
      favouritesBtn.classList.remove("active");
    }
  }

  /*  Event listeners  */

  /** Toggle the filter panel open/closed */
  filterBtn.addEventListener("click", () => {
    const isHidden = filterPanel.classList.toggle("d-none");
    filterBtn.setAttribute("aria-expanded", String(!isHidden));
  });

  edibleBtn.addEventListener("click", () => {
    toggleEdiblePill("edible", edibleBtn, nonEdibleBtn);
    applyFilters();
  });

  nonEdibleBtn.addEventListener("click", () => {
    toggleEdiblePill("non-edible", nonEdibleBtn, edibleBtn);
    applyFilters();
  });

  /** Favourites is a simple boolean toggle */
  favouritesBtn.addEventListener("click", () => {
    favouritesOnly = !favouritesOnly;
    favouritesBtn.classList.toggle("active", favouritesOnly);
    applyFilters();
  });

  searchInput.addEventListener("input", applyFilters);

  /** Resets all filter state and closes the panel */
  clearBtn.addEventListener("click", () => {
    edibleFilter   = "all";
    favouritesOnly = false;
    searchInput.value = "";

    [edibleBtn, nonEdibleBtn, favouritesBtn].forEach(b => b.classList.remove("active"));

    applyFilters();
    filterPanel.classList.add("d-none");
    filterBtn.setAttribute("aria-expanded", "false");
  });

  /*  Bookmark / favourite persistence  */

  /**
   * Each bookmark button POSTs to /info/favourite to persist the change,
   * then updates the button, its parent card's data attribute,
   * and re-evaluates filter visibility + current filter results.
   */
  document.querySelectorAll(".save-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const plantId   = btn.dataset.id;
      const newState  = btn.dataset.favourite !== "true"; // flip current value

      try {
        const response = await fetch("/info/favourite", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ id: plantId, favourite: newState })
        });

        if (!response.ok) throw new Error("Server returned non-OK status");

        // Sync the button and its parent card with the new state
        btn.dataset.favourite = String(newState);
        btn.classList.toggle("saved", newState);

        const card = btn.closest(".plant-card");
        card.dataset.favourite = String(newState);

        updateFavouritePillVisibility();
        applyFilters();

      } catch (err) {
        console.error("Favourite update failed:", err);
      }
    });
  });

  /* Init*/
  updateFavouritePillVisibility();

});