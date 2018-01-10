import React, { Component } from 'react';

export default class Text extends Component {
  
  render() {
    
    return (
      <div id='app'>
        <div id='display' className='typetextbig' />
        <form>
          <input id="input" className='typetext' type="text" name='typetext' />
        </form>
        <div className="scores">
          <div id="correct">
          </div>
          <div id="incorrect">
          </div>
        </div>
      </div>
    )
  }
}