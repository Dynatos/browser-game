import React, { Component } from 'react';

export default class Rewards extends Component {

  getItemDropDiv(itemData) {

    if (!itemData) {
      return <div className="reward-item--no-item">No item drop</div>;
    }

    return (
      <div className="reward-item-parent" >
        {itemData.map((e) => {
          return (
            <div className="reward-item-child" >
              {e.name}
            </div>
          )
        })}
      </div>
    )
  }

  getLevelPercentage(oldExp, newExp, levelObject) {

  }

  fillBar() {
    return {width: '50%'}
  }

  render() {

    const { oldGold, oldExp, newGold, newExp } = this.props.propsObject.updateExperienceAndGold;
    const randomItem = this.props.propsObject.getItemName;

    return (
      <div className="reward-highest-parent" >

        <div>JSON:{JSON.stringify(this.props.propsObject)}</div>

        <div className="reward-gold-parent" >
          Gold:{newGold - oldGold}
        </div>

        <div className="reward-experience-parent" >
          Experience Gained: {newExp - oldExp}
          <div className="reward-experience--progress-bar-parent">
            <div className="reward-experience--progress-bar-child--bar" style={this.fillBar()}/>
          </div>
        </div>

        {this.getItemDropDiv(randomItem)}


        <a href="/inventory">
          Inventory
        </a>
        <a href="/map">
          Map
        </a>

      </div>
    )
  }
}
