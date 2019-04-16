import react from 'react';
const itemStatDisplayContainer = document.querySelector("inventory-stat-display--highest-parent");
const itemIconContainer = document.querySelector("inventory-item-icon-container");

function getImagePath(itemID) {
  return { //TODO update to production values
    1: "../../static/images/weapons/game/iron_shortsword.png",
    2: "../../static/images/weapons/game/iron_longsword.png",
    3: "../../static/images/weapons/game/iron_greatsword.png",
    4: "../../static/images/weapons/game/wooden_wand.png",
    5: "../../static/images/weapons/game/wooden_staff.png"
  }[itemID]
}

function renderStatDisplay(weaponID) {
  const itemData = [];
  const imageElement = react.createElement('img');
  imageElement.className = "inventory-stat-display--image";
  imageElement.src = getImagePath(weaponID);
  imageElement.alt = "Weapon icon";

  const newStatDisplay = (
    <div className="inventory-stat-display--alignment">

      <div className="inventory-stat-display--image-container">
        {imageElement}
        {/*<img className="inventory-stat-display--image" src={getImagePath(weaponID)} alt="item icon" />*/}
      </div>

      <div className="inventory-stat-display--item-name">
        {itemData.name}
      </div>
      <div className="inventory-stat-display--damage">
        Damage: {`${itemData.min_melee_damage}-${itemData.max_melee_damage}`}
      </div>
      <div className="inventory-stat-display--hand-style">
        {itemData.two_handed ? "2" : "1"} Handed
      </div>
      <div className="inventory-stat-display--critical-chance">
        Critical chance: {itemData.crit_chance}%
      </div>
      <div className="inventory-stat-display--req">
        Required level: {itemData.level_requirement}
      </div>
      <div className="inventory-stat-display--sell-value">
        Sell value
      </div>
      <form method="POST" action="/equip_weapon" className="inventory-stat-display--equip">
        <button type="submit" name="equip" value={id} >Equip</button>
      </form>

    </div>
  );

  // return (
  //   <div className="inventory-stat-display--parent">
  //
  //     <div className="inventory-stat-display--image-container">
  //       <img className="inventory-stat-display--image" src={getImagePath(1)} alt="item icon" />
  //     </div>
  //
  //     <div className="inventory-stat-display--item-name">
  //       Name
  //     </div>
  //
  //     <div className="inventory-stat-display--damage">
  //       Damage
  //     </div>
  //
  //     <div className="inventory-stat-display--hand-style">
  //       Hands
  //     </div>
  //
  //     <div className="inventory-stat-display--critical-chance">
  //       Critical chance
  //     </div>
  //
  //     <div className="inventory-stat-display--req">
  //       Level
  //     </div>
  //
  //     <div className="inventory-stat-display--sell-value">
  //       Sell value
  //     </div>
  //
  //     <div className="inventory-stat-display--equip">
  //       Equip
  //     </div>
  //
  //   </div>
  // )
}