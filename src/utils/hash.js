'use strict';

const crypto = require('crypto');

module.exports = function hashString(string) {
  return crypto.createHash('sha256').update(string).digest('hex');
};
