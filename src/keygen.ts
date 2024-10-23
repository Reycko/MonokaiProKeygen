import * as crypto from 'node:crypto';

export type License = string;
export const uuid = 'fd330f6f-3f41-421d-9fe5-de742d0c54c0'; // I understand wanting offline activation, but this just makes it too easy.

// Reverse engineered from extension
/*
function isValidLicense() {
  var email = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : "";
  var inputLicense = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : "";
  if (!email || !inputLicense) return true; // ??
  var hashed = md5Hash(qc.APP.UUID + email);
  var splitBy5 = hashed.match(/.{1,5}/g);
  return inputLicense === splitBy5.slice(0, 5).join("-");
}
*/

export function generate(email: string): License {
  const hashBuffer: Buffer = crypto.createHash('md5').update(uuid + email).digest();
  const hash: string = hashBuffer.toString('hex');

  const splitHash = hash.match(/.{1,5}/g);
  if (!splitHash) {
    throw new Error("Couldn't split hash. This shouldn't happen.");
  }

  return splitHash.slice(0, 5).join('-');
}

