const crypto = require('crypto');

function generateJWTSecret(length = 64) {
  return crypto.randomBytes(length).toString('hex');
}

const secret = generateJWTSecret();
console.log('JWT Secret:', secret);