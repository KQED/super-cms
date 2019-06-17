import React, { Component } from 'react';
import { Auth } from 'aws-amplify';
import { StyledLink } from 'baseui/link';
import {
  HeaderNavigation,
  ALIGN,
  StyledNavigationItem as NavigationItem,
  StyledNavigationList as NavigationList
} from 'baseui/header-navigation';
import { Link } from 'react-router-dom';

class Header extends Component {
  signOut = () => {
    Auth.signOut();
  };
  render() {
    return (
      <HeaderNavigation>
        <NavigationList $align={ALIGN.left}>
          <NavigationItem>
            <StyledLink to="/" $as={Link}>
              Home
            </StyledLink>
          </NavigationItem>
        </NavigationList>
        <NavigationList $align={ALIGN.left}>
          <NavigationItem>
            <StyledLink to="/transcribe" $as={Link}>
              Transcribe
            </StyledLink>
          </NavigationItem>
        </NavigationList>
        <NavigationList $align={ALIGN.center} />
        <NavigationList $align={ALIGN.right}>
          <NavigationItem>
            <StyledLink onClick={this.signOut}>Logout</StyledLink>
          </NavigationItem>
        </NavigationList>
      </HeaderNavigation>
    );
  }
}

export default Header;
