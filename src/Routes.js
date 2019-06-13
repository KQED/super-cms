import { BrowserRouter as Router, Route, Link } from 'react-router-dom';
import React from 'react';
import Home from './modules/Home/components/Home';
import Create from './modules/Home/components/Create';
import Header from './components/Header';

const Routes = () => {
  return (
    <div>
      <Header />
      <Router>
        <div>
          <Route path="/" exact component={Home} />
          <Route path="/create" exact component={Create} />
        </div>
      </Router>
    </div>
  );
};

export default Routes;
