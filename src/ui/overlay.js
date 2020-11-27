// Vendor
const {ipcRenderer} = require('electron');
const settings = require('electron-settings');

// Services
const {fetchStashItems} = require('../services/stash-items');
const {aggregateChaosRecipe} = require('../services/chaos-recipe');
const {fetchCurrentLeague} = require('../services/active-leagues');

const refreshChaosRecipe = async () => {
  const updateIndicator = (indicatorId, {isDanger, isWarning, totalCount}) => {
    const slotElement = document.getElementById(indicatorId);
    const valueElement = slotElement.querySelector('span');

    slotElement.classList.remove('danger');
    slotElement.classList.remove('warning');
    slotElement.classList.add('grey');


    if (isDanger) {
      slotElement.classList.add('danger');
      slotElement.classList.remove('grey');
    } else if (isWarning) {
      slotElement.classList.add('warning');
      slotElement.classList.remove('grey');
    }

    valueElement.textContent = totalCount;
  };

  const {league: leagueSetting, account, sessionId, stashIds} = settings.get('user');
  const league = await fetchCurrentLeague(leagueSetting);

  try {
    const stashItems = await fetchStashItems(stashIds, {league, account, sessionId});
    const chaosRecipe = aggregateChaosRecipe(stashItems);

    updateIndicator('hand', chaosRecipe.hand);
    updateIndicator('bodyArmour', chaosRecipe.bodyArmour);
    updateIndicator('helmet', chaosRecipe.helmet);
    updateIndicator('glove', chaosRecipe.glove);
    updateIndicator('boot', chaosRecipe.boot);
    updateIndicator('belt', chaosRecipe.belt);
    updateIndicator('ring', chaosRecipe.ring);
    updateIndicator('amulet', chaosRecipe.amulet);
  } catch (error) {
    console.log("Overlay poll error", error);
  }
};

ipcRenderer.on('forceChaosRecipeRefresh', () => refreshChaosRecipe());
setInterval(() => refreshChaosRecipe(), settings.get('overlay.refreshTime') * 1000 || 30000);
refreshChaosRecipe();

const ForceRefreshButtonElement = document.getElementById('force-refresh-button');
ForceRefreshButtonElement.onclick = () => {
  refreshChaosRecipe();
}

const OpenOptionsButtonElement = document.getElementById('open-options-button');
OpenOptionsButtonElement.onclick = () => {
  ipcRenderer.send('open-options');
}

