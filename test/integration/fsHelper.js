const chai = require('chai');

const fsHelper = require('../../lib/utils/fsHelper');

const expect = chai.expect;

describe('fsHelper', () => {
  it('loadJsonSync should return undefined for file not in output folder', () => {
    expect(fsHelper.loadJsonSync('noSuchFile')).to.not.exist;
  });
});
