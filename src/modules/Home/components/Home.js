import React, { Component } from 'react';
import { Table } from 'baseui/table';
import { Block } from 'baseui/block';
import { Button } from 'baseui/button';
const DATA = [
  ['Sarah Brown', 31, '100 Broadway st. New York City, New York'],
  ['Jane Smith', 32, '100 Market st. San Francisco, California'],
  ['Joe Black', 33, '100 Macquarie st. Sydney, Australia']
];

const COLUMNS = ['Name', 'Age', 'Address'];
class Home extends Component {
  render() {
    return (
      <div>
        <Button>
          <Block paddingLeft="scale1200" paddingRight="scale1200">
            Action
          </Block>
        </Button>
        <Table columns={COLUMNS} data={DATA} />
      </div>
    );
  }
}

export default Home;
