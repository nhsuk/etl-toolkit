const chai = require('chai');
const fs = require('fs');

const EtlStore = require('../../lib/etlStore');

let etlStore;
const expect = chai.expect;
const outputFile = 'test-data.json';
const idKey = 'identifier';

function readAsJson(path) {
  return JSON.parse(fs.readFileSync(path, 'utf8'));
}

function addSampleData() {
  etlStore.addIds(['1', '2', '3']);
  etlStore.addRecord({ identifier: '1' });
  etlStore.addRecord({ identifier: '2' });
  etlStore.addRecord({ identifier: '3' });
  etlStore.saveRecords();
}

describe('ETL store', () => {
  beforeEach(() => {
    etlStore = new EtlStore({ idKey, outputFile });
    etlStore.clearState();
  });

  it('constructor should throw error if outputFile not provided', () => {
    expect(() => new EtlStore({ idKey })).to.throw('\'outputFile\' must be provided');
  });

  describe('key management', () => {
    it('should use provided ID key', () => {
      etlStore.addRecord({ identifier: '123' });
      expect(etlStore.getRecord('123')).to.exist;
    });
  });

  describe('Record management', () => {
    it('getRecord should retrieve record by ID', () => {
      etlStore.addRecord({ identifier: '123' });
      expect(etlStore.getRecord('123')).to.exist;
    });

    it('addRecord should not allow the addition of duplicate records', () => {
      etlStore.addRecord({ identifier: '123' });
      etlStore.addRecord({ identifier: '123' });
      expect(etlStore.getRecord('123')).to.exist;
      expect(etlStore.getRecords().length).to.equal(1);
    });

    it('deleteRecord should delete by ID', () => {
      etlStore.addRecord({ identifier: '123' });
      expect(etlStore.getRecord('123')).to.exist;
      etlStore.deleteRecord('123');
      expect(etlStore.getRecord('123')).to.not.exist;
    });
  });

  describe('ID management', () => {
    it('addIds should add an array of ids', () => {
      etlStore.addIds(['1', '2', '3']);
      expect(etlStore.getIds().length).to.equal(3);
    });

    it('addIds should not allow the addition of duplicate ids', () => {
      etlStore.addIds(['1', '2', '3', '1']);
      expect(etlStore.getIds().length).to.equal(3);
    });
  });

  describe('Error management', () => {
    it('addFailedIds should add message and area of failure', () => {
      const message = '500 error on services';
      etlStore.addFailedId('bad1', 'services', message);
      expect(etlStore.getErroredIds().length).to.equal(1);
      expect(etlStore.errorDetails.bad1.services).to.equal(message);
    });
  });

  describe('Reporting', () => {
    it('writeStatus should list failed IDs', () => {
      etlStore.addIds(['1', '2', '3']);
      etlStore.addRecord({ identifier: '1' });
      const message = '500 error on services';
      etlStore.addFailedId('2', 'services', message);
      etlStore.addRecord({ identifier: '3' });
      const result = [];
      etlStore.writeStatus({ info: (status) => { result.push(status); } });
      expect(result[0]).to.equal('1 IDs failed: 2');
      expect(result[1]).to.equal('See \'summary.json\' for full details');
    });

    it('saveSummary should write report of date, total scanned, total errored IDs and failure details', () => {
      etlStore.addIds(['1', '2', '3']);
      etlStore.addRecord({ identifier: '1' });
      const message = '500 error on services';
      etlStore.addFailedId('2', 'services', message);
      etlStore.addRecord({ identifier: '3' });
      etlStore.saveSummary();
      const summary = readAsJson(`output/${etlStore.summaryFilename}`);
      expect(summary.lastWritten).to.exist;
      expect(summary.totalScanned).to.equal(3);
      expect(summary.totalErrored).to.equal(1);
      expect(summary.erroredIds['2'].services).to.equal(message);
    });

    it('saveRecords should save output file and seed ID list', () => {
      addSampleData();
      const output = readAsJson(`output/${etlStore.outputFilename}`);
      expect(output.length).to.equal(3);
      expect(output[0].identifier).to.equal('1');
      expect(output[1].identifier).to.equal('2');
      expect(output[2].identifier).to.equal('3');
      const seedIds = readAsJson(`output/${etlStore.seedIdFilename}`);
      expect(seedIds.length).to.equal(3);
      expect(seedIds[0]).to.equal('1');
      expect(seedIds[1]).to.equal('2');
      expect(seedIds[2]).to.equal('3');
    });
  });
});
