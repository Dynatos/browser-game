import React, { Component } from 'react';

const navData = [
  {
    display: "Map",
    linkTo: "/map"
  },
  {
    display: "Inventory",
    linkTo: "/inventory"
  },
  {
    display: "TEST INV",
    linkTo: "/inventory_test"
  },
  {
    display: "Shop",
    linkTo: "/shop"
  }
];

export default class LeftNavBar extends Component {
  
  render() {
    
    return (
      <div className="left-navbar-highest-parent">
        {navData.map((e, i) => {
          return (
            <div className="left-navbar-element" key={i}>
              <a className="left-navbar-anchor" href={e.linkTo}>
                <div className="left-navbar-anchor-align">
                    {e.display}
                </div>
              </a>
            </div>
          )})}
      </div>
    )
  }
}