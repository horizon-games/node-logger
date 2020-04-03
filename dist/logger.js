"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const winston = require("winston");
class logger {
    constructor(config, backend) {
        this.config = config;
        this.backend = backend;
    }
    createEntry(fields) {
        return createLogEntry(this, fields);
    }
    log(level, message, meta) {
        this.backend.log(level, message, meta);
    }
    debug(message, meta) {
        this.backend.debug(message, meta);
    }
    info(message, meta) {
        this.backend.info(message, meta);
    }
    warn(message, meta) {
        this.backend.warn(message, meta);
    }
    error(message, meta) {
        this.backend.error(message, meta);
    }
    critical(message, meta) {
        this.backend.log('critical', message, meta);
    }
}
exports.createLogger = (config) => {
    if (config.service === '') {
        throw Error('config error! service cannot be empty');
    }
    let meta = { service: config.service };
    if (config.concise !== true && config.tags) {
        meta = { ...config.tags, ...meta };
    }
    const backend = winston.createLogger({
        level: config.level || 'info',
        levels: {
            critical: 0,
            error: 1,
            warn: 2,
            info: 3,
            debug: 4
        },
        defaultMeta: meta,
        format: winston.format.combine(winston.format.timestamp())
    });
    if (config.json === true) {
        backend.add(new winston.transports.Console({
            format: winston.format.combine(winston.format.json())
        }));
    }
    else {
        backend.add(new winston.transports.Console({
            format: winston.format.combine(winston.format.colorize({ colors: { 'critical': 'red' } }), winston.format.simple())
        }));
    }
    return new logger(config, backend);
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
        log: function (level, message, meta) {
            // if (logger.config.concise !== true) {
            //   this.fields['severity'] = level
            // }
            if (meta !== undefined) {
                logger.log(level, message, { ...this.fields, ...meta });
            }
            else {
                logger.log(level, message, this.fields);
            }
        },
        debug: function (message, meta) {
            this.log('debug', message, meta);
        },
        info: function (message, meta) {
            this.log('info', message, meta);
        },
        warn: function (message, meta) {
            this.log('warn', message, meta);
        },
        error: function (message, meta) {
            this.log('error', message, meta);
        },
        critical: function (message, meta) {
            this.log('critical', message, meta);
        }
    };
};
//# sourceMappingURL=logger.js.map