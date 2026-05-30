
// AI Chatbot Logic
const chatInputField = document.getElementById('chat-input-field');
const chatSendBtn = document.getElementById('chat-send-btn');
const chatMessagesContainer = document.getElementById('chat-messages-container');

const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY'; // Replace with your Gemini API Key
const PLANT_ID_API_KEY = 'YOUR_PLANT_ID_API_KEY'; // Replace with your Plant.id API Key

let chatHistory = [];
// Inject the entire medicine database as context for Gemini
const systemInstruction = `You are the Herbalia AI Assistant, an expert plant doctor and botanist. You must provide helpful, friendly, and accurate advice. 
When asked about treatments or medicines, prioritize recommending from the following database of known treatments:
${JSON.stringify(medicineDatabase)}
If a user provides an image, another system will identify the disease and feed you the results. You should then summarize it and provide treatment advice based on the database.`;

function addChatMessage(text, isUser, isHtml = false) {
  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${isUser ? 'chat-right' : 'chat-left'}`;
  
  const now = new Date();
  const timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
  
  const contentHTML = isHtml ? text : text.replace(/\n/g, '<br>');
  
  bubble.innerHTML = `
    ${contentHTML}
    <div class="chat-time">${timeStr} ${isUser ? '<span class="material-icons-round" style="font-size:10px;">done_all</span>' : ''}</div>
  `;
  
  chatMessagesContainer.appendChild(bubble);
  chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
  return bubble;
}

function showTypingIndicator() {
  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble chat-left typing-indicator';
  bubble.id = 'typing-indicator';
  bubble.innerHTML = `<span class="material-icons-round" style="animation: pulse 1s infinite;">more_horiz</span>`;
  chatMessagesContainer.appendChild(bubble);
  chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
}

function hideTypingIndicator() {
  const indicator = document.getElementById('typing-indicator');
  if (indicator) indicator.remove();
}

async function callLLMAPI(userText) {
  showTypingIndicator();
  
  chatHistory.push({ role: "user", content: userText });
  
  try {
    const activeKey = GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${activeKey}`;
    
    // Format messages for Google Gemini
    const formattedContents = chatHistory.map(msg => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }]
    }));

    const response = await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemInstruction }]
        },
        contents: formattedContents
      })
    });
    
    const data = await response.json();
    hideTypingIndicator();
    
    if (data.error) {
      addChatMessage(`API Error: ${data.error.message}`, false);
    } else if (data.candidates && data.candidates.length > 0) {
      const aiText = data.candidates[0].content.parts[0].text;
      chatHistory.push({ role: "assistant", content: aiText });
      
      let formattedText = aiText
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>');
      
      addChatMessage(formattedText, false, true);
    } else {
      addChatMessage("I'm sorry, I couldn't process that request right now.", false);
    }
  } catch (err) {
    console.error("LLM API Error:", err);
    hideTypingIndicator();
    addChatMessage("Sorry, I'm having trouble connecting to the network.", false);
  }
}

function handleChatSend() {
  if(!chatInputField) return;
  const text = chatInputField.value.trim();
  if (!text) return;
  
  addChatMessage(text, true);
  chatInputField.value = '';
  
  callLLMAPI(text);
}

if(chatSendBtn) {
  chatSendBtn.addEventListener('click', handleChatSend);
}
if(chatInputField) {
  chatInputField.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleChatSend();
  });
}

// Image Upload Logic
const chatCameraBtn = document.getElementById('chat-camera-btn');
const chatGalleryBtn = document.getElementById('chat-gallery-btn');
const chatGalleryInput = document.getElementById('chat-gallery-input');

async function callPlantIdAPI(base64Data) {
  showTypingIndicator();
  
  try {
    const response = await fetch('https://api.plant.id/v2/identify', {
      method: 'POST',
      headers: {
        'Api-Key': PLANT_ID_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        images: [base64Data.split(',')[1]],
        modifiers: ["health_all", "similar_images"],
        plant_details: ["common_names"]
      })
    });
    
    const data = await response.json();
    
    // Parse result
    let promptAddition = "I have analyzed an image the user uploaded using Plant.id API. Here are the results: \\n";
    
    if (data.suggestions && data.suggestions.length > 0) {
      promptAddition += `Plant: ${data.suggestions[0].plant_name} (Probability: ${(data.suggestions[0].probability * 100).toFixed(1)}%).\\n`;
    }
    
    if (data.health_assessment && data.health_assessment.is_healthy_probability) {
      const isHealthy = data.health_assessment.is_healthy_probability > 0.5;
      promptAddition += `Health Status: ${isHealthy ? 'Healthy' : 'Sick'}.\\n`;
      
      if (!isHealthy && data.health_assessment.diseases && data.health_assessment.diseases.length > 0) {
        promptAddition += `Detected Disease: ${data.health_assessment.diseases[0].name} (Probability: ${(data.health_assessment.diseases[0].probability * 100).toFixed(1)}%).\\n`;
      }
    }
    
    promptAddition += "\\nPlease respond to the user, tell them what you found in the image, and if it's sick, provide detailed treatment advice using our medicine database.";
    
    hideTypingIndicator();
    // Send this hidden prompt to Gemini to generate the final response
    callLLMAPI(promptAddition);
    
  } catch (err) {
    console.error("Plant.id Error:", err);
    hideTypingIndicator();
    addChatMessage("Sorry, I had trouble analyzing that image. Could you try again?", false);
  }
}

function sendImageToChat(dataUrl) {
  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble chat-right';
  const now = new Date();
  const timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
  
  bubble.innerHTML = `
    <div class="chat-images">
      <img src="${dataUrl}" style="max-width:150px; border-radius:8px;">
    </div>
    <div class="chat-time">${timeStr} <span class="material-icons-round" style="font-size:10px;">done_all</span></div>
  `;
  chatMessagesContainer.appendChild(bubble);
  chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
  
  callPlantIdAPI(dataUrl);
}

function handleImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(event) {
    sendImageToChat(event.target.result);
  };
  reader.readAsDataURL(file);
  e.target.value = '';
}

if(chatCameraBtn) {
  chatCameraBtn.addEventListener('click', () => {
    isScanningForChat = true;
    showScreen('camera');
    startCamera();
  });
}
if(chatGalleryBtn) chatGalleryBtn.addEventListener('click', () => chatGalleryInput.click());
if(chatGalleryInput) chatGalleryInput.addEventListener('change', handleImageUpload);

// Toggle Oneshot/Multiple
const btnOneshot = document.getElementById('btn-mode-oneshot');
const btnMultiple = document.getElementById('btn-mode-multiple');
if (btnOneshot && btnMultiple) {
  btnOneshot.addEventListener('click', () => {
    btnOneshot.classList.add('active');
    btnMultiple.classList.remove('active');
  });
  btnMultiple.addEventListener('click', () => {
    btnMultiple.classList.add('active');
    btnOneshot.classList.remove('active');
  });
}

// Camera Info Modal
const btnCameraInfo = document.getElementById('btn-camera-info');
const modalCameraInfo = document.getElementById('camera-info-modal');
const btnCloseCameraInfo = document.getElementById('btn-close-camera-info');

if (btnCameraInfo) {
  btnCameraInfo.addEventListener('click', () => {
    modalCameraInfo.style.display = 'flex';
  });
}
if (btnCloseCameraInfo) {
  btnCloseCameraInfo.addEventListener('click', () => {
    modalCameraInfo.style.display = 'none';
  });
}
if (modalCameraInfo) {
  modalCameraInfo.addEventListener('click', (e) => {
    if (e.target === modalCameraInfo) {
      modalCameraInfo.style.display = 'none';
    }
  });
}

// Camera Gallery Upload
const btnCameraGallery = document.getElementById('btn-camera-gallery');
const cameraGalleryInput = document.getElementById('camera-gallery-input');

if (btnCameraGallery) {
  btnCameraGallery.addEventListener('click', () => {
    cameraGalleryInput.click();
  });
}
if (cameraGalleryInput) {
  cameraGalleryInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (isScanningForChat) {
      const reader = new FileReader();
      reader.onload = function(event) {
        sendImageToChat(event.target.result);
        isScanningForChat = false;
        showScreen('chat');
      };
      reader.readAsDataURL(file);
    } else {
      scanImageForDisease(file);
    }
    e.target.value = '';
  });
}

// ==========================================
// Plant Medicine Dictionary Feature
// ==========================================

