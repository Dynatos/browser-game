import React, { Component } from 'react';

export default class Battle extends Component {
  
  render() {
    
    const { bg } = this.props;
    
    return (
      <div className="battle-highest-parent" style={{backgroundImage: `url(${bg})`}}>
        <img className="battle-player-image" src="/static/images/zones/enchanted_forest/player.png" />
        <img className="battle-enemy-image" src="/static/images/zones/enchanted_forest/enemy.png" />
        <button className="battle-attack-button">
          Attack
        </button>
      </div>
    )
  }
}