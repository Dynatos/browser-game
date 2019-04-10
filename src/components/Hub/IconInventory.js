import React, { Component } from 'react';

// The inventory component is responsible for displaying all the items in the users inventory. This component must be
// called with inventory item data as props in order to display items.

export default class IconInventory extends Component {

  constructor(props) {
    super(props);
    this.state = {
      inventoryItemDataArray: [],
      currentInventoryItemDisplay: -1
    };
  }

  render() {

    // itemIDs is an array of IDs associated with the user in the inventory table, dupes represent multiple of an item
    const { results, itemIDs } = this.props.inventoryItemDataObject;

    // IIFE that forms inventoryItems object lookup table for use while mapping in renderItems
    const inventoryItems = (function() {
      const lookupTableByItemID = {}; // lookup table that stores item data by id
      if (results) {
        results.forEach(function (e) {
          lookupTableByItemID[e.id] = e;
        });
        return lookupTableByItemID;
      }
    })();

    // renderItems takes in item data (from the db) and creates an element for each of the items using a map function
    // Each element is stored in the elements array, and the function returns that array when the map is complete
    function renderItems (inventoryItems) {
      const elements = []; // array that will store all inventory item elements, to be returned by renderItems function

      if (inventoryItems && itemIDs && typeof inventoryItems !== 'undefined' && typeof itemIDs[0] !== 'undefined') { // makes sure that all data is present before attempting to populate inventory
        itemIDs.map((elm, index) => {
          const e = inventoryItems[elm]; // elm is current itemID, inventoryItems is item lookup table
          const element = (
            <div key={`inventory-item-index-${index}`} className="inventory-item-parent">
              <p className="inventory-item--item-name">
                {e.name}
              </p>
              <p className="inventory-item--hand-style">
                {e.two_handed === true ? 2 : 1}
              </p>
              <p className="inventory-item--damage">
                {`${e.min_melee_damage}-${e.max_melee_damage}`}
              </p>
              <p className="inventory-item--crit">
                {e.crit_chance}
              </p>
              <p className="inventory-item--req">
                {e.level_requirement}
              </p>
              <button className="inventory-item--equip">
                Equip
              </button>
            </div>
          );

          elements.push(element); // pushes current inventory element into the array returned by renderItems
        }) // end of itemIDs.map
      }
      return elements || []; // array that stores all inventory item elements, returned by renderItems function
    }

    return (
      <div className="inventory-highest-parent navigation-shell-internal-component">
        <div className="inventory-item-legend">
          <p className="inventory-item-legend-item-name">
            Name
          </p>
          <p className="inventory-item-legend-hand-style">
            Hands
          </p>
          <p className="inventory-item-legend-damage">
            Damage
          </p>
          <p className="inventory-item-legend-crit">
            Crit
          </p>
          <p className="inventory-item-legend-req">
            Level
          </p>
          <p className="inventory-item-legend-equip">
            Equip
          </p>
        </div>
        <div id="inventory" className="inventory-item-container">
          {renderItems(inventoryItems)}
        </div>
      </div>
    );
  }
}