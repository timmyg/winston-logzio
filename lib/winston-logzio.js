const Transport = require('winston-transport');
const stringifySafe = require('json-stringify-safe');
const logzioNodejs = require('logzio-nodejs');

module.exports = class LogzioWinstonTransport extends Transport {
  constructor(options) {
    super(options);
    this.name = options.name || 'LogzioLogger';
    this.level = options.level || 'info';
    this.logzioLogger = logzioNodejs.createLogger(options);
  }

  log(info, callback) {
    setImmediate(() => {
      this.emit('logged', info);
    });

    let msg = info.message;
    if (typeof info.message !== 'string' && typeof info.message !== 'object') {
      let safeMessage;
      try {
        safeMessage = JSON.stringify(json);
      } catch (ex) {
        safeMessage = stringifySafe(json, null, null, () => {});
      }
      msg = {
        message: safeMessage,
      };
    } else if (typeof info.message === 'string') {
      msg = {
        message: info.message,
      };
    }

    const splat = info[Symbol.for('splat')];
    let meta = splat && splat[0];
    if (meta instanceof Error) {
      meta = {
        error: meta.stack || meta.toString(),
      };
    }

    const logObject = Object.assign({}, info, msg, {
      level: info.level || this.level,
      meta,
    });

    this.logzioLogger.log(logObject);
    callback(null, true);
  }

  finish(callback) {
    this.logzioLogger.sendAndClose(callback);
  }
};
