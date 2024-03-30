/* global electron Event EventTarget LOCAL Worker YahooNPB YahooNPBCard */
'use strict';

class YahooNPBCrawler extends EventTarget {
  //
  constructor (app) {
    super();

    this.app = app;
    this.tickerIntervalSec = 60;

    this.worker = new Worker('ticker.js');
    this.worker.onmessage = function () {
      this.update(false);
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

  fetchCardDetails (card) {
    return new Promise((resolve, reject) => {
      if (!card) {
        resolve(card);
        return;
      }

      if (!card.detailPageUrl) {
        card.scoreBoard = null;
        card.scorePlays = [];
        card.homeTeam.startingMember = null;
        card.awayTeam.startingMember = null;
        resolve(card);
        return;
      }

      if (LOCAL) {
        const localFilePath = 'test/dummy_detail_gaming.html';
        electron.node.fs.readFile(localFilePath, 'utf-8', (err, data) => {
          if (err) {
            console.log(err);
            const error = new Error('Failed to fetch detail page data.');
            error.name = 'ServerError';
            reject(error);
            return;
          }
          try {
            const details = YahooNPB.parseDetailPage(data);
            card.highlight = details.highlight;
            card.scoreBoard = details.scoreBoard;
            card.scorePlays = details.scorePlays;
            card.homeTeam.startingMember = details.startingMembers
              ? details.startingMembers.homeTeamStartingMember : null;
            card.awayTeam.startingMember = details.startingMembers
              ? details.startingMembers.awayTeamStartingMember : null;
            resolve(card);
          } catch (e) {
            reject(e);
          }
        });
        return;
      }

      let buf;
      const request = electron.node.https.request(card.detailPageUrl, {}, (res) => {
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
          try {
            // console.log(buf)
            const details = YahooNPB.parseDetailPage(buf.toString('utf8'));
            card.highlight = details.highlight;
            card.scoreBoard = details.scoreBoard;
            card.scorePlays = details.scorePlays;
            card.homeTeam.startingMember = details.startingMembers
              ? details.startingMembers.homeTeamStartingMember : null;
            card.awayTeam.startingMember = details.startingMembers
              ? details.startingMembers.awayTeamStartingMember : null;
            card.videoList = details.videoList;
            resolve(card);
          } catch (e) {
            reject(e);
          }
        });
      });

      request.on('error', (e) => {
        console.error(`problem with request: ${e.message}`);
      });

      // req.write(postData);
      request.end();
    });
  }

  /**
   * [description]
   * error: ServerError, ParseError
   * @return {[type]} [description]
   */
  fetchTopPage () {
    return new Promise((resolve, reject) => {
      try {
        if (LOCAL) {
          // const localFilePath = 'private/yahoo/top_0707_after.html';
          // const localFilePath = 'private/yahoo/top_afterGame.html';
          const localFilePath = 'test/dummy_top_beforeGame.html';
          // const localFilePath = 'private/yahoo/inedx.html';
          // const localFilePath = 'private/yahoo/inedx_removed.html';
          // const localFilePath = 'private/yahoo/top_cancelled.html';
          electron.node.fs.readFile(localFilePath, 'utf-8', (err, data) => {
            if (err) {
              const error = new Error(err.message);
              error.name = 'ServerError';
              reject(error);
              return;
            }
            try {
              resolve(YahooNPB.parseTopPageData(data));
            } catch (e) {
              reject(e);
            }
          });
          return;
        }

        let buf;
        const request = electron.node.https.request(YahooNPB.topPageUrl, {}, (res) => {
          // res.setEncoding('utf8');
          res.on('data', (chunk) => {
            // console.log(`BODY: ${chunk}`)
            if (buf === undefined) {
              buf = chunk;
            } else {
              buf = electron.node.Buffer.concat([buf, chunk]);
            }
          });

          res.on('end', () => {
            // console.log('No more data in response.')
            if (res.statusCode !== 200) {
              const error = new Error(`Status Code: ${res.statusCode}`);
              error.name = 'ServerError';
              reject(error);
              return;
            }

            try {
              resolve(YahooNPB.parseTopPageData(buf.toString('utf8')));
            } catch (e) {
              reject(e);
            }
          });
        });

        request.on('error', (e) => {
          console.log(e);
          const error = new Error(e.message);
          error.name = 'ServerError';
          reject(error);
        });

        request.end();
      } catch (e) {
        reject(e);
      }
    });
  }

  run () {
    this.update(true);
    this.worker.postMessage({
      type: 'start',
      intervalSec: this.tickerIntervalSec
    });
  }

  update (isForce) {
    //
    const nowMsec = Date.now();
    let intervalMsec = this.app.preferences.updateFreqMinitus * 60 * 1000;

    // 試合開始時刻ちょうどに更新するため、更新間隔を開始時刻に合わせて上書きする。
    if (this.app.favoriteTeamCard) {
      const scheduledStartTime = this.app.favoriteTeamCard.scheduledStartTimeObject();
      if (scheduledStartTime) {
        const tillGameStartMsec = scheduledStartTime - this.lastUpdateMsec;
        if (tillGameStartMsec < intervalMsec) {
          intervalMsec = tillGameStartMsec;
        }
      }
    }

    if (!navigator.onLine && !LOCAL) {
      return;
    }

    if (!isForce && this.lastUpdateMsec) {
      // ミリ秒単位ではなく、分単位で比較。分未満は切り捨て。
      const lastUpdate = new Date(this.lastUpdateMsec);
      if (lastUpdate.setSeconds(0, 0) + intervalMsec > nowMsec) {
        // console.log(`Remain2: ${lastUpdate.getTime() + intervalMsec - nowMsec}msec`);
        return;
      }
    }

    this.fetchTopPage()
      .then((topPageData) => {
        const event = new Event('topPageData');
        event.data = {
          topPageData: topPageData,
          date: nowMsec,
          nextUpdateMsec: nowMsec + intervalMsec
        };
        this.dispatchEvent(event);

        const favoriteTeamCard = YahooNPBCard.findCardByTeamId(
          topPageData.cards,
          this.app.preferences.favoriteTeamId
        );
        return favoriteTeamCard;
      })
      .then((favoriteTeamCard) => {
        this.fetchCardDetails(favoriteTeamCard)
          .then((card) => {
            const event = new Event('detailPageData');
            event.data = { card: card, date: nowMsec };
            this.dispatchEvent(event);
          })
          .catch((e) => {
            console.error(e);
            const event = new Event('detailPageError');
            event.data = {
              error: e,
              date: nowMsec,
              nextUpdateMsec: nowMsec + intervalMsec
            };
            this.dispatchEvent(event);
          });
      })
      .catch((e) => {
        console.error(e);
        const event = new Event('topPageError');
        event.data = {
          error: e,
          date: nowMsec,
          nextUpdateMsec: nowMsec + intervalMsec
        };
        this.dispatchEvent(event);
      });

    this.lastUpdateMsec = nowMsec;
    console.log(`NPB updated: ${new Date(nowMsec).toLocaleTimeString()}${isForce ? 'F' : ''}`);
  }
}

module.exports = YahooNPBCrawler;
