import React, { Component } from 'react';

export default class LoginPage extends Component {
  
  logMeIn() {
    return (
      <form method="POST" action="/login">
        <input name="username" value="therealgentoo" readOnly />
        <input name="password" value="password" readOnly />
        <input type="submit" value="ok" />
      </form>
    )
  }

  render() {

    const { failed } = this.props;
    const hiddenDefault = { display: 'none' };

    return (
      <div className="login-page-highest-parent">
        <div style={ failed || hiddenDefault }>
          Failed to log in
        </div>
        <form method="POST" action="/login">
          <input type="text" placeholder="Username" name="username" />
          <input type="password" placeholder="Password" name="password" />
          <input type="submit" value="ok" />
        </form>
        {this.logMeIn()}
        <div>
          Don't have an account? <a className="anchor-always-blue" href="/signup">Sign up</a>!
        </div>
      </div>
    );
  }
}