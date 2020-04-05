"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const uuid_1 = require("uuid");
exports.requestLogger = (logger) => (req, res, next) => {
    const entry = logger.createEntry();
    const verbose = logger.config.concise !== true;
    const requestURL = req.protocol + '://' + req.get('host') + req.originalUrl;
    // Record httpRequest details
    if (verbose) {
        let httpRequest = {
            'requestMethod': req.method,
            'requestPath': req.path,
            'requestURL': requestURL,
            'scheme': req.protocol
        };
        // Compute unique id to track this request flow
        httpRequest['requestID'] = uuid_1.v4();
        // Determine remote ip of user
        httpRequest['remoteIP'] = (req.headers['x-forwarded-for'] || '').split(',').pop() ||
            req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
        // Record headers, but clear some values out for safety
        httpRequest['headers'] = req.headers;
        if (httpRequest['headers']['authorization'] && httpRequest['headers']['authorization'] !== '') {
            httpRequest['headers']['authorization'] = '***';
        }
        if (httpRequest['headers']['cookie'] && httpRequest['headers']['cookie'] !== '') {
            httpRequest['headers']['cookie'] = '***';
        }
        if (httpRequest['headers']['set-cookie'] && httpRequest['headers']['set-cookie'] !== '') {
            httpRequest['headers']['set-cookie'] = '***';
        }
        entry.set('httpRequest', httpRequest, false);
    }
    const startAt = process.hrtime();
    setLogEntry(req, entry);
    req.requestLoggerConfig = logger.config;
    // Process request
    next();
    // Now, we're after the request handler, record httpResponse details and log it
    const elapsed = process.hrtime(startAt);
    const elapsedMs = ((elapsed[0] * 1e3) + (elapsed[1] * 1e-6)).toFixed(3); // ms
    if (verbose) {
        let httpResponse = {
            status: res.statusCode,
            elapsed: elapsedMs
        };
        entry.set('httpResponse', httpResponse, false);
    }
    // Log the request & response
    let message = '';
    if (verbose) {
        // Verbose-mode -- small message as data is in the entry
        message = `Response: ${res.statusCode} ${statusLabel(res.statusCode)}`;
    }
    else {
        // Concise-mode -- pack the info in this message
        // message = `${res.statusCode} ${statusLabel(res.statusCode)} - ${req.method} ${req.originalUrl}`
        message = `"${req.method} ${req.originalUrl}" - ${res.statusCode} ${statusLabel(res.statusCode)} in ${elapsedMs}ms`;
    }
    // entry.write(statusLevel(res.statusCode), message, false)
    entry.log(statusLevel(res.statusCode), message);
};
exports.getLogEntry = (req) => {
    const entry = req.requestLogEntry;
    if (entry === undefined || !entry) {
        throw Error('middleware error! requestLogger entry not found.');
    }
    return req.requestLogEntry;
};
const setLogEntry = (req, logEntry) => {
    req.requestLogEntry = logEntry;
};
exports.requestRecoverer = (error, req, res, next) => {
    if (error) {
        const config = req.requestLoggerConfig;
        const entry = req.requestLogEntry;
        if (config.json === true) {
            entry.set('stacktrace', error.stack, false);
            entry.set('panic', error.message, false);
        }
        else {
            console.log(error.stack);
        }
    }
    res.status(500).send(error.message);
};
const statusLevel = (status) => {
    if (status <= 0) {
        return 'warn';
    }
    if (status < 400) { // for codes in 100s, 200s, 300s
        return 'info';
    }
    if (status >= 400 && status < 500) {
        return 'warn';
    }
    if (status >= 500) {
        return 'error';
    }
    return 'info';
};
const statusLabel = (status) => {
    if (status >= 100 && status < 300) {
        return 'OK';
    }
    if (status >= 300 && status < 400) {
        return 'Redirect';
    }
    if (status >= 400 && status < 500) {
        return 'Client Error';
    }
    if (status >= 500) {
        return 'Server Error';
    }
    return 'Unknown';
};
//# sourceMappingURL=requestLogger.js.map