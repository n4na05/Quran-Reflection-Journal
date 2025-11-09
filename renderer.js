
const fs = require('fs'); 
const notesFile = 'data.json'; //file untuk simpan notes
const favFile = 'favorites.json'; //file untuk simpan favorites

let notes = [];
let favorites = [];

function goto(page) { window.location.href = page; }

/* ---------- Load data from JSON files ---------- */
function loadNotesFromFile() { //baca file notes
  try {
    if (fs.existsSync(notesFile)) {
      const raw = fs.readFileSync(notesFile);
      notes = JSON.parse(raw);
    } else {
      notes = [];
    }
  } catch (err) {
    console.error("Error loading notes:", err);
    notes = [];
  }
}

function saveNotesToFile() { //simpan file notes
  try {
    fs.writeFileSync(notesFile, JSON.stringify(notes, null, 2));
  } catch (err) {
    console.error("Error saving notes:", err);
  }
}

function loadFavoritesFromFile() { // baca file favorites
  try {
    if (fs.existsSync(favFile)) {
      const raw = fs.readFileSync(favFile);
      favorites = JSON.parse(raw);
    } else {
      favorites = [];
    }
  } catch (err) {
    console.error("Error loading favorites:", err);
    favorites = [];
  }
}

function saveFavoritesToFile() { //simpan file favorites
  try {
    fs.writeFileSync(favFile, JSON.stringify(favorites, null, 2));
  } catch (err) {
    console.error("Error saving favorites:", err);
  }
}

// App start: call daily prompt then load surah 
async function appStart() {
  loadNotesFromFile();
  loadFavoritesFromFile();
  await dailyPrompt(); // show daily prompt question
  getAllSurah();
}

//DAILY PROMPT (Unique feature) 
const reflectionFile = 'reflection.json';

function saveReflectionToFile(data) {
  try {
    fs.writeFileSync(reflectionFile, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error saving reflection:", err);
  }
}

async function dailyPrompt() {
  try {
    const r = await fetch("https://api.alquran.cloud/v1/surah");
    const j = await r.json();
    const list = j.data;
    const idx = Math.floor(Math.random() * list.length);
    const s = list[idx];
    const questions = [
      `What lesson from Surah ${s.englishName} (${s.name}) can you apply this week?`,
      `How did Surah ${s.englishName} make you feel today?`,
      `Write one short dua after reading ${s.englishName}.`
    ];
    const q = questions[Math.floor(Math.random() * questions.length)];
    document.getElementById('reflectionQuestion').textContent = q;
    document.getElementById('reflectionPopup').style.display = 'flex';
  } catch (err) {
    console.warn("Daily prompt failed:", err);
  }
}

function saveReflection() {
  const answer = document.getElementById('reflectionAnswer').value.trim();
  if (!answer) {
    alert("Please write your reflection before saving.");
    return;
  }

  const reflectionData = {
    question: document.getElementById('reflectionQuestion').textContent,
    answer,
    date: new Date().toLocaleString()
  };

  let existingReflections = [];
  try {
    if (fs.existsSync(reflectionFile)) {
      const raw = fs.readFileSync(reflectionFile);
      existingReflections = JSON.parse(raw);
      if (!Array.isArray(existingReflections)) existingReflections = [];
    }
  } catch (err) {
    console.error("Error reading reflections:", err);
  }

  existingReflections.push(reflectionData);

  try {
    fs.writeFileSync(reflectionFile, JSON.stringify(existingReflections, null, 2));
    alert("Reflection saved successfully!");
    closeReflection();
  } catch (err) {
    console.error("Error saving reflection:", err);
  }
}

  saveReflectionToFile(reflectionData);
  alert("Reflection saved successfully!");
  closeReflection();

function closeReflection() {
  document.getElementById('reflectionPopup').style.display = 'none';
}

//API: Get all surah 
async function getAllSurah() {
  try {
    const response = await fetch("https://api.alquran.cloud/v1/surah");
    const data = await response.json();
    displaySurah(data.data);
  } catch (err) {
    alert("Failed to fetch surah list. Check internet connection.");
    console.error(err);
  }
}

//Display surah list with required details
function displaySurah(surahList) {
  const container = document.getElementById('surahList');
  if (!container) return;
  container.innerHTML = "";
  surahList.forEach(surah => {
    const div = document.createElement('div');
    div.classList.add('surah-item');
    const translation = surah.englishNameTranslation || '';
    div.innerHTML = `
      <h3>${surah.englishName} (${surah.name})</h3>
      <div class="surah-meta">
        <strong>English Translation:</strong> ${translation} &nbsp;|&nbsp;
        <strong>Surah No:</strong> ${surah.number} &nbsp;|&nbsp;
        <strong>Ayahs:</strong> ${surah.numberOfAyahs} &nbsp;|&nbsp;
        <strong>Revelation:</strong> ${surah.revelationType}
      </div>
      <div class="surah-actions">
        <button class="btn-fav" onclick="addFavorite('${escapeQuotes(surah.englishName)}')">⭐ Add to Favorites</button>
        <button class="btn-notes" onclick="prefillNote('${escapeQuotes(surah.englishName)}', ${surah.numberOfAyahs})">🧾 Add Note</button>
        <button class="btn-open" onclick="openSurahDetail(${surah.number})">🔎 Open Details</button>
      </div>
    `;
    container.appendChild(div);
  });
}

//to escape single quotes in names when used in onclick string
function escapeQuotes(s) { return s.replace(/'/g, "\\'").replace(/"/g, '\\"'); }

// Search function 
async function searchSurah() {
  const q = document.getElementById('searchInput').value.trim().toLowerCase();
  try {
    const response = await fetch("https://api.alquran.cloud/v1/surah");
    const data = await response.json();
    const filtered = data.data.filter(s => s.englishName.toLowerCase().includes(q) || s.name.toLowerCase().includes(q));
    if (filtered.length === 0) alert("No surah found matching: " + q);
    displaySurah(filtered);
  } catch (err) {
    alert("Search failed. Check your connection.");
    console.error(err);
  }
}

//Favorite logic 
function addFavorite(name) {
  loadFavoritesFromFile();
  if (!favorites.includes(name)) {
    favorites.push(name);
    saveFavoritesToFile();
    alert("'" + name + "' added to Favorites!");
  } else {
    alert("'" + name + "' is already in Favorites.");
  }
}

function showFavorites() {
  loadFavoritesFromFile();
  const container = document.getElementById('favoriteList');
  if (!container) return;
  container.innerHTML = "";
  if (favorites.length === 0) {
    container.innerHTML = "<p>No favorites yet.</p>";
    return;
  }
  favorites.forEach((name, idx) => {
    const div = document.createElement('div');
    div.classList.add('surah-item');
    div.innerHTML = `
      <h3>${name}</h3>
      <div class="surah-actions">
        <button class="btn-fav" onclick="removeFavorite(${idx})">❌ Remove</button>
      </div>
    `;
    container.appendChild(div);
  });
}

function removeFavorite(index) {
  loadFavoritesFromFile();
  if (confirm("Remove this surah from favorites?")) {
    favorites.splice(index, 1);
    saveFavoritesToFile();
    alert("Removed from favorites.");
    showFavorites();
  }
}

// Prefill note form 
function prefillNote(surahName, ayahCount) {
  // save prefill temporarily in a JSON file (optional) — simplified with global var
  sessionStorage.setItem("prefillSurah", JSON.stringify({ surahName, ayahCount }));
  goto('notes.html');
}

// Open surah detail (optional) 
async function openSurahDetail(number) {
  alert("To read ayahs, please open an online Quran or use the API in an extended version.");
}

// NOTES CRUD (Create, Read, Update, Delete) 
function loadPrefill() {
  const v = JSON.parse(sessionStorage.getItem("prefillSurah") || "null");
  if (v) {
    document.getElementById('surahName').value = v.surahName;
    document.getElementById('ayahDone').value = v.ayahCount || "";
    sessionStorage.removeItem("prefillSurah");
  }
}

function clearNoteForm() {
  document.getElementById('surahName').value = "";
  document.getElementById('ayahDone').value = "";
  document.getElementById('note').value = "";
}

function addNote() {
  const surah = document.getElementById('surahName').value.trim();
  const ayah = document.getElementById('ayahDone').value.trim();
  const noteText = document.getElementById('note').value.trim();

  if (!surah || !noteText) {
    alert("Please fill in all fields.");
    return;
  }

  const noteObj = {
    surah,
    ayah: ayah ? Number(ayah) : 0,
    note: noteText,
    createdAt: new Date().toISOString()
  };

  loadNotesFromFile();
  notes.push(noteObj);
  saveNotesToFile();
  alert("Reflection added successfully!");
  displayNotes();
  clearNoteForm();
}

/* READ funtion */
function displayNotes() {
  loadNotesFromFile();
  try { loadPrefill(); } catch (e) {}
  const container = document.getElementById('noteList');
  if (!container) return;
  container.innerHTML = "";
  if (notes.length === 0) {
    container.innerHTML = "<p>No reflections yet.</p>";
    return;
  }
  notes.forEach((n, idx) => {
    const div = document.createElement('div');
    div.classList.add('surah-item', 'note-item');
    div.innerHTML = `
      <h3>${n.surah}</h3>
      <p><strong>Ayahs Completed:</strong> ${n.ayah}</p>
      <p>${n.note}</p>
      <p style="font-size:12px;color:#666">Saved: ${new Date(n.createdAt).toLocaleString()}</p>
      <div style="margin-top:6px;">
        <button class="small-btn edit-btn" onclick="editNote(${idx})">✏️ Edit</button>
        <button class="small-btn delete-btn" onclick="deleteNote(${idx})">❌ Delete</button>
      </div>
    `;
    container.appendChild(div);
  });
}

/* UPDATE function */
function editNote(index) {
  loadNotesFromFile();
  const current = notes[index];
  document.getElementById('editBox').style.display = 'block';
  document.getElementById('editIndex').value = index;
  document.getElementById('editSurah').value = current.surah;
  document.getElementById('editAyah').value = current.ayah;
  document.getElementById('editNoteText').value = current.note;
}

function saveEditedNote() {
  const index = document.getElementById('editIndex').value;
  notes[index].surah = document.getElementById('editSurah').value.trim();
  notes[index].ayah = Number(document.getElementById('editAyah').value.trim());
  notes[index].note = document.getElementById('editNoteText').value.trim();
  notes[index].updatedAt = new Date().toISOString();

  saveNotesToFile();
  alert("Reflection updated successfully!");
  document.getElementById('editBox').style.display = 'none';
  displayNotes();
}

function cancelEdit() {
  document.getElementById('editBox').style.display = 'none';
}

/* DELETE function */
function deleteNote(index) {
  loadNotesFromFile();
  if (confirm("Are you sure you want to delete this reflection?")) {
    notes.splice(index, 1);
    saveNotesToFile();
    alert("Reflection deleted successfully!");
    displayNotes();
  }
}

/* ---------- On load handlers ---------- */
try {
  if (window.location.pathname.endsWith('notes.html')) displayNotes();
  if (window.location.pathname.endsWith('favorites.html')) showFavorites();
} catch (err) {}
