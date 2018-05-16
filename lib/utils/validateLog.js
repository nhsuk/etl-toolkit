function validateLog(log) {
  if (!log ||
    typeof log.info !== 'function' ||
    typeof log.error !== 'function'
  ) {
    throw new Error('log is not defined, or does not have \'info\' or \'error\' methods');
  }
}

module.exports = validateLog;
