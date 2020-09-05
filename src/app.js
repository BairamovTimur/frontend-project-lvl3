import 'bootstrap';
import axios from 'axios';
import * as yup from 'yup';
import i18next from 'i18next';
import { uniqueId, differenceBy } from 'lodash';

import initView from './watchers';
import parseRSS from './rss';
import resources from './locales';

const intervalPostsUpdate = 5000;

const addIdToPost = (post, feedId) => ({
  ...post,
  feedId,
  id: uniqueId(),
});

const addProxy = (url) => {
  const proxyURL = 'https://cors-anywhere.herokuapp.com/';
  return `${proxyURL}${url}`;
};

const baseURLSchema = yup
  .string()
  .url();

const validateURL = (feeds, url) => {
  const feedUrls = feeds.map((feed) => feed.url);
  const actualSchema = baseURLSchema.notOneOf(feedUrls, i18next.t('error.alreadyExists'));
  try {
    actualSchema.validateSync(url);
    return null;
  } catch (e) {
    return e.message;
  }
};

const updatePosts = (watched) => watched
  .feeds.map((feed) => {
    const urlWithProxy = addProxy(feed.url);
    return axios.get(urlWithProxy).then((response) => {
      const { posts } = parseRSS(response.data);
      const oldPosts = watched.posts.filter((post) => post.feedId === feed.id);
      const newPosts = differenceBy(posts, oldPosts, 'link')
        .map((post) => addIdToPost(post, feed.id));
      watched.posts = [...newPosts, ...watched.posts];
    });
  });

const makeUpdates = (watched) => {
  const promises = updatePosts(watched);
  Promise.all(promises).finally(() => {
    setTimeout(() => makeUpdates(watched), intervalPostsUpdate);
  });
};

const loadRss = (watched, url) => {
  watched.error = null;
  watched.loadingProcess.status = 'loading';
  const urlWithProxy = addProxy(url);
  axios.get(urlWithProxy).then((response) => {
    const { title, posts } = parseRSS(response.data);
    watched.loadingProcess.status = 'filling';
    const feedId = uniqueId();
    const postsWithId = posts.map((post) => addIdToPost(post, feedId));
    watched.feeds.push({ url, title, id: feedId });
    watched.posts = [...watched.posts, ...postsWithId];
  }).catch(() => {
    watched.error = i18next.t('error.common');
    watched.loadingProcess.status = 'failed';
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

    setTimeout(() => makeUpdates(watched), intervalPostsUpdate);
  });
};
