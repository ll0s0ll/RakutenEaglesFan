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

/* global */

const RakutenFmTohoku = {

  hlsSrcUrl: 'https://rakuteneagles-live.hls.wselive.stream.ne.jp/hls-live/1/rakuteneagles-live/livestream/playlist.m3u8',
  timetableUrl: 'https://rkt-cache.bitmedia.ne.jp/rakuten_fm/data/radio_tm.jsonp',

  getNowOnAirProgram: function (timeTable) {
    const now = new Date();
    // now.setHours(0, 0, 0)
    // now.setDate(now.getDate() + 1)
    // now.setHours(now.getHours() - 1);
    // console.log('Now: ' + now)

    const progs = RakutenFmTohoku.getProgramsByDay(timeTable, now);
    // console.log(progs)
    let prog = this.getProgramByTime(progs, now);
    if (!prog) {
      // 見つからない場合、昨日から日をまたいで放送している番組の可能性を探る。
      const yesterDay = new Date(now.getTime());
      yesterDay.setDate(now.getDate() - 1);
      // console.log(yesterDay)
      const progs = this.getProgramsByDay(timeTable, yesterDay);
      prog = this.getProgramByTime(progs, now);
    }

    return prog;
  },

  getProgramByTime: function (programs, dateObj) {
    for (const prog of programs) {
      // console.log(prog)
      if (prog.startTimeMSec <= dateObj.getTime() && dateObj.getTime() < prog.endTimeMSec) {
        return prog;
      }
    }
    return null;
  },

  getProgramsByDay: function (timeTable, date) {
    // console.log(timeTable)
    // console.log(date)

    // 指定日が、タイムテーブルの掲載範囲内か確認。
    if (date.getTime() < timeTable.termStartMSec || date.getTime() >= timeTable.termEndMSec) {
      return [];
    }

    let progs;
    // 指定日の曜日に合致するオブジェクトを取得
    switch (date.getDay()) {
      case 0:
        progs = timeTable.sun;
        break;
      case 1:
        progs = timeTable.mon;
        break;
      case 2:
        progs = timeTable.tue;
        break;
      case 3:
        progs = timeTable.wed;
        break;
      case 4:
        progs = timeTable.thu;
        break;
      case 5:
        progs = timeTable.fri;
        break;
      case 6:
        progs = timeTable.sat;
        break;
      default:
        throw new Error('Unknown day');
    }
    // console.log(progs)
    // return progs

    // それぞれのプログラムの開始終了時刻を'Unix time (milliseconds)'でも保存する。
    for (const prog of progs) {
      // console.log(prog)

      const start = this.timeTextToDateObject(prog.start, date);
      // console.log(start)
      prog.startTimeMSec = start.getTime();

      const end = this.timeTextToDateObject(prog.end, date);
      // console.log(end)
      prog.endTimeMSec = end.getTime();
    }

    return progs;
  },

  timeTextToDateObject: function (timeText, now) {
    const out = new Date(now.getTime());
    if (Number(timeText.substr(0, 2)) > 24) {
      out.setDate(out.getDate() + 1);
      out.setHours(Number(timeText.substr(0, 2)) - 24, timeText.substr(2, 4), 0);
    } else {
      out.setHours(timeText.substr(0, 2), timeText.substr(2, 4), 0);
    }
    return out;
  },

  parseTimeTable: function (timetableJsonpStr) {
    // 荒れているJSONPを地道に整えることから始める

    // JSONPの関数呼び出しをはずす
    const r0 = timetableJsonpStr.replace(/^tm_891\(([\s\S]*)\);$/, '$1');
    // const r0 = html.match(/^tm_891\(([\s\S]*)\);$/);
    // console.log(r0);

    // オブジェクトの始まりの不要な記号等を削除
    const r1 = r0.replace(/\{(\s+)"/g, '{"');
    // const r1 = r0.match(/\{(\s+)/g);
    // console.log(r1);

    // プロパティ間の不要な記号等を削除
    const r2 = r1.replace(/,(\s+)"/g, ',"');
    // const r2 = r1.match(/,(\s+)"/g);
    // console.log(r2);

    // オブジェクト間の不要な記号等を削除
    const r3 = r2.replace(/\},(\s+)\{/g, '},{');
    // const r3 = r2.match(/\},(\s+)\{/g);
    // console.log(r3);

    // 配列の始まりの不要な記号等を削除
    const r4 = r3.replace(/\[(\s+)\{/g, '[{');
    // const r4 = r3.match(/\[(\s+)\{/g);
    // console.log(r4);

    // ケツカンマ
    const r5 = r4.replace(/\},(\s+)\]/g, '}]');
    // const r5 = r4.match(/\},(\s+)\]/g);
    // console.log(r5);

    // オブジェクトの終わりの不要な記号等を削除
    const r6 = r5.replace(/\](\s+)\}/g, ']}');
    // const r6 = r5.match(/\](\s+)\}/g);
    // console.log(r6);

    // 配列の中のオブジェクトの始まりの不要な記号等を削除
    // const test2 = test[1].trim().replace(/\[(\s+)\{/g, '[{');
    // const test2 = test[1].trim().match(/\[(\s+)\{/g);
    // console.log(test2);
    // console.log(test2[1]);

    // オブジェクト間の不要な記号等を削除
    // const test3 = test2.replace(/\},(\s+)\{/g, '},{');
    // const test3 = test2.trim().match(/\},(\s+)\{/g);
    // console.log(test3);
    // console.log(test2[1]);

    // ケツカンマ
    // const test4 = test3.replace(/\},(\s*)\]/g, '}]');
    // const test5 = test4.trim().match(/\},(\s*)\]/g);
    // console.log(test5);

    // プロパティ間の不要な記号等を削除
    // const test5 = test4.replace(/\}\],(\s*)"/g, '}],"');
    // const test5 = test4.trim().match(/\}\],(\s*)\"/g);
    // console.log(test5);

    // 不要な改行、スペースを削除
    // const r = html.replace(/\s/gm, '');
    // const r = html.replace(/(\r\n|\n|\r|\t|\f|\v)/g, '');
    // const r = html.replace(/(\r\n|\n|\r|\t|\s{3,})/g, '');
    // console.log(r)

    // ケツカンマ
    // const s = r.replace(/,(?=\s*[}\]])/gm, '');
    // console.log(s)

    // JSONPの関数呼び出しをはずす
    // const objectText = s.match(/^tm_891\((.*)\);$/);
    // console.log(objectText)

    const timeTableObj = JSON.parse(r6);
    // console.log(timeTableObject)

    // 期間を使いやすい形式(unix time (milliseconds))でも保存する。
    // term: "7月13日～7月19日"
    const term = timeTableObj.term.match(/(\d{1,2})月(\d{1,2})日～(\d{1,2})月(\d{1,2})日/);
    // console.log(reg)

    const year = new Date().getFullYear();
    const termStart = new Date(year, (Number(term[1]) - 1), term[2], 0, 0, 0);
    // console.log(termStart);
    timeTableObj.termStartMSec = termStart.getTime();

    const termEnd = new Date(year, (Number(term[3]) - 1), term[4], 23, 59, 59);
    // console.log(termEnd);
    timeTableObj.termEndMSec = termEnd.getTime();

    return timeTableObj;
  }
}; // RakutenFmTohoku
