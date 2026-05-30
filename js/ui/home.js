async function renderHomeArticles() {
  const slider = document.getElementById('home-articles-slider');
  if (!slider) return;
  
  if (dynamicArticles.length === 0) {
    await fetchPlantNews();
  }
  
  slider.innerHTML = '';
  
  if (dynamicArticles.length === 0) {
    slider.innerHTML = `<div style="padding:24px; color:var(--text-gray);">No articles available.</div>`;
    return;
  }
  
  const displayArticles = dynamicArticles.slice(0, 5);
  displayArticles.forEach(article => {
    const card = document.createElement('div');
    card.className = 'article-card';
    card.style.margin = '0'; // Overwrite default CSS margin
    card.style.minWidth = '280px';
    card.style.flexShrink = '0';
    
    const dateObj = new Date(article.publishedAt);
    const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const imgUrl = article.urlToImage || 'assets/mint.png';
    const sourceName = (article.source && article.source.name) ? article.source.name : 'News';

    card.innerHTML = `
      <img src="${imgUrl}" alt="Article" style="object-fit:cover;">
      <div class="article-info">
        <div class="article-tag">#research</div>
        <div class="article-title">${article.title}</div>
        <div class="article-meta">
          <span><span class="material-icons-round" style="font-size:12px;">schedule</span> ${dateStr}</span>
        </div>
      </div>
    `;
    card.addEventListener('click', () => openArticle(article, dateStr, imgUrl, sourceName));
    slider.appendChild(card);
  });
}

function openArticle(article, dateStr, imgUrl, sourceName) {
  document.getElementById('reader-hero').src = imgUrl;
  document.getElementById('reader-tag').textContent = "#research";
  document.getElementById('reader-title').textContent = article.title;
  document.getElementById('reader-source').textContent = sourceName;
  document.getElementById('reader-date').textContent = dateStr;
  
  const contentText = article.content || article.description || "No summary available.";
  document.getElementById('reader-content').innerHTML = `<p>${contentText}</p>`;
  
  const urlBtn = document.getElementById('reader-url');
  if (urlBtn) {
    urlBtn.href = article.url;
  }
  
  showScreen('articleReader');
}

const linkMoreArticles = document.getElementById('link-more-articles');
if (linkMoreArticles) {
  linkMoreArticles.addEventListener('click', (e) => {
    e.preventDefault();
    renderArticles('latest');
    document.getElementById('article-sort').value = 'latest';
    showScreen('articlesList');
  });
}

document.querySelectorAll('.section-title a').forEach(link => {
  if (link.id !== 'link-more-articles' && link.id !== 'link-more-medicines' && link.parentElement.querySelector('h3').textContent.includes('Articles')) {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      renderArticles('latest');
      document.getElementById('article-sort').value = 'latest';
      showScreen('articlesList');
    });
  }
});

const homeArticleCard = document.querySelector('#screen-home .article-card');
if(homeArticleCard) {
  homeArticleCard.addEventListener('click', () => {
    openArticle(mockArticles[0]);
  });
}

document.getElementById('article-sort').addEventListener('change', (e) => {
  renderArticles(e.target.value);
});


// Search Bar Logic
const searchInput = document.getElementById('home-search-input');
const searchResults = document.getElementById('home-search-results');

searchInput.addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase().trim();
  
  if (query.length === 0) {
    searchResults.classList.add('hidden');
    return;
  }
  
  searchResults.classList.remove('hidden');
  searchResults.innerHTML = '';
  
  let hasResults = false;

  // Search Medicines
  const matchedMedicines = medicineDatabase.filter(m => m.name.toLowerCase().includes(query) || m.category.toLowerCase().includes(query));
  if (matchedMedicines.length > 0) {
    hasResults = true;
    const header = document.createElement('div');
    header.style.padding = '8px 12px';
    header.style.background = '#f0f0f0';
    header.style.fontSize = '12px';
    header.style.fontWeight = '600';
    header.textContent = 'Medicines & Fertilizers';
    searchResults.appendChild(header);
    
    matchedMedicines.forEach(m => {
      const item = document.createElement('div');
      item.style.padding = '12px';
      item.style.borderBottom = '1px solid #eee';
      item.innerHTML = `<div style="font-weight:500;">${m.name}</div><div style="font-size:12px; color:var(--text-gray);">${m.category}</div>`;
      searchResults.appendChild(item);
    });
  }

  // Search Plants
  const matchedPlants = plantDatabase.filter(p => p.name.toLowerCase().includes(query) || p.scientific.toLowerCase().includes(query));
  if (matchedPlants.length > 0) {
    hasResults = true;
    const header = document.createElement('div');
    header.style.padding = '8px 12px';
    header.style.background = '#f0f0f0';
    header.style.fontSize = '12px';
    header.style.fontWeight = '600';
    header.textContent = 'Plants';
    searchResults.appendChild(header);
    
    matchedPlants.forEach(p => {
      const item = document.createElement('div');
      item.style.padding = '12px';
      item.style.borderBottom = '1px solid #eee';
      item.innerHTML = `<div style="font-weight:500;">${p.name}</div><div style="font-size:12px; color:var(--text-gray);">${p.scientific}</div>`;
      searchResults.appendChild(item);
    });
  }

  // Search Articles
  const matchedArticles = mockArticles.filter(a => a.title.toLowerCase().includes(query) || a.tag.toLowerCase().includes(query));
  if (matchedArticles.length > 0) {
    hasResults = true;
    const header = document.createElement('div');
    header.style.padding = '8px 12px';
    header.style.background = '#f0f0f0';
    header.style.fontSize = '12px';
    header.style.fontWeight = '600';
    header.textContent = 'Articles';
    searchResults.appendChild(header);
    
    matchedArticles.forEach(a => {
      const item = document.createElement('div');
      item.style.padding = '12px';
      item.style.borderBottom = '1px solid #eee';
      item.style.cursor = 'pointer';
      item.innerHTML = `<div style="font-weight:500;">${a.title}</div><div style="font-size:12px; color:var(--text-gray);">${a.tag}</div>`;
      item.addEventListener('click', () => {
        openArticle(a);
        searchInput.value = '';
        searchResults.classList.add('hidden');
      });
      searchResults.appendChild(item);
    });
  }

  if (!hasResults) {
    const item = document.createElement('div');
    item.style.padding = '12px';
    item.style.color = 'var(--text-gray)';
    item.style.textAlign = 'center';
    item.textContent = 'No results found.';
    searchResults.appendChild(item);
  }
});

// Close search results when clicking outside
document.addEventListener('click', (e) => {
  if (!searchResults.contains(e.target) && e.target !== searchInput) {
    searchResults.classList.add('hidden');
  }
});
