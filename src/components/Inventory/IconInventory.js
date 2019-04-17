import React, { Component } from 'react';

// The inventory component is responsible for displaying all the items in the users inventory. This component must be
// called with inventory item data as props in order to display items.

function makeItemIDLookupTable(results) {
  const lookupTableByItemID = {}; // lookup table that stores item data by id
  if (results) {
    results.forEach(function (e) {
      lookupTableByItemID[e.id] = e;
    });
    return lookupTableByItemID;
  }
}

function getImagePath(itemID) {
  return { //TODO update to production values
    1: "../../static/images/weapons/game/iron_shortsword.png",
    2: "../../static/images/weapons/game/iron_longsword.png",
    3: "../../static/images/weapons/game/iron_greatsword.png",
    4: "../../static/images/weapons/game/wooden_wand.png",
    5: "../../static/images/weapons/game/wooden_staff.png"
  }[itemID]
}

// renderItems takes in item data (from the db) and creates an element for each of the items using a map function
// Each element is stored in the elements array, and the function returns that array when the map is complete
function renderItems(itemIDLookupTable, itemIDs) {

  const inventoryDOMElements = []; // array that will store all inventory item elements, to be returned by renderItems function
  const itemDataForDisplay = {};

  if ( // makes sure that all data is present before attempting to populate inventory
    itemIDLookupTable
    && itemIDs
    && typeof itemIDLookupTable !== 'undefined'
    && typeof itemIDs[0] !== 'undefined'
  ) {
    // each ID (including duplicates) represents an element that we need to render
    itemIDs.forEach((currentItemObject, index) => {
      const currentItemID = currentItemObject.item_id;
      // const currentItemData = itemIDLookupTable[currentItemID];
      const currentElement = (
        <div key={`inventory-item-index-${index}`} className="inventory-item-icon--image-parent">

          <img className="inventory-item-icon--image"
               src={getImagePath(currentItemID)}
               alt="item icon"
               data-weaponid={currentItemID} />

        </div>
      );

      inventoryDOMElements.push(currentElement); // pushes current inventory element into the array returned by renderItems
    }) // end of itemIDs.map
  }
  return inventoryDOMElements || [(<div>You don't have any items!</div>)]; // array that stores all inventory item elements, returned by renderItems function
}

function renderStatDisplayWithFirstInventoryItem(inventoryItemDataObject, itemIDLookupTable) {

  if (!inventoryItemDataObject) {
    return (
      <div>
        You don't have any items!
      </div>
    )
  }
  const id = inventoryItemDataObject.item_id;
  const itemData = itemIDLookupTable[id];

  return (
    <div className="inventory-stat-display--alignment">

      <div className="inventory-stat-display--image-container">
        <img className="inventory-stat-display--image" src={getImagePath(id)} alt="item icon" />
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
  )
}

export default class IconInventory extends Component {

  render() {

    // itemIDs is an array of IDs of items in the user's inventory, dupes represent multiple of an item
    const { results, itemIDs } = this.props.inventoryItemDataObject;

    // object lookup table for use while mapping in renderItems
    const itemIDLookupTable = makeItemIDLookupTable(results);

    return (
      <div className={"inventory--highest-parent " + this.props.className}>

        <div className="inventory-item-icon-container">
          {renderItems(itemIDLookupTable, itemIDs)}
        </div>

        <div className="inventory-stat-display--highest-parent">
          {renderStatDisplayWithFirstInventoryItem(itemIDs[0], itemIDLookupTable)}
        </div>

      </div>
    );
  }
}