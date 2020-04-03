"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const winston = require("winston");
exports.createLogger = (config) => {
    if (config.service === '') {
        throw Error('config error! service cannot be empty');
    }
    let meta = { service: config.service };
    if (config.concise !== true && config.tags) {
        meta = { ...config.tags, ...meta };
    }
    const logger = winston.createLogger({
        level: config.level,
        defaultMeta: meta,
        format: winston.format.combine(winston.format.timestamp())
    });
    if (config.json === true) {
        logger.add(new winston.transports.Console({
            format: winston.format.combine(winston.format.json())
        }));
    }
    else {
        logger.add(new winston.transports.Console({
            format: winston.format.combine(winston.format.colorize(), winston.format.simple())
        }));
    }
    logger.config = config;
    logger.createEntry = (fields) => createLogEntry(logger, fields);
    return logger;
};
const createLogEntry = (logger, fields) => {
    return {
        fields: fields || {},
        set: function (k, v) {
            this.fields[k] = v;
        },
        get: function (k) {
            return this.fields[k];
        },
        log: function (level, message) {
            if (logger.config.concise !== true) {
                this.fields['severity'] = level;
            }
            logger.log(level, message, this.fields);
        },
        debug: function (message) {
            this.log('debug', message);
        },
        info: function (message) {
            this.log('info', message);
        },
        warn: function (message) {
            this.log('warn', message);
        },
        error: function (message) {
            this.log('error', message);
        }
    };
};
//# sourceMappingURL=logger.js.map