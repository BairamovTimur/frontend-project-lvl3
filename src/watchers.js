import onChange from 'on-change';
import i18next from 'i18next';
import { differenceBy } from 'lodash';

const initView = (state, elements) => {
  const buildPostsElement = (post) => {
    const blockEl = document.createElement('div');
    const linkEl = document.createElement('a');
    linkEl.textContent = post.title;
    linkEl.href = post.link;
    blockEl.append(linkEl);
    return blockEl;
  };

  const handlePosts = (posts, oldPosts) => {
    const newPosts = differenceBy(posts, oldPosts, 'id');
    state.feeds.forEach((feed) => {
      const feedNode = elements.feedsBox.querySelector(`#feed_${feed.id}`);
      const newPostsFeed = newPosts.filter((post) => post.feedId === feed.id);
      const postsNodes = newPostsFeed.map(buildPostsElement);
      postsNodes.forEach((postNode) => elements.feedsBox.append(postNode));
      if (postsNodes.length > 0) {
        feedNode.after(...postsNodes);
      }
    });
  };

  const buildFeedElement = (feed) => {
    const headerEl = document.createElement('h2');
    headerEl.id = `feed_${feed.id}`;
    headerEl.textContent = feed.title;
    return headerEl;
  };

  const handleFeeds = (feed, oldFeed) => {
    const newFeed = differenceBy(feed, oldFeed, 'id');
    const feedNodes = newFeed.map(buildFeedElement);
    elements.feedsBox.append(...feedNodes);
  };

  const handleLoadingProcessStatus = () => {
    switch (state.loadingProcess.status) {
      case 'filling':
        elements.submitBtn.removeAttribute('disabled');
        elements.input.removeAttribute('disabled');
        elements.input.value = '';
        elements.feedback.classList.remove('text-danger');
        elements.feedback.classList.add('text-success');
        elements.feedback.textContent = i18next.t('sucessLoaded');
        break;

      case 'failed':
        elements.submitBtn.removeAttribute('disabled');
        elements.input.removeAttribute('disabled');
        elements.input.select();
        if (!state.error) return;
        elements.feedback.classList.remove('text-success');
        elements.feedback.classList.add('text-danger');
        elements.feedback.textContent = state.error;
        break;

      case 'loading':
        elements.submitBtn.setAttribute('disabled', true);
        elements.input.setAttribute('disabled', true);
        break;

      default:
        throw Error(i18next.t('error.unknownFormStatus', { status: state.loadingProcess.status }));
    }
  };

  const handleForm = () => {
    if (state.form.valid) {
      elements.input.classList.remove('is-invalid');
      elements.feedback.classList.remove('text-danger');
      elements.feedback.textContent = '';
    } else {
      elements.input.classList.add('is-invalid');
      elements.feedback.classList.remove('text-success');
      elements.feedback.classList.add('text-danger');
      elements.feedback.textContent = state.form.error;
    }
    elements.input.focus();
  };

  elements.input.focus();

  const watchedState = onChange(state, (path, value, previousValue) => {
    switch (path) {
      case 'form':
        handleForm();
        break;
      case 'loadingProcess.status':
        handleLoadingProcessStatus();
        break;
      case 'feeds':
        handleFeeds(value, previousValue);
        break;
      case 'posts':
        handlePosts(value, previousValue);
        break;
      default:
        break;
    }
  });

  return watchedState;
};

export default initView;
