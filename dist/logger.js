"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const winston = require("winston");
const defaultFieldsPath = 'context';
class logger {
    constructor(config, backend) {
        this.config = config;
        this.backend = backend;
    }
    createEntry(defaultPath) {
        if (defaultPath === undefined) {
            defaultPath = defaultFieldsPath;
        }
        // * null path means default value
        // * '' (empty) path means root
        // * 'something' path means a /something path
        return createLogEntry(this, defaultPath);
    }
    write(level, message, path, ...fields) {
        let meta = null;
        let err = null;
        if (fields && fields.length > 0) {
            for (let i = 0; i < fields.length; i++) {
                const field = fields[i];
                if (field && (field instanceof Error || field.stack)) {
                    if (level !== 'warn' && level != 'error' && level !== 'critical') {
                        level = 'error';
                    }
                    err = field;
                }
                else {
                    meta = { ...meta, ...field };
                }
            }
            if (path !== null && path !== '') {
                meta = { [path]: { ...meta } };
            }
        }
        if (err !== null) {
            meta['stacktrace'] = err.stack;
            meta['panic'] = err.message;
        }
        this.backend.log(level, message, meta);
    }
    log(level, message, ...fields) {
        this.write(level, message, defaultFieldsPath, ...fields);
    }
    debug(message, ...fields) {
        this.log('debug', message, ...fields);
    }
    info(message, ...fields) {
        this.log('info', message, ...fields);
    }
    warn(message, ...fields) {
        this.log('warn', message, ...fields);
    }
    error(message, ...fields) {
        this.log('error', message, ...fields);
    }
    critical(message, ...fields) {
        this.log('critical', message, ...fields);
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
const createLogEntry = (logger, defaultPath) => {
    return {
        defaultPath: defaultPath,
        fields: {},
        set: function (k, v, defaultPath) {
            if (defaultPath !== false) {
                if (!this.fields[this.defaultPath]) {
                    this.fields[this.defaultPath] = {};
                }
                this.fields[this.defaultPath][k] = v;
            }
            else {
                this.fields[k] = v;
            }
        },
        get: function (k, defaultPath) {
            if (defaultPath !== false) {
                return this.fields[this.defaultPath][k];
            }
            else {
                return this.fields[k];
            }
        },
        log: function (level, message, ...fields) {
            if (fields && fields.length > 0) {
                logger.write(level, message, '', ...[this.fields, ...fields]);
            }
            else {
                logger.write(level, message, '', this.fields);
            }
        },
        debug: function (message, ...fields) {
            this.log('debug', message, ...fields);
        },
        info: function (message, ...fields) {
            this.log('info', message, ...fields);
        },
        warn: function (message, ...fields) {
            this.log('warn', message, ...fields);
        },
        error: function (message, ...fields) {
            this.log('error', message, ...fields);
        },
        critical: function (message, ...fields) {
            this.log('critical', message, ...fields);
        }
    };
};
//# sourceMappingURL=logger.js.map