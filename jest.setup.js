import nock from 'nock';

nock.disableNetConnect();
global.XMLHttpRequest = undefined;
