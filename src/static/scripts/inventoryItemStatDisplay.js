const inventoryItemIconContainer = document.querySelector(".inventory-item-icon-container");
const statDisplayImage = document.querySelector(".inventory-stat-display--image");
const statDisplayItemName = document.querySelector(".inventory-stat-display--item-name");
const statDisplayDamage = document.querySelector(".inventory-stat-display--damage");
const statDisplayHands = document.querySelector(".inventory-stat-display--hand-style");
const statDisplayCrit = document.querySelector(".inventory-stat-display--critical-chance");
const statDisplayRequiredLevel = document.querySelector(".inventory-stat-display--req");
//const statDisplaySellValue = document.querySelector(".inventory-stat-display--sell-value");
const weaponDataLookup = JSON.parse(allItemStatData);

function getImagePath(itemID) {
  return { //TODO update to production values
    1: "../../static/images/weapons/game/iron_shortsword.png",
    2: "../../static/images/weapons/game/iron_longsword.png",
    3: "../../static/images/weapons/game/iron_greatsword.png",
    4: "../../static/images/weapons/game/wooden_wand.png",
    5: "../../static/images/weapons/game/wooden_staff.png"
  }[itemID]
}

function updateStatDisplay(weaponID) {

  const itemData = weaponDataLookup[weaponID - 1]; // itemIDs are index from 1 but the lookup starts at 0

  statDisplayImage.src               = getImagePath(weaponID);
  statDisplayItemName.innerText      = itemData.name;
  statDisplayDamage.innerText        = `Damage: ${itemData.min_melee_damage}-${itemData.max_melee_damage}`;
  statDisplayHands.innerText         = (itemData.two_handed ? "2" : "1") +  " Handed";
  statDisplayCrit.innerText          = `Critical chance: ${itemData.crit_chance}%`;
  statDisplayRequiredLevel.innerText = `Required level: ${itemData.level_requirement}`;
  //statDisplaySellValue.innerText     =

}

// event delegation is used for this click handling. Rather than assigning an onClick handler for each item element
// we simply assign it to the container and use event.target to determine what was clicked
inventoryItemIconContainer.addEventListener('click', (event) => {
  updateStatDisplay(event.target.getAttribute('data-weaponid'));
});