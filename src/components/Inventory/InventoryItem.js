import React, { Component } from 'react';

// Redundant component, inventory item generation has been built into the Inventory component. Leaving for possible
// future usage

export default class InventoryItem extends Component {
  
  render() {
    
    const {
      name,
      two_handed,
      min_melee_dmg,
      max_melee_dmg,
      crit_chance,
      level_requirement,
      imageSource,
      uniqueKey
    } = this.props;

    console.log('InventoryItem component created with props:', props);
    
    return (
      <div className="inventory-item-parent" key={uniqueKey}>

        <img className="" src={imageSource}/>

        <div className="inventory-item--tooltip-text-parent">
          <p className="inventory-item--item-name">
            {name}
          </p>

          <p className="inventory-item--hand-style">
            {two_handed}
          </p>

          <p className="inventory-item--damage">
            {min_melee_dmg} - {max_melee_dmg}
          </p>

          <p className="inventory-item--crit">
            {crit_chance}
          </p>

          <p className="inventory-item--req">
            {level_requirement}
          </p>
        </div>
      </div>
    );
  }
}