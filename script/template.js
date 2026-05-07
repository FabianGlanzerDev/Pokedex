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

function getTypeHtml(types) {
    return `
    <div class="type-list">
      ${types.map(type => getTypePill(type.type.name)).join('')}
    </div>
  `;
}

function getTypePill(typeName) {
    return `
    <span class="type-pill">
      ${translateType(typeName)}
    </span>
  `;
}

function getDetailCard(pokemon, mainType) {
    return `
    <div class="detail-top" style="background:${typeColors[mainType]}">

      ${getDetailHeader(pokemon)}

      ${getTypeHtml(pokemon.types)}

      <img 
        src="${getPokemonImage(pokemon)}" 
        alt="${pokemon.name}"
      >
    </div>

    <div class="detail-body">
      ${getInfoBox(pokemon)}
      ${getStats(pokemon.stats)}
    </div>
  `;
}

function getDetailHeader(pokemon) {
    return `
    <div class="detail-header">
      <h2 id="detailName">
        ${formatName(pokemon.name)}
      </h2>

      <strong>
        #${formatId(pokemon.id)}
      </strong>
    </div>
  `;
}

function getInfoBox(pokemon) {
    return `
    <div class="info-grid">

      <div class="info-box">
        <span>Größe</span>
        ${pokemon.height / 10} m
      </div>

      <div class="info-box">
        <span>Gewicht</span>
        ${pokemon.weight / 10} kg
      </div>

      <div class="info-box">
        <span>Fähigkeiten</span>
        ${getAbilities(pokemon)}
      </div>

      <div class="info-box">
        <span>Basis XP</span>
        ${pokemon.base_experience ?? 'unbekannt'}
      </div>

    </div>
  `;
}


function getStats(stats) {
    return stats.map(stat => getStatRow(stat)).join('');
}

function getStatRow(stat) {
    const percent = Math.min(
        stat.base_stat,
        150
    ) / 150 * 100;

    return `
    <div class="stat-row">

      <strong>
        ${translateStat(stat.stat.name)}
      </strong>

      <span>
        ${stat.base_stat}
      </span>

      <div class="stat-bar">
        <div 
          class="stat-fill"
          style="width:${percent}%"
        ></div>
      </div>

    </div>
  `;
}

function getSuggestionButton(name) {
    return `
    <button 
      class="suggestion-button"
      type="button"
      onclick="chooseSuggestion('${name}')"
    >
      ${formatName(name)}
    </button>
  `;
}