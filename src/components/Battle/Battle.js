import React, { Component } from 'react';

export default class Battle extends Component {
  
  render() {
    
    const { bg, originalUrl, enemyID } = this.props;
    
    return (
      <div className="battle-highest-parent" style={{backgroundImage: `url(${bg})`}}>
        <div className="battle-alignment" >
          <img className="battle-player-image" src="../../static/images/zones/enchanted_forest/player.png" alt="Player"/>
          <img className="battle-enemy-image" src={`../../static/images/zones/enchanted_forest/${enemyID}.png`} alt="Enemy"/>
        </div>
        <form method="POST" action="/battle_attack_post" className="battle-attack--form">
          <input type="hidden" name="zoneArea" value={originalUrl} />
          <input type="submit" id="battle-submit-attack" className="battle-attack--button" name="Attack"
                 value="Attack" />
        </form>
      </div>
    )
  }
}
