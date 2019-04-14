import React, { Component } from 'react';

export default class Rewards extends Component {

  getItemDropDiv(itemData) {

    if (!itemData) {
      return <div className="reward-item--no-item">No item drop</div>;
    }

    return (
      <div className="reward-item-parent" >
        Item drop received:
        {itemData.map((e, i) => {
          return (
            <div className="reward-item-child" key={`rewards-item-${i}`}>
              {e.name}
            </div>
          )
        })}
      </div>
    )
  }

  getLevelPercentage(levelObject, experienceObject) {
    const remainder = levelObject.remainder;
    const expToNextLevel = experienceObject[levelObject.level + 1];

    return Math.round((remainder / expToNextLevel) * 100);
    // remainder is the current exp towards next level, dividing by the exp required gives a percentage between 0-1
    // multiplying by 100 gives a percentage 0-100, which we use to size our progress bar via css

    // TODO remove
    // probably unneccesary but I haven't fully tested the above 1-liner so this is here for now
    // return (
    //   (remainder / expToNextLevel) // get percentage to fill progress bar, can be a long number which screws the css
    //   .toString() // make it a string
    //   .split('') // make the string an array of characters
    //   .map((e, i) => { // map over the characters
    //     if (i >= 2 && i <= 3) {
    //       return e
    //     } // ignore the characters past the second index
    //   })
    //   .filter(e => e) // filter empty responses, shouldn't be necessary but it wasn't working without
    //   .join('') // make the array back into a string
    // )
  }

  fillBar(percentage) {
    return {maxWidth: `${percentage}%`}
  }



  render() {

    const { oldGold, oldExp, newGold, newExp } = this.props.propsObject.updateExperienceAndGold;
    const randomItem = this.props.propsObject.getItemName;
    const { experienceAndLevelObject } = this.props.propsObject;
    const experienceObject = this.props.propsObject.experienceObject;

    return (
      <div className={"reward-highest-parent " + this.props.className } >

        <div className="reward-gold-parent" >
          Gold: {newGold - oldGold}
        </div>

        <div className="reward-experience-parent" >
          <div className="reward-experience--gained-experience">
            Experience Gained: {newExp - oldExp}
          </div>
          <div className="reward-experience--align-levels-and-bar">
            <div className="reward-experience--current-level">{experienceAndLevelObject.level}</div>
            <div className="reward-experience--progress-bar-parent">
              <div className="reward-experience--progress-bar-child--bar width-zero"
                   style={this.fillBar(this.getLevelPercentage(experienceAndLevelObject, experienceObject))}/>
            </div>
            <div className="reward-experience--next-level">{experienceAndLevelObject.level + 1}</div>
          </div>
        </div>

        {this.getItemDropDiv(randomItem)}


        {/*<a href="/inventory">*/}
          {/*Inventory*/}
        {/*</a>*/}
        {/*<a href="/map">*/}
          {/*Map*/}
        {/*</a>*/}

      </div>
    )
  }
}
