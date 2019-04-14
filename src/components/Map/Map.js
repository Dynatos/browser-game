import React, { Component } from 'react';

const mapZoneData = [
  {
    display: 'Enchanted Forest',
    linkTo: '/zone/enchanted_forest'
  }
];

export default class Map extends Component {
  
  render() {
  
    return (
      <div className="map-highest-parent">
        {
          mapZoneData.map((e, i) => {
            return (
              <div className="map-element" key={i}>
                <a href={e.linkTo}>
                  {e.display}
                </a>
              </div>
            )
          })
        }
      </div>
    )
  }
}