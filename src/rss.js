const parseRSS = (data) => {
  const domparser = new DOMParser();
  const docData = domparser.parseFromString(data, 'text/xml');

  const parseError = docData.querySelector('parsererror');
  if (parseError) {
    throw new Error(parseError.textContent);
  }

  const titleChannelNode = docData.querySelector('channel > title');
  const descriptionNode = docData.querySelector('channel > description');
  const postsNode = [...docData.querySelectorAll('channel > item')];

  const titleChannel = titleChannelNode.textContent;
  const description = descriptionNode.textContent;
  const posts = postsNode.map((post) => {
    const titleNode = post.querySelector('title');
    const linkNode = post.querySelector('link');
    const title = titleNode.textContent;
    const link = linkNode.textContent;

    return { title, link };
  });

  return { title: titleChannel, description, posts };
};

export default parseRSS;
