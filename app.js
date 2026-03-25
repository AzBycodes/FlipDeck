/**
 * FlipDeck — Flashcard Studio
 * app.js
 */

// ============================================================
//  DATA MODEL (persisted to localStorage)
// ============================================================

const STORAGE_KEY = "flipdeck_v1";

function loadData() {
  try {
    return (
      JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
        folders: [],
        cards: [],
      }
    );
  } catch {
    return { folders: [], cards: [] };
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

const state = loadData();
let activeFolderID = null;
let editingCardID = null;
let selectedColor = "#e8624a";

// ============================================================
//  DOM REFS
// ============================================================
const folderList = document.getElementById("folderList");
const addFolderBtn = document.getElementById("addFolderBtn");
const folderTitle = document.getElementById("folderTitle");
const cardGrid = document.getElementById("cardGrid");
const emptyState = document.getElementById("emptyState");
const totalCount = document.getElementById("totalCount");

const addCardBtn = document.getElementById("addCardBtn");
const playBtn = document.getElementById("playBtn");

const cardModal = document.getElementById("cardModal");
const modalTitle = document.getElementById("modalTitle");
const cardFront = document.getElementById("cardFront");
const cardBack = document.getElementById("cardBack");
const saveCardBtn = document.getElementById("saveCardBtn");
const closeCardModal = document.getElementById("closeCardModal");
const cancelCardModal = document.getElementById("cancelCardModal");

const folderModal = document.getElementById("folderModal");
const folderNameInput = document.getElementById("folderNameInput");
const saveFolderBtn = document.getElementById("saveFolderBtn");
const closeFolderModal = document.getElementById("closeFolderModal");
const cancelFolderModal = document.getElementById("cancelFolderModal");
const colorPicker = document.getElementById("colorPicker");

const playOverlay = document.getElementById("playOverlay");
const playFolderName = document.getElementById("playFolderName");
const playProgress = document.getElementById("playProgress");
const flipCard = document.getElementById("flipCard");
const playFront = document.getElementById("playFront");
const playBack = document.getElementById("playBack");
const flipBtn = document.getElementById("flipBtn");
const shuffleBtn = document.getElementById("shuffleBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const exitPlayBtn = document.getElementById("exitPlayBtn");

const hamburger = document.getElementById("hamburger");
const sidebar = document.getElementById("sidebar");

// ============================================================
//  UTILITY
// ============================================================
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function getFolderCards(folderID) {
  return state.cards.filter((c) => c.folderID === folderID);
}

// ============================================================
//  RENDER
// ============================================================

function renderFolders() {
  folderList.innerHTML = "";
  state.folders.forEach((f) => {
    const count = getFolderCards(f.id).length;
    const li = document.createElement("li");
    li.className = "folder-item" + (f.id === activeFolderID ? " active" : "");
    li.style.setProperty("--folder-color", f.color);
    li.innerHTML = `
      <span class="folder-dot" style="background:${f.color}"></span>
      <span class="folder-name">${escHtml(f.name)}</span>
      <span class="folder-count">${count}</span>
      <button class="folder-delete" title="Delete folder" data-id="${f.id}">✕</button>
    `;
    li.addEventListener("click", (e) => {
      if (e.target.classList.contains("folder-delete")) {
        deleteFolder(f.id);
      } else {
        selectFolder(f.id);
      }
    });
    folderList.appendChild(li);
  });

  totalCount.textContent = `${state.cards.length} card${state.cards.length !== 1 ? "s" : ""} total`;
}

function renderCards() {
  // Remove old cards (keep emptyState)
  [...cardGrid.children].forEach((el) => {
    if (!el.id || el.id !== "emptyState") el.remove();
  });

  if (!activeFolderID) {
    emptyState.style.display = "";
    emptyState.innerHTML = `<div class="empty-icon">🗂</div><p>Select or create a folder to get started.</p>`;
    return;
  }

  const cards = getFolderCards(activeFolderID);
  if (cards.length === 0) {
    emptyState.style.display = "";
    emptyState.innerHTML = `<div class="empty-icon">✨</div><p>No cards yet — add your first one!</p>`;
    return;
  }

  emptyState.style.display = "none";
  cards.forEach((card) => {
    const div = document.createElement("div");
    div.className = "fc-card";
    div.innerHTML = `
      <div class="fc-actions">
        <button class="fc-btn" data-action="edit" data-id="${card.id}">Edit</button>
        <button class="fc-btn del" data-action="del" data-id="${card.id}">✕</button>
      </div>
      <div class="fc-front">${escHtml(card.front)}</div>
      <div class="fc-back">${escHtml(card.back)}</div>
    `;
    div.addEventListener("click", (e) => {
      const action = e.target.dataset.action;
      if (action === "edit") openEditCard(card.id);
      else if (action === "del") deleteCard(card.id);
    });
    cardGrid.appendChild(div);
  });
}

function escHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ============================================================
//  FOLDER ACTIONS
// ============================================================

function selectFolder(id) {
  activeFolderID = id;
  const folder = state.folders.find((f) => f.id === id);
  folderTitle.textContent = folder ? folder.name : "Unknown";
  addCardBtn.disabled = false;
  playBtn.disabled = false;
  renderFolders();
  renderCards();
  closeSidebarOnMobile();
}

function deleteFolder(id) {
  if (!confirm("Delete this folder and all its cards?")) return;
  state.folders = state.folders.filter((f) => f.id !== id);
  state.cards = state.cards.filter((c) => c.folderID !== id);
  if (activeFolderID === id) {
    activeFolderID = null;
    folderTitle.textContent = "Select a folder";
    addCardBtn.disabled = true;
    playBtn.disabled = true;
    renderCards();
  }
  saveData();
  renderFolders();
  renderCards();
}

// ============================================================
//  FOLDER MODAL
// ============================================================

addFolderBtn.addEventListener("click", () => openFolderModal());

function openFolderModal() {
  folderNameInput.value = "";
  folderModal.classList.add("open");
  folderNameInput.focus();
}
function closeFolderModal_fn() {
  folderModal.classList.remove("open");
}
closeFolderModal.addEventListener("click", closeFolderModal_fn);
cancelFolderModal.addEventListener("click", closeFolderModal_fn);
folderModal.addEventListener("click", (e) => {
  if (e.target === folderModal) closeFolderModal_fn();
});

saveFolderBtn.addEventListener("click", createFolder);
folderNameInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") createFolder();
});

function createFolder() {
  const name = folderNameInput.value.trim();
  if (!name) {
    folderNameInput.focus();
    return;
  }
  const folder = { id: uid(), name, color: selectedColor };
  state.folders.push(folder);
  saveData();
  closeFolderModal_fn();
  renderFolders();
  selectFolder(folder.id);
}

// Color picker
colorPicker.querySelectorAll(".color-dot").forEach((dot) => {
  dot.addEventListener("click", () => {
    colorPicker
      .querySelectorAll(".color-dot")
      .forEach((d) => d.classList.remove("selected"));
    dot.classList.add("selected");
    selectedColor = dot.dataset.color;
  });
});

// ============================================================
//  CARD MODAL
// ============================================================

addCardBtn.addEventListener("click", () => openAddCard());

function openAddCard() {
  editingCardID = null;
  modalTitle.textContent = "Add New Card";
  cardFront.value = "";
  cardBack.value = "";
  cardModal.classList.add("open");
  cardFront.focus();
}

function openEditCard(id) {
  const card = state.cards.find((c) => c.id === id);
  if (!card) return;
  editingCardID = id;
  modalTitle.textContent = "Edit Card";
  cardFront.value = card.front;
  cardBack.value = card.back;
  cardModal.classList.add("open");
  cardFront.focus();
}

function closeCardModal_fn() {
  cardModal.classList.remove("open");
  editingCardID = null;
}
closeCardModal.addEventListener("click", closeCardModal_fn);
cancelCardModal.addEventListener("click", closeCardModal_fn);
cardModal.addEventListener("click", (e) => {
  if (e.target === cardModal) closeCardModal_fn();
});

saveCardBtn.addEventListener("click", saveCard);

function saveCard() {
  const front = cardFront.value.trim();
  const back = cardBack.value.trim();
  if (!front || !back) {
    if (!front) cardFront.focus();
    else cardBack.focus();
    return;
  }

  if (editingCardID) {
    const card = state.cards.find((c) => c.id === editingCardID);
    if (card) {
      card.front = front;
      card.back = back;
    }
  } else {
    state.cards.push({
      id: uid(),
      folderID: activeFolderID,
      front,
      back,
      created: Date.now(),
    });
  }

  saveData();
  closeCardModal_fn();
  renderFolders();
  renderCards();
}

function deleteCard(id) {
  state.cards = state.cards.filter((c) => c.id !== id);
  saveData();
  renderFolders();
  renderCards();
}

// ============================================================
//  PLAY MODE
// ============================================================

let playDeck = [];
let playIndex = 0;
let isFlipped = false;

playBtn.addEventListener("click", startPlay);

function startPlay() {
  const folder = state.folders.find((f) => f.id === activeFolderID);
  const cards = getFolderCards(activeFolderID);
  if (cards.length === 0) {
    alert("Add some cards first!");
    return;
  }
  playDeck = [...cards];
  playIndex = 0;
  playFolderName.textContent = folder ? folder.name : "Study Session";
  renderPlayCard();
  playOverlay.classList.add("open");
  document.addEventListener("keydown", playKeyHandler);
}

function exitPlay() {
  playOverlay.classList.remove("open");
  document.removeEventListener("keydown", playKeyHandler);
  flipCard.classList.remove("flipped");
  isFlipped = false;
}

exitPlayBtn.addEventListener("click", exitPlay);

function renderPlayCard() {
  const card = playDeck[playIndex];
  isFlipped = false;
  flipCard.classList.remove("flipped");
  playFront.textContent = card.front;
  playBack.textContent = card.back;
  playProgress.textContent = `${playIndex + 1} / ${playDeck.length}`;
  prevBtn.disabled = playIndex === 0;
  nextBtn.disabled = playIndex === playDeck.length - 1;
}

function flipToggle() {
  isFlipped = !isFlipped;
  flipCard.classList.toggle("flipped", isFlipped);
}

document.getElementById("flipCardWrap").addEventListener("click", flipToggle);
flipBtn.addEventListener("click", flipToggle);

prevBtn.addEventListener("click", () => {
  if (playIndex > 0) {
    playIndex--;
    renderPlayCard();
  }
});
nextBtn.addEventListener("click", () => {
  if (playIndex < playDeck.length - 1) {
    playIndex++;
    renderPlayCard();
  }
});

shuffleBtn.addEventListener("click", () => {
  for (let i = playDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [playDeck[i], playDeck[j]] = [playDeck[j], playDeck[i]];
  }
  playIndex = 0;
  renderPlayCard();
});

function playKeyHandler(e) {
  if (e.key === " ") {
    e.preventDefault();
    flipToggle();
  }
  if (e.key === "ArrowRight" && playIndex < playDeck.length - 1) {
    playIndex++;
    renderPlayCard();
  }
  if (e.key === "ArrowLeft" && playIndex > 0) {
    playIndex--;
    renderPlayCard();
  }
  if (e.key === "Escape") exitPlay();
}

// ============================================================
//  MOBILE SIDEBAR
// ============================================================

// Create overlay element
const sidebarOverlay = document.createElement("div");
sidebarOverlay.className = "sidebar-overlay";
document.body.appendChild(sidebarOverlay);

hamburger.addEventListener("click", () => {
  sidebar.classList.toggle("open");
  sidebarOverlay.classList.toggle("open");
});
sidebarOverlay.addEventListener("click", closeSidebarOnMobile);

function closeSidebarOnMobile() {
  sidebar.classList.remove("open");
  sidebarOverlay.classList.remove("open");
}

// ============================================================
//  KEYBOARD SHORTCUTS (global)
// ============================================================
document.addEventListener("keydown", (e) => {
  if (playOverlay.classList.contains("open")) return;
  if (document.querySelector(".modal-overlay.open")) return;
  if (e.key === "n" && activeFolderID) openAddCard();
});

// ============================================================
//  INIT
// ============================================================
renderFolders();
renderCards();

// Seed sample data if empty
if (state.folders.length === 0) {
  const id1 = uid();
  const id2 = uid();
  state.folders = [
    { id: id1, name: "English Vocab", color: "#e8624a" },
    { id: id2, name: "Science Facts", color: "#50b584" },
  ];
  state.cards = [
    {
      id: uid(),
      folderID: id1,
      front: "Ephemeral",
      back: "Lasting for a very short time; transitory.",
      created: Date.now(),
    },
    {
      id: uid(),
      folderID: id1,
      front: "Sonder",
      back: "The realization that each passerby has a life as vivid and complex as your own.",
      created: Date.now(),
    },
    {
      id: uid(),
      folderID: id1,
      front: "Mellifluous",
      back: "Sweet or musical; pleasant to hear.",
      created: Date.now(),
    },
    {
      id: uid(),
      folderID: id2,
      front: "Photosynthesis",
      back: "The process by which green plants convert sunlight into food using CO₂ and water.",
      created: Date.now(),
    },
    {
      id: uid(),
      folderID: id2,
      front: "Newton's 3rd Law",
      back: "For every action, there is an equal and opposite reaction.",
      created: Date.now(),
    },
  ];
  saveData();
  renderFolders();
  selectFolder(id1);
}
