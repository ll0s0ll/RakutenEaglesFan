/* global $ electron YahooNPB YahooNPBCard */
const GUI = {

  errorMsgs: {
    ServerErrorMsg: '情報の取得に失敗しました。',
    parseErrorMsg: '情報の解析に失敗しました。',
    unexpectedErrorMsg: '予期せぬエラーが発生しました。'
  },

  constructGameDiv: function (card) {
    //
    const gameDiv = document.createElement('div');
    // gameDiv.className = 'game';
    gameDiv.className = 'card__game game';
    gameDiv.innerHTML += `<p class="game__venue"> ${card.venue}</p>`;
    if (card.homeTeam.score && card.awayTeam.score) {
      gameDiv.innerHTML += `<p class="game__score">${card.homeTeam.score} - ${card.awayTeam.score}</p>`;
    }

    if (card.scheduledStartTime) {
      gameDiv.innerHTML += `<p class="game__scheduled-starttime">${card.scheduledStartTime}</p>`;
    }

    if (card.status) {
      // const currentCardStatus = YahooNPB.currentCardStatus(card);
      const currentCardStatus = card.currentStatus();
      let text = '';
      switch (currentCardStatus) {
        case YahooNPBCard.statuses.before:
          text = '試合開始予定';
          break;
        default:
          text = card.status;
      }
      gameDiv.innerHTML += `<p class="game__status" onclick="App.execProtocol('${card.detailPageUrl}')">${text}</p>`;
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

  renderCardsSection: function (cards, updateMilliSec, favoriteTeamId, isDebug) {
    //
    GUI.cards.updateLastUpdateText(updateMilliSec, isDebug);

    $('#cardsSectionErrorMsg').text('').hide();

    // h2部分
    const now = new Date(updateMilliSec);
    const dayText = ['日', '月', '火', '水', '木', '金', '土'][now.getDay()];
    const h2Text = `${now.getMonth() + 1}月${now.getDate()}日（${dayText}）の日程・結果`;
    $('#cardsSection h2').text(h2Text);

    const cardsUL = document.createElement('ul');
    cardsUL.className = 'cards-section-contents__cards cards';

    for (const card of cards) {
      // console.log(card)
      const li = document.createElement('li');
      li.className = 'cards__card card';

      li.appendChild(GUI.constructTeamDiv(card.homeTeam));
      li.appendChild(GUI.constructGameDiv(card));
      li.appendChild(GUI.constructTeamDiv(card.awayTeam));

      if (card.league.match(/セ・リーグ/) && !YahooNPB.isPacificLeagueTeam(favoriteTeamId)) {
        cardsUL.appendChild(li);
      } else if (card.league.match(/パ・リーグ/) && YahooNPB.isPacificLeagueTeam(favoriteTeamId)) {
        cardsUL.appendChild(li);
      } else if (card.league.match(/日本シリーズ/)) {
        cardsUL.appendChild(li);
      }
    }

    const contents = document.getElementById('cardsSectionContents');
    contents.innerHTML = '';

    if (cardsUL.hasChildNodes()) {
      contents.appendChild(cardsUL);
    } else {
      const p = document.createElement('p');
      p.className = 'cards-section-contents__no-game';
      if (YahooNPB.isPacificLeagueTeam(favoriteTeamId)) {
        p.className += ' team15';
      } else {
        p.className += ' team16';
      }
      p.textContent = '今日の試合はありません';
      contents.appendChild(p);
    }
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
      console.log('順位表なし。');
      return;
    }

    const tbody = $('#standingsSection tbody')[0];
    // console.log(tbody);
    tbody.innerHTML = '';
    //
    for (const team of standings) {
    // for (const team of npbStandings.pacificLeague) {
      // console.log(team);

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

  renderTodaySection: function (card, updateMilliSec, favoriteTeamId, isDebug, nextDetailPageUpdateTime) {
    GUI.today.resetErrorMessages();
    GUI.today.constructH2();
    GUI.today.constructCard(card);
    GUI.today.constructScoreBoardTable(card);
    GUI.today.constructScorePlay(card);
    GUI.today.constructNoGameMessage(card, favoriteTeamId);
    GUI.today.constructFooter(updateMilliSec, isDebug, nextDetailPageUpdateTime);
  },

  switchTab: function (tab) {
    // console.log('switchTab()');
    $('#tabs').tabs('option', 'active', tab);
  },

  updateNetworkStatus: function () {
    if (navigator.onLine) {
      $('#networkStatusMessage').hide();
    } else {
      $('#networkStatusMessage').show();
    }
  },

  cards: {
    showErrorMessage: function (e, isDebug, nextScoreUpdateTime) {
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
      if (isDebug) {
        msg += ` ${d.getHours()}時${d.getMinutes()}分${d.getSeconds()}秒に再試行します。`;
      } else {
        msg += ` ${d.getHours()}時${d.getMinutes()}分に再試行します。`;
      }
      $('#cardsSectionErrorMsg').text(msg).show();
    },

    updateLastUpdateText: function (update, isDebug) {
      // 更新時刻を更新
      let now = new Date(update).toLocaleTimeString();
      if (!isDebug) {
        // 21:52:04 -> 21:52
        now = now.replace(/:\d{1,2}$/, '');
      }
      $('#cardsLastUpdateText').text(now);
    }
  }, // cards

  menu: {
    init: function (startPage, favoriteTeamId) {
      //
      $('#tabs').tabs({
        show: { effect: 'fade', duration: 150 },
        active: startPage
      });

      $('#todaySectionMenu').attr('href', 'javascript:GUI.switchTab(0)');
      $('#cardsSectionMenu').attr('href', 'javascript:GUI.switchTab(1)');
      $('#standingsSectionMenu').attr('href', 'javascript:GUI.switchTab(2)');
      $('#rakutenFmTohokuSectionMenu').attr('href', 'javascript:GUI.switchTab(3)');
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

    onChangeHandler: function (event, preferences) {
      // console.log(`onchange:${event.target}`);
      let isChanged = false;
      for (const element of $('#preferenceSection input, select')) {
        switch (element.id) {
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

    init: function (preferences, isDebug, onPreferenceChangedHandler) {
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
            element.min = isDebug ? 0 : preferences.minUpdateFreqMinitus;
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

    onPreferenceChanged: function (preferences) {
      // Override me.
      console.log('onPreferenceChanged()');
    },

    save: function () {
      // console.log('preference::save()');
      const newPrefs = {};
      for (const element of $('#preferenceSection input, select')) {
        // console.log(`type:${input.type} id:${input.id} name:${input.name} value:${input.value}`);
        switch (element.id) {
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

      this.onPreferenceChanged(newPrefs);

      $('#applyButton').prop('disabled', true);
      $('#cancelButton').prop('disabled', true);
    },

    showErrorMessage: function (msg) {
      $('#preferenceSectionErrorMsg').text(msg).show();
    }
  }, // preferenceSection

  rakutenFmTohokuSection: {

    audioPlayer: {
      addEventListeners: function (playingEventHander, waitingEventHander) {
        const audioPlayer = document.getElementById('audioPlayer');

        if (playingEventHander) {
          audioPlayer.addEventListener('playing', playingEventHander);
        }

        if (waitingEventHander) {
          audioPlayer.addEventListener('waiting', waitingEventHander);
        }

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

      init: function (hlsSrcUrl, playingEventHander, waitingEventHander) {
        const Hls = electron.node.hls;
        if (Hls.isSupported()) {
          GUI.hls = new Hls();
          // const hls = new Hls();
          GUI.hls.loadSource(hlsSrcUrl);
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

        this.addEventListeners(playingEventHander, waitingEventHander);
      },

      play: function () {
        const audioPlayer = document.getElementById('audioPlayer');
        audioPlayer.play();
      },

      reload: function (hlsSrcUrl) {
        GUI.hls.destroy();
        GUI.rakutenFmTohokuSection.audioPlayer.init(hlsSrcUrl, null, null);
      },

      pause: function () {
        const audioPlayer = document.getElementById('audioPlayer');
        audioPlayer.pause();
      }
    }, // audioPlayer

    init: function (hlsSrcUrl, disableRadioPlayer, playingEventHander, waitingEventHander) {
      if (!disableRadioPlayer) {
        this.audioPlayer.init(hlsSrcUrl, playingEventHander, waitingEventHander);
      }
    },

    renderNowOnAir: function (program) {
      $('#rakutenFmTohokuSectionErrorMsg').text('').hide();
      let html = '';
      if (program) {
        const startText = program.start.replace(/^(\d{2})/, '$1:').replace(/^0/, '');
        const endText = program.end.replace(/^(\d{2})/, '$1:').replace(/^0/, '');
        const titleText = program.title.replace(/\[|\]/g, '');
        const contentText = program.content.replace(/^<br>/, '');
        html = `<p class="now-on-air__term">${startText} - ${endText}</p><h4 class="now-on-air__h4">${titleText}</h4><p class="now-on-air__content">${contentText}</p>`;
      } else {
        html = '<p class="now-on-air__no-program">番組情報はありません</p>';
      }

      $('#nowOnAirProgram').html(html);
    },

    showErrorMessage: function (e, isDebug, nextNoaUpdateTime) {
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
      if (isDebug) {
        msg += ` ${d.getHours()}時${d.getMinutes()}分${d.getSeconds()}秒に再試行します。`;
      } else {
        msg += ` ${d.getHours()}時${d.getMinutes()}分に再試行します。`;
      }
      $('#rakutenFmTohokuSectionErrorMsg').text(msg).show();
    }
  }, // rakutenFmTohokuSection

  standingsSection: {
    showErrorMessage: function (e, isDebug, nextScoreUpdateTime) {
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
      if (isDebug) {
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
      tc.append(GUI.constructTeamDiv(card.homeTeam));
      tc.append(GUI.constructGameDiv(card));
      tc.append(GUI.constructTeamDiv(card.awayTeam));
      tc.show();
    },

    constructFooter: function (updateMilliSec, isDebug, nextDetailPageUpdateTime) {
      // 更新時刻を更新
      let now = new Date(updateMilliSec).toLocaleTimeString();
      if (isDebug) {
        $('#todayLastUpdateText').html(`${now}<br>次回更新 ${new Date(nextDetailPageUpdateTime).toLocaleTimeString()}`);
      } else {
        // 21:52:04 -> 21:52
        now = now.replace(/:\d{1,2}$/, '');
        $('#todayLastUpdateText').html(`${now}`);
      }
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
      // console.log(card);
      if (!card) {
        // console.log('試合はありません。');
        $('#scoreBoard').hide();
        return;
      }

      const table = document.getElementById('scoreBoard');
      // console.log(table);

      const trs = table.getElementsByTagName('tr');
      // console.log(trs);
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
      // console.log(table);
    },

    constructScorePlay: function (card) {
      // console.log(card);
      if (!card) {
        $('#todaysScorePlays').hide();
        return;
      }

      const scorePlays = card.scorePlays;
      if (scorePlays.length === 0) {
        // console.log('スコアプレイはありません。');
        $('#todaysScorePlays').hide();
        return;
      }

      const ul = $('#todaysScorePlays > ul')[0];
      ul.innerHTML = '';

      for (const sp of scorePlays) {
        // console.log(sp);
        let teamId = '';
        const r = sp.inningText.match(/^\d+回([表|裏])$/);
        // console.log(r);
        if (!r || r.length <= 1) {
          console.log('Error: Could not parse inningText.');
        } else {
          if (r[1] === '表') {
            teamId = card.awayTeam.id;
          } else if (r[1] === '裏') {
            teamId = card.homeTeam.id;
          }
        }

        const html = `<li class="score-plays__li team${teamId}"><b>${sp.inningText}</b> ${sp.state}<br><b>${sp.order} ${sp.player}</b><br>${sp.summary}</li>`;
        ul.innerHTML = html + ul.innerHTML;
      }

      $('#todaysScorePlays').show();
    },

    hideTopPageError: function () {
      $('#todaySectionTopErrorMsg').text('').hide();
    },

    resetErrorMessages: function () {
      $('#todaySectionDetailErrorMsg').text('').hide();
      $('#todaySectionTopErrorMsg').text('').hide();
    },

    showDetailPageError: function (e, isDebug, nextDetailPageUpdateTime) {
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
      if (isDebug) {
        msg += ` ${d.getHours()}時${d.getMinutes()}分${d.getSeconds()}秒に再試行します。`;
      } else {
        msg += ` ${d.getHours()}時${d.getMinutes()}分に再試行します。`;
      }

      if (!$('#todaySectionTopErrorMsg').text()) {
        $('#todaySectionDetailErrorMsg').text(msg).show();
      }
    },

    showTopPageError: function (e, isDebug, nextScoreUpdateTime) {
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
      if (isDebug) {
        msg += ` ${d.getHours()}時${d.getMinutes()}分${d.getSeconds()}秒に再試行します。`;
      } else {
        msg += ` ${d.getHours()}時${d.getMinutes()}分に再試行します。`;
      }
      $('#todaySectionDetailErrorMsg').hide();
      $('#todaySectionTopErrorMsg').text(msg).show();
    }
  }
}; // GUI
