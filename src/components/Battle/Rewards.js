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
              {e.innerText}
            </div>
          )
        })}
      </div>
    )
  }

  getLevelPercentage(experienceObj) {

  }

  render() {

    const { oldGold, oldExp, newGold, newExp } = this.props.propsObject.updateExperienceAndGold;
    const randomItem = this.props.propsObject.getItemName;

    return (
      <div className="reward-highest-parent" >
        <div className="reward-gold-parent" >
          Gold:{newGold - oldGold}
        </div>
        <div className="reward-experience-parent" >
          Experience: {newExp - oldExp}
        </div>
        {this.getItemDropDiv(randomItem)}
      </div>
    )
  }
}
