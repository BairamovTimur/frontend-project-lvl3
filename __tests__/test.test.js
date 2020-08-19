import { test, expect } from '@jest/globals';
import start from '../src/index.js';

test('getTrue', () => {
  expect(start()).toEqual(true);
});
