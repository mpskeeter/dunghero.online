const zoo = document.querySelector('.zoo');
const scoreElement = document.querySelector('.score .value');
const socket = io();

const animalsById = {};
const dungsById = {};

function removeDung(dung) {
  dung.classList.add('shrink');
  dung.addEventListener('animationend', () => {
    dung.remove();
  });
}

function collectDung(dung) {
  return () => {
    socket.emit('collect-dung', {
      id: dung.id,
    });
    if (dungsById[dung.id]) {
      removeDung(dungsById[dung.id]);
      delete dungsById[dung.id];
    }
  };
}

let firstRun = true;
function updateView(gameState) {
  scoreElement.textContent = gameState.dungCollected;
  const dungIds = {};
  gameState.dungs.forEach((dung) => {
    dungIds[dung.id] = true;
    if (!dungsById[dung.id]) {
      const dungElement = document.createElement('span');
      dungElement.classList.add('emoji');
      dungElement.classList.add('dung');
      dungElement.textContent = '💩';
      dungsById[dung.id] = dungElement;
      dungElement.addEventListener('click', collectDung(dung));
      zoo.appendChild(dungElement);
    }
    dungsById[dung.id].style.top = `${dung.location.y * 100}vh`;
    dungsById[dung.id].style.left = `${dung.location.x * 100}vw`;
  });
  Object.entries(dungsById).forEach(([id, dung]) => {
    if (!dungIds[id]) {
      removeDung(dung);
    }
  });
  const animalIds = {};
  gameState.animals.forEach((animal) => {
    animalIds[animal.id] = true;
    let animalElement = animalsById[animal.id];
    if (!animalElement) {
      animalElement = document.createElement('span');
      animalElement.classList.add('emoji');
      animalElement.classList.add('animal');
      animalElement.textContent = animal.emoji;
      animalsById[animal.id] = animalElement;
      zoo.appendChild(animalElement);
    }
    if (animal.hasUpdate || firstRun) {
      animalElement.style.top = `${animal.location.y * 100}vh`;
      animalElement.style.left = `${animal.location.x * 100}vw`;
      const duration = (animal.endTime - Date.now()) / 1000;
      animalElement.style.transition = `all ${duration}s ease-in-out`;
      const bounceDuration = 250 + Math.floor(Math.random() * 200);
      let animationName = 'bounce';
      if (animal.nextLocation.x > animal.location.x) {
        animationName = 'flip-bounce';
      }
      animalElement.style.animation = `${animationName} ${bounceDuration}ms alternate ease-in-out infinite`;
      setTimeout(() => {
        animalElement.style.top = `${animal.nextLocation.y * 100}vh`;
        animalElement.style.left = `${animal.nextLocation.x * 100}vw`;
      }, 200);
    }
  });
  Object.entries(animalsById).forEach(([id, animal]) => {
    if (!animalIds[id]) {
      animal.remove();
    }
  });
  firstRun = false;
}

socket.on('game-state', updateView);
