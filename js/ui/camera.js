// Camera Functions
function applyFlash() {
  if (stream) {
    const track = stream.getVideoTracks()[0];
    if (track) {
      const capabilities = track.getCapabilities();
      if (capabilities.torch) {
        track.applyConstraints({
          advanced: [{ torch: flashEnabled }]
        }).catch(e => console.log("Flash error:", e));
      }
    }
  }
}

async function startCamera() {
  const video = document.getElementById('camera-feed');
  stopCamera();
  try {
    stream = await navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: currentFacingMode } 
    });
    video.srcObject = stream;
    applyFlash();
  } catch (err) {
    console.error("Camera error:", err);
  }
}

function stopCamera() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
  }
}

// Navigation Events
document.getElementById('nav-home').addEventListener('click', () => showScreen('home'));
document.getElementById('nav-scan').addEventListener('click', () => {
  showScreen('camera');
  startCamera();
});
document.getElementById('nav-consult').addEventListener('click', () => showScreen('chat'));

// Back buttons
document.querySelectorAll('.nav-back').forEach(btn => {
  btn.addEventListener('click', () => {
    if (screens.camera.classList.contains('active')) {
      if (isScanningForChat) {
        isScanningForChat = false;
        showScreen('chat');
      } else {
        showScreen('home');
      }
    }
    else if (screens.result.classList.contains('active')) {
      showScreen('camera');
      startCamera();
    }
    else if (screens.chat.classList.contains('active')) showScreen('home');
    else if (screens.articlesList.classList.contains('active')) showScreen('home');
    else if (screens.articleReader.classList.contains('active')) showScreen('articlesList');
    else if (screens.medicineList.classList.contains('active')) showScreen('home');
    else if (screens.medicineReader.classList.contains('active')) showScreen('medicineList');
  });
});

// Camera Controls
const btnFlipCamera = document.getElementById('btn-flip-camera');
if (btnFlipCamera) {
  btnFlipCamera.addEventListener('click', () => {
    currentFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';
    startCamera();
  });
}

const btnToggleFlash = document.getElementById('btn-toggle-flash');
if (btnToggleFlash) {
  btnToggleFlash.addEventListener('click', (e) => {
    flashEnabled = !flashEnabled;
    e.target.textContent = flashEnabled ? 'flash_on' : 'flash_off';
    applyFlash();
  });
}



// AI Model State
let tfModel = null;
let diseaseLabels = [];

// Initialize AI Model
async function loadAIModel() {
  try {
    console.log("Loading TFLite model...");
    tflite.setWasmPath('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-tflite/dist/');
    const response = await fetch('assets/labels.txt');
    const text = await response.text();
    diseaseLabels = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    tfModel = await tflite.loadTFLiteModel('assets/model.tflite');
    console.log("Model and labels loaded successfully!");
    // alert("Model loaded successfully!"); // uncomment if we want to confirm success
  } catch (error) {
    console.error("Failed to load AI model:", error);
    alert("AI Load Error: " + error.message);
  }
}

window.addEventListener('load', loadAIModel);

// Settings Modal Listeners Removed

// Multiple Mode Toggles
document.getElementById('btn-mode-oneshot').addEventListener('click', (e) => {
  isMultipleMode = false;
  e.target.classList.add('active');
  document.getElementById('btn-mode-multiple').classList.remove('active');
});

document.getElementById('btn-mode-multiple').addEventListener('click', (e) => {
  isMultipleMode = true;
  e.target.classList.add('active');
  document.getElementById('btn-mode-oneshot').classList.remove('active');
});

// Render Multiple Gallery
function renderMultiGallery() {
  const overlay = document.getElementById('multi-gallery-overlay');
  const container = document.getElementById('multi-gallery-thumbnails');
  document.getElementById('multi-count').innerText = capturedImages.length;
  
  container.innerHTML = '';
  capturedImages.forEach((imgBase64, index) => {
    const thumbWrap = document.createElement('div');
    thumbWrap.style.position = 'relative';
    thumbWrap.style.minWidth = '80px';
    thumbWrap.style.height = '80px';
    
    const img = document.createElement('img');
    img.src = imgBase64;
    img.style.width = '80px';
    img.style.height = '80px';
    img.style.objectFit = 'cover';
    img.style.borderRadius = '12px';
    
    const delBtn = document.createElement('div');
    delBtn.innerHTML = '<span class="material-icons-round" style="font-size:16px;">close</span>';
    delBtn.style.position = 'absolute';
    delBtn.style.top = '-6px';
    delBtn.style.right = '-6px';
    delBtn.style.background = '#ff5252';
    delBtn.style.color = 'white';
    delBtn.style.borderRadius = '50%';
    delBtn.style.width = '24px';
    delBtn.style.height = '24px';
    delBtn.style.display = 'flex';
    delBtn.style.justifyContent = 'center';
    delBtn.style.alignItems = 'center';
    delBtn.style.cursor = 'pointer';
    delBtn.onclick = () => {
      capturedImages.splice(index, 1);
      if (capturedImages.length === 0) {
        overlay.style.display = 'none';
      } else {
        renderMultiGallery();
      }
    };
    
    thumbWrap.appendChild(img);
    thumbWrap.appendChild(delBtn);
    container.appendChild(thumbWrap);
  });
  
  overlay.style.display = 'block';
}

document.getElementById('btn-multi-add').addEventListener('click', () => {
  if (capturedImages.length >= 5) {
    alert("Maximum of 5 images allowed for research.");
    return;
  }
  document.getElementById('multi-gallery-overlay').style.display = 'none';
});

document.getElementById('btn-multi-analyze').addEventListener('click', () => {
  if (capturedImages.length > 0) {
    showScreen('result');
    scanWithPlantIdAPI(capturedImages, capturedImages[0]);
  }
});

// Plant.id API Inference
async function scanWithPlantIdAPI(base64ImagesArray, previewUrl) {
  const apiKey = 'YOUR_PLANT_ID_API_KEY'; // Replace with your Plant.id API Key
  const resultCard = document.getElementById('view-ai-result');
  
  if (resultCard) {
    resultCard.innerHTML = `<div style="text-align:center; padding: 40px; color: var(--primary-green);">
      <style>@keyframes spin { 100% { transform: rotate(360deg); } }</style>
      <span class="material-icons-round" style="font-size: 48px; animation: spin 2s linear infinite;">energy_savings_leaf</span>
      <h3 style="margin-top: 16px;">Plant.id AI is analyzing...</h3>
      <p style="font-size: 13px;">Universal Plant & Disease Detection</p>
    </div>`;
  }

  try {
    // Strip "data:image/jpeg;base64," prefix from all images
    const cleanedImagesArray = base64ImagesArray.map(img => img.split(',')[1] || img);

    const requestBody = {
      images: cleanedImagesArray,
      modifiers: ["health_all"],
      disease_details: ["description", "treatment"],
      plant_details: ["common_names"]
    };

    const response = await fetch(`https://api.plant.id/v2/identify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': apiKey
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Plant.id API Error: ${response.status}`);
    }

    const data = await response.json();
    
    // Parse Plant Identification (from health_assessment endpoint, it usually includes 'disease_assessment' and 'is_healthy_probability')
    let plantName = "Unknown Plant";
    let plantConfidence = 0;
    
    // For health_assessment, it might not have 'suggestions' for plant ID like /identify does.
    // Let's fallback gracefully if the user just wants the disease data.

    if (data.suggestions && data.suggestions.length > 0) {
      const topMatch = data.suggestions[0];
      const scientificName = topMatch.plant_name;
      let commonName = "";
      if (topMatch.plant_details && topMatch.plant_details.common_names && topMatch.plant_details.common_names.length > 0) {
         commonName = topMatch.plant_details.common_names[0];
      }
      if (commonName) {
         plantName = `${commonName} <span style="font-size:12px; font-weight:normal; opacity:0.8;">(${scientificName})</span>`;
      } else {
         plantName = scientificName;
      }
      plantConfidence = Math.round(topMatch.probability * 100);
    }
    
    // Parse Disease Identification
    let diseaseStatus = "Healthy";
    let diseaseDetails = "This plant appears to be healthy and well cared for.";
    let diseaseColor = "var(--primary-green)";
    
    if (data.health_assessment && data.health_assessment.is_healthy === false) {
      if (data.health_assessment.diseases && data.health_assessment.diseases.length > 0) {
         const topDisease = data.health_assessment.diseases[0];
         diseaseStatus = topDisease.name;
         diseaseDetails = `We detected signs of ${topDisease.name}. ` + (topDisease.disease_details ? topDisease.disease_details.description : "Please monitor the plant closely for worsening symptoms.");
         diseaseColor = "#d93025";
      }
    }

    // Translate to Hindi using free Google Translate API
    let diseaseStatusHi = "";
    let diseaseDetailsHi = "";
    try {
      const resStatus = await fetch('https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=hi&dt=t&q=' + encodeURIComponent(diseaseStatus));
      const dataStatus = await resStatus.json();
      diseaseStatusHi = dataStatus[0].map(x => x[0]).join('');
      
      const resDetails = await fetch('https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=hi&dt=t&q=' + encodeURIComponent(diseaseDetails));
      const dataDetails = await resDetails.json();
      diseaseDetailsHi = dataDetails[0].map(x => x[0]).join('');
    } catch (e) {
      console.error("Translation error", e);
    }

    // Recommend a medicine
    let recommendedMed = null;
    if (diseaseStatus !== "Healthy") {
      const diseaseLower = diseaseStatus.toLowerCase();
      
      recommendedMed = medicineDatabase.find(m => {
        const cat = m.category.toLowerCase();
        
        if (diseaseLower.includes('fung') || diseaseLower.includes('rot') || diseaseLower.includes('mildew') || diseaseLower.includes('spot') || diseaseLower.includes('blight')) {
          if (cat.includes('fungicide')) return true;
        }
        if (diseaseLower.includes('insect') || diseaseLower.includes('bug') || diseaseLower.includes('aphid') || diseaseLower.includes('mite') || diseaseLower.includes('whitefly') || diseaseLower.includes('scale')) {
          if (cat.includes('insecticide') || cat.includes('biological control')) return true;
        }
        if (diseaseLower.includes('nutrient') || diseaseLower.includes('deficiency') || diseaseLower.includes('yellow')) {
          if (cat.includes('fertilizer')) return true;
        }
        return false;
      });
      
      if (!recommendedMed) {
        recommendedMed = medicineDatabase.find(m => m.name.includes('Neem Oil')) || medicineDatabase[6]; 
      }
    }

    if (resultCard) {
      resultCard.innerHTML = `
        <div class="diagnosis-header" style="background: linear-gradient(135deg, #e8f0fe 0%, #ffffff 100%); border: 1px solid #d2e3fc;">
          <img src="${previewUrl}" class="diagnosis-img">
          <div>
            <div class="diagnosis-title" style="text-transform: capitalize; color: #1a73e8;">
              <span class="material-icons-round" style="font-size:18px;">energy_savings_leaf</span> ${plantName}
            </div>
            <div class="diagnosis-subtitle" style="margin-top:4px; font-weight:600;">
              <span style="color:${diseaseColor}">${diseaseStatus} ${diseaseStatusHi ? `<br><span style="font-size:12px; opacity:0.8;">(${diseaseStatusHi})</span>` : ''}</span>
            </div>
          </div>
        </div>
        <div class="diagnosis-text">
          <h4 style="margin-top:0;">Plant.id Diagnosis:</h4>
          <p style="font-size:13px; line-height:1.5; color:#333; margin-bottom:8px;">${diseaseDetails}</p>
          ${diseaseDetailsHi ? `<p style="font-size:14px; line-height:1.5; color:#444; border-left:3px solid #1a73e8; padding-left:8px; background:#f8f9fa;">${diseaseDetailsHi}</p>` : ''}
          <div style="margin-top:8px; font-size:11px; color:#666;">Confidence: ${plantConfidence}%</div>
          
          ${recommendedMed ? `
            <div id="recommended-med-card" style="margin-top: 16px; padding: 12px; border-radius: 12px; background: white; border: 1px solid #e0e0e0; cursor: pointer; display: flex; align-items: center; gap: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
              <img src="${recommendedMed.image}" style="width:48px; height:48px; border-radius:8px; object-fit:cover; background:#f8f9fa;">
              <div style="flex:1;">
                <div style="font-size:11px; color:var(--primary-green); font-weight:700; text-transform:uppercase; letter-spacing:0.5px; display:flex; align-items:center; gap:4px;"><span class="material-icons-round" style="font-size:12px;">medication</span> Recommended Treatment</div>
                <div style="font-size:14px; font-weight:600; color:#333; margin-top:2px;">${recommendedMed.name}</div>
                <div style="font-size:11px; color:#666; margin-top:2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px;">${recommendedMed.category}</div>
              </div>
              <span class="material-icons-round" style="color:var(--text-gray);">chevron_right</span>
            </div>
          ` : ''}
        </div>
      `;

      if (recommendedMed) {
        const medCard = document.getElementById('recommended-med-card');
        if (medCard) {
          medCard.addEventListener('click', () => {
            if (typeof openMedicineReader === 'function') {
              openMedicineReader(recommendedMed);
            }
          });
        }
      }
    }
  } catch (error) {
    console.error("Plant.id Scan Error:", error);
    if (resultCard) {
      resultCard.innerHTML = `<div style="text-align:center; padding: 40px; color: #ff5252;">
        <span class="material-icons-round" style="font-size: 48px;">error_outline</span>
        <h3 style="margin-top: 16px;">Plant.id API Failed</h3>
        <p style="font-size: 13px;">${error.message}. Please try scanning again.</p>
      </div>`;
    }
    alert("Scanner Error: " + error.message);
  }
}

// Local Edge AI Inference
async function scanImageForDisease(imageElementOrCanvas) {
  let previewUrl = '';
  let pixelsElement = imageElementOrCanvas;
  let base64Image = '';
  
  if (imageElementOrCanvas instanceof Blob) {
    previewUrl = URL.createObjectURL(imageElementOrCanvas);
    base64Image = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(imageElementOrCanvas);
    });
  } else {
    previewUrl = imageElementOrCanvas.toDataURL('image/jpeg');
    base64Image = previewUrl;
  }

  if (isMultipleMode) {
    if (capturedImages.length < 5) {
      capturedImages.push(base64Image);
      renderMultiGallery();
    } else {
      alert("Maximum of 5 images allowed.");
    }
    return;
  }

  showScreen('result');
  const resultCard = document.getElementById('view-ai-result');
  
  if (resultCard) {
    resultCard.innerHTML = `<div style="text-align:center; padding: 40px; color: var(--primary-green);">
      <style>@keyframes spin { 100% { transform: rotate(360deg); } }</style>
      <span class="material-icons-round" style="font-size: 48px; animation: spin 2s linear infinite;">autorenew</span>
      <h3 style="margin-top: 16px;">AI is analyzing...</h3>
    </div>`;
  }

  try {
    // Run Plant.id API for Oneshot
    return scanWithPlantIdAPI([base64Image], previewUrl);
  } catch (error) {
    console.error(error);
    if (resultCard) {
      resultCard.innerHTML = `<div style="text-align:center; padding: 40px; color: #ff5252;">
        <span class="material-icons-round" style="font-size: 48px;">error_outline</span>
        <h3 style="margin-top: 16px;">Scan Failed</h3>
        <p style="font-size: 13px;">${error.message}</p>
      </div>`;
    }
    alert("Scan Failure: " + error.message);
  }
}

function renderLocalAIResult(diseaseName, confidence, imageUrl, debugText) {
  const resultCard = document.getElementById('view-ai-result');
  if (!resultCard) return;

  resultCard.innerHTML = `
    <div class="diagnosis-header">
      <img src="${imageUrl}" class="diagnosis-img">
      <div>
        <div class="diagnosis-title" style="text-transform: capitalize;">
          <span class="material-icons-round" style="font-size:18px;">warning</span> ${diseaseName}
        </div>
        <div class="diagnosis-subtitle" style="margin-top:4px;">
          Confidence: ${confidence}%
        </div>
      </div>
    </div>
    <div class="diagnosis-text">
      <h4 style="margin-top:0;">Diagnosis Details:</h4>
      <p style="font-size:13px; line-height:1.5;">Our local AI model has identified this with ${confidence}% confidence.</p>
      <div style="margin-top:10px; padding:8px; background:#f5f5f5; border-radius:4px; font-family:monospace; font-size:11px; color:#666;">
        <strong>Debug Info:</strong><br>
        ${debugText}
      </div>
    </div>
  `;
}

// Camera Capture
document.getElementById('btn-capture').addEventListener('click', () => {
  const video = document.getElementById('camera-feed');
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth || 400;
  canvas.height = video.videoHeight || 400;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  
  if (isScanningForChat) {
    sendImageToChat(canvas.toDataURL('image/jpeg'));
    isScanningForChat = false;
    showScreen('chat');
  } else {
    scanImageForDisease(canvas);
  }
});


// Articles Feature
async function renderArticles(sortType = 'latest') {
  const container = document.getElementById('articles-container');
  
  if (dynamicArticles.length === 0) {
    container.innerHTML = `
      <div id="articles-loading" style="text-align:center; padding:40px; color:var(--primary-green);">
        <style>@keyframes spin { 100% { transform: rotate(360deg); } }</style>
        <span class="material-icons-round" style="font-size: 32px; animation: spin 2s linear infinite;">autorenew</span>
        <div style="margin-top:16px; font-weight:500;">Fetching latest news...</div>
      </div>
    `;
    await fetchPlantNews();
  }
  
  container.innerHTML = '';

  if (dynamicArticles.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:40px; color:var(--text-gray);">No articles found or API limit reached.</div>`;
    return;
  }

  let sorted = [...dynamicArticles];
  
  // Note: NewsAPI articles don't have 'likes', so sorting is mostly visual mock for now
  if (sortType === 'likes') {
    sorted.sort(() => Math.random() - 0.5); 
  } else if (sortType === 'featured') {
    sorted = sorted.slice(0, 5); 
  } else {
    // Already sorted by publishedAt from API
  }

  sorted.forEach(article => {
    const card = document.createElement('div');
    card.className = 'article-card';
    card.style.margin = '0';
    
    // Format date
    const dateObj = new Date(article.publishedAt);
    const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    // Fallback image
    const imgUrl = article.urlToImage || 'assets/mint.png';
    const sourceName = (article.source && article.source.name) ? article.source.name : 'News';

    card.innerHTML = `
      <img src="${imgUrl}" alt="Article" style="object-fit:cover;">
      <div class="article-info">
        <div class="article-tag">#research</div>
        <div class="article-title">${article.title}</div>
        <div class="article-meta">
          <span><span class="material-icons-round" style="font-size:12px;">schedule</span> ${dateStr}</span>
          <span><span class="material-icons-round" style="font-size:12px;">language</span> ${sourceName}</span>
        </div>
      </div>
    `;
    card.addEventListener('click', () => openArticle(article, dateStr, imgUrl, sourceName));
    container.appendChild(card);
  });
}

