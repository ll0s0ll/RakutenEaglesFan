'use strict';
/* global electron GUI Notification RakutenFmTohoku YahooNPB YahooNPBCard localStorage */

// オブジェクト名を取得
// console.log(Object.prototype.toString.apply(scheduledStartTime));

const App = {
  isDebug: false,
  isLocalDebug: false,
  ignoreUpdateFreqPref: false,
  disableRadioPlayer: false,
  disabledNowOnAir: false,

  isOnline: undefined,

  cards: undefined,
  notifiedScorePlays: undefined,

  currentInning: undefined,
  currentStatus: undefined,

  nextNoaUpdateTime: undefined,
  nextDetailPageUpdateTime: undefined,
  nextScoreUpdateTime: undefined,

  preferences: {
    // デフォルト値
    favoriteTeamIdDefaultVal: 376, // 376=楽天
    gamesetNotificationDefaultVal: true,
    inningChangeNotificationDefaultVal: true,
    playballNotificationDefaultVal: true,
    scorePlayNotificationDefaultVal: true,
    silentNotificationDefaultVal: false,
    startPageDefaultVal: 0, // '今日の試合'のページ
    updateFreqMinitusDefaultVal: 10,

    minUpdateFreqMinitus: 5,
    maxUpdateFreqMinitus: 60,

    get favoriteTeamId () {
      const savedVal = localStorage.getItem('pref_favoriteTeamId');
      if (savedVal) {
        return Number(savedVal);
      } else {
        // 保存されていない場合は、デフォルト値を保存して、返す。
        localStorage.setItem('pref_favoriteTeamId', String(this.favoriteTeamIdDefaultVal));
        return this.favoriteTeamIdDefaultVal;
      }
    },

    set favoriteTeamId (val) {
      if (typeof val !== 'number') {
        throw TypeError(`Argument must be number, ${typeof val} passed.`);
      }
      localStorage.setItem('pref_favoriteTeamId', String(val));
    },

    get gamesetNotification () {
      const savedVal = localStorage.getItem('pref_gamesetNotification');
      if (savedVal) {
        return savedVal === '1' ? true : false;
      } else {
        // 保存されていない場合は、デフォルト値を保存して、返す。
        const dv = this.gamesetNotificationDefaultVal ? '1' : '0';
        localStorage.setItem('pref_gamesetNotification', dv);
        return this.gamesetNotificationDefaultVal;
      }
    },

    set gamesetNotification (val) {
      if (typeof val !== 'boolean') {
        throw TypeError(`Argument must be boolean, ${typeof val} passed.`);
      }
      localStorage.setItem('pref_gamesetNotification', val ? '1' : '0');
    },

    get inningChangeNotification () {
      const savedVal = localStorage.getItem('pref_inningChangeNotification');
      if (savedVal) {
        return savedVal === '1' ? true : false;
      } else {
        // 保存されていない場合は、デフォルト値を保存して、返す。
        const dv = this.inningChangeNotificationDefaultVal ? '1' : '0';
        localStorage.setItem('pref_inningChangeNotification', dv);
        return this.inningChangeNotificationDefaultVal;
      }
    },

    set inningChangeNotification (val) {
      if (typeof val !== 'boolean') {
        throw TypeError(`Argument must be boolean, ${typeof val} passed.`);
      }
      localStorage.setItem('pref_inningChangeNotification', val ? '1' : '0');
    },

    get playballNotification () {
      const savedVal = localStorage.getItem('pref_playballNotification');
      if (savedVal) {
        return savedVal === '1' ? true : false;
      } else {
        // 保存されていない場合は、デフォルト値を保存して、返す。
        const dv = this.playballNotificationDefaultVal ? '1' : '0';
        localStorage.setItem('pref_playballNotification', dv);
        return this.playballNotificationDefaultVal;
      }
    },

    set playballNotification (val) {
      if (typeof val !== 'boolean') {
        throw TypeError(`Argument must be boolean, ${typeof val} passed.`);
      }
      localStorage.setItem('pref_playballNotification', val ? '1' : '0');
    },

    get silentNotification () {
      const savedVal = localStorage.getItem('pref_silentNotification');
      if (savedVal) {
        return savedVal === '1' ? true : false;
      } else {
        // 保存されていない場合は、デフォルト値を保存して、返す。
        const dv = this.silentNotificationDefaultVal ? '1' : '0';
        localStorage.setItem('pref_silentNotification', dv);
        return this.silentNotificationDefaultVal;
      }
    },

    set silentNotification (val) {
      if (typeof val !== 'boolean') {
        throw TypeError(`Argument must be boolean, ${typeof val} passed.`);
      }
      localStorage.setItem('pref_silentNotification', val ? '1' : '0');
    },

    get scorePlayNotification () {
      const savedVal = localStorage.getItem('pref_scorePlayNotification');
      if (savedVal) {
        return savedVal === '1' ? true : false;
      } else {
        // 保存されていない場合は、デフォルト値を保存して、返す。
        const dv = this.scorePlayNotificationDefaultVal ? '1' : '0';
        localStorage.setItem('pref_scorePlayNotification', dv);
        return this.scorePlayNotificationDefaultVal;
      }
    },

    set scorePlayNotification (val) {
      if (typeof val !== 'boolean') {
        throw TypeError(`Argument must be boolean, ${typeof val} passed.`);
      }
      localStorage.setItem('pref_scorePlayNotification', val ? '1' : '0');
    },

    get startPage () {
      const savedVal = localStorage.getItem('pref_startPage');
      if (savedVal) {
        return Number(savedVal);
      } else {
        // 保存されていない場合は、デフォルト値を保存して、返す。
        localStorage.setItem('pref_startPage', String(this.startPageDefaultVal));
        return this.startPageDefaultVal;
      }
    },

    set startPage (val) {
      if (typeof val !== 'number') {
        throw TypeError(`Argument must be number, ${typeof val} passed.`);
      }
      localStorage.setItem('pref_startPage', String(val));
    },

    get updateFreqMinitus () {
      const savedVal = localStorage.getItem('pref_updateFreqMinitus');
      if (savedVal) {
        return Number(savedVal);
      } else {
        // 保存されていない場合は、デフォルト値を保存して、返す。
        localStorage.setItem('pref_updateFreqMinitus', String(this.updateFreqMinitusDefaultVal));
        return this.updateFreqMinitusDefaultVal;
      }
    },

    set updateFreqMinitus (val) {
      if (typeof val !== 'number') {
        throw TypeError(`Argument must be number, ${typeof val} passed.`);
      }
      localStorage.setItem('pref_updateFreqMinitus', String(val));
    },

    save: function (prefs) {
      // console.log(prefs);
      for (const pref in prefs) {
        // console.log(pref);
        switch (pref) {
          case 'favoriteTeamId': {
            const isChanged = prefs.favoriteTeamId !== App.preferences.favoriteTeamId;
            App.preferences.favoriteTeamId = prefs.favoriteTeamId;
            if (isChanged) {
              App.reload();
            }
            break;
          }
          case 'gamesetNotification':
            App.preferences.gamesetNotification = prefs.gamesetNotification;
            break;
          case 'inningChangeNotification':
            App.preferences.inningChangeNotification = prefs.inningChangeNotification;
            break;
          case 'playballNotification':
            App.preferences.playballNotification = prefs.playballNotification;
            break;
          case 'startPage':
            App.preferences.startPage = prefs.startPage;
            break;
          case 'scorePlayNotification':
            App.preferences.scorePlayNotification = prefs.scorePlayNotification;
            break;
          case 'silentNotification':
            App.preferences.silentNotification = prefs.silentNotification;
            break;
          case 'updateFreqMinitus': {
            const isChanged = prefs.updateFreqMinitus !== App.preferences.updateFreqMinitus;
            App.preferences.updateFreqMinitus = prefs.updateFreqMinitus;
            if (isChanged) {
              App.reScheduleNextScoreUpdateTime();
            }
            break;
          }
          default:
            //
        }
      }
    }
  }, // preferences

  audioPlayer: {
    isStalled: false,
    timeoutId: null,

    /**
     * isStalledの値をfalseに設定する。
     * @param  {Event} e イベントハンドラのイベントオブジェクト
     */
    playingEventHander: function (e) {
      // console.log(e.type);
      App.audioPlayer.isStalled = false;
    },

    /**
     * 関数実行後5秒以内にisStalledがfalseにならなければ、
     * audioPlayerをリロードして、再生を再開する。
     *
     * @param  {Event} e イベントハンドラのイベントオブジェクト
     */
    waitingEventHander: function (e) {
      // console.log(e.type);
      App.audioPlayer.isStalled = true;
      clearTimeout(App.audioPlayer.timeoutId);
      App.audioPlayer.timeoutId = window.setTimeout(function () {
        // console.log(`isAudioPlayerStalled: ${App.audioPlayer.isStalled}`);
        if (App.audioPlayer.isStalled) {
          // console.log('reload');
          GUI.rakutenFmTohokuSection.audioPlayer.reload(RakutenFmTohoku.hlsSrcUrl);
          GUI.rakutenFmTohokuSection.audioPlayer.play();
        }
      }, 5 * 1000);
    }
  },
  /*
  calcDetailPageUpdateTime: function (card, nowMilliSec) {
    //
    let updateTime;
    const currentCardStatus = card.currentStatus();
    const scheduledStartTimeObj = card.scheduledStartTimeObject();
    if (scheduledStartTimeObj) {
      // 試合開始の5分前から更新
      updateTime = scheduledStartTimeObj.getTime() - 5 * 60 * 1000;
    } else if (currentCardStatus === YahooNPBCard.statuses.cancel ||
                currentCardStatus === YahooNPBCard.statuses.over) {
      // 試合終了後や中止の場合は、遠い未来を指定。
      updateTime = nowMilliSec + (24 * 60 * 60 * 1000);
    } else {
      // 試合中
      const intervalSec = App.ignoreUpdateFreqPref ? 10 : App.preferences.updateFreqMinitus * 60;
      updateTime = nowMilliSec + (intervalSec * 1000);
    }

    return updateTime;
  },
  */
  execProtocol: function (url) {
    electron.shell.openExternal(url);
  },

  fetchDetailPageAsync: function (card) {
    //
    return new Promise((resolve, reject) => {
      if (!card || !card.detailPageUrl) {
        resolve({ scoreBoard: null, scorePlays: [], startingMembers: null });
        return;
      }

      if (App.isLocalDebug) {
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
            resolve(YahooNPB.parseDetailPage(data));
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
            resolve(YahooNPB.parseDetailPage(buf.toString('utf8')));
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
  },

  fetchTimeTableAsync: function () {
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
              const error = new Error(`Server returned Status Code: ${res.statusCode}`);
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
  },

  /**
   * [description]
   * error: ServerError, ParseError
   * @return {[type]} [description]
   */
  fetchTopPageAsync: function () {
    return new Promise((resolve, reject) => {
      try {
        if (App.isLocalDebug) {
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
  },

  forceUpdateNowOnAir: function () {
    this.updateNowOnAirAsync(true);
  },

  init: function () {
    this.reset();

    GUI.menu.init(App.preferences.startPage, App.preferences.favoriteTeamId);

    GUI.rakutenFmTohokuSection.init(
      RakutenFmTohoku.hlsSrcUrl,
      this.disableRadioPlayer,
      App.audioPlayer.playingEventHander,
      App.audioPlayer.waitingEventHander
    );

    GUI.preferenceSection.init(App.preferences, App.isDebug, App.preferences.save);
    // GUI.preferenceSection.onPreferenceChanged = App.preferences.save;
  },

  makeNotification: function (card) {
    // console.log(card)
    if (!card) return;

    const currentStatus = card.currentStatus();
    if (App.currentStatus === undefined) {
      App.currentStatus = currentStatus; // 起動直後対策
    }

    const currentInning = card.currentInning();
    if (App.currentInning === undefined) {
      App.currentInning = currentInning; // 起動直後対策
    }

    // console.log(`current Status:${currentStatus} Inning:${currentInning}`);

    // プレイボール通知
    if (App.preferences.playballNotification &&
      App.currentStatus === YahooNPBCard.statuses.before &&
      currentStatus === YahooNPBCard.statuses.going) {
      App.notifyPlayBall(card);
    }

    // ゲームセット通知
    if (App.preferences.gamesetNotification &&
        App.currentStatus !== YahooNPBCard.statuses.over &&
        currentStatus === YahooNPBCard.statuses.over) {
      App.notifyGameSet(card);
    }

    // スコアプレイ通知
    if (App.preferences.scorePlayNotification &&
      currentStatus !== YahooNPBCard.statuses.over) {
      // 起動直後対策
      if (App.notifiedScorePlays === undefined) {
        App.notifiedScorePlays = card.scorePlays;
        // return;
      }

      // 取得したスコアプレーから、通知済みとして保存されていないものを探して、通知する。
      let scorePlayIndex = 0;
      for (const newSp of card.scorePlays) {
        let found = false;
        for (const oldSp of App.notifiedScorePlays) {
          if (newSp.isEqual(oldSp)) {
            found = true;
            break;
          }
        }
        if (!found) {
          App.notifyScorePlay(card, scorePlayIndex);
          App.notifiedScorePlays.push(newSp);
        }
        scorePlayIndex++;
      }
    }

    // イニング通知
    if (App.preferences.inningChangeNotification &&
        currentInning !== null && App.currentInning !== null &&
        currentInning > App.currentInning) {
      App.notifyInningChange(card, currentInning);
    }

    App.currentStatus = currentStatus;
    App.currentInning = currentInning;
  },

  notifyGameSet: function (card) {
    //
    const title = `[試合終了] ${card.homeTeam.team} vs ${card.awayTeam.team} @ ${card.venue}`;
    const body = `${card.homeTeam.team} ${card.homeTeam.score} - ${card.awayTeam.score} ${card.awayTeam.team}`;
    const options = { body: body, silent: App.preferences.silentNotification, tag: 'gameset' };
    const notification = new Notification(title, options);
  },

  notifyInningChange: function (card, currentInning) {
    let inningText = '';
    if (currentInning === Math.floor(currentInning)) { // 6.5 <- 6回裏 つまり、小数点以下を切り捨てしたものと同じなら、'表'。
      inningText = `${currentInning - 1}回裏 終了`;
    } else {
      inningText = `${Math.floor(currentInning)}回表 終了`;
    }
    const title = `[途中経過] ${card.homeTeam.team} vs ${card.awayTeam.team} @ ${card.venue}`;
    const body = `${inningText} ${card.homeTeam.team} ${card.homeTeam.score} - ${card.awayTeam.score} ${card.awayTeam.team}`;
    const options = { body: body, silent: App.preferences.silentNotification, tag: 'inningChange' };
    const notification = new Notification(title, options);
  },

  notifyPlayBall: function (card) {
    //
    const title = `[試合開始] ${card.homeTeam.team} vs ${card.awayTeam.team} @ ${card.venue}`;
    const body = `[先攻] ${card.awayTeam.team} (先)${card.awayTeam.startingMember[0].name} \n[後攻] ${card.homeTeam.team} (先)${card.homeTeam.startingMember[0].name} `;
    const options = { body: body, silent: App.preferences.silentNotification, tag: 'playball' };
    const notification = new Notification(title, options);
  },

  notifyScorePlay: function (card, scorePlayIndex) {
    const sp = card.scorePlays[scorePlayIndex];

    let iconUrl = null;
    if (sp.inningText.match(/^(\d{1,2})回(表)$/)) {
      iconUrl = `../assets/img/teamLogos/${card.awayTeam.id}.png`;
    } else if (sp.inningText.match(/^(\d{1,2})回(裏)$/)) {
      iconUrl = `../assets/img/teamLogos/${card.homeTeam.id}.png`;
    }

    const title = `[スコアプレイ] ${card.homeTeam.team} vs ${card.awayTeam.team} @ ${card.venue}`;
    const body = `${sp.inningText} ${sp.order} ${sp.player} ${sp.state}。 ${sp.summary}`;
    const options = {
      body: body,
      icon: iconUrl,
      silent: App.preferences.silentNotification,
      tag: `scorePlay${scorePlayIndex}`
    };
    const notification = new Notification(title, options);
    notification.onclick = function () {
      App.execProtocol(`${card.detailPageUrl}#scor_ply`);
    };
  },

  openRakutenFm: function () {
    electron.shell.openExternal('https://www.rakuteneagles.jp/radio/#header');
  },

  openSportsnavi: function () {
    electron.shell.openExternal('https://baseball.yahoo.co.jp/npb/');
  },

  reScheduleNextScoreUpdateTime: function () {
    // console.log('reScheduleNextScoreUpdateTime()');
    const intervalSec = App.ignoreUpdateFreqPref ? 10 : App.preferences.updateFreqMinitus * 60;
    App.nextScoreUpdateTime = Date.now() + (intervalSec * 1000);
    // console.log(new Date(App.nextScoreUpdateTime));
  },

  updateCardsAsync: function (isForceUpdate) {
    //
    const nowMilliSec = Date.now();
    if (App.nextScoreUpdateTime !== undefined &&
        App.nextScoreUpdateTime > nowMilliSec &&
        !isForceUpdate) {
      // console.log(`${App.nextScoreUpdateTime - now}`);
      return;
    }

    const intervalSec = App.ignoreUpdateFreqPref ? 10 : App.preferences.updateFreqMinitus * 60;
    App.nextScoreUpdateTime = nowMilliSec + (intervalSec * 1000);
    // console.log(new Date(App.nextScoreUpdateTime));

    this.fetchTopPageAsync()
      .then((topPageData) => {
        //
        GUI.today.hideTopPageError();

        var favoriteTeamCard = YahooNPBCard.findCardByTeamId(
          topPageData.cards,
          App.preferences.favoriteTeamId
        );

        if (favoriteTeamCard && !favoriteTeamCard.isTodaysCard()) {
          favoriteTeamCard = null;
        }

        this.updateDetailAsync(favoriteTeamCard, nowMilliSec, isForceUpdate)
          .then((card) => {
            try {
              GUI.renderTodaySection(card, nowMilliSec, App.preferences.favoriteTeamId,
                App.isDebug,
                App.nextDetailPageUpdateTime);
              App.makeNotification(card);
            } catch (e) {
              console.log(e);
              GUI.today.showDetailPageError(e, App.isDebug, App.nextDetailPageUpdateTime);
            }
          })
          .catch((e) => {
            console.log(e);
            GUI.today.showDetailPageError(e, App.isDebug, App.nextDetailPageUpdateTime);
          });

        return topPageData;
      })
      .then((topPageData) => {
        try {
          const favoriteLeagueCards = [];
          for (const card of topPageData.cards) {
            if (!card.isTodaysCard()) continue;

            if (card.homeTeam.isSameLeague(App.preferences.favoriteTeamId) ||
                card.awayTeam.isSameLeague(App.preferences.favoriteTeamId)) {
              favoriteLeagueCards.push(card);
            }
          }

          GUI.CardsSection.render(
            favoriteLeagueCards,
            nowMilliSec,
            App.preferences.favoriteTeamId,
            App.isDebug);
        } catch (e) {
          console.log(e);
          GUI.CardsSection.showErrorMessage(e, App.isDebug, App.nextScoreUpdateTime);
        }

        try {
          GUI.renderStandingsSection(topPageData.npbStandings, App.preferences.favoriteTeamId);
        } catch (e) {
          console.log(e);
          GUI.standingsSection.showErrorMessage(e, App.isDebug, App.nextScoreUpdateTime);
        }
      })
      .catch((e) => {
        console.log(e);
        GUI.today.showTopPageError(e, App.isDebug, App.nextScoreUpdateTime);
        GUI.CardsSection.showErrorMessage(e, App.isDebug, App.nextScoreUpdateTime);
        GUI.standingsSection.showErrorMessage(e, App.isDebug, App.nextScoreUpdateTime);
      });
  },

  updateDetailAsync: function (card, updateMilliSec, isForceUpdate) {
    return new Promise((resolve, reject) => {
      if (!card) {
        resolve(card);
        return;
      }
      //
      const detailPageUpdateTime = App.nextDetailPageUpdateTime;
      // App.nextDetailPageUpdateTime = App.calcDetailPageUpdateTime(card, updateMilliSec);
      App.nextDetailPageUpdateTime = App.nextScoreUpdateTime;
      // console.log(`${new Date(App.nextDetailPageUpdateTime)}`);

      if (detailPageUpdateTime === undefined ||
          detailPageUpdateTime <= updateMilliSec ||
          isForceUpdate) {
        App.fetchDetailPageAsync(card)
          .then(({ scoreBoard, scorePlays, startingMembers }) => {
            card.scoreBoard = scoreBoard;
            card.scorePlays = scorePlays;
            card.homeTeam.startingMember = startingMembers ? startingMembers.homeTeamStartingMember : null;
            card.awayTeam.startingMember = startingMembers ? startingMembers.awayTeamStartingMember : null;
            resolve(card);
          })
          .catch((e) => {
            reject(e);
          });
      } else {
        // console.log('skipped');
      }
    });
  },

  updateNowOnAirAsync: function (isForceUpdate) {
    //
    const now = Date.now();
    if (App.nextNoaUpdateTime !== undefined &&
        App.nextNoaUpdateTime > now &&
        !isForceUpdate) {
      // console.log('NOA:' + new Date(App.nextNoaUpdateTime));
      return;
    }

    this.fetchTimeTableAsync()
      .then((timeTable) => {
        const p = RakutenFmTohoku.getNowOnAirProgram(timeTable);

        try {
          GUI.rakutenFmTohokuSection.renderNowOnAir(p);
        } catch (e) {
          console.log(e);
          GUI.rakutenFmTohokuSection.showErrorMessage(e, App.isDebug, App.nextNoaUpdateTime);
        }

        // 次回更新時刻をプログラムの終了時刻に設定。
        App.nextNoaUpdateTime = p
          ? p.endTimeMSec
          : now + (App.preferences.updateFreqMinitus * 60 * 1000);
      })
      .catch((e) => {
        console.log(e);
        App.nextNoaUpdateTime = now + (App.preferences.updateFreqMinitus * 60 * 1000);
        GUI.rakutenFmTohokuSection.showErrorMessage(e, App.isDebug, App.nextNoaUpdateTime);
      });
  },

  quit: function () {
    // console.log('App::quit()');
    window.close();
  },

  reload: function () {
    this.reset();
    this.run();
  },

  reloadMediaElement: function () {
    GUI.rakutenFmTohokuSection.reloadMediaElement(RakutenFmTohoku.hlsSrcUrl);
  },

  reset: function () {
    this.isOnline = navigator.onLine;

    this.cards = undefined;
    this.notifiedScorePlays = undefined;

    this.currentInning = undefined;
    this.currentStatus = undefined;

    this.nextNoaUpdateTime = undefined;
    this.nextDetailPageUpdateTime = undefined;
    this.nextScoreUpdateTime = undefined;
  },

  run: function () {
    //
    App.update();

    // 1秒ごとに実行。
    if (App.timerId) clearTimeout(App.timerId);
    App.timerId = setInterval(App.update, 1 * 1000);
  },

  update: function () {
    if (navigator.onLine) {
      // console.log('Online');

      // オフラインからオンラインに変わった場合は、強制的にアップデート。
      const isForceUpdate = !App.isOnline && navigator.onLine ? true : false;
      App.updateCardsAsync(isForceUpdate);
      if (!App.disabledNowOnAir) {
        App.updateNowOnAirAsync(isForceUpdate);
      }
    } else {
      // console.log('offline');
    }

    GUI.menu.updateMenu(App.preferences.favoriteTeamId);
    GUI.updateNetworkStatus();
    App.isOnline = navigator.onLine;
  }
}; // App

if (typeof module !== 'undefined') {
  module.exports = {
    App: App
  };
}
