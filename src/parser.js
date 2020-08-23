import i18next from 'i18next';

const parseRSS = (data) => {
  const domparser = new DOMParser();
  const docData = domparser.parseFromString(data, 'text/xml');
  const titleEl = docData.querySelector('title');
  const items = [...docData.querySelectorAll('item')];

  if (!titleEl || items.length === 0) {
    throw Error(i18next.t('error.invalidFormatRSS'));
  }

  const titleDoc = titleEl.textContent;

  const posts = items.map((item) => {
    const titleElement = item.querySelector('title');
    const linkElement = item.querySelector('link');
    const title = titleElement.textContent;
    const link = linkElement.textContent;
    return { title, link };
  });
  return { title: titleDoc, posts };
};

export default parseRSS;
