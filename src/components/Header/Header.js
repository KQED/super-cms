import React, { Component } from 'react';
import { Auth } from 'aws-amplify';
import {
  HeaderNavigation,
  ALIGN,
  StyledNavigationItem as NavigationItem,
  StyledNavigationList as NavigationList
} from 'baseui/header-navigation';
import { StyledLink as Link } from 'baseui/link';

class Header extends Component {
  signOut = () => {
    Auth.signOut();
  };
  render() {
    return (
      <HeaderNavigation>
        <NavigationList $align={ALIGN.left}>
          <NavigationItem>
            {' '}
            <Link href="/">Home</Link>
          </NavigationItem>
        </NavigationList>
        <NavigationList $align={ALIGN.left}>
          <NavigationItem>
            <Link href="/transcribe">Transcribe</Link>
          </NavigationItem>
        </NavigationList>
        <NavigationList $align={ALIGN.center} />
        <NavigationList $align={ALIGN.right}>
          <NavigationItem>
            <Link href="" onClick={this.signOut}>
              Logout
            </Link>
          </NavigationItem>
        </NavigationList>
      </HeaderNavigation>
    );
  }
}

export default Header;
