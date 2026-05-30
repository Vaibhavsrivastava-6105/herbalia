const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();

  async function testDevice(deviceOptions, deviceName, imageName) {
    console.log('\n--- Testing ' + deviceName + ' with ' + imageName + ' ---');
    const page = await browser.newPage();
    
    // Set device dimensions and user agent
    await page.emulate(deviceOptions);
    
    let errorFound = false;
    page.on('pageerror', err => {
      console.log('[' + deviceName + '] PAGE ERROR:', err.message);
      errorFound = true;
    });
    
    await page.goto('http://localhost:8080');
    
    // Inject image into canvas and call scanner
    const result = await page.evaluate(async (imgName) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = 'assets/' + imgName;
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          
          try {
            await scanImageForDisease(canvas);
            
            // Wait for API to return (poll until 'AI is analyzing' is gone)
            const check = setInterval(() => {
              const html = document.getElementById('view-ai-result').innerHTML;
              if (!html.includes('AI is analyzing')) {
                clearInterval(check);
                const hasMedicine = html.includes('Recommended Treatment');
                const titleMatch = html.match(/class="diagnosis-title"[^>]*>(.*?)<\/div>/s);
                resolve({ 
                  success: true, 
                  hasMedicine: hasMedicine,
                  title: titleMatch ? titleMatch[1].replace(/<[^>]*>?/gm, '').trim() : 'Unknown'
                });
              }
            }, 500);
          } catch(e) {
            resolve({ success: false, error: e.message });
          }
        };
        img.onerror = () => resolve({ success: false, error: 'Image failed to load' });
      });
    }, imageName);
    
    console.log('[' + deviceName + '] Scan Result:', result);
    if (errorFound) console.log('[' + deviceName + '] FAILED with page errors.');
    else console.log('[' + deviceName + '] SUCCESS.');
    
    await page.close();
  }

  // Device descriptors
  const pixel5 = puppeteer.KnownDevices['Pixel 5'];
  const ipad = puppeteer.KnownDevices['iPad Pro 11'];
  const desktop = {
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/114.0.0.0 Safari/537.36'
  };

  await testDevice(pixel5, 'Android (Pixel 5)', 'mint.png');
  await testDevice(ipad, 'Tablet (iPad Pro)', 'ginger.png');
  await testDevice(desktop, 'Laptop (Windows Desktop)', 'chamomile.png');

  await browser.close();
})();
