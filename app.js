const STORAGE_KEY = "notas.evernote.local.v1";

const initialState = {
  notebooks: [
    { id: "inbox", name: "Mi primer libreta", icon: "🚀" },
    { id: "work", name: "Trabajo y Proyectos", icon: "💼" },
    { id: "personal", name: "Personal y Diario", icon: "🏠" }
  ],
  notes: [
    {
      id: crypto.randomUUID(),
      title: "Nota sin titulo",
      content: "",
      notebookId: "inbox",
      tags: [],
      favorite: false,
      deleted: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: crypto.randomUUID(),
      title: "Web para abogado",
      content: "&lt;!DOCTYPE html&gt;&lt;html lang=&quot;es&quot;&gt;&lt;head&gt; &lt;meta charset=&quot;UTF-8&quot;&gt; &lt;meta name=&quot;viewport&quot;...",
      notebookId: "work",
      tags: ["web"],
      favorite: false,
      deleted: false,
      createdAt: Date.now() - 86400000,
      updatedAt: Date.now() - 86400000
    }
  ],
  selectedNoteId: null,
  activeView: "all",
  activeNotebookId: null,
  activeTag: null,
  sortNewestFirst: true
};

let state = loadState();
let saveTimer = null;

const els = {
  newNoteButton: document.querySelector("#newNoteButton"),
  addNotebookButton: document.querySelector("#addNotebookButton"),
  notebookList: document.querySelector("#notebookList"),
  tagCloud: document.querySelector("#tagCloud"),
  noteList: document.querySelector("#noteList"),
  searchInput: document.querySelector("#searchInput"),
  sortButton: document.querySelector("#sortButton"),
  viewTitle: document.querySelector("#viewTitle"),
  noteCountLabel: document.querySelector("#noteCountLabel"),
  allCount: document.querySelector("#allCount"),
  favoriteCount: document.querySelector("#favoriteCount"),
  trashCount: document.querySelector("#trashCount"),
  editor: document.querySelector("#editor"),
  emptyState: document.querySelector("#emptyState"),
  titleInput: document.querySelector("#titleInput"),
  tagInput: document.querySelector("#tagInput"),
  contentInput: document.querySelector("#contentInput"),
  notebookSelect: document.querySelector("#notebookSelect"),
  favoriteButton: document.querySelector("#favoriteButton"),
  deleteButton: document.querySelector("#deleteButton"),
  statusLine: document.querySelector("#statusLine"),
  exportButton: document.querySelector("#exportButton"),
  importInput: document.querySelector("#importInput"),
  contextMenu: document.querySelector("#contextMenu"),
  contextDeleteBtn: document.querySelector("#contextDeleteBtn")
};

if (window.notasUpdater) {
  window.notasUpdater.onStatus((payload) => {
    if (!payload?.message) return;
    els.statusLine.textContent = payload.message;
  });
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return freshInitialState();
    const parsed = JSON.parse(raw);
    return normalizeState({ ...freshInitialState(), ...parsed });
  } catch {
    return freshInitialState();
  }
}

function freshInitialState() {
  const copy = structuredClone(initialState);
  copy.notes.forEach((note, index) => {
    note.id = crypto.randomUUID();
    note.createdAt = Date.now() - index * 86400000;
    note.updatedAt = Date.now() - index * 86400000;
  });
  copy.selectedNoteId = copy.notes[0].id;
  return copy;
}

function normalizeState(value) {
  const fallback = freshInitialState();
  const notebooks = Array.isArray(value.notebooks) && value.notebooks.length
    ? value.notebooks.map((book) => normalizeNotebook(book))
    : fallback.notebooks;
  const notes = Array.isArray(value.notes) ? value.notes : fallback.notes;
  const selectedNoteId = notes.some((note) => note.id === value.selectedNoteId)
    ? value.selectedNoteId
    : notes.find((note) => !note.deleted)?.id || notes[0]?.id || null;

  return {
    ...fallback,
    ...value,
    notebooks,
    notes,
    selectedNoteId
  };
}

function migrateDefaultNotebookName(name) {
  const defaults = {
    Bandeja: "Mi primer libreta",
    Trabajo: "Trabajo y Proyectos",
    Personal: "Personal y Diario"
  };
  return defaults[name] || name;
}

function normalizeNotebook(book) {
  const name = migrateDefaultNotebookName(book.name);
  return {
    ...book,
    name,
    icon: book.icon || defaultNotebookIcon(name)
  };
}

function defaultNotebookIcon(name) {
  const icons = {
    "Mi primer libreta": "🚀",
    "Trabajo y Proyectos": "💼",
    "Personal y Diario": "🏠"
  };
  return icons[name] || "📓";
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  els.statusLine.textContent = "Autoguardado activado";
}

function scheduleSave() {
  els.statusLine.textContent = "Guardando cambios...";
  clearTimeout(saveTimer);
  saveTimer = setTimeout(persist, 250);
}

function selectedNote() {
  return state.notes.find((note) => note.id === state.selectedNoteId) || null;
}

function cleanText(html) {
  const div = document.createElement("div");
  div.innerHTML = html || "";
  return div.textContent?.replace(/\s+/g, " ").trim() || "";
}

function formatDate(value) {
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "short"
  }).format(new Date(value));
}

function noteMatches(note, query) {
  const haystack = [
    note.title,
    cleanText(note.content),
    note.tags.join(" "),
    notebookName(note.notebookId)
  ].join(" ").toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function filteredNotes() {
  const query = els.searchInput.value.trim();
  let notes = state.notes.filter((note) => {
    if (state.activeView === "trash") return note.deleted;
    if (state.activeView === "tasks") return false;
    if (note.deleted) return false;
    if (state.activeView === "favorites" && !note.favorite) return false;
    if (state.activeNotebookId && note.notebookId !== state.activeNotebookId) return false;
    if (state.activeTag && !note.tags.includes(state.activeTag)) return false;
    if (query && !noteMatches(note, query)) return false;
    return true;
  });

  notes = notes.sort((a, b) => {
    return state.sortNewestFirst ? b.updatedAt - a.updatedAt : a.updatedAt - b.updatedAt;
  });

  return notes;
}

function notebookName(id) {
  return state.notebooks.find((book) => book.id === id)?.name || "Sin libreta";
}

function allTags() {
  return [...new Set(state.notes.filter((note) => !note.deleted).flatMap((note) => note.tags))]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
}

function createNote() {
  const notebookId = state.activeNotebookId || state.notebooks[0]?.id || "inbox";
  const note = {
    id: crypto.randomUUID(),
    title: "Nota sin titulo",
    content: "",
    notebookId,
    tags: [],
    favorite: false,
    deleted: false,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  state.notes.unshift(note);
  state.selectedNoteId = note.id;
  state.activeView = "all";
  state.activeTag = null;
  render();
  els.titleInput.focus();
  els.titleInput.select();
  persist();
}

function createNotebook() {
  const name = prompt("Nombre de la libreta");
  if (!name?.trim()) return;
  const notebook = { id: crypto.randomUUID(), name: name.trim() };
  state.notebooks.push(notebook);
  state.activeNotebookId = notebook.id;
  state.activeView = "all";
  state.activeTag = null;
  render();
  persist();
}

function updateSelectedNote(patch) {
  const note = selectedNote();
  if (!note) return;
  Object.assign(note, patch, { updatedAt: Date.now() });
  scheduleSave();
  renderListsOnly();
}

function deleteOrRestoreSelected() {
  const note = selectedNote();
  if (!note) return;
  if (note.deleted) {
    updateSelectedNote({ deleted: false });
    state.activeView = "all";
  } else {
    updateSelectedNote({ deleted: true, favorite: false });
  }
  state.selectedNoteId = null;
  render();
  persist();
}

function renderCounts() {
  els.allCount.textContent = state.notes.filter((note) => !note.deleted).length;
  els.favoriteCount.textContent = state.notes.filter((note) => !note.deleted && note.favorite).length;
  els.trashCount.textContent = state.notes.filter((note) => note.deleted).length;
}

function renderNav() {
  document.querySelectorAll(".nav-item").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === state.activeView && !state.activeNotebookId && !state.activeTag);
  });
}

function renderNotebooks() {
  els.notebookList.innerHTML = "";
  state.notebooks.forEach((book) => {
    const count = state.notes.filter((note) => !note.deleted && note.notebookId === book.id).length;
    const button = document.createElement("button");
    button.className = "notebook-item";
    button.type = "button";
    button.classList.toggle("active", state.activeNotebookId === book.id);
    button.innerHTML = `
      <span class="notebook-book-icon" aria-hidden="true"></span>
      <span class="notebook-name"><span class="notebook-emoji" aria-hidden="true"></span><span class="notebook-label"></span></span>
      <em>${count}</em>
    `;
    button.querySelector(".notebook-emoji").textContent = book.icon || defaultNotebookIcon(book.name);
    button.querySelector(".notebook-label").textContent = book.name;
    button.addEventListener("click", () => {
      state.activeNotebookId = book.id;
      state.activeTag = null;
      state.activeView = "all";
      render();
      persist();
    });
    els.notebookList.append(button);
  });
}

function renderTags() {
  els.tagCloud.innerHTML = "";
  allTags().forEach((tag) => {
    const button = document.createElement("button");
    button.className = "tag-pill";
    button.type = "button";
    button.classList.toggle("active", state.activeTag === tag);
    button.textContent = tag;
    button.addEventListener("click", () => {
      state.activeTag = state.activeTag === tag ? null : tag;
      state.activeNotebookId = null;
      state.activeView = "all";
      render();
      persist();
    });
    els.tagCloud.append(button);
  });
}

function renderNoteList() {
  const notes = filteredNotes();
  els.noteList.innerHTML = "";
  els.noteCountLabel.textContent = `${notes.length} ${notes.length === 1 ? "nota" : "notas"}`;
  els.viewTitle.textContent = currentTitle();

  notes.forEach((note) => {
    const button = document.createElement("button");
    button.className = "note-card";
    button.type = "button";
    button.classList.toggle("active", note.id === state.selectedNoteId);

    const title = document.createElement("strong");
    title.textContent = `${note.favorite ? "* " : ""}${note.title || "Sin titulo"}`;
    const excerpt = document.createElement("p");
    excerpt.textContent = cleanText(note.content) || "Nota vacia";
    const meta = document.createElement("small");
    meta.textContent = formatDate(note.updatedAt);

    button.append(title, excerpt, meta);
    button.addEventListener("click", () => {
      state.selectedNoteId = note.id;
      render();
      persist();
    });
    button.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      state.selectedNoteId = note.id;
      render();
      persist();
      showContextMenu(e.clientX, e.clientY, note);
    });
    els.noteList.append(button);
  });
}

function renderNotebookSelect() {
  els.notebookSelect.innerHTML = "";
  state.notebooks.forEach((book) => {
    const option = document.createElement("option");
    option.value = book.id;
    option.textContent = book.name;
    els.notebookSelect.append(option);
  });
}

function renderEditor() {
  const note = selectedNote();
  const hasNote = Boolean(note);
  els.editor.classList.toggle("visible", hasNote);
  els.emptyState.classList.toggle("hidden", hasNote);
  if (!note) return;

  els.titleInput.value = note.title;
  els.tagInput.value = note.tags.join(", ");
  els.contentInput.innerHTML = note.content;
  els.notebookSelect.value = note.notebookId;
  els.favoriteButton.classList.toggle("active", note.favorite);
  els.deleteButton.textContent = note.deleted ? "↺" : "♲";
  els.deleteButton.title = note.deleted ? "Restaurar" : "Eliminar";
}

function currentTitle() {
  if (state.activeTag) return `Etiqueta: ${state.activeTag}`;
  if (state.activeNotebookId) return notebookName(state.activeNotebookId);
  if (state.activeView === "favorites") return "Favoritas";
  if (state.activeView === "trash") return "Papelera";
  if (state.activeView === "tasks") return "Tareas";
  return "Notas";
}

function renderListsOnly() {
  renderCounts();
  renderNav();
  renderNotebooks();
  renderTags();
  renderNoteList();
}

function render() {
  renderCounts();
  renderNav();
  renderNotebooks();
  renderTags();
  renderNotebookSelect();
  renderNoteList();
  renderEditor();
}

function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `notas-backup-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function importData(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(String(reader.result));
      if (!Array.isArray(imported.notes) || !Array.isArray(imported.notebooks)) {
        throw new Error("Formato invalido");
      }
      state = { ...structuredClone(initialState), ...imported, selectedNoteId: imported.notes[0]?.id || null };
      render();
      persist();
    } catch {
      alert("No se pudo importar el archivo. Revisa que sea un respaldo JSON de Notas.");
    }
  };
  reader.readAsText(file);
}

els.newNoteButton.addEventListener("click", createNote);
els.addNotebookButton.addEventListener("click", createNotebook);
els.searchInput.addEventListener("input", renderNoteList);
els.sortButton.addEventListener("click", () => {
  state.sortNewestFirst = !state.sortNewestFirst;
  els.sortButton.textContent = state.sortNewestFirst ? "Mas recientes⌄" : "Mas antiguas⌃";
  renderNoteList();
  persist();
});
els.exportButton.addEventListener("click", exportData);
els.importInput.addEventListener("change", (event) => importData(event.target.files[0]));

document.querySelectorAll(".nav-item").forEach((button) => {
  button.addEventListener("click", () => {
    state.activeView = button.dataset.view;
    state.activeNotebookId = null;
    state.activeTag = null;
    render();
    persist();
  });
});

document.querySelectorAll("[data-command]").forEach((button) => {
  button.addEventListener("click", () => {
    const command = button.dataset.command;
    const value = button.dataset.value || null;
    document.execCommand(command, false, value);
    els.contentInput.focus();
    updateSelectedNote({ content: els.contentInput.innerHTML });
  });
});

els.titleInput.addEventListener("input", () => updateSelectedNote({ title: els.titleInput.value }));
els.tagInput.addEventListener("input", () => {
  const tags = els.tagInput.value
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);
  updateSelectedNote({ tags: [...new Set(tags)] });
});
els.contentInput.addEventListener("input", () => updateSelectedNote({ content: els.contentInput.innerHTML }));
els.notebookSelect.addEventListener("change", () => updateSelectedNote({ notebookId: els.notebookSelect.value }));
els.favoriteButton.addEventListener("click", () => {
  const note = selectedNote();
  if (note) updateSelectedNote({ favorite: !note.favorite });
  renderEditor();
});
els.deleteButton.addEventListener("click", deleteOrRestoreSelected);

function showContextMenu(x, y, note) {
  const menu = els.contextMenu;
  els.contextDeleteBtn.textContent = note.deleted ? "Restaurar" : "Eliminar";
  menu.style.left = x + "px";
  menu.style.top = y + "px";
  menu.hidden = false;
}

function hideContextMenu() {
  els.contextMenu.hidden = true;
}

els.contextDeleteBtn.addEventListener("click", () => {
  hideContextMenu();
  deleteOrRestoreSelected();
});

document.addEventListener("click", (e) => {
  if (!e.target.closest("#contextMenu")) hideContextMenu();
});

document.addEventListener("contextmenu", (e) => {
  if (!e.target.closest(".note-card")) hideContextMenu();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    hideContextMenu();
    return;
  }
  if (e.key !== "Delete") return;
  const tag = document.activeElement?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || document.activeElement?.isContentEditable) return;
  deleteOrRestoreSelected();
});

window.addEventListener("beforeunload", persist);

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}

render();
