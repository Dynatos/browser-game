import React, { Component } from 'react';
import CharacterInformationTopBar from './CharacterInformationTopBar';
import LeftNavBar from './LeftNavBar';
import Inventory from './Inventory';
import Map from './Map';
import Text from './textThing/Text';

export default class NavigationShell extends Component {

  render() {
    
    const { userData, componentToRender, optProps } = this.props;
    
    const renderInternalComponent = (componentToRender, optProps) => {
      if (optProps) {
        switch (componentToRender) {
          // case 'map':
          //   return <Map />;
          case 'inventory':
            return <Inventory inventoryItemDataObject={optProps} />;
          // case 'text_thing':
          //   return <Text />;
          // case 'shop':
          //   return <Shop />;
        }
      }
      switch (componentToRender) {
        case 'map':
          return <Map />;
        case 'inventory':
          return <Inventory />;
        case 'text_thing':
          return <Text />;
        case 'shop':
          return <Shop />;
      }
    };

    return (
      <div className="navigation-shell-highest-parent">
        <CharacterInformationTopBar userData={userData} />
        <LeftNavBar />
        {renderInternalComponent(componentToRender, optProps)}
      </div>
    );
  }
}