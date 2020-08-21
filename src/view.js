/* eslint-disable no-param-reassign */
import onChange from 'on-change';

const buildPostsElement = (post) => {
  const blockEl = document.createElement('div');
  const linkEl = document.createElement('a');
  linkEl.textContent = post.title;
  linkEl.href = post.link;
  blockEl.append(linkEl);
  return blockEl;
};

const buildFeedElement = (feed, postsFeed) => {
  const headerEl = document.createElement('h2');
  headerEl.textContent = feed.title;
  const postsEl = postsFeed.map(buildPostsElement);
  return [headerEl, ...postsEl];
};

const renderFeeds = (feeds, posts, elements) => {
  elements.feedsBox.textContent = '';
  const feedNodes = feeds.flatMap((feed) => {
    const postsFeed = posts.filter((post) => post.feedId === feed.id);
    return buildFeedElement(feed, postsFeed);
  });
  elements.feedsBox.append(...feedNodes);
};

const renderForm = (form, elements) => {
  switch (form.status) {
    case 'filling':
      elements.submitBtn.removeAttribute('disabled');
      elements.input.removeAttribute('disabled');
      elements.input.value = '';
      elements.feedback.classList.remove('text-danger');
      elements.feedback.classList.add('text-success');
      elements.feedback.textContent = 'Rss has been loaded';
      break;

    case 'failed':
      elements.submitBtn.removeAttribute('disabled');
      elements.input.removeAttribute('disabled');
      elements.input.select();
      break;

    case 'loading':
      elements.submitBtn.setAttribute('disabled', true);
      elements.input.setAttribute('disabled', true);
      break;

    default:
      throw Error(`Unknown form status: ${form.status}`);
  }
};

const renderFormErrors = (form, elements) => {
  const field = form.fields.url;
  if (field.valid) {
    elements.input.classList.remove('is-invalid');
    elements.feedback.classList.remove('text-danger');
    elements.feedback.textContent = '';
  } else {
    elements.input.classList.add('is-invalid');
    elements.feedback.classList.remove('text-success');
    elements.feedback.classList.add('text-danger');
    elements.feedback.textContent = field.error;
  }
};

const renderAppError = (error, elements) => {
  if (!error) return;
  elements.feedback.classList.remove('text-success');
  elements.feedback.classList.add('text-danger');
  elements.feedback.textContent = error;
};

const initView = (state, elements) => {
  elements.input.focus();

  const mapping = {
    'form.status': () => renderForm(state.form, elements),
    'form.fields.url': () => renderFormErrors(state.form, elements),
    'form.submitCount': () => elements.input.focus(),
    error: () => renderAppError(state.error, elements),
    feeds: () => renderFeeds(state.feeds, state.posts, elements),
  };

  const watchedState = onChange(state, (path) => {
    if (mapping[path]) {
      mapping[path]();
    }
  });

  return watchedState;
};

export default initView;
