import React from 'react';
import Amplify from 'aws-amplify';
import { withAuthenticator } from 'aws-amplify-react';
import './App.css';
import Routes from './Routes';
import aws_exports from './aws-exports';
Amplify.configure(aws_exports);

const authConfig = {
  signUpConfig: {
    hiddenDefaults: ['phone_number']
  }
};

function App() {
  return <Routes />;
}

export default withAuthenticator(App, authConfig);
