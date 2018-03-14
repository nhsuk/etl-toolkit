const chai = require('chai');

const etlStore = require('../../lib/etlStore');

const expect = chai.expect;

describe('ETL store', () => {
  beforeEach(() => {
    etlStore.clearState();
  });

  it('should allow the ID key to be set', () => {
    etlStore.setIdKey('identifier');
    etlStore.addRecord({ identifier: '123' });
    expect(etlStore.getRecord('123')).to.exist;
  });

  it('should allow record to be deleted by ID', () => {
    etlStore.setIdKey('identifier');
    etlStore.addRecord({ identifier: '123' });
    expect(etlStore.getRecord('123')).to.exist;
    etlStore.deleteRecord('123');
    expect(etlStore.getRecord('123')).to.not.exist;
  });
});
