import { BrowserRouter as Router, Route, Link } from 'react-router-dom';
import React from 'react';
import Home from './modules/Home/components/Home';
import Create from './modules/Home/components/Create';

const Routes = () => {
  return (
    <Router>
      <div>
        <Route path="/" exact component={Home} />
        <Route path="/create" exact component={Create} />
      </div>
    </Router>
  );
};

export default Routes;
