'use strict';
/* global $ DEBUG DISABLE_RADIO electron RakutenFmTohoku YahooNPB YahooNPBCard */
const GUI = {

  init: function (preferences) {
    this.updateNetworkStatus();

    GUI.menu.init(preferences.startPage, preferences.favoriteTeamId);
    GUI.preferenceSection.init(preferences, preferences.save);
    GUI.radioSection.init();
  },

  errorMsgs: {
    ServerErrorMsg: '情報の取得に失敗しました。',
    parseErrorMsg: '情報の解析に失敗しました。',
    unexpectedErrorMsg: '予期せぬエラーが発生しました。'
  },

  renderStandingsSection: function (npbStandings, favoriteTeamId) {
    // console.log(npbStandings);
    $('#standingsSectionErrorMsg').text('').hide();

    let standings;
    if (YahooNPB.isPacificLeagueTeam(favoriteTeamId)) {
      standings = npbStandings.pacificLeague;
    } else {
      standings = npbStandings.centralLeague;
    }

    if (!standings) {
      // console.log('順位表なし。');
      return;
    }

    const tbody = $('#standingsSection tbody')[0];
    // console.log(tbody);
    tbody.innerHTML = '';
    //
    for (const team of standings) {
      let tr = '';
      if (team[1] === YahooNPB.teamIdToName(favoriteTeamId)) {
        tr = '<tr class="standings__favoriteTeam">';
      } else {
        tr = '<tr>';
      }

      for (let i = 0; i < team.length; i++) {
        switch (i) {
          case 0:
            tr += `<td class="standings__standing">${team[i]}</td>`;
            break;
          case 1:
            tr += `<td class="standings__team-name">${team[i]}</td>`;
            break;
          default:
            tr += `<td>${team[i]}</td>`;
        }
      }
      tr += '</tr>';
      tbody.innerHTML += tr;
    }

    // 更新日時
    let update;
    if (YahooNPB.isPacificLeagueTeam(favoriteTeamId)) {
      update = npbStandings.pacificLeagueUpdate;
    } else {
      update = npbStandings.centralLeagueUpdate;
    }

    let text = '';
    if (update) {
      // 2020/7/4 22:32:00 -> 2020/7/4 22:32
      text = update.toLocaleString().replace(/(:\d+)$/, '');
      $('#standingsSection footer span').text(text);
    }
  },

  renderTodaySection: function (card, updateMsec, favoriteTeamId) {
    GUI.today.resetErrorMessages();
    GUI.today.constructH2();
    GUI.today.constructCard(card);
    GUI.today.constructScoreBoardTable(card);
    GUI.today.constructVideoList(card);
    GUI.today.constructScorePlay(card);
    GUI.today.constructNoGameMessage(card, favoriteTeamId);
    GUI.today.constructFooter(updateMsec);
  },

  switchTab: function (tab) {
    // console.log('switchTab()');
    $('#tabs').tabs('option', 'active', tab);
  },

  switchRadioSectionTab: function (tabNumber) {
    // $('#tabs').tabs('option', 'active', 3);
    $('#radioSectionTabs').tabs('option', 'active', tabNumber);
  },

  updateNetworkStatus: function () {
    if (navigator.onLine) {
      $('#networkStatusMessage').hide();
    } else {
      $('#networkStatusMessage').show();
    }
  },

  CardsSection: {

    constructGameDiv: function (card) {
      const gameDiv = document.createElement('div');
      gameDiv.className = 'card__game game';

      const kindText = this.generateKindText(card);
      if (kindText) {
        gameDiv.innerHTML += `<p class="game__kind">${kindText}</p>`;
      }

      gameDiv.innerHTML += `<p class="game__venue">${card.venue}</p>`;

      if (card.homeTeam.score && card.awayTeam.score) {
        gameDiv.innerHTML += `<p class="game__score">${card.homeTeam.score} - ${card.awayTeam.score}</p>`;
      }

      if (card.scheduledStartTime) {
        gameDiv.innerHTML += `<p class="game__scheduled-starttime">${card.scheduledStartTime}</p>`;
      }

      const statusText = this.generateStatusText(card);
      if (statusText) {
        if (card.detailPageUrl) {
          gameDiv.innerHTML += `<p class="game__status" onclick="App.execProtocol('${card.detailPageUrl}')">${statusText}</p>`;
        } else {
          gameDiv.innerHTML += `<p class="game__status">${statusText}</p>`;
        }
      }

      return gameDiv;
    },

    constructTeamDiv: function (teamObj) {
      const div = document.createElement('div');
      div.className = `card__team team team${teamObj.id}`;

      const teamP = document.createElement('p');
      teamP.className = 'team__team-name';
      teamP.textContent = teamObj.team;
      div.appendChild(teamP);

      const playersUl = document.createElement('ul');
      playersUl.className = 'team__pitchers pitchers';
      for (const p of teamObj.players) {
        const playerLi = document.createElement('li');
        playerLi.textContent = p;
        playersUl.appendChild(playerLi);
      }
      div.appendChild(playersUl);

      return div;
    },

    generateKindText: function (card) {
      switch (card.kind) {
        case YahooNPB.kindIds[1]: // セ・リーグ
          return '';
        case YahooNPB.kindIds[2]: // パ・リーグ
          return '';
        case YahooNPB.kindIds[35]: // セ・リーグCSファーストステージ
          return 'CSファーストステージ';
        case YahooNPB.kindIds[36]: // セ・リーグCSファイナルステージ
          return 'CSファイナルステージ';
        case YahooNPB.kindIds[37]: // パ・リーグCSファーストステージ
          return 'CSファーストステージ';
        case YahooNPB.kindIds[38]: // パ・リーグCSファイナルステージ
          return 'CSファイナルステージ';
        default:
          return card.kind;
      }
    },

    generateStatusText: function (card) {
      if (!card) return '';
      switch (card.currentStatus()) {
        case YahooNPBCard.statuses.before:
          return '試合開始予定';
        default:
          return card.status ? card.status : '';
      }
    },

    render: function (cards, updateMsec, favoriteTeamId) {
      //
      this.updateLastUpdateText(updateMsec);

      $('#cardsSectionErrorMsg').text('').hide();

      // h2部分
      const now = new Date(updateMsec);
      const dayText = ['日', '月', '火', '水', '木', '金', '土'][now.getDay()];
      const h2Text = `${now.getMonth() + 1}月${now.getDate()}日（${dayText}）の日程・結果`;
      $('#cardsSectionH2').text(h2Text);

      const cardsUL = document.createElement('ul');
      cardsUL.className = 'cards-section__cards cards';

      for (const card of cards) {
        // console.log(card)
        const li = document.createElement('li');
        li.className = 'cards__card card';
        li.appendChild(this.constructTeamDiv(card.homeTeam));
        li.appendChild(this.constructGameDiv(card));
        li.appendChild(this.constructTeamDiv(card.awayTeam));

        cardsUL.appendChild(li);
      }

      const contents = document.getElementById('cardsSectionContents');
      contents.innerHTML = '';
      if (cardsUL.hasChildNodes()) {
        contents.appendChild(cardsUL);
      } else {
        const p = document.createElement('p');
        p.className = 'cards-section__no-game';
        if (YahooNPB.isPacificLeagueTeam(favoriteTeamId)) {
          p.className += ' team15';
        } else {
          p.className += ' team16';
        }
        p.textContent = '今日の試合はありません';
        contents.appendChild(p);
      }
    },

    showErrorMessage: function (e, nextScoreUpdateTime) {
      let msg = '';
      switch (e.name) {
        case 'ServerError':
          msg = GUI.errorMsgs.ServerErrorMsg;
          break;
        case 'ParseError':
          msg = GUI.errorMsgs.parseErrorMsg;
          break;
        default:
          msg = GUI.errorMsgs.unexpectedErrorMsg;
      }
      const d = new Date(nextScoreUpdateTime);
      if (DEBUG) {
        msg += ` ${d.getHours()}時${d.getMinutes()}分${d.getSeconds()}秒に再試行します。`;
      } else {
        msg += ` ${d.getHours()}時${d.getMinutes()}分に再試行します。`;
      }
      $('#cardsSectionErrorMsg').text(msg).show();
    },

    updateLastUpdateText: function (update) {
      // 更新時刻を更新
      let now = new Date(update).toLocaleTimeString();
      if (!DEBUG) {
        // 21:52:04 -> 21:52
        now = now.replace(/:\d{1,2}$/, '');
      }
      $('#cardsLastUpdateText').text(now);
    }
  }, // CardsSection

  menu: {
    favoriteTeamId: null,

    init: function (startPage, favoriteTeamId) {
      //
      $('#tabs').tabs({
        show: { effect: 'fade', duration: 150 },
        active: startPage
      });

      $('#todaySectionMenu').attr('href', 'javascript:GUI.switchTab(0)');
      $('#cardsSectionMenu').attr('href', 'javascript:GUI.switchTab(1)');
      $('#standingsSectionMenu').attr('href', 'javascript:GUI.switchTab(2)');
      $('#radioSectionMenu').attr('href', 'javascript:GUI.switchTab(3)');
      $('#preferenceSectionMenu').attr('href', 'javascript:GUI.switchTab(4)');
      $('#quitMenu').attr('href', 'javascript:App.quit()');

      this.updateMenu(favoriteTeamId);
    },

    updateMenu: function (favoriteTeamId) {
      if (YahooNPB.isPacificLeagueTeam(favoriteTeamId)) {
        $('#cardsSectionMenu').text('パ・リーグ');
      } else {
        $('#cardsSectionMenu').text('セ・リーグ');
      }
    }
  },

  preferenceSection: {

    cancel: function (preferences) {
      // console.log('cancel');
      for (const element of $('#preferenceSection input, select')) {
        // console.log(`type:${input.type} id:${input.id} name:${input.name} value:${input.value}`);
        switch (element.id) {
          case 'autoUpdatesCheckingCheckbox':
            element.checked = preferences.autoUpdatesChecking;
            break;
          case 'favoriteTeamSelect':
            $('#favoriteTeamSelect').val(String(preferences.favoriteTeamId));
            break;
          case 'gamesetNotifCheckbox':
            element.checked = preferences.gamesetNotification;
            break;
          case 'inningNotifCheckbox':
            element.checked = preferences.inningChangeNotification;
            break;
          case 'notificationSoundCheckbox':
            element.checked = preferences.silentNotification ? false : true;
            break;
          case 'playballNotifCheckbox':
            element.checked = preferences.playballNotification;
            break;
          case 'scorePlayNotifCheckbox':
            element.checked = preferences.scorePlayNotification;
            break;
          case 'startPageSelect':
            $('#startPageSelect').val(String(preferences.startPage));
            break;
          case 'updateFreqSlider':
            element.value = String(preferences.updateFreqMinitus);
            $('#updateFreqText').text(String(preferences.updateFreqMinitus));
            break;
          default:
            // Do nothing.
        }
      }

      $('#applyButton').prop('disabled', true);
      $('#cancelButton').prop('disabled', true);
    },

    clearCheckingUpdateStatus: function () {
      $('#updateMessage').html('');
    },

    init: function (preferences, onPreferenceChangedHandler) {
      // console.log('preference::init()');

      this.onPreferenceChanged = onPreferenceChangedHandler;

      $('#preferenceSectionErrorMsg').text('').hide();

      for (const element of $('#preferenceSection input, select')) {
        // console.log(`type:${input.type} id:${input.id} name:${input.name} value:${input.value}`);

        // すべての要素にonChangeハンドラを設定
        // element.onchange = this.onChangeHandler;
        element.onchange = function (event) {
          GUI.preferenceSection.onChangeHandler(event, preferences);
        };

        switch (element.id) {
          case 'autoUpdatesCheckingCheckbox':
            element.checked = preferences.autoUpdatesChecking;
            break;
          case 'favoriteTeamSelect':
            $('#favoriteTeamSelect').val(String(preferences.favoriteTeamId));
            break;
          case 'gamesetNotifCheckbox':
            element.checked = preferences.gamesetNotification;
            break;
          case 'inningNotifCheckbox':
            element.checked = preferences.inningChangeNotification;
            break;
          case 'notificationSoundCheckbox':
            element.checked = preferences.silentNotification ? false : true;
            break;
          case 'playballNotifCheckbox':
            element.checked = preferences.playballNotification;
            break;
          case 'scorePlayNotifCheckbox':
            element.checked = preferences.scorePlayNotification;
            break;
          case 'startPageSelect':
            element.value = String(preferences.startPage);

            for (const option of element.children) {
              if (option.value === '1') {
                if (YahooNPB.isPacificLeagueTeam(preferences.favoriteTeamId)) {
                  option.textContent = 'パ・リーグ';
                } else {
                  option.textContent = 'セ・リーグ';
                }
              }
            }
            break;
          case 'updateFreqSlider':
            element.oninput = function (event) {
              $('#updateFreqText').text(event.target.value);
            };
            element.step = 5;
            element.min = DEBUG ? 0 : preferences.minUpdateFreqMinitus;
            element.max = preferences.maxUpdateFreqMinitus;
            element.value = String(preferences.updateFreqMinitus);

            $('#updateFreqText').text(String(preferences.updateFreqMinitus));
            break;
          default:
            // Do nothing.
        }
      }

      const applyButton = $('#applyButton');
      applyButton.on('click', function () {
        GUI.preferenceSection.save();
      });
      applyButton.prop('disabled', true);

      const cancelButton = $('#cancelButton');
      cancelButton.on('click', function () {
        GUI.preferenceSection.cancel(preferences);
      });
      cancelButton.prop('disabled', true);
    },

    onChangeHandler: function (event, preferences) {
      // console.log(`onchange:${event.target}`);
      let isChanged = false;
      for (const element of $('#preferenceSection input, select')) {
        switch (element.id) {
          case 'autoUpdatesCheckingCheckbox':
            if (element.checked !== preferences.autoUpdatesChecking) {
              isChanged = true;
            }
            break;
          case 'favoriteTeamSelect':
            if ($('#favoriteTeamSelect').val() !== String(preferences.favoriteTeamId)) {
              isChanged = true;
            }
            break;
          case 'gamesetNotifCheckbox':
            if (element.checked !== preferences.gamesetNotification) {
              isChanged = true;
            }
            break;
          case 'inningNotifCheckbox':
            if (element.checked !== preferences.inningChangeNotification) {
              isChanged = true;
            }
            break;
          case 'notificationSoundCheckbox':
            // preference値とあたいが逆なため注意。
            if (element.checked !== !preferences.silentNotification) {
              isChanged = true;
            }
            break;
          case 'playballNotifCheckbox':
            if (element.checked !== preferences.playballNotification) {
              isChanged = true;
            }
            break;
          case 'scorePlayNotifCheckbox':
            if (element.checked !== preferences.scorePlayNotification) {
              isChanged = true;
            }
            break;
          case 'startPageSelect':
            if ($('#startPageSelect').val() !== String(preferences.startPage)) {
              isChanged = true;
            }
            break;
          case 'updateFreqSlider':
            if ($('#updateFreqSlider').val() !== String(preferences.updateFreqMinitus)) {
              isChanged = true;
            }
            break;
          default:
        }
      }

      // console.log(`isChanged:${isChanged}`);
      if (isChanged) {
        $('#applyButton').prop('disabled', false);
        $('#cancelButton').prop('disabled', false);
      } else {
        $('#applyButton').prop('disabled', true);
        $('#cancelButton').prop('disabled', true);
      }
    },

    onPreferenceChanged: function (preferences) {
      // Override me.
      console.log('onPreferenceChanged()');
    },

    refreshCheckingUpdatesStatus: function (version, update, error) {
      const timeStr = update.toLocaleTimeString().replace(/:\d{1,2}$/, '');
      let dateStr = `${update.getMonth() + 1}月${update.getDate()}日`;
      dateStr += DEBUG ? ` ${timeStr}` : '';

      let html = '';
      if (version) {
        html += `<strong><a href="javascript:App.openGitHubLatestReleasePage()">新しいバージョン（${version}）</a>があります。</strong>`;
      } else if (error && error.message === 'RateLimitExceeded') {
        html += 'エラー: 制限回数を超えました。';
      } else if (error) {
        html += `予期せぬエラーが発生しました。（${dateStr} 現在）`;
      } else {
        html += `最新のバージョンです。（${dateStr} 現在）`;
      }

      $('#updateMessage').html(html);
    },

    save: function () {
      // console.log('preference::save()');
      const newPrefs = {};
      for (const element of $('#preferenceSection input, select')) {
        // console.log(`type:${input.type} id:${input.id} name:${input.name} value:${input.value}`);
        switch (element.id) {
          case 'autoUpdatesCheckingCheckbox':
            newPrefs.autoUpdatesChecking = element.checked;
            break;
          case 'favoriteTeamSelect': {
            newPrefs.favoriteTeamId = Number($('#favoriteTeamSelect').val());
            /* const isChanged = App.preferences.favoriteTeamId !== Number($('#favoriteTeamSelect').val());
            App.preferences.favoriteTeamId = Number($('#favoriteTeamSelect').val());
            if (isChanged) {
              App.reload();
            } */
            break;
          }
          case 'notificationSoundCheckbox':
            newPrefs.silentNotification = element.checked ? false : true;
            // App.preferences.silentNotification = element.checked ? false : true;
            break;
          case 'gamesetNotifCheckbox':
            newPrefs.gamesetNotification = element.checked;
            // App.preferences.gamesetNotification = element.checked;
            break;
          case 'inningNotifCheckbox':
            newPrefs.inningChangeNotification = element.checked;
            // App.preferences.inningChangeNotification = element.checked;
            break;
          case 'playballNotifCheckbox':
            newPrefs.playballNotification = element.checked;
            // App.preferences.playballNotification = element.checked;
            break;
          case 'scorePlayNotifCheckbox':
            newPrefs.scorePlayNotification = element.checked;
            // App.preferences.scorePlayNotification = element.checked;
            break;
          case 'startPageSelect':
            newPrefs.startPage = Number($('#startPageSelect').val());
            // App.preferences.startPage = Number($('#startPageSelect').val());
            break;
          case 'updateFreqSlider': {
            newPrefs.updateFreqMinitus = Number(element.value) === 0
              ? 1
              : Number(element.value);
            /* const isChanged = App.preferences.updateFreqMinitus !== Number(element.value);
            App.preferences.updateFreqMinitus = Number(element.value) === 0
              ? 1
              : Number(element.value);
            if (isChanged) {
              App.reScheduleNextScoreUpdateTime();
            } */
            break;
          }
          default:
            // Do nothing.
        }
      }

      if (newPrefs.autoUpdatesChecking === false) {
        this.clearCheckingUpdateStatus();
      }

      this.onPreferenceChanged(newPrefs);

      $('#applyButton').prop('disabled', true);
      $('#cancelButton').prop('disabled', true);
    },

    showErrorMessage: function (msg) {
      $('#preferenceSectionErrorMsg').text(msg).show();
    }
  }, // preferenceSection

  radioSection: {
    audioPlayer: {
      isStalled: false,
      timeoutId: null,

      init: function () {
        const Hls = electron.node.hls;
        if (Hls.isSupported()) {
          GUI.hls = new Hls();
          GUI.hls.loadSource(RakutenFmTohoku.hlsSrcUrl);
          GUI.hls.attachMedia(document.getElementById('audioPlayer'));
          GUI.hls.on(Hls.Events.MANIFEST_PARSED, function () {
            // audio.play();
          });
          GUI.hls.on(Hls.Events.MANIFEST_PARSED, function (event, data) {
            // console.log('manifest loaded, found ' + data.levels.length + ' quality level');
          });
          GUI.hls.on(Hls.Events.ERROR, function (event, data) {
            if (data.fatal) {
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                // try to recover network error
                  console.log('fatal network error encountered, try to recover');
                  GUI.hls.startLoad();
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  console.log('fatal media error encountered, try to recover');
                  GUI.hls.recoverMediaError();
                  break;
                default:
                  // cannot recover
                  console.log('Unknown error encountered.');
                  GUI.hls.destroy();
                  break;
              }
            }
          });
        }

        this.addEventListeners();
      },

      addEventListeners: function () {
        const audioPlayerElement = document.getElementById('audioPlayer');
        audioPlayerElement.addEventListener('playing', function () {
          this.playingEventHander();
        }.bind(this));

        audioPlayerElement.addEventListener('waiting', function () {
          this.waitingEventHander();
        }.bind(this));

        /* const eventList = [
            "abort","canplay","canplaythrough","durationchange","emptied",
            "ended","error","loadeddata","loadedmetadata","loadstart",
            "pause","play","playing","progress","ratechange","seeking",
            "seeked","stalled","suspend","timeupdate","volumechange","waiting"
        ];

        for (const event of eventList) {
          // console.log(event);
          audioPlayer.addEventListener(event, (e) => {
            console.log(e.type);
          });
        }
        */
      },

      play: function () {
        const audioPlayer = document.getElementById('audioPlayer');
        audioPlayer.play();
      },

      /**
       * isStalledの値をfalseに設定する。
       * @param  {Event} e イベントハンドラのイベントオブジェクト
       */
      playingEventHander: function (e) {
        this.isStalled = false;
      },

      reload: function (hlsSrcUrl) {
        GUI.hls.destroy();
        this.init(hlsSrcUrl, null, null);
      },

      pause: function () {
        const audioPlayer = document.getElementById('audioPlayer');
        audioPlayer.pause();
      },

      /**
       * 関数実行後3秒以内にisStalledがfalseにならなければ、
       * audioPlayerをリロードして、再生を再開する。
       *
       * @param  {Event} e イベントハンドラのイベントオブジェクト
       */
      waitingEventHander: function (e) {
        this.isStalled = true;
        clearTimeout(this.timeoutId);
        this.timeoutId = window.setTimeout(function () {
          if (this.isStalled) {
            this.reload(RakutenFmTohoku.hlsSrcUrl);
            this.play();
          }
        }.bind(this), 3 * 1000);
      }
    }, // audioPlayer

    formatTimeString: function (timeStr) {
      return timeStr.replace(/^(\d{2})/, '$1:').replace(/^0/, '');
    },

    formatTitleString: function (titleStr) {
      return titleStr.replace(/\[|\]/g, '');
    },

    init: function () {
      if (!DISABLE_RADIO) {
        this.audioPlayer.init();
      }
    },

    renderNowOnAir: function (program) {
      $('#radioSectionErrorMsg').text('').hide();
      let html = '';
      if (program) {
        const startText = this.formatTimeString(program.start);
        const endText = this.formatTimeString(program.end);
        const titleText = this.formatTitleString(program.title);
        const contentText = program.content.replace(/^<br>/, '');
        html = `<p class="radio-section__now-on-air-term">${startText} - ${endText}</p><h4 class="radio-section__now-on-air-h4">${titleText}</h4><p class="radio-section__now-on-air-content">${contentText}</p>`;
      } else {
        html = '<p>番組情報はありません</p>';
      }

      $('#nowOnAirProgram').html(html);
    },

    renderTimeTable: function (timeTable) {
      $('#radioSectionTabs').tabs({
        show: { effect: 'fade', duration: 150 },
        activate: function (event, ui) {
          ui.newTab.children().addClass('radio-section__selected-tab-menu');
          ui.oldTab.children().removeClass('radio-section__selected-tab-menu');
        }
      });

      const ul = document.getElementById('radioSectionTimeTableUl');
      ul.innerHTML = '';
      for (const p of timeTable) {
        let li = '';

        const nowMsec = Date.now();
        if (p.startTimeMSec <= nowMsec && p.endTimeMSec > nowMsec) {
          li += '<li class="radio-section__timetable-li radio-section__timetable-li_highlight-background">';
        } else {
          li += '<li class="radio-section__timetable-li">';
        }
        li += `<p class="radio-section__timetable-program-term">${this.formatTimeString(p.start)}<br>|<br>${this.formatTimeString(p.end)}</p>`;
        li += `<p class="radio-section__timetable-program-content"><b>${this.formatTitleString(p.title)}</b>${p.content}</p>`;
        li += '</li>';

        ul.innerHTML = ul.innerHTML + li;
      }
    },

    showErrorMessage: function (e, nextNoaUpdateTime) {
      let msg = '';
      switch (e.name) {
        case 'ServerError':
          msg = GUI.errorMsgs.ServerErrorMsg;
          break;
        case 'ParseError':
          msg = GUI.errorMsgs.parseErrorMsg;
          break;
        default:
          msg = GUI.errorMsgs.unexpectedErrorMsg;
      }
      const d = new Date(nextNoaUpdateTime);
      if (DEBUG) {
        msg += ` ${d.getHours()}時${d.getMinutes()}分${d.getSeconds()}秒に再試行します。`;
      } else {
        msg += ` ${d.getHours()}時${d.getMinutes()}分に再試行します。`;
      }
      $('#radioSectionErrorMsg').text(msg).show();
    }
  }, // radioSection

  standingsSection: {
    showErrorMessage: function (e, nextScoreUpdateTime) {
      let msg = '';
      switch (e.name) {
        case 'ServerError':
          msg = GUI.errorMsgs.ServerErrorMsg;
          break;
        case 'ParseError':
          msg = GUI.errorMsgs.parseErrorMsg;
          break;
        default:
          msg = GUI.errorMsgs.unexpectedErrorMsg;
      }
      const d = new Date(nextScoreUpdateTime);
      if (DEBUG) {
        msg += ` ${d.getHours()}時${d.getMinutes()}分${d.getSeconds()}秒に再試行します。`;
      } else {
        msg += ` ${d.getHours()}時${d.getMinutes()}分に再試行します。`;
      }
      $('#standingsSectionErrorMsg').text(msg).show();
    }
  }, // standingsSection

  today: {

    constructCard: function (card) {
      if (!card) {
        $('#todaysCard').hide();
        return;
      }

      const tc = $('#todaysCard');
      tc.html('');
      tc.append(GUI.CardsSection.constructTeamDiv(card.homeTeam));
      tc.append(GUI.CardsSection.constructGameDiv(card));
      tc.append(GUI.CardsSection.constructTeamDiv(card.awayTeam));
      tc.show();
    },

    constructFooter: function (updateMsec) {
      // 更新時刻を更新
      let update = new Date(updateMsec).toLocaleTimeString();
      if (!DEBUG) {
        // 21:52:04 -> 21:52
        update = update.replace(/:\d{1,2}$/, '');
      }
      $('#todayLastUpdateText').html(`${update}`);
    },

    constructH2: function () {
      const now = new Date();
      const dayText = ['日', '月', '火', '水', '木', '金', '土'][now.getDay()];
      const h2Text = `${now.getMonth() + 1}月${now.getDate()}日（${dayText}）の日程・結果`;
      $('#todaySection h2').text(h2Text);
    },

    constructNoGameMessage: function (card, favoriteTeamId) {
      const todaySectionNoGame = $('#todaySectionNoGame');
      if (card) {
        todaySectionNoGame.hide();
      } else {
        todaySectionNoGame.addClass(`team${favoriteTeamId}`);
        todaySectionNoGame.show();
      }
    },

    constructScoreBoardTable: function (card) {
      if (!card || !card.scoreBoard) {
        $('#scoreBoard').hide();
        return;
      }

      const table = document.getElementById('scoreBoard');
      const trs = table.getElementsByTagName('tr');
      const theadTr = trs[0];
      const awayTr = trs[1];
      const homeTr = trs[2];

      theadTr.innerHTML = '<th></th>';
      awayTr.innerHTML = `<td class="score-board__team-name">${card.awayTeam.team}</td>`;
      homeTr.innerHTML = `<td class="score-board__team-name">${card.homeTeam.team}</td>`;

      let awayTeamScoreTotal = 0;
      let homeTeamScoreTotal = 0;
      let inning = 1;
      const sbLen = card.scoreBoard.innings.length !== 0 ? card.scoreBoard.innings.length : 9;
      for (let i = 0; i < sbLen; i++) {
        const score = card.scoreBoard.innings[i];
        // console.log(score);
        theadTr.innerHTML += `<th>${inning}</th>`;
        awayTr.innerHTML += `<td>${score ? score[0] : ''}</td>`;
        homeTr.innerHTML += `<td>${score ? score[1] : ''}</td>`;

        awayTeamScoreTotal += Number(score && score[0].match(/\d+/) ? score[0] : 0);
        homeTeamScoreTotal += Number(score && score[1].match(/\d+/) ? score[1] : 0);
        // homeTeamScoreTotal += Number(score && score[1] !== '-' && score[1] !== 'X' ? score[1] : 0);
        inning++;
      }

      theadTr.innerHTML += '<th>計</th>';
      awayTr.innerHTML += `<td class="score-board__total-score">${card.scoreBoard.innings[0] ? awayTeamScoreTotal : ''}</td>`;
      homeTr.innerHTML += `<td class="score-board__total-score">${card.scoreBoard.innings[0] ? homeTeamScoreTotal : ''}</td>`;

      theadTr.innerHTML += '<th>安</th>';
      awayTr.innerHTML += `<td>${card.scoreBoard.hits[0] ? card.scoreBoard.hits[0] : ''}</td>`;
      homeTr.innerHTML += `<td>${card.scoreBoard.hits[1] ? card.scoreBoard.hits[1] : ''}</td>`;

      theadTr.innerHTML += '<th>失</th>';
      awayTr.innerHTML += `<td>${card.scoreBoard.losses[0] ? card.scoreBoard.losses[0] : ''}</td>`;
      homeTr.innerHTML += `<td>${card.scoreBoard.losses[1] ? card.scoreBoard.losses[1] : ''}</td>`;

      $('#scoreBoard').show();
    },

    constructScorePlay: function (card) {
      if (!card || !card.scorePlays || card.scorePlays.length === 0) {
        $('#todaysScorePlays').hide();
        return;
      }

      const ul = $('#todaysScorePlays > ul')[0];
      ul.innerHTML = '';

      for (const sp of card.scorePlays) {
        let teamId = '';
        const r = sp.inningText.match(/^\d+回([表|裏])$/);
        if (!r || r.length <= 1) {
          console.log('Error: Could not parse inningText.');
        } else {
          if (r[1] === '表') {
            teamId = card.awayTeam.id;
          } else if (r[1] === '裏') {
            teamId = card.homeTeam.id;
          }
        }

        let videoDiv = '';
        if (sp.video) {
          videoDiv = `
          <div class="score-plays__video">
          <a href="JavaScript:App.execProtocol('${sp.video.pageUrl}')">
          <img class="score-plays__video-thumbnail" src="${sp.video.thumbnailUrl}">
          <span class="score-plays__video-title">${sp.video.title}</span></a>
          </div>`;
        }

        const html = `<li class="score-plays__li team${teamId}">
        <b>${sp.inningText}</b> ${sp.state}<br>
        <b>${sp.order} ${sp.player}</b><br>
        ${sp.summary}
        ${videoDiv}
        </li>`;

        ul.innerHTML = html + ul.innerHTML;
      }

      $('#todaysScorePlays').show();
    },

    constructVideoList: function (card) {
      if (!card || !card.videoList || card.videoList.length === 0) {
        $('#todaySectionVideo').hide();
        return;
      }

      const ul = document.getElementById('todaySectionVideoList');
      if (!ul) return;

      ul.innerHTML = '';

      for (const video of card.videoList) {
        const li = document.createElement('li');
        li.className = 'today-section__video-li';
        li.innerHTML = `<a href="JavaScript:App.execProtocol('${video.pageUrl}')">
        <img class="today-section__video-thumbnail" src="${video.thumbnailUrl}">
        <span class="today-section__video-title">${video.title}</span></a>`;
        ul.append(li);
      }

      $('#todaySectionVideo').show();
    },

    hideTopPageError: function () {
      $('#todaySectionTopErrorMsg').text('').hide();
    },

    resetErrorMessages: function () {
      $('#todaySectionDetailErrorMsg').text('').hide();
      $('#todaySectionTopErrorMsg').text('').hide();
    },

    showDetailPageError: function (e, nextDetailPageUpdateTime) {
      let msg = '';
      switch (e.name) {
        case 'ServerError':
          msg = GUI.errorMsgs.ServerErrorMsg;
          break;
        case 'ParseError':
          msg = GUI.errorMsgs.parseErrorMsg;
          break;
        default:
          msg = GUI.errorMsgs.unexpectedErrorMsg;
      }
      const d = new Date(nextDetailPageUpdateTime);
      if (DEBUG) {
        msg += ` ${d.getHours()}時${d.getMinutes()}分${d.getSeconds()}秒に再試行します。`;
      } else {
        msg += ` ${d.getHours()}時${d.getMinutes()}分に再試行します。`;
      }

      if (!$('#todaySectionTopErrorMsg').text()) {
        $('#todaySectionDetailErrorMsg').text(msg).show();
      }
    },

    showTopPageError: function (e, nextScoreUpdateTime) {
      let msg = '';
      switch (e.name) {
        case 'ServerError':
          msg = GUI.errorMsgs.ServerErrorMsg;
          break;
        case 'ParseError':
          msg = GUI.errorMsgs.parseErrorMsg;
          break;
        default:
          msg = GUI.errorMsgs.unexpectedErrorMsg;
      }
      const d = new Date(nextScoreUpdateTime);
      if (DEBUG) {
        msg += ` ${d.getHours()}時${d.getMinutes()}分${d.getSeconds()}秒に再試行します。`;
      } else {
        msg += ` ${d.getHours()}時${d.getMinutes()}分に再試行します。`;
      }
      $('#todaySectionDetailErrorMsg').hide();
      $('#todaySectionTopErrorMsg').text(msg).show();
    }
  }
}; // GUI
