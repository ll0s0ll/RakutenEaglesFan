/* global describe it before */

const assert = require('chai').assert;
const fs = require('fs');
const { JSDOM } = require('jsdom');

const { YahooNPB, YahooNPBCard, YahooNPBScorePlay } = require('../src/yahoo-npb.js');

describe('YahooNPB', function () {
  describe('Top page tests', function () {
    describe('試合開始前', function () {
      let htmlObj = null;
      before(async function () {
        const localFilePath = 'test/dummy_top_beforeGame.html';
        await new Promise((resolve, reject) => {
          fs.readFile(localFilePath, 'utf-8', (err, data) => {
            if (err) throw new Error(err.message);
            htmlObj = new JSDOM(data).window.document;
            resolve();
          });
        });
      });

      it('#parseCards()', function () {
        const cards = YahooNPB.parseCards(htmlObj);
        // console.log(cards);

        const card1 = new YahooNPBCard();
        card1.status = '見どころ';
        card1.homeTeam = { team: '広島', id: 6, players: ['(予)遠藤'], score: undefined };
        card1.awayTeam = { team: '阪神', id: 5, players: ['(予)西勇'], score: undefined };
        card1.scoreBoard = undefined;
        card1.scorePlays = undefined;
        card1.league = 'セ・リーグ';
        card1.detailPageUrl = 'https://baseball.yahoo.co.jp/npb/game/2020070503/top';
        card1.venue = 'マツダスタジアム';
        card1.scheduledStartTime = '13:30';

        const card2 = new YahooNPBCard();
        card2.status = '見どころ';
        card2.homeTeam = { team: '巨人', id: 1, players: ['(予)サンチェス'], score: undefined };
        card2.awayTeam = { team: '中日', id: 4, players: ['(予)梅津'], score: undefined };
        card2.scoreBoard = undefined;
        card2.scorePlays = undefined;
        card2.league = 'セ・リーグ';
        card2.detailPageUrl = 'https://baseball.yahoo.co.jp/npb/game/2020070501/top';
        card2.venue = '東京ドーム';
        card2.scheduledStartTime = '14:00';

        const card3 = new YahooNPBCard();
        card3.status = '見どころ';
        card3.homeTeam = { team: 'ヤクルト', id: 2, players: ['(予)高梨'], score: undefined };
        card3.awayTeam = { team: 'ＤｅＮＡ', id: 3, players: ['(予)平良'], score: undefined };
        card3.scoreBoard = undefined;
        card3.scorePlays = undefined;
        card3.league = 'セ・リーグ';
        card3.detailPageUrl = 'https://baseball.yahoo.co.jp/npb/game/2020070502/top';
        card3.venue = '神宮';
        card3.scheduledStartTime = '17:00';

        const card4 = new YahooNPBCard();
        card4.status = '見どころ';
        card4.homeTeam = { team: '日本ハム', id: 8, players: ['(予)河野'], score: undefined };
        card4.awayTeam = { team: 'ソフトバンク', id: 12, players: ['(予)二保'], score: undefined };
        card4.scoreBoard = undefined;
        card4.scorePlays = undefined;
        card4.league = 'パ・リーグ';
        card4.detailPageUrl = 'https://baseball.yahoo.co.jp/npb/game/2020070504/top';
        card4.venue = '札幌ドーム';
        card4.scheduledStartTime = '13:00';

        const card5 = new YahooNPBCard();
        card5.status = '見どころ';
        card5.homeTeam = { team: '楽天', id: 376, players: ['(予)石橋'], score: undefined };
        card5.awayTeam = { team: 'ロッテ', id: 9, players: ['(予)美馬'], score: undefined };
        card5.scoreBoard = undefined;
        card5.scorePlays = undefined;
        card5.league = 'パ・リーグ';
        card5.detailPageUrl = 'https://baseball.yahoo.co.jp/npb/game/2020070505/top';
        card5.venue = '楽天生命パーク';
        card5.scheduledStartTime = undefined;

        const card6 = new YahooNPBCard();
        card6.status = '見どころ';
        card6.homeTeam = { team: '西武', id: 7, players: ['(予)與座'], score: undefined };
        card6.awayTeam = { team: 'オリックス', id: 11, players: ['(予)山本'], score: undefined };
        card6.scoreBoard = undefined;
        card6.scorePlays = undefined;
        card6.league = 'パ・リーグ';
        card6.detailPageUrl = 'https://baseball.yahoo.co.jp/npb/game/2020070506/top';
        card6.venue = 'メットライフ';
        card6.scheduledStartTime = '18:00';

        const expectedCards = [card1, card2, card3, card4, card5, card6];

        assert.isArray(cards);
        assert.lengthOf(cards, 6);
        for (let i = 0; i < cards.length; i++) {
          assert.deepOwnInclude(cards[i], expectedCards[i]);
        }
      });

      it('#parseStandings()', function () {
        const standings = YahooNPB.parseStandings(htmlObj);
        // console.log(standings);

        assert.deepPropertyVal(standings, 'centralLeague', [
          ['1', '巨人', '10', '3', '1', '-'],
          ['2', 'ＤｅＮＡ', '8', '6', '0', '2.5'],
          ['3', 'ヤクルト', '7', '6', '0', '0.5'],
          ['4', '広島', '5', '6', '1', '1'],
          ['5', '中日', '6', '8', '0', '0.5'],
          ['6', '阪神', '3', '10', '0', '2.5']
        ]);
        assert.deepPropertyVal(standings, 'pacificLeague', [
          ['1', '楽天', '10', '4', '0', '-'],
          ['2', 'ロッテ', '9', '5', '0', '1'],
          ['3', '西武', '7', '6', '1', '1.5'],
          ['4', 'ソフトバンク', '6', '7', '1', '1'],
          ['5', '日本ハム', '5', '8', '1', '1'],
          ['6', 'オリックス', '3', '10', '1', '2']
        ]);

        // 2020/7/4 22:32
        assert.deepPropertyVal(standings, 'centralLeagueUpdate',
          new Date(2020, 6, 4, 22, 32, 0));

        // 2020/7/4 22:32
        assert.deepPropertyVal(standings, 'pacificLeagueUpdate',
          new Date(2020, 6, 4, 22, 32, 0));
      }); // #parseStandings()
    }); // 試合開始前

    describe('試合がない場合', function () {
      let htmlObj = null;
      before(async function () {
        const localFilePath = 'test/dummy_top_nogames.html';
        await new Promise((resolve, reject) => {
          fs.readFile(localFilePath, 'utf-8', (err, data) => {
            if (err) throw new Error(err.message);
            htmlObj = new JSDOM(data).window.document;
            resolve();
          });
        });
      });

      it('#parseCards()', function () {
        const topPageData = YahooNPB.parseCards(htmlObj);
        assert.isArray(topPageData);
        assert.lengthOf(topPageData, 0);
      });
    }); // 試合がない場合

    describe('試合が中止の場合', function () {
      let htmlObj = null;
      before(async function () {
        const localFilePath = 'test/dummy_top_cancelled.html';
        await new Promise((resolve, reject) => {
          fs.readFile(localFilePath, 'utf-8', (err, data) => {
            if (err) throw new Error(err.message);
            htmlObj = new JSDOM(data).window.document;
            resolve();
          });
        });
      });

      it('#parseCards()', function () {
        const cards = YahooNPB.parseCards(htmlObj);
        // console.log(cards);

        const expectedCard = new YahooNPBCard();
        expectedCard.status = '試合中止';
        expectedCard.homeTeam = { team: '広島', id: 6, players: [], score: undefined };
        expectedCard.awayTeam = { team: '阪神', id: 5, players: [], score: undefined };
        expectedCard.scoreBoard = undefined;
        expectedCard.scorePlays = undefined;
        expectedCard.league = 'セ・リーグ';
        expectedCard.detailPageUrl = 'https://baseball.yahoo.co.jp/npb/game/2020070601/top';
        expectedCard.venue = 'マツダスタジアム';
        expectedCard.scheduledStartTime = undefined;

        assert.isArray(cards);
        assert.lengthOf(cards, 1);
        assert.deepOwnInclude(cards[0], expectedCard);
      });
    }); // 試合が中止の場合
  }); // top page test

  describe('Detail page tests', function () {
    describe('進行中の場合', function () {
      let htmlObj = null;
      before(async function () {
        // console.log('before');
        const localFilePath = 'test/dummy_detail_gaming.html';
        //
        await new Promise((resolve, reject) => {
          fs.readFile(localFilePath, 'utf-8', (err, data) => {
            if (err) throw new Error(err.message);
            htmlObj = new JSDOM(data).window.document;
            resolve();
          });
        });
      });

      it('#parseScoreBoard()', function () {
        const scoreBoard = YahooNPB.parseScoreBoard(htmlObj);
        // console.log(scoreBoard);
        assert.isObject(scoreBoard);
        assert.hasAllKeys(scoreBoard, ['innings', 'hits', 'losses']);
        assert.isArray(scoreBoard.innings);
        assert.sameDeepOrderedMembers(scoreBoard.innings, [['2','2'],['0','1'],['1','0'],['0','0'],['0','1'],['0','-'],['',''],['',''],['','']]);
        assert.isArray(scoreBoard.hits);
        assert.sameOrderedMembers(scoreBoard.hits, ['4', '6']);
        assert.isArray(scoreBoard.losses);
        assert.sameOrderedMembers(scoreBoard.losses, ['1', '0']);
      });

      it('#parseScorePlays()', function () {
        const scorePlays = YahooNPB.parseScorePlays(htmlObj);
        // console.log(scorePlays[0]);
        assert.isArray(scorePlays, Array);

        const sp1 = new YahooNPBScorePlay();
        sp1.inningText = '1回表';
        sp1.order = '5番';
        sp1.player = '島内 宏明';
        sp1.state = '二死1,2塁';
        sp1.summary = '2アウト1,2塁の2-2からセンターへのタイムリーツーベースで楽天先制！ ソ0-2楽 2塁。';

        const sp2 = new YahooNPBScorePlay();
        sp2.inningText = '1回裏';
        sp2.order = '3番';
        sp2.player = '柳田 悠岐';
        sp2.state = '一死1塁';
        sp2.summary = 'レフトスタンドへの同点２ランホームラン！ ソ2-2楽。';

        const sp3 = new YahooNPBScorePlay();
        sp3.inningText = '2回裏';
        sp3.order = '1番';
        sp3.player = '栗原 陵矢';
        sp3.state = '一死走者なし';
        sp3.summary = '1-0からライトスタンドへの勝ち越しホームラン！ ソ3-2楽';

        const sp4 = new YahooNPBScorePlay();
        sp4.inningText = '3回表';
        sp4.order = '4番';
        sp4.player = '浅村 栄斗';
        sp4.state = '一死走者なし';
        sp4.summary = '同点ホームラン！ ソ3-3楽';

        assert.sameDeepOrderedMembers(scorePlays, [sp1, sp2, sp3, sp4]);
      });

      it('#parseStartingMembers()', function () {
        const startingMembers = YahooNPB.parseStartingMembers(htmlObj);
        // console.log(startingMembers);
        assert.deepOwnInclude(startingMembers,
          {
            homeTeamStartingMember: [
              { position: '（投）', name: '千賀 滉大', hand: '右', rate: '-' },
              { position: '（左）', name: '栗原 陵矢', hand: '左', rate: '.317' },
              { position: '（遊）', name: '今宮 健太', hand: '右', rate: '.271' },
              { position: '（中）', name: '柳田 悠岐', hand: '左', rate: '.283' },
              { position: '（指）', name: 'バレンティン', hand: '右', rate: '.259' },
              { position: '（一）', name: '川島 慶三', hand: '右', rate: '.143' },
              { position: '（三）', name: '松田 宣浩', hand: '右', rate: '.155' },
              { position: '（右）', name: '上林 誠知', hand: '左', rate: '.196' },
              { position: '（捕）', name: '甲斐 拓也', hand: '右', rate: '.229' },
              { position: '（二）', name: '牧原 大成', hand: '左', rate: '.146' }
            ],
            awayTeamStartingMember: [
              { position: '（投）', name: '弓削 隼人', hand: '左', rate: '2.13' },
              { position: '（遊）', name: '茂木 栄五郎', hand: '左', rate: '.288' },
              { position: '（三）', name: '鈴木 大地', hand: '左', rate: '.350' },
              { position: '（右）', name: 'ブラッシュ', hand: '右', rate: '.245' },
              { position: '（二）', name: '浅村 栄斗', hand: '右', rate: '.351' },
              { position: '（左）', name: '島内 宏明', hand: '左', rate: '.339' },
              { position: '（指）', name: 'ロメロ', hand: '右', rate: '.360' },
              { position: '（一）', name: '銀次', hand: '左', rate: '.267' },
              { position: '（捕）', name: '太田 光', hand: '右', rate: '.343' },
              { position: '（中）', name: '辰己 涼介', hand: '左', rate: '.250' }
            ]
          }
        ); // assert
      }); // it
    });

    describe('中止の場合', function () {
      let htmlObj = null;
      before(async function () {
        // console.log('before');
        const localFilePath = 'test/dummy_detail_cancelled.html';
        //
        await new Promise((resolve, reject) => {
          fs.readFile(localFilePath, 'utf-8', (err, data) => {
            if (err) throw new Error(err.message);
            htmlObj = new JSDOM(data).window.document;
            resolve();
          });
        });
      });

      it('#parseScoreBoard()', function () {
        const scoreBoard = YahooNPB.parseScoreBoard(htmlObj);
        // console.log(scoreBoard);
        assert.isObject(scoreBoard);
        assert.hasAllKeys(scoreBoard, ['innings', 'hits', 'losses']);
        assert.isArray(scoreBoard.innings);
        assert.lengthOf(scoreBoard.innings, 0);
        assert.isArray(scoreBoard.hits);
        assert.lengthOf(scoreBoard.hits, 0);
        assert.isArray(scoreBoard.losses);
        assert.lengthOf(scoreBoard.losses, 0);
      });

      it('#parseScorePlays()', function () {
        const scorePlays = YahooNPB.parseScorePlays(htmlObj);
        assert.isArray(scorePlays, Array);
        assert.lengthOf(scorePlays, 0);
      });

      it('#parseStartingMembers()', function () {
        const startingMembers = YahooNPB.parseStartingMembers(htmlObj);
        // console.log(startingMembers);
        assert.propertyVal(startingMembers, 'homeTeamStartingMember', null);
        assert.propertyVal(startingMembers, 'awayTeamStartingMember', null);
      });
    });
  }); // Detail page tests

  describe('Utility function tests', function () {
    describe('#isPacificLeagueTeam()', function () {
      //
      it('Pass pacific league team teamIds.', function () {
        for (const teamId in YahooNPB.pacificLeagueTeams) {
          // console.log(Math.random().toString(36).slice(-8));
          assert.strictEqual(YahooNPB.isPacificLeagueTeam(Number(teamId)), true);
        }
      });

      it('Pass central league team teamIds.', function () {
        for (const teamId in YahooNPB.centralLeagueTeams) {
          assert.strictEqual(YahooNPB.isPacificLeagueTeam(Number(teamId)), false);
        }
      });

      it('Pass teamId 10 (invalid teamID).', function () {
        assert.throws(() => YahooNPB.isPacificLeagueTeam(10), Error, 'Invalid teamId');
      });
    });
  }); // Utility function tests
});

describe('YahooNPBCard', function () {
  const maxInning = 15;
  describe('#currentInning()', function () {
    it('Status is 1-15回表', function () {
      for (let i = 1; i <= maxInning; i++) {
        const card = new YahooNPBCard();
        card.status = `${i}回表`;
        assert.strictEqual(card.currentInning(), i);
      }
    });

    it('Status is 1-15回裏', function () {
      for (let i = 1; i <= maxInning; i++) {
        const card = new YahooNPBCard();
        card.status = `${i}回裏`;
        assert.strictEqual(card.currentInning(), i + 0.5);
      }
    });

    it('Status is not available, throw error.', function () {
      const card = new YahooNPBCard();
      assert.throws(() => card.currentInning(), 'Invalid status value.');
    });

    for (const status of YahooNPBCard.statusTexts) {
      it(`Status is ${status}, return null.`, function () {
        const card = new YahooNPBCard();
        card.status = status;
        assert.isNull(card.currentInning(), 'msg');
      });
    }
  });

  describe('#currentStatus()', function () {
    it('Status is 見どころ, return 0 (before).', function () {
      const card = new YahooNPBCard();
      card.status = '見どころ';
      assert.strictEqual(card.currentStatus(), YahooNPBCard.statuses.before);
    });

    it('Status is スタメン, return 0 (before).', function () {
      const card = new YahooNPBCard();
      card.status = 'スタメン';
      assert.strictEqual(card.currentStatus(), YahooNPBCard.statuses.before);
    });

    it('Status is 試合終了, return 2 (over).', function () {
      const card = new YahooNPBCard();
      card.status = '試合終了';
      assert.strictEqual(card.currentStatus(), YahooNPBCard.statuses.over);
    });

    it('Status is 中断中, return 3 (suspend).', function () {
      const card = new YahooNPBCard();
      card.status = '中断中';
      assert.strictEqual(card.currentStatus(), YahooNPBCard.statuses.suspend);
    });

    it('Status is 試合中止, return 4 (cancel).', function () {
      const card = new YahooNPBCard();
      card.status = '試合中止';
      assert.strictEqual(card.currentStatus(), YahooNPBCard.statuses.cancel);
    });

    it('Status is 1-15回表, return 1 (going).', function () {
      for (let i = 1; i <= maxInning; i++) {
        const card = new YahooNPBCard();
        card.status = `${i}回表`;
        assert.strictEqual(card.currentStatus(), YahooNPBCard.statuses.going);
      }
    });

    it('Status is 1-15回裏, return 1 (going).', function () {
      for (let i = 1; i <= maxInning; i++) {
        const card = new YahooNPBCard();
        card.status = `${i}回裏`;
        assert.strictEqual(card.currentStatus(), YahooNPBCard.statuses.going);
      }
    });
  });

  describe('#scheduledStartTimeObject()', function () {
    it('開始時刻を18時0分に設定すると、テストが実行された日の18時0分0秒0ミリ秒を表すDateオブジェクトを返す。', function () {
      const card = new YahooNPBCard();
      card.scheduledStartTime = '18:00';
      const date = card.scheduledStartTimeObject();

      const expectedDate = new Date();
      expectedDate.setHours(18, 0, 0, 0);

      assert.strictEqual(date.getTime(), expectedDate.getTime());
    });
  });
});
