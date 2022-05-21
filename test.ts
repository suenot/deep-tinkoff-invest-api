import 'dotenv/config';
import 'mocha';
import { expect } from 'chai';
import _ from 'lodash';
// import uniqid from 'uniqid';

const debug = require('debug')('bot').extend('balancer');

describe('bot', () => {
  describe('balancer', () => {
    it.only('#1', async () => {
      debug('#1');
      expect(undefined).to.equal(undefined);
    })
  })
})
