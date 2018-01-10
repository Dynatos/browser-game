import React, { Component } from 'react';

export default class SignupPage extends Component {
  
  render() {
    
    return (
      <div className="signup-page-highest-parent">
        <form className="signup-form" method="POST" action="/signuppost">
          <input id="signup-un-field" type="text" placeholder="Username" name="username" minLength="4" maxLength="20"
                 onFocus={ () => {this.setState({usernameDisplay: inf})} }
                 onBlur={ () => {this.setState({usernameDisplay: oof})} } required />
          <br/>
          <input id="signup-pw-field" type="password" placeholder="Password" name="password" pattern="^[\x00-\x7F]*$"
                 minLength="16" maxLength="40" onFocus={ () => {this.setState({passwordDisplay: inf})} }
                 onBlur={ () => {this.setState({passwordDisplay: oof})} } required />
          <br/>
          <input id="signup-pwc-field" type="password" placeholder="Confirm Password" name="confirmPassword"
                 pattern="^[\x00-\x7F]*$" minLength="16" maxLength="40"
                 onFocus={ () => {this.setState({passwordDisplay: inf})} }
                 onBlur={ () => {this.setState({passwordDisplay: oof})} } required />
          <br/>
          <input id="signup-submit" type="submit" value="ok" href="/signuppost" />
        </form>
        <h3 id="signup-un-rules">
          Username must be 4-20 characters long
        </h3>
        <br/>
        <h3 id="signup-pw-rules">
          Password must be 16-40 characters long
        </h3>
      </div>
    );
  }
}