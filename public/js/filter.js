document.addEventListener("DOMContentLoaded", () => {

  const filterBtn = document.querySelector(".filter-button");
  const filterPanel = document.getElementById("filter-panel");
  const searchInput = document.querySelector(".search-input");
  const searchForm = document.querySelector(".search-form");
  const searchSuggestions = document.getElementById("search-suggestions");
  const edibleBtn = document.getElementById("pill-edible");
  const nonEdibleBtn = document.getElementById("pill-non-edible");
  const favouritesBtn = document.getElementById("pill-favourites");
  const clearBtn = document.getElementById("clear-filters");

  let edibleFilter = "all";
  let favouritesOnly = false;
  let selectedPlantName = "";
  let activeSuggestionIndex = -1;

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
      const scientificName = card.dataset.scientificName;

      let matchesSearch = true;

      if (selectedPlantName) {
        matchesSearch = name === selectedPlantName;
      } else if (query) {
        matchesSearch = name.includes(query) || scientificName.includes(query);
      }

      const matchesEdible =
        edibleFilter === "all" ||
        (edibleFilter === "edible" && isEdible) ||
        (edibleFilter === "non-edible" && !isEdible);
      const matchesFavourite = !favouritesOnly || isFavourite;

      card.style.display = matchesSearch && matchesEdible && matchesFavourite ? "" : "none";
    });
  }

  //Search all the plant cards, if matches exist, creates clickable sugesstion button
  //if not match shows, no plants found
  function showSuggestions() {
    const query = searchInput.value.trim().toLowerCase();

    searchSuggestions.innerHTML = "";
    activeSuggestionIndex = -1;

    if (!query) {
      searchSuggestions.classList.add("d-none");
      selectedPlantName = "";
      applyFilters();
      return;
    }

    const matchingCards = [...getCards()].filter(card => {
      const name = card.dataset.name;
      const scientificName = card.dataset.scientificName;

      return name.includes(query) || scientificName.includes(query);
    });

    if (matchingCards.length === 0) {
      searchSuggestions.innerHTML = `<div class="suggestion-item">No plants found</div>`;
      searchSuggestions.classList.remove("d-none");
      return;
    }

    matchingCards.forEach(card => {
      const displayName = card.dataset.displayName;
      const displayScientificName = card.dataset.displayScientificName;
      const isEdible = card.dataset.edible === "true";
      const edibleText = isEdible ? "Edible" : "Not Edible";

      const suggestion = document.createElement("button");
      suggestion.type = "button";
      suggestion.classList.add("suggestion-item");

      suggestion.textContent = `${displayName}, ${displayScientificName} - ${edibleText}`;

      suggestion.addEventListener("click", () => {
        searchInput.value = displayName;
        selectedPlantName = card.dataset.name;
        searchSuggestions.classList.add("d-none");
        applyFilters();
      });

      searchSuggestions.appendChild(suggestion);
    });

    searchSuggestions.classList.remove("d-none");
  }

  function getSuggestionItems() {
    return searchSuggestions.querySelectorAll(".suggestion-item");
  }

  function updateActiveSuggestion(items) {
    items.forEach((item, index) => {
      item.classList.toggle("active", index === activeSuggestionIndex);
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

  // ── Clear all filters ────────────────────────────────────────
  clearBtn.addEventListener("click", () => {
    edibleFilter = "all";
    favouritesOnly = false;
    searchInput.value = "";
    selectedPlantName = "";
    searchSuggestions.innerHTML = "";
    searchSuggestions.classList.add("d-none");
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


  // ── Search ───────────────────────────────────────────────────
  searchInput.addEventListener("input", () => {
    selectedPlantName = "";
    showSuggestions();
    applyFilters();
  });

  //arrowdown move down suggestions
  //arrowUp move up the suggestions
  //enter choose the highlighted suggestion
  //escape close the drop down
  searchInput.addEventListener("keydown", (event) => {
    const items = getSuggestionItems();

    if (searchSuggestions.classList.contains("d-none") || items.length === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();

      activeSuggestionIndex++;

      if (activeSuggestionIndex >= items.length) {
        activeSuggestionIndex = 0;
      }

      updateActiveSuggestion(items);
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();

      activeSuggestionIndex--;

      if (activeSuggestionIndex < 0) {
        activeSuggestionIndex = items.length - 1;
      }

      updateActiveSuggestion(items);
    }

    if (event.key === "Enter") {
      event.preventDefault();

      if (activeSuggestionIndex >= 0) {
        items[activeSuggestionIndex].click();
      }
    }

    if (event.key === "Escape") {
      searchSuggestions.classList.add("d-none");
    }
  });

  searchInput.addEventListener("focus", () => {
    if (searchInput.value.trim() !== "") {
      showSuggestions();
    }
  });

  //if they click outside of the suggest bar it hides the drop down
  document.addEventListener("click", (event) => {
    if (!searchForm.contains(event.target)) {
      searchSuggestions.classList.add("d-none");
    }
  });

});