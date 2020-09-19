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

global.electron.node = {};
// global.electron.node.os = require('os');
global.electron.node.fs = require('fs');
global.electron.node.https = require('https');
global.electron.node.hls = require('hls.js');
global.electron.node.Buffer = Buffer;

global.assert = require('assert');
//
