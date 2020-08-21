const parseRSS = (data) => {
  const domparser = new DOMParser();
  const docData = domparser.parseFromString(data, 'text/xml');
  const titleEl = docData.querySelector('title');
  const titleDoc = titleEl.textContent;
  const items = [...docData.querySelectorAll('item')];
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
