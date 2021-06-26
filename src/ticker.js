/* global self */
'use strict';

self.onmessage = function (e) {
  switch (e.data.type) {
    case 'start':
      if (!e.data.intervalSec) {
        throw new Error('Invalid parameter.');
      }

      if (self.timerId) {
        clearInterval(self.timerId);
      }

      self.timerId = setInterval(function () {
        self.postMessage('msg');
      }, e.data.intervalSec * 1000);

      break;
    case 'stop':
      clearInterval(self.timerId);
      self.timerId = null;
      break;
    default:
  }
};
