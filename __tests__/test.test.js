import start from '../src/init';

test('getTrue', () => {
  expect(start()).toEqual(true);
});
