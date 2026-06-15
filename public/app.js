const state = {
  players: [],
  filters: {
    search: '',
    tag: '',
    favorite: false
  },
  loading: false
};

const els = {
  statusBadge: document.querySelector('#statusBadge'),
  importForm: document.querySelector('#importForm'),
  username: document.querySelector('#username'),
  tags: document.querySelector('#tags'),
  notes: document.querySelector('#notes'),
  favorite: document.querySelector('#favorite'),
  lookupButton: document.querySelector('#lookupButton'),
  lookupResult: document.querySelector('#lookupResult'),
  search: document.querySelector('#search'),
  tagFilter: document.querySelector('#tagFilter'),
  favoriteFilter: document.querySelector('#favoriteFilter'),
  refreshButton: document.querySelector('#refreshButton'),
  summary: document.querySelector('#summary'),
  playerGrid: document.querySelector('#playerGrid'),
  template: document.querySelector('#playerTemplate'),
  toast: document.querySelector('#toast')
};

function splitTags(value) {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function setLoading(isLoading) {
  state.loading = isLoading;
  document.body.classList.toggle('is-loading', isLoading);
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.hidden = false;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    els.toast.hidden = true;
  }, 3600);
}

async function requestJson(path, options = {}) {
  const response = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || 'Falha na requisicao.');
  }

  return payload;
}

function setStatus(ok) {
  els.statusBadge.classList.toggle('ok', ok);
  els.statusBadge.classList.toggle('fail', !ok);
  els.statusBadge.querySelector('span:last-child').textContent = ok ? 'Online' : 'Offline';
}

async function checkHealth() {
  try {
    await requestJson('/health');
    setStatus(true);
  } catch (_error) {
    setStatus(false);
  }
}

function playerAvatar(player) {
  return `https://crafatar.com/avatars/${player.uuid}?size=96&overlay`;
}

function formatDate(value) {
  if (!value) {
    return 'Sem data';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
}

function renderLookup(player) {
  els.lookupResult.hidden = false;
  els.lookupResult.innerHTML = `
    <h2>${player.displayName || player.username}</h2>
    <p>${player.uuid}</p>
  `;
}

function renderPlayers() {
  els.playerGrid.replaceChildren();

  if (state.players.length === 0) {
    els.summary.textContent = 'Nenhum jogador encontrado.';
    return;
  }

  els.summary.textContent = `${state.players.length} jogador${state.players.length === 1 ? '' : 'es'} encontrado${state.players.length === 1 ? '' : 's'}.`;

  const fragment = document.createDocumentFragment();

  for (const player of state.players) {
    const node = els.template.content.firstElementChild.cloneNode(true);
    const avatar = node.querySelector('.avatar');
    const title = node.querySelector('h2');
    const uuid = node.querySelector('.uuid');
    const notes = node.querySelector('.notes');
    const tags = node.querySelector('.tag-list');
    const skin = node.querySelector('.skin');
    const updated = node.querySelector('.updated');
    const favoriteButton = node.querySelector('.favorite-button');
    const syncButton = node.querySelector('.sync-button');
    const deleteButton = node.querySelector('.delete-button');

    avatar.src = playerAvatar(player);
    avatar.alt = `${player.displayName || player.username} avatar`;
    title.textContent = player.displayName || player.username;
    uuid.textContent = player.uuid;
    notes.textContent = player.notes || 'Sem notas.';
    skin.textContent = player.mojang?.skinVariant || 'unknown';
    updated.textContent = formatDate(player.updatedAt);
    favoriteButton.innerHTML = player.favorite ? '&#9733;' : '&#9734;';

    if (player.tags?.length) {
      for (const tag of player.tags) {
        const tagNode = document.createElement('span');
        tagNode.className = 'tag';
        tagNode.textContent = tag;
        tags.append(tagNode);
      }
    } else {
      const tagNode = document.createElement('span');
      tagNode.className = 'tag';
      tagNode.textContent = 'sem-tag';
      tags.append(tagNode);
    }

    favoriteButton.addEventListener('click', () => toggleFavorite(player));
    syncButton.addEventListener('click', () => syncPlayer(player));
    deleteButton.addEventListener('click', () => deletePlayer(player));

    fragment.append(node);
  }

  els.playerGrid.append(fragment);
}

async function loadPlayers() {
  const params = new URLSearchParams({
    page: '1',
    limit: '100'
  });

  if (state.filters.search) {
    params.set('search', state.filters.search);
  }

  if (state.filters.tag) {
    params.set('tag', state.filters.tag);
  }

  if (state.filters.favorite) {
    params.set('favorite', 'true');
  }

  setLoading(true);
  try {
    const payload = await requestJson(`/players?${params.toString()}`);
    state.players = payload.data || [];
    renderPlayers();
  } catch (error) {
    showToast(error.message);
  } finally {
    setLoading(false);
  }
}

async function lookupPlayer() {
  const username = els.username.value.trim();

  if (!username) {
    els.username.focus();
    return;
  }

  setLoading(true);
  try {
    const payload = await requestJson(`/players/lookup/${encodeURIComponent(username)}`);
    renderLookup(payload.data);
    showToast('Perfil encontrado na Mojang API.');
  } catch (error) {
    showToast(error.message);
  } finally {
    setLoading(false);
  }
}

async function importPlayer(event) {
  event.preventDefault();
  const username = els.username.value.trim();

  setLoading(true);
  try {
    const payload = await requestJson(`/players/import/${encodeURIComponent(username)}`, {
      method: 'POST',
      body: JSON.stringify({
        favorite: els.favorite.checked,
        notes: els.notes.value.trim(),
        tags: splitTags(els.tags.value)
      })
    });

    els.importForm.reset();
    els.lookupResult.hidden = true;
    showToast(payload.message || 'Jogador importado.');
    await loadPlayers();
  } catch (error) {
    showToast(error.message);
  } finally {
    setLoading(false);
  }
}

async function toggleFavorite(player) {
  setLoading(true);
  try {
    await requestJson(`/players/${player.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        favorite: !player.favorite
      })
    });
    await loadPlayers();
  } catch (error) {
    showToast(error.message);
  } finally {
    setLoading(false);
  }
}

async function syncPlayer(player) {
  setLoading(true);
  try {
    const payload = await requestJson(`/players/${player.id}/sync`, {
      method: 'POST',
      body: JSON.stringify({})
    });
    showToast(payload.message || 'Jogador sincronizado.');
    await loadPlayers();
  } catch (error) {
    showToast(error.message);
  } finally {
    setLoading(false);
  }
}

async function deletePlayer(player) {
  const confirmed = window.confirm(`Excluir ${player.displayName || player.username}?`);

  if (!confirmed) {
    return;
  }

  setLoading(true);
  try {
    await requestJson(`/players/${player.id}`, {
      method: 'DELETE'
    });
    showToast('Jogador removido.');
    await loadPlayers();
  } catch (error) {
    showToast(error.message);
  } finally {
    setLoading(false);
  }
}

function debounce(callback, delay = 280) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => callback(...args), delay);
  };
}

const applyFilters = debounce(() => {
  state.filters.search = els.search.value.trim();
  state.filters.tag = els.tagFilter.value.trim();
  state.filters.favorite = els.favoriteFilter.checked;
  loadPlayers();
});

els.importForm.addEventListener('submit', importPlayer);
els.lookupButton.addEventListener('click', lookupPlayer);
els.refreshButton.addEventListener('click', loadPlayers);
els.search.addEventListener('input', applyFilters);
els.tagFilter.addEventListener('input', applyFilters);
els.favoriteFilter.addEventListener('change', applyFilters);

checkHealth();
loadPlayers();
