const chai = require('chai');

const FsHelper = require('../../lib/utils/fsHelper');

const fsHelper = new FsHelper({ error: () => { }, info: () => { } });
const expect = chai.expect;

describe('fsHelper', () => {
  it('loadJsonSync should return undefined for file not in output folder', () => {
    expect(fsHelper.loadJsonSync('noSuchFile')).to.not.exist;
  });
});
