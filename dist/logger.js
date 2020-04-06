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
        // * null path means default value
        // * '' (empty) path means root
        // * 'something' path means a /something path
        if (defaultPath === undefined) {
            defaultPath = defaultFieldsPath;
        }
        return createLogEntry(this, defaultPath);
    }
    write(level, message, rootFields, pathFields, path) {
        let meta = rootFields, pathMeta = {};
        let err = null;
        for (let i = 0; i < pathFields.length; i++) {
            const field = pathFields[i];
            if (field && (field instanceof Error || field.stack)) {
                if (level !== 'warn' && level != 'error' && level !== 'critical') {
                    level = 'error';
                }
                err = field;
            }
            else {
                pathMeta = { ...pathMeta, ...field };
            }
        }
        if (path !== null && path !== '') {
            meta[path] = pathMeta;
        }
        else {
            meta = { ...pathMeta, ...meta };
        }
        if (err !== null) {
            meta['stacktrace'] = err.stack;
            meta['panic'] = err.message;
        }
        this.backend.log(level, message, meta);
    }
    log(level, message, ...fields) {
        this.write(level, message, {}, fields, defaultFieldsPath);
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
const createLogEntry = (logger, path) => {
    return {
        path: path,
        rootFields: {},
        pathFields: {},
        set: function (k, v, rootField) {
            if (rootField === true) {
                this.rootFields[k] = v;
            }
            else {
                this.pathFields[k] = v;
            }
        },
        get: function (k, rootField) {
            if (rootField === true) {
                return this.rootFields[k];
            }
            else {
                return this.pathFields[k];
            }
        },
        log: function (level, message, ...fields) {
            let pathFields = [];
            for (let k in this.pathFields) {
                let v = this.pathFields[k];
                pathFields.push({ [k]: v });
            }
            pathFields = [...pathFields, ...fields];
            logger.write(level, message, this.rootFields, pathFields, this.path);
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