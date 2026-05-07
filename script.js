// Basis-URL der PokéAPI. Von dort werden die Pokémon-Daten geladen.
const apiBaseUrl = 'https://pokeapi.co/api/v2/pokemon';

// HTML-Elemente aus der index.html holen.
const pokemonGrid = document.getElementById('pokemonGrid');
const loaderOverlay = document.getElementById('loaderOverlay');
const detailOverlay = document.getElementById('detailOverlay');
const detailContent = document.getElementById('detailContent');
const closeOverlayButton = document.getElementById('closeOverlayButton');
const previousPokemonButton = document.getElementById('previousPokemonButton');
const nextPokemonButton = document.getElementById('nextPokemonButton');
const searchForm = document.getElementById('searchForm');
const searchInput = document.getElementById('searchInput');
const messageBox = document.getElementById('messageBox');
const suggestionBox = document.getElementById('suggestionBox');
const backHomeButton = document.getElementById('backHomeButton');

// Es werden maximal 36 Pokémon angezeigt.
const maxPokemonAmount = 36;

// Speichert, welches Pokémon gerade in der Detailansicht geöffnet ist.
let currentPokemonIndex = 0;

// Speichert die Pokémon, die gerade auf der Seite angezeigt werden.
let renderedPokemon = [];

// Speichert die ersten 36 Pokémon für die Startseite.
let startPokemon = [];

// Speichert alle Pokémon-Namen für die Suche.
let allPokemonNames = [];

// Cache, damit geladene Pokémon nicht mehrfach geladen werden müssen.
let pokemonCache = {};

// Farben für die verschiedenen Pokémon-Typen.
const typeColors = {
  normal: '#a8a77a',
  fire: '#ee8130',
  water: '#6390f0',
  electric: '#f7d02c',
  grass: '#7ac74c',
  ice: '#96d9d6',
  fighting: '#c22e28',
  poison: '#a33ea1',
  ground: '#e2bf65',
  flying: '#a98ff3',
  psychic: '#f95587',
  bug: '#a6b91a',
  rock: '#b6a136',
  ghost: '#735797',
  dragon: '#6f35fc',
  dark: '#705746',
  steel: '#b7b7ce',
  fairy: '#d685ad'
};

// Startet die App.
initApp();

// Lädt die Startdaten und registriert alle Events.
async function initApp() {
  registerEvents();
  await loadStartPokemon();
  await loadAllPokemonNames();
}

// Hier werden alle Klicks und Eingaben verbunden.
function registerEvents() {
  searchForm.addEventListener('submit', searchPokemon);
  searchInput.addEventListener('input', showSuggestions);
  backHomeButton.addEventListener('click', showStartPage);
  closeOverlayButton.addEventListener('click', closeOverlay);
  detailOverlay.addEventListener('click', closeByOutsideClick);
  previousPokemonButton.addEventListener('click', showPreviousPokemon);
  nextPokemonButton.addEventListener('click', showNextPokemon);
  window.addEventListener('keydown', handleKeys);
}

// Lädt die ersten 36 Pokémon für die Startseite.
async function loadStartPokemon() {
  showLoader(true);
  const pokemonUrls = await getPokemonUrls();
  const pokemonList = await Promise.all(pokemonUrls.map(loadPokemon));
  startPokemon = pokemonList;
  renderPokemon(startPokemon);
  showLoader(false);
}

// Holt die URLs der ersten 36 Pokémon aus der API.
async function getPokemonUrls() {
  const response = await fetch(`${apiBaseUrl}?limit=${maxPokemonAmount}&offset=0`);
  const data = await response.json();
  return data.results.map(pokemon => pokemon.url);
}

// Lädt ein einzelnes Pokémon und speichert es im Cache.
async function loadPokemon(urlOrName) {
  const key = getPokemonKey(urlOrName);
  if (pokemonCache[key]) return pokemonCache[key];

  const response = await fetch(`${apiBaseUrl}/${key}`);
  const pokemon = await response.json();
  pokemonCache[key] = pokemon;

  return pokemon;
}

// Erstellt aus URL oder Name den richtigen API-Schlüssel.
function getPokemonKey(urlOrName) {
  if (!urlOrName.includes('http')) {
    return urlOrName.toLowerCase();
  }

  return urlOrName.split('/').filter(Boolean).pop();
}

// Rendert alle Pokémon-Karten in den Grid-Container.
function renderPokemon(pokemonList) {
  pokemonGrid.innerHTML = '';
  renderedPokemon = pokemonList;
  pokemonGrid.innerHTML = pokemonList.map(getPokemonCard).join('');
  addCardClicks();
}

// Erstellt das HTML für eine kleine Pokémon-Karte.
function getPokemonCard(pokemon) {
  const mainType = pokemon.types[0].type.name;

  return `
    <button class="pokemon-card" style="background:${typeColors[mainType]}" data-id="${pokemon.id}">
      <div class="card-content">
        <span class="card-id">#${formatId(pokemon.id)}</span>
        <div class="card-text">
          <h2 class="card-title">${formatName(pokemon.name)}</h2>
          ${getTypeHtml(pokemon.types)}
        </div>
        <img src="${getPokemonImage(pokemon)}" alt="${pokemon.name}">
      </div>
    </button>
  `;
}

// Erstellt den Bereich mit den Pokémon-Typen.
function getTypeHtml(types) {
  return `
    <div class="type-list">
      ${types.map(type => getTypePill(type.type.name)).join('')}
    </div>
  `;
}

// Erstellt einen einzelnen Typ-Badge.
function getTypePill(typeName) {
  return `<span class="type-pill">${translateType(typeName)}</span>`;
}

// Fügt jeder Pokémon-Karte einen Klick hinzu.
function addCardClicks() {
  document.querySelectorAll('.pokemon-card').forEach(card => {
    card.onclick = () => openOverlay(Number(card.dataset.id));
  });
}

// Öffnet die große Detailansicht zu einem Pokémon.
function openOverlay(pokemonId) {
  currentPokemonIndex = renderedPokemon.findIndex(pokemon => pokemon.id === pokemonId);
  showDetailPokemon(renderedPokemon[currentPokemonIndex]);
  detailOverlay.classList.remove('hidden');
  document.body.classList.add('overlay-open');
  detailOverlay.setAttribute('aria-hidden', 'false');
}

// Zeigt das aktuelle Pokémon in der Detailansicht an.
function showDetailPokemon(pokemon) {
  const mainType = pokemon.types[0].type.name;
  detailContent.innerHTML = getDetailCard(pokemon, mainType);
}

// Erstellt das HTML für die große Detailkarte.
function getDetailCard(pokemon, mainType) {
  return `
    <div class="detail-top" style="background:${typeColors[mainType]}">
      ${getDetailHeader(pokemon)}
      ${getTypeHtml(pokemon.types)}
      <img src="${getPokemonImage(pokemon)}" alt="${pokemon.name}">
    </div>
    <div class="detail-body">
      ${getInfoBox(pokemon)}
      ${getStats(pokemon.stats)}
    </div>
  `;
}

// Erstellt den Kopfbereich der Detailkarte.
function getDetailHeader(pokemon) {
  return `
    <div class="detail-header">
      <h2 id="detailName">${formatName(pokemon.name)}</h2>
      <strong>#${formatId(pokemon.id)}</strong>
    </div>
  `;
}

// Erstellt die Infobox mit Größe, Gewicht, Fähigkeiten und XP.
function getInfoBox(pokemon) {
  return `
    <div class="info-grid">
      <div class="info-box"><span>Größe</span>${pokemon.height / 10} m</div>
      <div class="info-box"><span>Gewicht</span>${pokemon.weight / 10} kg</div>
      <div class="info-box"><span>Fähigkeiten</span>${getAbilities(pokemon)}</div>
      <div class="info-box"><span>Basis XP</span>${pokemon.base_experience ?? 'unbekannt'}</div>
    </div>
  `;
}

// Erstellt alle Statuswerte.
function getStats(stats) {
  return stats.map(stat => getStatRow(stat)).join('');
}

// Erstellt eine einzelne Statuswert-Zeile.
function getStatRow(stat) {
  const percent = Math.min(stat.base_stat, 150) / 150 * 100;

  return `
    <div class="stat-row">
      <strong>${translateStat(stat.stat.name)}</strong>
      <span>${stat.base_stat}</span>
      <div class="stat-bar">
        <div class="stat-fill" style="width:${percent}%"></div>
      </div>
    </div>
  `;
}

// Zeigt in der Detailansicht das vorherige Pokémon.
function showPreviousPokemon() {
  currentPokemonIndex--;
  if (currentPokemonIndex < 0) currentPokemonIndex = renderedPokemon.length - 1;
  showDetailPokemon(renderedPokemon[currentPokemonIndex]);
}

// Zeigt in der Detailansicht das nächste Pokémon.
function showNextPokemon() {
  currentPokemonIndex++;
  if (currentPokemonIndex >= renderedPokemon.length) currentPokemonIndex = 0;
  showDetailPokemon(renderedPokemon[currentPokemonIndex]);
}

// Schließt die Detailansicht.
function closeOverlay() {
  detailOverlay.classList.add('hidden');
  document.body.classList.remove('overlay-open');
  detailOverlay.setAttribute('aria-hidden', 'true');
}

// Schließt die Detailansicht, wenn man neben die Karte klickt.
function closeByOutsideClick(event) {
  if (event.target === detailOverlay) {
    closeOverlay();
  }
}

// Ermöglicht Tastatursteuerung in der Detailansicht.
function handleKeys(event) {
  if (detailOverlay.classList.contains('hidden')) return;
  if (event.key === 'Escape') closeOverlay();
  if (event.key === 'ArrowLeft') showPreviousPokemon();
  if (event.key === 'ArrowRight') showNextPokemon();
}

// Lädt alle Pokémon-Namen für die Suche.
async function loadAllPokemonNames() {
  const response = await fetch(`${apiBaseUrl}?limit=1302`);
  const data = await response.json();
  allPokemonNames = data.results.map(pokemon => pokemon.name);
}

// Wird ausgeführt, wenn das Suchformular abgeschickt wird.
async function searchPokemon(event) {
  event.preventDefault();
  const searchValue = searchInput.value.trim().toLowerCase();

  if (searchValue.length < 3) {
    showMessage('Bitte gib mindestens 3 Buchstaben ein.');
    return;
  }

  await showSearchResult(searchValue);
}

// Zeigt Suchvorschläge ab 3 Buchstaben.
function showSuggestions() {
  const searchValue = searchInput.value.trim().toLowerCase();

  if (searchValue.length < 3) {
    hideSuggestions();
    return;
  }

  const suggestions = getMatchingNames(searchValue, 5);
  renderSuggestions(suggestions);
}

// Sucht passende Pokémon-Namen.
function getMatchingNames(searchValue, amount) {
  return allPokemonNames
    .filter(name => name.includes(searchValue))
    .slice(0, amount);
}

// Rendert die Vorschläge unter dem Suchfeld.
function renderSuggestions(suggestions) {
  if (suggestions.length === 0) {
    suggestionBox.innerHTML = '<div class="suggestion-button">Keine Treffer gefunden</div>';
    suggestionBox.classList.remove('hidden');
    return;
  }

  suggestionBox.innerHTML = suggestions.map(getSuggestionButton).join('');
  suggestionBox.classList.remove('hidden');
}

// Erstellt einen einzelnen Vorschlag-Button.
function getSuggestionButton(name) {
  return `
    <button class="suggestion-button" type="button" onclick="chooseSuggestion('${name}')">
      ${formatName(name)}
    </button>
  `;
}

// Wird ausgeführt, wenn ein Vorschlag angeklickt wird.
async function chooseSuggestion(name) {
  searchInput.value = formatName(name);
  hideSuggestions();
  await showSearchResult(name);
}

// Zeigt die Suchergebnisse an.
async function showSearchResult(searchValue) {
  showLoader(true);

  const names = getMatchingNames(searchValue.toLowerCase(), maxPokemonAmount);
  if (names.length === 0) return showNoResult();

  const pokemonList = await Promise.all(names.map(loadPokemon));
  renderPokemon(pokemonList);
  backHomeButton.classList.remove('hidden');

  showLoader(false);
}

// Meldung, falls kein Pokémon gefunden wurde.
function showNoResult() {
  showLoader(false);
  showMessage('Keine passenden Pokémon gefunden.');
}

// Stellt die Startseite mit den ersten 30 Pokémon wieder her.
function showStartPage() {
  searchInput.value = '';
  messageBox.textContent = '';
  hideSuggestions();
  backHomeButton.classList.add('hidden');
  renderPokemon(startPokemon);
}

// Versteckt die Suchvorschläge.
function hideSuggestions() {
  suggestionBox.innerHTML = '';
  suggestionBox.classList.add('hidden');
}

// Zeigt eine kurze Meldung an.
function showMessage(text) {
  messageBox.textContent = text;

  setTimeout(() => {
    messageBox.textContent = '';
  }, 3000);
}

// Blendet den Ladebildschirm ein oder aus.
function showLoader(isLoading) {
  loaderOverlay.classList.toggle('hidden', !isLoading);
}

// Holt das offizielle Pokémon-Bild.
function getPokemonImage(pokemon) {
  return pokemon.sprites.other['official-artwork'].front_default || pokemon.sprites.front_default;
}

// Holt und formatiert die Fähigkeiten eines Pokémon.
function getAbilities(pokemon) {
  return pokemon.abilities
    .map(ability => formatName(ability.ability.name))
    .join(', ');
}

// Formatiert die ID auf drei Stellen, z. B. 001.
function formatId(id) {
  return String(id).padStart(3, '0');
}

// Formatiert Pokémon-Namen schöner.
function formatName(name) {
  return name
    .split('-')
    .map(word => capitalizeWord(word))
    .join(' ');
}

// Macht den ersten Buchstaben groß.
function capitalizeWord(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

// Übersetzt die Statuswerte auf Deutsch.
function translateStat(statName) {
  const statNames = {
    hp: 'KP',
    attack: 'Angriff',
    defense: 'Verteidigung',
    'special-attack': 'Spezial-Angriff',
    'special-defense': 'Spezial-Verteidigung',
    speed: 'Initiative'
  };

  return statNames[statName] || statName;
}

// Übersetzt die Pokémon-Typen auf Deutsch.
function translateType(typeName) {
  const typeNames = {
    normal: 'Normal',
    fire: 'Feuer',
    water: 'Wasser',
    electric: 'Elektro',
    grass: 'Pflanze',
    ice: 'Eis',
    fighting: 'Kampf',
    poison: 'Gift',
    ground: 'Boden',
    flying: 'Flug',
    psychic: 'Psycho',
    bug: 'Käfer',
    rock: 'Gestein',
    ghost: 'Geist',
    dragon: 'Drache',
    dark: 'Unlicht',
    steel: 'Stahl',
    fairy: 'Fee'
  };

  return typeNames[typeName] || typeName;
}