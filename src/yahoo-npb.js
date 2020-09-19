/*
  Copyright (C) 2020 Shun Ito

  This file is part of RakutenEaglesFan.

  RakutenEaglesFan is free software; you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation; either version 1, or (at your option)
  any later version.

  RakutenEaglesFan is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program; if not, write to the Free Software
  Foundation, Inc., 675 Mass Ave, Cambridge, MA 02139, USA.
*/

/* global DOMParser assert */

if (!assert) {
  var assert = require('assert');
}

/** YahooNPBに関するオブジェクト */
const YahooNPB = {

  topPageUrl: 'https://baseball.yahoo.co.jp/npb/',

  teams: {
    1: '巨人',
    2: 'ヤクルト',
    3: 'ＤｅＮＡ',
    4: '中日',
    5: '阪神',
    6: '広島',
    7: '西武',
    8: '日本ハム',
    9: 'ロッテ',
    11: 'オリックス',
    12: 'ソフトバンク',
    376: '楽天'
  },

  centralLeagueTeams: {
    1: '巨人',
    2: 'ヤクルト',
    3: 'ＤｅＮＡ',
    4: '中日',
    5: '阪神',
    6: '広島'
  },

  pacificLeagueTeams: {
    7: '西武',
    8: '日本ハム',
    9: 'ロッテ',
    11: 'オリックス',
    12: 'ソフトバンク',
    376: '楽天'
  },

  /**
   * 引数で与えられたチームID値のチームが、パシフィックリーグのチームかどうか判別する。
   * @param  {Number} teamId 判別するチームのID値。
   * @return {Boolean} パシフィックリーグの場合はtrue、違う場合はfalse。
   * @throws {Error} 引数の値が不正な場合。
   * @throws {TypeError} 引数の型が不正な場合。
   */
  isPacificLeagueTeam: function (teamId) {
    if (!Number.isInteger(teamId)) {
      throw new TypeError('Invalid argument type, Number is expected.');
    }

    if (YahooNPB.pacificLeagueTeams[Number(teamId)] === undefined &&
        YahooNPB.centralLeagueTeams[Number(teamId)] === undefined) {
      throw new Error('Invalid teamId.');
    }
    return YahooNPB.pacificLeagueTeams[Number(teamId)] !== undefined;
  },

  /**
   * トップページの試合日程部分をパースする。
   * @param  {HTMLDocument} topPageHtmlDoc トップページのオブジェクト
   * @return {Array} cardsオブジェクトの配列
   */
  parseCards: function (topPageHtmlObj) {
    const cards = [];

    for (const league of topPageHtmlObj.getElementById('gm_card').getElementsByTagName('section')) {
      // League
      const leagueNameH1 = league.getElementsByClassName('bb-socore__title');
      if (leagueNameH1.length === 0) {
        // 試合がないときは、リーグ名も表示されない。
        continue;
      }

      const leagueName = leagueNameH1.item(0).textContent;
      // console.log(leagueText)

      // Card
      for (const card of league.getElementsByClassName('bb-score__item')) {
        const c = new YahooNPBCard();
        c.league = leagueName;

        const url = card.getElementsByClassName('bb-score__content').item(0).href;
        c.detailPageUrl = url.match(/(.*\/).*$/)[1] + 'top';

        c.venue = card.getElementsByClassName('bb-score__venue').item(0).textContent;

        // Team
        c.homeTeam = {};
        c.awayTeam = {};
        for (const team of card.getElementsByClassName('bb-score__team').item(0).children) {
          if (team.classList.contains('bb-score__homeLogo')) {
            c.homeTeam.team = team.textContent;
            c.homeTeam.id = Number(team.classList.item(1).match(/bb-score__homeLogo--team(.*)$/)[1]);
          } else if (team.classList.contains('bb-score__awayLogo')) {
            c.awayTeam.team = team.textContent;
            c.awayTeam.id = Number(team.classList.item(1).match(/bb-score__awayLogo--team(.*)$/)[1]);
          }
        }

        // Info
        for (const info of card.getElementsByClassName('bb-score__info').item(0).children) {
          if (info.className === 'bb-score__home' || info.className === 'bb-score__away') {
            // Player
            const p = [];
            for (const player of info.getElementsByClassName('bb-score__player')) {
              for (const className of player.classList) {
                switch (className) {
                  case 'bb-score__player--probable':
                    p.push(`(予)${player.textContent}`);
                    break;
                  case 'bb-score__player--start':
                    p.push(`(先)${player.textContent}`);
                    break;
                  case 'bb-score__player--win':
                    p.push(`(勝)${player.textContent}`);
                    break;
                  case 'bb-score__player--lose':
                    p.push(`(負)${player.textContent}`);
                    break;
                  case 'bb-score__player--save':
                    p.push(`(S)${player.textContent}`);
                    break;
                  case 'bb-score__player':
                    break;
                  default:
                    console.error('Unknown player state');
                }
              }
            }
            if (info.className === 'bb-score__home') {
              c.homeTeam.players = p;
            } else if (info.className === 'bb-score__away') {
              c.awayTeam.players = p;
            }
          } else if (info.className === 'bb-score__detail') {
            const time = info.getElementsByTagName('time');
            if (time.length !== 0) {
              c.scheduledStartTime = time.item(0).textContent;
            } else {
              c.scheduledStartTime = undefined;
            }

            const link = info.getElementsByClassName('bb-score__link');
            if (link.length !== 0) {
              c.status = link.item(0).textContent;
            } else {
              c.status = undefined;
            }

            const homeTeamScore = info.getElementsByClassName('bb-score__score--left');
            if (homeTeamScore.length !== 0) {
              c.homeTeam.score = homeTeamScore.item(0).textContent;
            } else {
              c.homeTeam.score = undefined;
            }

            const awayTeamScore = info.getElementsByClassName('bb-score__score--right');
            if (awayTeamScore.length !== 0) {
              c.awayTeam.score = awayTeamScore.item(0).textContent;
            } else {
              c.awayTeam.score = undefined;
            }
          } else {
            // console.log(`Unknown info: ${info}`);
          }
        }
        cards.push(c);
        // console.log(c);
      }
    }
    return cards;
  },

  /**
   * 詳細ページをパースする。
   * 戻り値の詳細は、それぞれ、parseScoreBoard、parseScorePlays、
   * parseStartingMembersの関数を参照してください。
   *
   * @param  {String} detailPageHtmlDoc 詳細ページのhtmlドキュメント
   * @return {Object} scoreBoard, scorePlays, startingMembersのキーを含んだオブジェクト
   */
  parseDetailPage: function (detailPageHtmlDoc) {
    const htmlObj = new DOMParser().parseFromString(detailPageHtmlDoc, 'text/html');
    return {
      scoreBoard: this.parseScoreBoard(htmlObj),
      scorePlays: this.parseScorePlays(htmlObj),
      startingMembers: this.parseStartingMembers(htmlObj)
    };
  },

  /**
   * 詳細ページのスコアボード部分をパースする。
   *
   * 戻り値について
   * innings それぞれのイニングの得点を含んだ配列の配列。
   * それぞれのイニングの配列の0番目はアウェイチーム、1番目はホームチームの得点。
   * hits それぞれのチームの安打を含んだ配列。
   * 配列の0番目はアウェイチーム、1番目はホームチームの安打。
   * losses それぞれのチームの失策を含んだ配列。
   * 配列の0番目はアウェイチーム、1番目はホームチームの安打。
   *
   * @param  {HTMLDocument} detailPageHtmlObj 試合詳細ページのオブジェクト
   * @return {Object} innings, hits, lossesのキーを含むオブジェクト
   */
  parseScoreBoard: function (detailPageHtmlObj) {
    //
    const innings = [];
    const hits = [];
    const losses = [];
    const scoreBoardTable = detailPageHtmlObj.getElementById('ing_brd'); // 開始前は存在しない。
    if (scoreBoardTable) {
      const sbTbody = scoreBoardTable.getElementsByTagName('tbody').item(0);
      for (let i = 0; i < sbTbody.children.length; i++) {
        // console.log(sbTbody.children.item(i))
        const tr = sbTbody.children.item(i);
        const scores = tr.getElementsByClassName('bb-gameScoreTable__score');
        for (let j = 0; j < scores.length; j++) {
          const score = scores.item(j);
          const inning = innings[j];
          if (inning) {
            inning[i] = score.textContent;
          } else {
            innings.push([score.textContent]);
          }
        }

        const hit = tr.getElementsByClassName('bb-gameScoreTable__data--hits')[0];
        hits[i] = hit.textContent;

        const loss = tr.getElementsByClassName('bb-gameScoreTable__data--loss')[0];
        losses[i] = loss.textContent;
      }
    }
    // console.log(innings)
    // console.log(hits);
    // console.log(losses);

    return { innings, hits, losses };
  },

  /**
   * 試合詳細ページのスコアプレイ部分をパースする。
   * @param  {HTMLDocument} detailPageHtmlObj 試合詳細ページのオブジェクト
   * @return {Array}                          取得したスコアプレイの配列
   */
  parseScorePlays: function (detailPageHtmlObj) {
    assert(detailPageHtmlObj, 'Invalid argument.');

    const scorePlays = [];

    const scorePlaySection = detailPageHtmlObj.getElementById('scor_ply');
    if (!scorePlaySection) {
      return scorePlays;
    }

    const tbody = scorePlaySection.getElementsByTagName('tbody').item(0);
    for (const tr of tbody.children) {
      const scorePlay = new YahooNPBScorePlay();

      const th = tr.getElementsByTagName('th').item(0);
      scorePlay.inningText = th.textContent.trim();

      const order = tr.getElementsByClassName('bb-gameTable__order').item(0).textContent.trim();
      scorePlay.order = order;

      const player = tr.getElementsByClassName('bb-gameTable__player').item(0).textContent.trim();
      scorePlay.player = player;

      const state = tr.getElementsByClassName('bb-gameTable__state').item(0).textContent.trim();
      scorePlay.state = state;

      scorePlay.summary = '';
      const summaries = tr.getElementsByClassName('bb-gameTable__summary');
      for (const summary of summaries) {
        const t = summary.textContent.replace(/\r|\r\n|\n|\t|\s{2,}/g, '');
        scorePlay.summary += t + '。';
      }

      const text = tr.getElementsByClassName('bb-gameTable__text');
      if (text.length !== 0) {
        const t = text.item(0).textContent.replace(/\r|\r\n|\n|\t|\s{2,}/g, '');
        scorePlay.summary += t;
      }
      // console.log(scorePlay);
      scorePlays.push(scorePlay);
    }
    // console.log(scorePlays);
    return scorePlays;
  },

  /**
   * トップページの順位表部分をパースする。
   *
   * 戻り値について
   * centralLeague、pacificLeagueのキーは、それぞれ配列を持つ。
   * 配列には、チームの情報を含んだ配列が含まれる。順番は順位の昇順となる。
   * チームの情報を含んだ配列は、
   * ['順位', 'チーム名', '勝', '負', ’引', '差']
   * の構成になっている。
   *
   * centralLeagueUpdate、pacificLeagueUpdateのキーは、
   * それぞれ順位表の更新日時を表すDateオブジェクトを持つ。
   *
   * @param  {HTMLDocument} topPageHtmlDoc トップページのオブジェクト
   * @return {Object} centralLeague, pacificLeague, centralLeagueUpdate,
   * pacificLeagueUpdateのキーを持つオブジェクト
   * @throws {ParseError} パースに失敗した場合
   */
  parseStandings: function (topPageHtmlObj) {
    //
    const npbStandings = {
      centralLeague: undefined,
      pacificLeague: undefined,
      centralLeagueUpdate: undefined,
      pacificLeagueUpdate: undefined
    };

    const section = topPageHtmlObj.getElementById('stand_r');
    const tables = section.getElementsByTagName('table');
    for (let i = 0; i < tables.length; i++) {
      const tbody = tables[i].getElementsByTagName('tbody')[0];
      const standings = [];
      for (const tr of tbody.getElementsByTagName('tr')) {
        const team = [];
        for (const td of tr.getElementsByTagName('td')) {
          team.push(td.textContent.replace(/\r|\r\n|\n|\t|\s/g, ''));
        }
        // console.log(team);
        standings.push(team);
      }
      switch (i) {
        case 0:
          npbStandings.centralLeague = standings;
          break;
        case 1:
          npbStandings.pacificLeague = standings;
          break;
        default:
          // Error.
      }
    }

    if (!npbStandings.centralLeague || !npbStandings.pacificLeague) {
      const error = new Error('Failed to get standings data.');
      error.name = 'ParseError';
      throw error;
    }

    // 順位表の更新日時をパース
    const footers = section.getElementsByTagName('footer');
    for (let i = 0; i < footers.length; i++) {
      // ex. '2020/7/4 22:32 更新'
      const timeText = footers[i].getElementsByTagName('time')[0].textContent;
      const r = timeText.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2}) (\d{1,2}):(\d{1,2}) 更新$/);
      const date = new Date(r[1], Number(r[2]) - 1, r[3], r[4], r[5], 0);

      switch (i) {
        case 0:
          npbStandings.centralLeagueUpdate = date;
          break;
        case 1:
          npbStandings.pacificLeagueUpdate = date;
          break;
        default:
          // Error.
      }
    }

    if (!npbStandings.centralLeagueUpdate || !npbStandings.pacificLeagueUpdate) {
      const error = new Error('Failed to get standings update.');
      error.name = 'ParseError';
      throw error;
    }

    return npbStandings;
  },

  /**
   * 試合詳細ページのスコアプレイ部分をパースする。
   *
   * 戻り値について
   * 戻り値のオブジェクトのそれぞれのキーは、配列を値として持つ。
   * 配列には、選手の情報を持つオブジェクトが保存される。
   * 配列の0番目が投手、1番目以降が野手となる。野手の順番は打順になっている。
   * 選手のオブジェクトは、position, name、hand, rateのキーを持つ。
   *
   * @param  {HTMLDocument} detailPageHtmlObj 試合詳細ページのオブジェクト。
   * @return {Object} homeTeamStartingMember、awayTeamStartingMemberのキーを持つ
   * オブジェクト。
   */
  parseStartingMembers: function (detailPageHtmlObj) {
    //
    const startingMembers = [];
    const startingMemberSection = detailPageHtmlObj.getElementById('strt_mem');
    if (startingMemberSection) {
      // console.log(startingMemberSection)
      for (const section of startingMemberSection.getElementsByClassName('bb-splits__item')) {
        const member = [];
        for (const tbody of section.getElementsByTagName('tbody')) {
          for (const tr of tbody.getElementsByTagName('tr')) {
            const player = {};
            const tds = tr.children;
            for (let i = 0; i < tds.length; i++) {
              const text = tds[i].textContent.trim();
              switch (i) {
                case 1:
                  player.position = text;
                  break;
                case 2:
                  player.name = text;
                  break;
                case 3:
                  player.hand = text;
                  break;
                case 4:
                  player.rate = text;
                  break;
                default:
                  //
              }
            }
            member.push(player);
          }
        }
        startingMembers.push(member);
        // break
      }
    }
    // console.log(startingMembers)

    return {
      homeTeamStartingMember: startingMembers[0] ? startingMembers[0] : null,
      awayTeamStartingMember: startingMembers[1] ? startingMembers[1] : null
    };
  },

  /**
   * トップページをパースする。
   *
   * @param  {String} htmlDoc トップページのHTML文書
   * @return {Object} cars,npbStandingsのキーを含むオブジェクト
   * @throws {ParseError} パースに失敗した場合
   */
  parseTopPageData: function (htmlDoc) {
    //
    const htmlObj = new DOMParser().parseFromString(htmlDoc, 'text/html');

    return {
      cards: this.parseCards(htmlObj),
      npbStandings: this.parseStandings(htmlObj)
    };
  },

  /**
   * 指定されたチームid値のチーム名を返す。
   *
   * @param  {Number} id チームのid値
   * @return {String}    チーム名
   * @throws {Error}     引数の値が不正な場合。
   * @throws {TypeError} 引数の型が不正な場合。
   */
  teamIdToName: function (id) {
    if (!Number.isInteger(id)) {
      throw new TypeError('Invalid argument type, Number is expected.');
    }
    const name = this.teams[id];
    if (!name) {
      throw new Error('Invalid team id.');
    }
    return name;
  }

}; // YahooNPB

/** 試合に関するクラス */
class YahooNPBCard {
  /**
   * コンストラクタ
   * 各種プロパティを初期化する。
   */
  constructor () {
    /**
     * 試合の状態を表す文字列。想定されるものは、statusTextsにて定義されている。
     * @type {String}
     */
    this.status = undefined;

    /**
     * ホームチームに関す情報が保存されるオブジェクト
     * @type {Object}
     */
    this.homeTeam = {};

    /**
     * ホームチームのスターティングメンバー
     * @type {Array}
     */
    this.homeTeam.startingMember = undefined;

    /**
     * アウェーチームに関す情報が保存されるオブジェクト
     * @type {Object}
     */
    this.awayTeam = {};

    /**
     * アウェーチームのスターティングメンバー
     * @type {Array}
     */
    this.awayTeam.startingMember = undefined;

    this.scoreBoard = undefined;
    this.scorePlays = undefined;
  }

  get [Symbol.toStringTag] () {
    return 'YahooNPBCard';
  }

  /**
   * スタティック関数
   *
   * 複数の試合が含まれた配列の中から、指定されたteamId値のチームが含まれる試合を返す。
   * 見つからない場合は、nullを変えす。
   *
   * @param  {Array} cards  複数の試合が含まれた配列
   * @param  {Number} teamId 見つけたいチームのteamId値
   * @return {YahooNPBCard} 指定されたteamId値のチームが含まれる試合、またはnull。
   * @throws {TypeError} 引数の型が不正な場合。
   */
  static findCardByTeamId (cards, teamId) {
    if (!(cards instanceof Array) || !Number.isInteger(teamId)) {
      throw new TypeError(
        'Invalid argument type. \'cards\' expects Array, \'teamId\' expects Number.'
      );
    }
    for (const c of cards) {
      if (c.homeTeam.id === teamId || c.awayTeam.id === teamId) {
        return c;
      }
    }
    return null;
  }

  /**
   * 現在のイニングを表す数字を返す。
   * 後半の場合は、イニングの数字に0.5を足したものを返す。
   * 試合開始中以外は、nullを返す。
   * ex. 5回表 -> 5
   *     5回裏 -> 5.5
   * @return {Number} イニングの数字、またはnull。
   */
  currentInning () {
    //
    assert(this.status !== undefined, 'Invalid status value.');

    if (YahooNPBCard.statusTexts.includes(this.status)) {
      return null;
    } else {
      const result = this.status.match(/^(\d{1,2})回(表|裏)$/);
      assert(result !== null, 'Invalid status value.');

      let inningNumber = Number(result[1]);
      if (result[2] === '裏') {
        inningNumber += 0.5;
      }

      return inningNumber;
    }
  }

  /**
   * 現在の試合状況を表す値を返す。
   * 返す値は、YahooNPBCard.statusesにて定義されている。
   * @return {Number} YahooNPBCard.statusesにて定義された、現在の試合状況を表す値。
   */
  currentStatus () {
    assert(this.status !== undefined, 'Invalid status value.');

    let status;
    switch (this.status) {
      case '見どころ':
        status = YahooNPBCard.statuses.before;
        break;
      case 'スタメン':
        status = YahooNPBCard.statuses.before;
        break;
      case '試合終了':
        status = YahooNPBCard.statuses.over;
        break;
      case '中断中':
        status = YahooNPBCard.statuses.suspend;
        break;
      case '試合中止':
        status = YahooNPBCard.statuses.cancel;
        break;
      default:
        if (this.status.match(/^(\d{1,2})回(表|裏)$/)) {
          status = YahooNPBCard.statuses.going;
        } else {
          assert(false, 'Invalid status value.');
        }
    }
    // console.log(status);
    return status;
  }

  /**
   * 試合開始時刻のDateオブジェクトを返す。
   * 返されるオブジェクトは、この関数を実行した日の指定時刻を表す。
   *
   * 例えば、試合開始時刻が20時00分、関数を実行した日が2020年7月22日の場合
   * 2020年7月22日20時00分0秒0ミリ秒を表すオブジェクトを返す。
   *
   * 開始時刻が指定されていない場合は、nullを返す。
   *
   * @return {Date} 試合開始時刻のDateオブジェクト、またはnull。
   */
  scheduledStartTimeObject () {
    if (!this.scheduledStartTime) return null;

    const r = this.scheduledStartTime.match(/(\d{1,2}):(\d{1,2})/);
    assert(r.length === 3, 'Faild to parse scheduledStartTime.');

    const scheduledStartTime = new Date();
    scheduledStartTime.setHours(r[1], r[2], 0, 0);
    return scheduledStartTime;
  }
} // YahooNPBCard

// Static values
YahooNPBCard.statuses = { before: 0, going: 1, over: 2, suspend: 3, cancel: 4 };
YahooNPBCard.statusTexts = ['見どころ', 'スタメン', '試合終了', '中断中', '試合中止'];

/** スコアプレイに関するクラス */
class YahooNPBScorePlay {
  constructor () {
    this.inningText = '';
    this.order = '';
    this.player = '';
    this.state = '';
    this.summary = '';
  }

  get [Symbol.toStringTag] () {
    return 'YahooNPBScorePlay';
  }

  /**
   * 同じスコアプレイか判断する。
   * @param  {YahooNPBScorePlay} other 比較対象のスコアプレイオブジェクト
   * @return {Boolean} 同じ場合はtrue、異なる場合はfalseを返す。
   * @throws {TypeError} 引数の型が不正な場合。
   */
  isEqual (other) {
    if (!(other instanceof YahooNPBScorePlay)) {
      throw new TypeError('Invalid argument type.');
    }

    for (const key of Object.keys(this)) {
      if (typeof this[key] === 'function') continue;
      if (key === 'summary') continue; // summaryは変化するので除外する。
      if (!other[key] || other[key] !== this[key]) return false;
    }
    return true;
  }
} // YahooNPBScorePlay

if (typeof module !== 'undefined') {
  module.exports = {
    YahooNPB: YahooNPB,
    YahooNPBCard: YahooNPBCard,
    YahooNPBScorePlay: YahooNPBScorePlay
  };
}
