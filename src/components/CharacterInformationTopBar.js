import React, { Component } from 'react';

import { experience } from '../constants/experienceObject';

const getLevel = (exp) => {
  let returnNum;
  let exper = exp;
  for (let i = 1; exper >= experience[i]; i++) {
    returnNum = i;
    exper -= experience[i];
  }
  return returnNum;
};

export default class CharacterInformationTopBar extends Component {
  
  render() {
    
    const data = this.props.userData;
    const level = getLevel(data.experience);
    
    return (
      <div className="character-data-display-top-bar">
        <div className="character-data-parent">
          <div className="character-data-username">{data.username}</div>
          <div className="character-data-level">Level: {level}</div>
          <div className="character-data-gold">
            <img className="character-data-gold-image" src="/static/images/gold.png" />
            <div className="character-data-gold-text">{data.gold}</div>
          </div>
        </div>
        <a className="logout-button-anchor" href="/logout">
          <img className="logout-button-image" src="/static/images/logout.png"/>
          <div>Log out</div>
        </a>
      </div>
    );
  }
}