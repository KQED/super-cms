import { BrowserRouter as Router, Route } from 'react-router-dom';
import React from 'react';
// import Home from './modules/Home/components/Home';
// import Create from './modules/Home/components/Create';
import Header from './components/Header';
import Transcribe from './modules/Transcribe/components';
import styles from './Routes.module.scss';

const Routes = () => {
  return (
    <div>
      <Router>
        <Header />
        <div className={styles.route}>
          {/*<Route path="/" exact component={Home} />*/}
          {/*<Route path="/create" component={Create} />*/}
          <Route path="/" component={Transcribe} />
        </div>
      </Router>
    </div>
  );
};

export default Routes;
