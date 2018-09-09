import React, { Component } from 'react';

export default class Battle extends Component {
  
  render() {
    
    const { bg, originalUrl } = this.props;
    
    return (
      <div className="battle-highest-parent" style={{backgroundImage: `url(${bg})`}}>
        <div className="battle-alignment" >
          <img className="battle-player-image" src="/static/images/zones/enchanted_forest/player.png" />
          <img className="battle-enemy-image" src="/static/images/zones/enchanted_forest/enemy.png" />
          <form action="/battle_attack_post" method="post">
            <input type="hidden" name="zoneArea" value={originalUrl} />
            <input type="submit" id="battle-submit-attack" className="battle-attack-button" name="Attack"
            value="Attack" />
          </form>
        </div>
      </div>
    )
  }
}
