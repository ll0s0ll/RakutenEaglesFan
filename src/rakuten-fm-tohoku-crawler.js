/* global electron Event EventTarget RakutenFmTohoku Worker */
'use strict';

class RakutenFmTohokuCrawler extends EventTarget {
  //
  constructor (preferences) {
    super();

    this.preferences = preferences;
    this.tickerIntervalSec = 5;

    this.worker = new Worker('ticker.js');
    this.worker.onmessage = function () {
      this.update(false);
    }.bind(this);

    this.worker.onerror = function (e) {
      const nowMsec = new Date();
      const updateFreqMsec = this.preferences.updateFreqMinitus * 60 * 1000;
      this.nextUpdateMsec = nowMsec + updateFreqMsec;

      const event = new Event('onError');
      event.data = {
        error: new Error(e.message),
        date: nowMsec,
        nextUpdate: this.nextUpdateMsec
      };
      this.dispatchEvent(event);
    }.bind(this);
  }

  fetchTimeTable () {
    return new Promise((resolve, reject) => {
      let buf;
      const request = electron.node.https.request(
        RakutenFmTohoku.timetableUrl,
        {},
        (res) => {
          // res.setEncoding('utf8');
          res.on('data', (chunk) => {
            // console.log(`BODY: ${chunk}`);
            if (buf === undefined) {
              buf = chunk;
            } else {
              buf = electron.node.Buffer.concat([buf, chunk]);
            }
          });
          res.on('end', () => {
            // console.log('No more data in response.')
            // console.log(buf)

            if (res.statusCode !== 200) {
              // console.log(res.statusCode)
              const error = new Error(`Status Code: ${res.statusCode}`);
              error.name = 'ServerError';
              reject(error);
              return;
            }

            try {
              const jsonp = buf.toString('utf8').trim();
              resolve(RakutenFmTohoku.parseTimeTable(jsonp));
            } catch (e) {
              console.log(e);
              const error = new Error('Failed to parse time table data.');
              error.name = 'ParseError';
              reject(error);
            }
          });
        });

      request.on('error', (e) => {
        console.log(e);
        const error = new Error('Failed to fetch timetable data.');
        error.name = 'ServerError';
        reject(error);
      });

      request.end();
    });
  }

  update (isForce) {
    const nowMsec = Date.now();
    if (this.nextUpdateMsec && this.nextUpdateMsec > nowMsec && !isForce) {
      // console.log('NOA:' + new Date(this.nextUpdateMsec));
      return;
    }

    if (!navigator.onLine) {
      return;
    }

    this.fetchTimeTable()
      .then((timeTable) => {
        const nowOnAirProgram = RakutenFmTohoku.getNowOnAirProgram(timeTable);

        const event = new Event('nowOnAirProgramUpdated');
        event.data = {
          program: nowOnAirProgram,
          programsToday: RakutenFmTohoku.getProgramsByDay(timeTable,
            new Date(nowMsec)),
          date: nowMsec,
          nextUpdate: this.nextUpdateMsec
        };
        this.dispatchEvent(event);

        // 次回更新時刻をプログラムの終了時刻に設定。
        this.nextUpdateMsec = nowOnAirProgram
          ? nowOnAirProgram.endTimeMSec
          : nowMsec + (this.preferences.updateFreqMinitus * 60 * 1000);
      })
      .catch((e) => {
        console.error(e);
        const updateFreqMsec = this.preferences.updateFreqMinitus * 60 * 1000;
        this.nextUpdateMsec = nowMsec + updateFreqMsec;

        const event = new Event('onError');
        event.data = {
          error: e,
          date: nowMsec,
          nextUpdate: this.nextUpdateMsec
        };
        this.dispatchEvent(event);
      });

    console.log(`Radio updated: ${new Date().toLocaleString()}`);
  }

  run () {
    this.update(true);
    this.worker.postMessage({
      type: 'start',
      intervalSec: this.tickerIntervalSec
    });
  }
}

module.exports = RakutenFmTohokuCrawler;
