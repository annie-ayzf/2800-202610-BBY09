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

  /*
  =========================================
  Toggle filter dropdown
  =========================================
  */

  filterBtn.addEventListener("click", () => {
    filterPanel.classList.toggle("d-none");
  });

  /*
  =========================================
  Main filter logic
  =========================================
  */

  function applyFilters() {

    const query = searchInput.value.trim().toLowerCase();

    getCards().forEach(card => {

      const name = card.dataset.name;
      const description = card.dataset.description;

      const isEdible = card.dataset.edible === "true";
      const isFavourite = card.dataset.favourite === "true";

      /*
      SEARCH
      */

      const matchesSearch =
        !query ||
        name.includes(query) ||
        description.includes(query);

      /*
      EDIBLE
      */

      let matchesEdible = true;

      if (edibleFilter === "edible") {
        matchesEdible = isEdible;
      }

      if (edibleFilter === "non-edible") {
        matchesEdible = !isEdible;
      }

      /*
      FAVOURITES
      */

      const matchesFavourite =
        !favouritesOnly || isFavourite;

      /*
      FINAL DISPLAY
      */

      if (
        matchesSearch &&
        matchesEdible &&
        matchesFavourite
      ) {
        card.style.display = "";
      } else {
        card.style.display = "none";
      }

    });
  }

  /*
  =========================================
  Favourite button visibility
  =========================================
  */

  function updateFavouriteFilterVisibility() {

    const hasFavourite = [...getCards()].some(card =>
      card.dataset.favourite === "true"
    );

    if (hasFavourite) {
      favouritesBtn.classList.remove("d-none");
    } else {

      favouritesBtn.classList.add("d-none");

      favouritesOnly = false;

      favouritesBtn.classList.remove("active");
    }
  }

  updateFavouriteFilterVisibility();

  /*
  =========================================
  Search
  =========================================
  */

  searchInput.addEventListener("input", applyFilters);

  /*
  =========================================
  Edible filter
  =========================================
  */

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

  /*
  =========================================
  Non edible filter
  =========================================
  */

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

  /*
  =========================================
  Favourites filter
  =========================================
  */

  favouritesBtn.addEventListener("click", () => {

    favouritesOnly = !favouritesOnly;

    favouritesBtn.classList.toggle(
      "active",
      favouritesOnly
    );

    applyFilters();
  });

  /*
  =========================================
  Clear filters
  =========================================
  */

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

  /*
  =========================================
  Bookmark save
  =========================================
  */

  document.querySelectorAll(".save-btn").forEach(btn => {

    btn.addEventListener("click", async () => {

      const plantId = btn.dataset.id;

      const current =
        btn.dataset.favourite === "true";

      try {

        const response = await fetch(
          "/info/favourite",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              id: plantId,
              favourite: !current
            })
          }
        );

        if (!response.ok) {
          throw new Error("Failed request");
        }

        /*
        Update UI
        */

        btn.dataset.favourite = String(!current);

        btn.classList.toggle("saved", !current);

        const card =
          btn.closest(".plant-card");

        card.dataset.favourite =
          String(!current);

        updateFavouriteFilterVisibility();

        applyFilters();

      } catch (err) {

        console.error(
          "Favourite update failed",
          err
        );
      }

    });

  });

});