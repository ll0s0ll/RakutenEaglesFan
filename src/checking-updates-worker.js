/* global APP_VERSION assert Event EventTarget LOCAL Worker */
'use strict';

const GitHubApiReleases = require('./github-api.js');

class CheckingUpdatesWorker extends EventTarget {
  //
  constructor (intervalDays) {
    super();

    this.intervalDays = intervalDays;

    this.tickerIntervalSec = 60;
    this.disableDurationOnRateLimitSec = 10 * 60;

    this.lastUpdatesCheckedMsec = 0;
    this.untilDisableCheckingMsec = 0;

    this.worker = new Worker('ticker.js');
    this.worker.onmessage = function () {
      this.checkUpdates(false);
    }.bind(this);

    this.worker.onerror = function (e) {
      const event = new Event('onError');
      event.data = {
        version: null,
        date: new Date(),
        error: new Error(e.message)
      };
      this.dispatchEvent(event);
    }.bind(this);
  }

  checkUpdates (isForce) {
    const nowMsec = Date.now();

    if (!navigator.onLine && LOCAL) {
      console.warn('Offline');
      return;
    }

    if (!isForce) {
      // 指定日数後の午前0時以降
      const nextUpdate = new Date(this.lastUpdatesCheckedMsec);
      nextUpdate.setDate(nextUpdate.getDate() + this.intervalDays);
      nextUpdate.setHours(0, 0, 0, 0);

      if (nextUpdate.getTime() > nowMsec) {
        return;
      }
    }

    // 分単位で判断
    if (new Date(this.untilDisableCheckingMsec).setSeconds(0, 0) > nowMsec) {
      // console.log(`until: ${new Date(this.untilDisableCheckingMsec)}`);
      const event = new Event('onError');
      event.data = {
        version: null,
        date: new Date(nowMsec),
        error: new Error('RateLimitExceeded')
      };
      this.dispatchEvent(event);
      return;
    }

    GitHubApiReleases.fetchLatestRelease()
      .then((response) => {
        const latestVersion = GitHubApiReleases.getReleaseVersion(response.body);

        const event = new Event('onProcessed');
        event.data = {
          version: this.isNewerVersion(latestVersion) ? latestVersion : null,
          date: new Date(nowMsec),
          error: null
        };
        this.dispatchEvent(event);

        this.lastUpdatesCheckedMsec = nowMsec;
        console.log(`Updates checked: ${new Date(nowMsec).toLocaleString()}`);
      })
      .catch((e) => {
        if (e.message === 'RateLimitExceeded') {
          console.warn(`RateLimit exceeded @ ${new Date(nowMsec)}`);
          const disableDurationMsec = this.disableDurationOnRateLimitSec * 1000;
          this.untilDisableCheckingMsec = nowMsec + disableDurationMsec;
        } else {
          console.error(e);
        }

        const event = new Event('onError');
        event.data = { version: null, date: new Date(nowMsec), error: e };
        this.dispatchEvent(event);
      });
  }

  checkUpdatesNow () {
    this.checkUpdates(true);
  }

  isNewerVersion (targetVersion) {
    const source = this.versionStrToObjct(APP_VERSION);
    const target = this.versionStrToObjct(targetVersion);
    // console.log(source);
    // console.log(target);

    assert(source && target, 'Invalid argument.');

    if (source.major < target.major) {
      // console.log(`Major: ${source.major} -> ${target.major}`);
      return true;
    }

    if (source.major === target.major &&
        source.minor < target.minor) {
      // console.log(`Minor: ${source.minor} -> ${target.minor}`);
      return true;
    }

    if (source.major === target.major &&
        source.minor === target.minor &&
        source.patch < target.patch) {
      // console.log(`Patch: ${source.patch} -> ${target.patch}`);
      return true;
    }

    return false;
  }

  run () {
    this.checkUpdates(true);
    this.worker.postMessage({
      type: 'start',
      intervalSec: this.tickerIntervalSec
    });
  }

  stop () {
    this.worker.postMessage({ type: 'stop' });
  }

  versionStrToObjct (versionStr) {
    if (!versionStr) return null;

    const result = versionStr.match(/^(\d+)\.(\d+)\.(\d+)$/);
    if (!result) return null;

    return {
      major: Number(result[1]),
      minor: Number(result[2]),
      patch: Number(result[3])
    };
  }
}

module.exports = CheckingUpdatesWorker;
