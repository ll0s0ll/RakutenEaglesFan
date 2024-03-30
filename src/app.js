'use strict';
/* global assert CheckingUpdatesWorker DISABLE_RADIO electron GUI Notification RakutenFmTohokuCrawler YahooNPBCard YahooNPBCrawler localStorage */

// オブジェクト名を取得
// console.log(Object.prototype.toString.apply(scheduledStartTime));

const App = {
  notifiedScorePlays: undefined,
  currentInning: undefined,
  currentStatus: undefined,
  favoriteTeamCard: undefined,

  preferences: {
    // デフォルト値
    autoUpdatesCheckingDefaultVal: true,
    autoUpdatesCheckingIntervalDaysDefaultVal: 1,
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

    get autoUpdatesChecking () {
      const savedVal = localStorage.getItem('pref_autoUpdatesChecking');
      if (savedVal) {
        return savedVal === '1' ? true : false;
      } else {
        const defaultVal = this.autoUpdatesCheckingDefaultVal ? '1' : '0';
        localStorage.setItem('pref_autoUpdatesChecking', defaultVal);
        return this.gamesetNotificationDefaultVal;
      }
    },

    set autoUpdatesChecking (val) {
      assert(typeof val === 'boolean', `Invalid argument, ${typeof val} passed.`);
      localStorage.setItem('pref_autoUpdatesChecking', val ? '1' : '0');
    },

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
          case 'autoUpdatesChecking': {
            const isChanged = prefs.autoUpdatesChecking !== App.preferences.autoUpdatesChecking;
            App.preferences.autoUpdatesChecking = prefs.autoUpdatesChecking;
            if (isChanged) {
              if (App.preferences.autoUpdatesChecking) {
                App.checkingUpdatesWorker.run();
              } else {
                App.checkingUpdatesWorker.stop();
              }
            }
            break;
          }
          case 'favoriteTeamId': {
            const isChanged = prefs.favoriteTeamId !== App.preferences.favoriteTeamId;
            App.preferences.favoriteTeamId = prefs.favoriteTeamId;
            if (isChanged) {
              App.reset();
              App.yahooNpbCrawler.update(true);
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
              App.yahooNpbCrawler.update(true);
            }
            break;
          }
          default:
            //
        }
      }
    }
  }, // preferences

  Notification: {
    notifyUpdateAvailable: function (version) {
      if (!version) return;

      const title = 'アップデートがあります';
      const options = {
        body: `新しいバージョン（${version}）が公開されました。\nクリックして確認してください。`,
        silent: App.preferences.silentNotification,
        tag: 'updateAvailable'
      };

      const notification = new Notification(title, options);
      notification.onclick = function () {
        App.openGitHubLatestReleasePage();
      };
    }
  },

  checkUpdatesNow: function () {
    this.checkingUpdatesWorker.checkUpdatesNow();
  },

  execProtocol: function (url) {
    electron.shell.openExternal(url);
  },

  init: function () {
    this.reset();

    GUI.init(App.preferences);

    this.setupIPC();
    this.setupKeyboardShortcuts();
    this.setupNetworkStatusListener();
    this.setupOnScrollListener();

    this.checkingUpdatesWorker = this.setupCheckingUpdatesWorker();
    this.rakutenFmTohokuCrawler = this.setupRakutenFmTohokuCrawler();
    this.yahooNpbCrawler = this.setupYahooNPBCrawler();
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
    const options = {
      body: body,
      silent: App.preferences.silentNotification,
      tag: `inningChange_${inningText}`
    };
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

  openGitHubLatestReleasePage: function () {
    electron.shell.openExternal('https://github.com/ll0s0ll/rakuteneaglesfan/releases/latest');
  },

  openRakutenFm: function () {
    electron.shell.openExternal('https://www.rakuteneagles.jp/radio/#header');
  },

  openSportsnavi: function () {
    electron.shell.openExternal('https://baseball.yahoo.co.jp/npb/');
  },

  setupCheckingUpdatesWorker: function () {
    const worker = new CheckingUpdatesWorker(
      App.preferences.autoUpdatesCheckingIntervalDaysDefaultVal
    );
    worker.addEventListener('onProcessed', function (e) {
      GUI.preferenceSection.refreshCheckingUpdatesStatus(
        e.data.version,
        e.data.date,
        e.data.error);
      if (e.data.version && !e.data.error) {
        App.Notification.notifyUpdateAvailable(e.data.version);
      }
    });
    worker.addEventListener('onError', function (e) {
      GUI.preferenceSection.refreshCheckingUpdatesStatus(
        null,
        e.data.date,
        e.data.error);
    });

    return worker;
  },

  setupIPC: function () {
    electron.ipcRenderer.on('resume', async (event, arg) => {
      console.log('Resumed: ' + new Date().toLocaleTimeString());
      await this.sleep(5);
      this.yahooNpbCrawler.update(true);
      this.rakutenFmTohokuCrawler.update(true);
    });
  },

  setupKeyboardShortcuts: function () {
    document.addEventListener('keyup', (event) => {
      switch (event.keyCode) {
        case 49: // Digit1 to 今日の試合
          GUI.switchTab(GUI.Tabs.TODAY);
          break;
        case 50: // Digit2 to パ・リーグ
          GUI.switchTab(GUI.Tabs.CARDS);
          break;
        case 51: // Digit3 to 順位表
          GUI.switchTab(GUI.Tabs.STANDINGS);
          break;
        case 52: // Digit4 to ラジオ
          GUI.switchTab(GUI.Tabs.RADIO);
          break;
        case 53: // Digit5 to 設定
          GUI.switchTab(GUI.Tabs.SETTINGS);
          break;
      }
    });
  },

  setupNetworkStatusListener: function () {
    window.addEventListener('offline', function (e) {
      console.log('offline');
      GUI.updateNetworkStatus();
    });

    window.addEventListener('online', function (e) {
      console.log('online');
      GUI.updateNetworkStatus();
      this.yahooNpbCrawler.update(true);
      this.rakutenFmTohokuCrawler.update(true);
    }.bind(this));
  },

  setupOnScrollListener: function () {
    window.addEventListener('scroll', function (e) {
      GUI.saveYPositionOfActiveTab();
    });

  setupRakutenFmTohokuCrawler: function () {
    const crawler = new RakutenFmTohokuCrawler(App.preferences);
    crawler.addEventListener('nowOnAirProgramUpdated', function (e) {
      GUI.radioSection.renderNowOnAir(e.data.program);
      GUI.radioSection.renderTimeTable(e.data.programsToday);
    });
    crawler.addEventListener('onError', function (e) {
      const data = e.data;
      GUI.radioSection.showErrorMessage(data.error, data.nextUpdate);
    });
    return crawler;
  },

  setupYahooNPBCrawler: function () {
    const crawler = new YahooNPBCrawler(App);
    crawler.addEventListener('detailPageData', function (e) {
      App.favoriteTeamCard = e.data.card;

      GUI.renderTodaySection(
        e.data.card,
        e.data.date,
        App.preferences.favoriteTeamId
      );
      App.makeNotification(e.data.card);
    });

    crawler.addEventListener('topPageData', function (e) {
      let error = null;
      const topPageData = e.data.topPageData;
      const favoriteTeamId = App.preferences.favoriteTeamId;
      const favoriteLeagueCards = [];
      for (const card of topPageData.cards) {
        if (!card.isTodaysCard()) continue;
        try {
          if (card.homeTeam.isSameLeague(App.preferences.favoriteTeamId) ||
              card.awayTeam.isSameLeague(App.preferences.favoriteTeamId)) {
            favoriteLeagueCards.push(card);
          }
        } catch (e) {
          console.error(e);
          error = e;
        }
      }

      GUI.today.hideTopPageError();
      GUI.menu.updateMenu(App.preferences.favoriteTeamId);
      if (error == null) {
        GUI.CardsSection.render(favoriteLeagueCards, e.data.date, favoriteTeamId);
      } else {
        GUI.CardsSection.showErrorMessage(error, e.data.nextUpdateMsec);
      }
      GUI.renderStandingsSection(topPageData.npbStandings, favoriteTeamId);
    });

    crawler.addEventListener('detailPageError', function (e) {
      GUI.today.showDetailPageError(e.data.error, e.data.nextUpdateMsec);
    });

    crawler.addEventListener('topPageError', function (event) {
      const data = event.data;
      GUI.today.showTopPageError(data.error, data.nextUpdateMsec);
      GUI.CardsSection.showErrorMessage(data.error, data.nextUpdateMsec);
      GUI.standingsSection.showErrorMessage(data.error, data.nextUpdateMsec);
    });

    return crawler;
  },

  quit: function () {
    window.close();
  },

  reset: function () {
    this.notifiedScorePlays = undefined;
    this.currentInning = undefined;
    this.currentStatus = undefined;
  },

  run: function () {
    this.yahooNpbCrawler.run();

    if (App.preferences.autoUpdatesChecking) {
      this.checkingUpdatesWorker.run();
    }

    if (!DISABLE_RADIO) {
      this.rakutenFmTohokuCrawler.run();
    }
  },

  sleep (sec) {
    return new Promise(resolve => setTimeout(resolve, sec * 1000));
  }
}; // App

if (typeof module !== 'undefined') {
  module.exports = {
    App: App
  };
}
