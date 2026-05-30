function renderHomeMedicines() {
  const slider = document.getElementById('home-medicine-slider');
  if (!slider) return;
  slider.innerHTML = '';
  
  // Show first 5 for home screen
  const displayMeds = medicineDatabase.slice(0, 5);
  displayMeds.forEach(med => {
    const card = document.createElement('div');
    card.className = 'product-card'; 
    card.style.cursor = 'pointer';
    card.style.minWidth = '140px';
    card.style.padding = '12px';
    card.innerHTML = `
      <img src="${med.image}" alt="${med.name}" style="height:100px; width:100%; object-fit:cover; border-radius:12px; margin-bottom:8px;">
      <div class="product-title" style="margin-top:4px; line-height:1.2; font-size:14px; white-space:normal;">${med.name}</div>
      <div style="font-size:11px; color:var(--text-gray); margin-top:4px;">${med.category}</div>
    `;
    card.addEventListener('click', () => openMedicineReader(med));
    slider.appendChild(card);
  });
}

const linkMoreMeds = document.getElementById('link-more-medicines');
if (linkMoreMeds) {
  linkMoreMeds.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('medicine-search-input').value = '';
    document.getElementById('medicine-sort').value = 'alpha';
    renderMedicineDirectory();
    showScreen('medicineList');
  });
}

function renderMedicineDirectory() {
  const container = document.getElementById('medicine-list-container');
  const searchInput = document.getElementById('medicine-search-input').value.toLowerCase();
  const sortType = document.getElementById('medicine-sort').value;
  
  container.innerHTML = '';
  
  let filtered = medicineDatabase.filter(med => 
    med.name.toLowerCase().includes(searchInput) ||
    med.plantUsedOn.toLowerCase().includes(searchInput) ||
    med.category.toLowerCase().includes(searchInput)
  );
  
  if (sortType === 'alpha') {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortType === 'category') {
    filtered.sort((a, b) => a.category.localeCompare(b.category));
  } else if (sortType === 'plant') {
    filtered.sort((a, b) => a.plantUsedOn.localeCompare(b.plantUsedOn));
  }
  
  filtered.forEach(med => {
    const card = document.createElement('div');
    card.style.background = 'var(--bg-gray)';
    card.style.borderRadius = '16px';
    card.style.padding = '12px';
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.gap = '8px';
    card.style.cursor = 'pointer';
    
    card.innerHTML = `
      <img src="${med.image}" style="width:100%; height:100px; object-fit:cover; border-radius:12px;">
      <div style="font-size:10px; font-weight:700; color:var(--accent-orange); text-transform:uppercase;">${med.category}</div>
      <div style="font-size:14px; font-weight:600; color:var(--text-dark); line-height:1.2;">${med.name}</div>
      <div style="font-size:11px; color:var(--text-gray); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">Used on: ${med.plantUsedOn}</div>
    `;
    card.addEventListener('click', () => openMedicineReader(med));
    container.appendChild(card);
  });
}

function openMedicineReader(med) {
  document.getElementById('med-reader-hero').src = med.image;
  document.getElementById('med-reader-tag').textContent = med.category;
  document.getElementById('med-reader-title').textContent = med.name;
  document.getElementById('med-reader-usedfor').textContent = med.usedFor;
  document.getElementById('med-reader-plants').textContent = med.plantUsedOn;
  
  showScreen('medicineReader');
}

const medSearchInput = document.getElementById('medicine-search-input');
const medSortSelect = document.getElementById('medicine-sort');
if (medSearchInput) {
  medSearchInput.addEventListener('input', renderMedicineDirectory);
}
if (medSortSelect) {
  medSortSelect.addEventListener('change', renderMedicineDirectory);
}

// ==========================================
// Translation Feature
// ==========================================
async function translateText(text, targetLang = 'hi') {
  if (!text) return text;
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    const response = await fetch(url);
    const result = await response.json();
    return result[0].map(x => x[0]).join('');
  } catch (error) {
    console.error("Translation Error:", error);
    return text;
  }
}

// Article Translation
let currentArticleIsHindi = false;
let currentArticleOriginals = {};
const btnTranslateArticle = document.getElementById('btn-translate-article');
if (btnTranslateArticle) {
  btnTranslateArticle.addEventListener('click', async () => {
    const titleEl = document.getElementById('reader-title');
    const contentEl = document.getElementById('reader-content');
    
    if (currentArticleIsHindi) {
      // Revert to English
      titleEl.textContent = currentArticleOriginals.title;
      contentEl.innerHTML = currentArticleOriginals.content;
      btnTranslateArticle.innerHTML = '<span class="material-icons-round" style="font-size:14px;">translate</span> Hindi';
      currentArticleIsHindi = false;
    } else {
      // Translate to Hindi
      currentArticleOriginals.title = titleEl.textContent;
      currentArticleOriginals.content = contentEl.innerHTML;
      btnTranslateArticle.innerHTML = '<style>@keyframes spin { 100% { transform: rotate(360deg); } }</style><span class="material-icons-round" style="font-size:14px; animation: spin 2s linear infinite;">autorenew</span>';
      
      const translatedTitle = await translateText(titleEl.textContent);
      const translatedContent = await translateText(contentEl.innerText);
      
      titleEl.textContent = translatedTitle;
      contentEl.innerHTML = `<p>${translatedContent}</p>`;
      btnTranslateArticle.innerHTML = '<span class="material-icons-round" style="font-size:14px;">translate</span> English';
      currentArticleIsHindi = true;
    }
  });
}

// Medicine Translation
let currentMedIsHindi = false;
let currentMedOriginals = {};
const btnTranslateMed = document.getElementById('btn-translate-medicine');
if (btnTranslateMed) {
  btnTranslateMed.addEventListener('click', async () => {
    const titleEl = document.getElementById('med-reader-title');
    const usedForEl = document.getElementById('med-reader-usedfor');
    
    if (currentMedIsHindi) {
      // Revert to English
      titleEl.textContent = currentMedOriginals.title;
      usedForEl.textContent = currentMedOriginals.usedFor;
      btnTranslateMed.innerHTML = '<span class="material-icons-round" style="font-size:14px;">translate</span> Hindi';
      currentMedIsHindi = false;
    } else {
      // Translate to Hindi
      currentMedOriginals.title = titleEl.textContent;
      currentMedOriginals.usedFor = usedForEl.textContent;
      btnTranslateMed.innerHTML = '<style>@keyframes spin { 100% { transform: rotate(360deg); } }</style><span class="material-icons-round" style="font-size:14px; animation: spin 2s linear infinite;">autorenew</span>';
      
      const translatedTitle = await translateText(titleEl.textContent);
      const translatedUsedFor = await translateText(usedForEl.textContent);
      
      titleEl.textContent = translatedTitle;
      usedForEl.textContent = translatedUsedFor;
      btnTranslateMed.innerHTML = '<span class="material-icons-round" style="font-size:14px;">translate</span> English';
      currentMedIsHindi = true;
    }
  });
}

// Override open functions to reset translation state
const originalOpenArticle = openArticle;
openArticle = function(article, dateStr, imgUrl, sourceName) {
  currentArticleIsHindi = false;
  if (btnTranslateArticle) btnTranslateArticle.innerHTML = '<span class="material-icons-round" style="font-size:14px;">translate</span> Hindi';
  originalOpenArticle(article, dateStr, imgUrl, sourceName);
}

const originalOpenMedicineReader = openMedicineReader;
openMedicineReader = function(med) {
  currentMedIsHindi = false;
  if (btnTranslateMed) btnTranslateMed.innerHTML = '<span class="material-icons-round" style="font-size:14px;">translate</span> Hindi';
  originalOpenMedicineReader(med);
}

// Initial render
document.addEventListener('DOMContentLoaded', () => {
  renderHomeMedicines();
  renderHomeArticles();
});
renderHomeMedicines();
renderHomeArticles();
