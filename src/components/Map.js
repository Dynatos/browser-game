import React, { Component } from 'react';

const mapAreaData = [
  {
    display: 'Enchanted Forest',
    linkTo: '/zone/enchanted_forest'
  }
];

export default class Map extends Component {
  
  render() {
  
    return (
      <div className="map-highest-parent">
        {mapAreaData.map((e, i) => {
          return (
            <div className="map-element" key={i}>
              <a href={e.linkTo}>
                {e.display}
              </a>
            </div>
          )})}
      </div>
    )
  }
}