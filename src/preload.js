// console.log('preload.js');
// window.remote = require('electron').remote;
// window.electron = require('electron');

// window.ytdl = require('ytdl-core');
// window.ffmpeg = require('fluent-ffmpeg');

// ffmpegを使うと'setImmediate is not defined'のエラーが出る。その解決策
// `setImmediate` is `undefined` in the preload script when `node-integration` is false · Issue #2984 · electron/electron · GitHub
// https://github.com/electron/electron/issues/2984
/* var _setImmediate = setImmediate;
process.once('loaded', function () {
  global.setImmediate = _setImmediate;
}); */

global.electron = {};
global.electron.name = process.env.npm_package_name;
global.electron.shell = require('electron').shell;

const argcStr = process.argv.find(e => e.search(/^--argc/) !== -1);
const argc = argcStr ? argcStr.match(/^--argc=(\d+)/)[1] : 0;
global.argv = argc > 0 ? process.argv.slice(-(argc)) : [];

global.APP_VERSION = require('electron').remote
  ? require('electron').remote.app.getVersion()
  : process.env.npm_package_version; // test対策
global.DEBUG = process.argv.includes('--debug') ? true : false;
global.DISABLE_RADIO = process.argv.includes('--disable-radio') ? true : false;
global.LOCAL = process.argv.includes('--local') ? true : false;

if (process.argv.includes('--debug')) {
  global.assert = require('assert');
} else {
  global.assert = function () {};
}

if (!process.argv.includes('--debug')) {
  console.log = function () {};
  console.warn = function () {};
  console.error = function () {};
}

global.electron.node = {};
// global.electron.node.os = require('os');
global.electron.node.fs = require('fs');
global.electron.node.https = require('https');
global.electron.node.hls = require('hls.js');
global.electron.node.Buffer = Buffer;

if (typeof EventTarget !== 'undefined') {
  global.CheckingUpdatesWorker = require('./checking-updates-worker.js');
  global.RakutenFmTohokuCrawler = require('./rakuten-fm-tohoku-crawler.js');
  global.YahooNPBCrawler = require('./yahoo-npb-crawler.js');
}
