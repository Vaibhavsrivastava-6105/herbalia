function showScreen(screenName) {
  Object.values(screens).forEach(s => {
    s.classList.add('hidden');
    s.classList.remove('active');
  });
  screens[screenName].classList.remove('hidden');
  setTimeout(() => {
    screens[screenName].classList.add('active');
  }, 10);

  const bottomNav = document.querySelector('.bottom-nav');
  if (screenName === 'home') {
    bottomNav.classList.remove('hidden');
  } else {
    bottomNav.classList.add('hidden');
  }

  if (screenName !== 'camera' && stream) {
    stopCamera();
  }
}

