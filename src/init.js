import axios from 'axios';
import * as yup from 'yup';
import { uniqueId } from 'lodash';
import initView from './view';
import parseRSS from './parser';

const addedIdToPost = ({ title, link }, feedId) => ({
  title,
  link,
  feedId,
  id: uniqueId(),
});

const getFeedData = async (url) => {
  const cornProxy = 'https://cors-anywhere.herokuapp.com/';
  const fullUrl = `${cornProxy}${url}`;
  const response = await axios.get(fullUrl);
  return parseRSS(response.data);
};

const schema = yup
  .string()
  .url();

const addedBefore = (currentFeeds, feedUrl) => {
  const feedsBefore = currentFeeds.filter(({ url }) => url === feedUrl);
  return feedsBefore.length > 0;
};

const validate = (currentFeeds, feedUrl) => {
  if (addedBefore(currentFeeds, feedUrl)) {
    return 'RSS already exists';
  }

  try {
    schema.validateSync(feedUrl);
    return null;
  } catch (e) {
    return e.message;
  }
};

export default () => {
  const state = {
    feeds: [],
    posts: [],
    error: null,
    form: {
      submitCount: 0,
      status: 'filling',
      fields: {
        url: {
          valid: true,
          error: null,
        },
      },
    },
  };

  const elements = {
    form: document.querySelector('.rss-form'),
    input: document.querySelector('.form-control'),
    submitBtn: document.querySelector('.btn'),
    feedsBox: document.querySelector('.feeds'),
    feedback: document.querySelector('.feedback'),
  };

  const watched = initView(state, elements);

  elements.form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const url = formData.get('url');
    const error = validate(state.feeds, url);

    if (error) {
      watched.form.fields.url = {
        error,
        valid: false,
      };
      return;
    }

    watched.form.fields.url = {
      error: null,
      valid: true,
    };

    try {
      watched.error = null;
      watched.form.status = 'loading';
      const { title, posts } = await getFeedData(url);
      watched.form.status = 'filling';
      const feedId = uniqueId();
      posts.map((post) => addedIdToPost(post, feedId))
        .forEach((post) => watched.posts.push(post));
      watched.feeds.push({ url, title, id: feedId });
    } catch (err) {
      watched.form.status = 'failed';
      watched.error = err.message;
    }
    watched.form.submitCount += 1;
  });
};
