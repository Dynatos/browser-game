import React, { Component } from 'react';

export default class InventoryItem extends Component {
  
  render() {
    
    const { name, two_handed, min_melee_dmg, max_melee_dmg, crit_chance, level_requirement } = this.props;
    console.log('InventoryItem component created with props:', props);
    
    return (
      <div className="inventory-item-parent">
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
        <p className="inventory-item--sell">
          <img className="character-data-gold-image" src="/static/images/gold.png" />
        </p>
      </div>
    );
  }
}