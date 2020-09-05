import '@testing-library/jest-dom';
import fs from 'fs';
import path from 'path';
import nock from 'nock';
import userEvent from '@testing-library/user-event';
import { screen, waitFor } from '@testing-library/dom';

import app from '../src/app';

const rssPath = path.join(__dirname, '../__fixtures__/RSS.xml');
const rssData = fs.readFileSync(rssPath, 'utf-8');
const rssUrl = 'https://pythondigest.ru/rss/';
const nonExistentUrl = 'https://nonexistenturl.ru/';

const index = path.join(__dirname, '..', 'index.html');
const initHtml = fs.readFileSync(index, 'utf-8');

const elements = {};

beforeEach(async () => {
  document.body.innerHTML = initHtml;
  await app();
  elements.input = screen.getByPlaceholderText('RSS link');
  elements.submit = screen.getByLabelText('add');
});

test('adding', async () => {
  const scope = nock('https://cors-anywhere.herokuapp.com')
    .get(`/${rssUrl}`)
    .reply(200, rssData);

  userEvent.type(elements.input, rssUrl);
  userEvent.click(elements.submit);

  await waitFor(() => {
    expect(screen.getByText(/RSS has been loaded/i)).toBeInTheDocument();
  });
  scope.done();
});

test('adding nonexistent ulr', async () => {
  const scope = nock('https://cors-anywhere.herokuapp.com')
    .get(`/${nonExistentUrl}`)
    .reply(404);
  userEvent.type(elements.input, nonExistentUrl);
  userEvent.click(elements.submit);
  await waitFor(() => {
    expect(screen.getByText(/An error occurred an incorrect url may have been entered. Try again./i)).toBeInTheDocument();
  });
  scope.done();
});

test('validation unique', async () => {
  nock('https://cors-anywhere.herokuapp.com')
    .get(`/${rssUrl}`)
    .reply(200, rssData);

  userEvent.type(elements.input, rssUrl);
  userEvent.click(elements.submit);

  await waitFor(() => {
    expect(screen.getByText(/RSS has been loaded/i)).toBeInTheDocument();
    expect(screen.getByText(/Бот-викторина для ВКонтакта/i)).toBeInTheDocument();
    expect(screen.getByText(/Data Version Control With Python and DVC/i)).toBeInTheDocument();
    expect(screen.getByText(/Разбор официального Docker image для Python/i)).toBeInTheDocument();
  });

  userEvent.type(elements.input, rssUrl);
  userEvent.click(elements.submit);

  await waitFor(() => {
    expect(screen.getByText(/RSS already exists/i)).toBeInTheDocument();
  });
});

test('validation invalid url', () => {
  userEvent.type(elements.input, 'invalidUrl');
  userEvent.click(elements.submit);
  expect(screen.getByText(/This must be a valid URL/i)).toBeInTheDocument();
});
