import React, { Component } from 'react';

export default class LostBattle extends Component {

  render() {

    //const {  } = this.props;

    return (
      <div className="battle-lost--highest-parent" >
        <div className="battle-lost--align-text">
          Oh dear you died!
        </div>
        <form action="/map" method="get">
          <input type="submit" value="Return to Map" />
        </form>
      </div>
    )
  }
}
