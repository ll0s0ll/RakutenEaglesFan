/*
  Copyright (C) 2021 Shun Ito

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

/* global electron LOCAL */
'use strict';

class GitHubApiReleases {
  //
  static fetchLatestRelease () {
    return new Promise((resolve, reject) => {
      if (LOCAL) {
        const localFilePath = 'private/githubapi_latest_release.json';
        electron.node.fs.readFile(localFilePath, 'utf-8', (err, data) => {
          if (err) {
            console.error(err);
            const error = new Error('Failed to fetch detail page data.');
            error.name = 'ServerError';
            reject(error);
            return;
          }
          try {
            const releases = JSON.parse(data);
            resolve({ body: releases, headers: null, statusCode: null });
          } catch (e) {
            reject(e);
          }
        });
        return;
      }

      const latestReleaseEndPoint = 'https://api.github.com/repos/ll0s0ll/rakuteneaglesfan/releases/latest';
      const options = { headers: { 'User-Agent': 'RakutenEaglesFan' } };
      let buf;
      const request = electron.node.https.request(latestReleaseEndPoint, options, (res) => {
        res.on('data', (chunk) => {
          if (buf === undefined) {
            buf = chunk;
          } else {
            buf = electron.node.Buffer.concat([buf, chunk]);
          }
        });
        res.on('end', () => {
          console.log('x-ratelimit-used:', res.headers['x-ratelimit-used']);
          if (res.statusCode === 403 && this.isRateLimitExceeded(res)) {
            reject(new Error('RateLimitExceeded'));
          } else if (res.statusCode !== 200) {
            reject(new Error('ServerError'));
          }

          try {
            const body = JSON.parse(buf.toString('utf8'));
            resolve({ body: body, headers: res.headers, statusCode: res.statusCode });
          } catch (e) {
            reject(e);
          }
        });
      });

      request.on('error', (e) => {
        reject(e);
      });

      request.end();
    });
  }

  /**
   * tag_name項目をバージョンとして使用。
   * @param  {[type]} releaseObject [description]
   * @return {[type]}               [description]
   */
  static getReleaseVersion (releaseObject) {
    if (!releaseObject) return null;

    var tagName = releaseObject.tag_name;
    if (!tagName) return null;

    const result = tagName.match(/^v(\d+\.\d+\.\d+)$/);
    return result ? result[1] : null;
  }

  static isRateLimitExceeded (response) {
    if (!response ||
        !response.hasOwnProperty('headers') ||
        !response.headers.hasOwnProperty('x-ratelimit-remaining')) {
      throw new Error('Invalid argument.');
    }
    return response.headers['x-ratelimit-remaining'] == 0 ? true : false;
  }
}

module.exports = GitHubApiReleases;
