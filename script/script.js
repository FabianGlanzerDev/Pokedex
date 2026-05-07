const apiBaseUrl = 'https://pokeapi.co/api/v2/pokemon';

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
const loadMoreButton = document.getElementById('loadMoreButton');

const firstLoadAmount = 36;
const nextLoadAmount = 20;
const maxPokemonAmount = 36;

let offset = 0;
let currentLoadAmount = firstLoadAmount;
let currentPokemonIndex = 0;
let renderedPokemon = [];
let startPokemon = [];
let allPokemonNames = [];
let pokemonCache = {};

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

initApp();

async function initApp() {
  registerEvents();
  await loadMorePokemon();
  await loadAllPokemonNames();
}

function registerEvents() {
  searchForm.addEventListener('submit', searchPokemon);
  searchInput.addEventListener('input', showSuggestions);
  backHomeButton.addEventListener('click', showStartPage);
  loadMoreButton.addEventListener('click', loadMorePokemon);
  closeOverlayButton.addEventListener('click', closeOverlay);
  detailOverlay.addEventListener('click', closeByOutsideClick);
  previousPokemonButton.addEventListener('click', showPreviousPokemon);
  nextPokemonButton.addEventListener('click', showNextPokemon);
  window.addEventListener('keydown', handleKeys);
  document.addEventListener('click', closeSuggestionsByOutsideClick);
}
function closeSuggestionsByOutsideClick(event) {
  const clickedSearch = searchInput.contains(event.target);
  const clickedSuggestions = suggestionBox.contains(event.target);

  if (!clickedSearch && !clickedSuggestions) {
    hideSuggestions();
  }
}

async function loadMorePokemon() {
  showLoader(true);
  loadMoreButton.disabled = true;

  const pokemonUrls = await getPokemonUrls();
  const pokemonList = await Promise.all(pokemonUrls.map(loadPokemon));

  startPokemon = [...startPokemon, ...pokemonList];
  renderPokemon(startPokemon);

  updateLoadValues();
  showLoader(false);
  loadMoreButton.disabled = false;
}
async function getPokemonUrls() {
  const response = await fetch(`${apiBaseUrl}?limit=${currentLoadAmount}&offset=${offset}`);
  const data = await response.json();
  return data.results.map(pokemon => pokemon.url);
}
function updateLoadValues() {
  offset += currentLoadAmount;
  currentLoadAmount = nextLoadAmount;
}

async function loadPokemon(urlOrName) {
  const key = getPokemonKey(urlOrName);
  if (pokemonCache[key]) return pokemonCache[key];

  const response = await fetch(`${apiBaseUrl}/${key}`);
  const pokemon = await response.json();
  pokemonCache[key] = pokemon;

  return pokemon;
}

function getPokemonKey(urlOrName) {
  if (!urlOrName.includes('http')) {
    return urlOrName.toLowerCase();
  }

  return urlOrName.split('/').filter(Boolean).pop();
}

function renderPokemon(pokemonList) {
  pokemonGrid.innerHTML = '';
  renderedPokemon = pokemonList;
  pokemonGrid.innerHTML = pokemonList.map(getPokemonCard).join('');
  addCardClicks();
}


function addCardClicks() {
  document.querySelectorAll('.pokemon-card').forEach(card => {
    card.onclick = () => openOverlay(Number(card.dataset.id));
  });
}

function openOverlay(pokemonId) {
  currentPokemonIndex = renderedPokemon.findIndex(pokemon => pokemon.id === pokemonId);
  showDetailPokemon(renderedPokemon[currentPokemonIndex]);
  detailOverlay.classList.remove('hidden');
  document.body.classList.add('overlay-open');
  detailOverlay.setAttribute('aria-hidden', 'false');
}

function showDetailPokemon(pokemon) {
  const mainType = pokemon.types[0].type.name;
  detailContent.innerHTML = getDetailCard(pokemon, mainType);
}


function showPreviousPokemon() {
  currentPokemonIndex--;
  if (currentPokemonIndex < 0) currentPokemonIndex = renderedPokemon.length - 1;
  showDetailPokemon(renderedPokemon[currentPokemonIndex]);
}

function showNextPokemon() {
  currentPokemonIndex++;
  if (currentPokemonIndex >= renderedPokemon.length) currentPokemonIndex = 0;
  showDetailPokemon(renderedPokemon[currentPokemonIndex]);
}

function closeOverlay() {
  closeOverlayButton.blur();
  detailOverlay.classList.add('hidden');
  document.body.classList.remove('overlay-open');
  detailOverlay.setAttribute('aria-hidden', 'true');
}

function closeByOutsideClick(event) {
  if (event.target === detailOverlay) {
    closeOverlay();
  }
}

function handleKeys(event) {
  if (detailOverlay.classList.contains('hidden')) return;
  if (event.key === 'Escape') closeOverlay();
  if (event.key === 'ArrowLeft') showPreviousPokemon();
  if (event.key === 'ArrowRight') showNextPokemon();
}

async function loadAllPokemonNames() {
  const response = await fetch(`${apiBaseUrl}?limit=1302`);
  const data = await response.json();
  allPokemonNames = data.results.map(pokemon => pokemon.name);
}

async function searchPokemon(event) {
  event.preventDefault();
  const searchValue = searchInput.value.trim().toLowerCase();

  if (searchValue.length < 3) {
    showMessage('Bitte gib mindestens 3 Buchstaben ein.');
    return;
  }

  await showSearchResult(searchValue);
}

function showSuggestions() {
  const searchValue = searchInput.value.trim().toLowerCase();

  if (searchValue.length < 3) {
    hideSuggestions();
    return;
  }

  const suggestions = getMatchingNames(searchValue, 5);
  renderSuggestions(suggestions);
}

function getMatchingNames(searchValue, amount) {
  return allPokemonNames
    .filter(name => name.includes(searchValue))
    .slice(0, amount);
}

function renderSuggestions(suggestions) {
  if (suggestions.length === 0) {
    suggestionBox.innerHTML = '<div class="suggestion-button">Keine Treffer gefunden</div>';
    suggestionBox.classList.remove('hidden');
    return;
  }

  suggestionBox.innerHTML = suggestions.map(getSuggestionButton).join('');
  suggestionBox.classList.remove('hidden');
} 4

async function chooseSuggestion(name) {
  searchInput.value = formatName(name);
  hideSuggestions();
  searchInput.blur();
  await showSearchResult(name);
}

async function showSearchResult(searchValue) {
  showLoader(true);

  const names = getMatchingNames(searchValue.toLowerCase(), maxPokemonAmount);
  if (names.length === 0) return showNoResult();

  const pokemonList = await Promise.all(names.map(loadPokemon));
  renderPokemon(pokemonList);

  backHomeButton.classList.remove('hidden');
  loadMoreButton.classList.add('hidden');
  showLoader(false);
}

function showNoResult() {
  showLoader(false);
  showMessage('Keine passenden Pokémon gefunden.');
}

function showStartPage() {
  searchInput.value = '';
  messageBox.textContent = '';
  hideSuggestions();
  backHomeButton.classList.add('hidden');
  loadMoreButton.classList.remove('hidden');
  renderPokemon(startPokemon);
}

function hideSuggestions() {
  suggestionBox.innerHTML = '';
  suggestionBox.classList.add('hidden');
}

function showMessage(text) {
  messageBox.textContent = text;

  setTimeout(() => {
    messageBox.textContent = '';
  }, 3000);
}

function showLoader(isLoading) {
  loaderOverlay.classList.toggle('hidden', !isLoading);
}

function getPokemonImage(pokemon) {
  return pokemon.sprites.other['official-artwork'].front_default || pokemon.sprites.front_default;
}

function getAbilities(pokemon) {
  return pokemon.abilities
    .map(ability => formatName(ability.ability.name))
    .join(', ');
}

function formatId(id) {
  return String(id).padStart(3, '0');
}

function formatName(name) {
  return name
    .split('-')
    .map(word => capitalizeWord(word))
    .join(' ');
}

function capitalizeWord(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

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