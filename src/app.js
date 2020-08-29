import 'bootstrap';
import axios from 'axios';
import * as yup from 'yup';
import i18next from 'i18next';
import { uniqueId, differenceBy } from 'lodash';

import initView from './watchers';
import parseRSS from './rss';
import resources from './locales';

const addIdToPost = (post, feedId) => ({
  ...post,
  feedId,
  id: uniqueId(),
});

const getFeedData = (url) => {
  const proxyURL = 'https://cors-anywhere.herokuapp.com/';
  const fullUrl = `${proxyURL}${url}`;

  return axios.get(fullUrl).then((response) => parseRSS(response.data));
};

const baseSchema = yup
  .string()
  .url();

const validateURL = (currentFeeds, feedUrl) => {
  const feedUrls = currentFeeds.map((feed) => feed.url);
  const actualSchema = baseSchema.notOneOf(feedUrls, i18next.t('error.alreadyExists'));
  try {
    actualSchema.validateSync(feedUrl);
    return null;
  } catch (e) {
    return e.message;
  }
};

const getNewPosts = (feeds, currentPosts) => {
  const promises = feeds.map((feed) => getFeedData(feed.url));
  return Promise.all(promises).then((dataFeeds) => dataFeeds
    .flatMap(({ posts }, index) => {
      const feed = feeds[index];
      const oldPosts = currentPosts.filter((post) => post.feedId === feed.id);

      const newPosts = differenceBy(posts, oldPosts, 'link')
        .map((post) => addIdToPost(post, feed.id));
      return newPosts;
    }));
};

const updatePosts = (watched) => {
  const promise = getNewPosts(watched.feeds, watched.posts);
  promise.then((newPosts) => {
    watched.posts = [...newPosts, ...watched.posts];
    setTimeout(() => updatePosts(watched), 5000);
  });
};

const loadRss = (watched, url) => {
  watched.error = null;
  watched.loadingProcess.status = 'loading';
  getFeedData(url).then(({ title, posts }) => {
    watched.loadingProcess.status = 'filling';
    const feedId = uniqueId();
    const postsWithId = posts.map((post) => addIdToPost(post, feedId));
    watched.feeds.push({ url, title, id: feedId });
    watched.posts = [...watched.posts, ...postsWithId];
  }).catch(() => {
    watched.error = i18next.t('error.common');
    watched.loadingProcess.status = 'failed';
  }).then(() => {
    watched.form.submitCount += 1;
  });
};

export default () => {
  const state = {
    feeds: [],
    posts: [],
    error: null,
    loadingProcess: {
      status: 'filling',
    },
    form: {
      valid: true,
      error: null,
    },
  };

  const elements = {
    form: document.querySelector('.rss-form'),
    input: document.querySelector('.form-control'),
    submitBtn: document.querySelector('.btn'),
    feedsBox: document.querySelector('.feeds'),
    feedback: document.querySelector('.feedback'),
  };

  i18next.init({
    lng: 'en',
    resources,
  }).then(() => {
    const watched = initView(state, elements);

    setTimeout(() => updatePosts(watched), 5000);

    elements.form.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const url = formData.get('url');
      const error = validateURL(state.feeds, url);
      if (!error) {
        watched.form = {
          valid: true,
          error: null,
        };
        loadRss(watched, url);
      } else {
        watched.form = {
          valid: false,
          error,
        };
      }
    });
  });
};
