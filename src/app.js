import axios from 'axios';
import * as yup from 'yup';
import i18next from 'i18next';
import { uniqueId, differenceBy } from 'lodash';
import initView from './view';
import parseRSS from './parser';
import resources from './locales';

const addIdToPost = (post, feedId) => ({
  ...post,
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
    return i18next.t('error.alreadyExists');
  }

  if (schema.isValidSync(feedUrl)) {
    return null;
  }

  return i18next.t('error.invalidUrl');
};

export default async () => {
  await i18next.init({
    lng: 'en',
    resources,
  });

  const state = {
    feeds: [],
    posts: [],
    error: null,
    updatePostCount: 0,
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

  const watched = initView(state, elements, i18next);

  const updatePosts = () => {
    const promises = state.feeds.map((feed) => getFeedData(feed.url));
    Promise.all(promises).then((dataFeeds) => {
      dataFeeds.forEach(({ posts }, index) => {
        const feed = watched.feeds[index];
        const oldPosts = watched.posts.filter((post) => post.feedId === feed.id);
        const newPost = differenceBy(posts, oldPosts, 'link')
          .map((post) => addIdToPost(post, feed.id));
        watched.posts = [...newPost, ...watched.posts];
      });
      watched.updatePostCount += 1;
      setTimeout(() => updatePosts(), 5000);
    });
  };

  setTimeout(() => updatePosts(), 5000);

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
      const postsWithId = posts.map((post) => addIdToPost(post, feedId));
      watched.posts = [...watched.posts, ...postsWithId];
      watched.feeds.push({ url, title, id: feedId });
    } catch (err) {
      watched.form.status = 'failed';
      console.log(err.message);
      watched.error = i18next.t('error.network');
    }
    watched.form.submitCount += 1;
  });
};
