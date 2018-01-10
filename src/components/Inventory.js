import React, { Component } from 'react';

export default class Inventory extends Component {
  
  render() {
  
    const { inventoryItems } = this.props;
    function renderItems (inventoryItems) {
      const elements = [];
      if (inventoryItems) {
        inventoryItems.map((e, i) => {
          const comp = (
            <div key={i} className="inventory-item-parent">
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
                E
              </button>
           </div>
          );
          elements.push(comp);
        })
      }
      return elements;
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