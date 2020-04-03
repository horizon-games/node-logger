import * as winston from 'winston';
export interface Config {
    service: string;
    level?: string;
    json?: boolean;
    concise?: boolean;
    tags?: object;
}
export interface Logger {
    config: Config;
    backend: winston.Logger;
    createEntry(fields?: object): LogEntry;
    log(level: string, message: string, meta?: object): any;
    debug(message: string, meta?: object): any;
    info(message: string, meta?: object): any;
    warn(message: string, meta?: object): any;
    error(message: string, meta?: object): any;
    critical(message: string, meta?: object): any;
}
export interface LogEntry {
    fields: object;
    set(k: string, v: object): any;
    get(k: string): any;
    log(level: string, message: string, meta?: object): any;
    debug(message: string, meta?: object): any;
    info(message: string, meta?: object): any;
    warn(message: string, meta?: object): any;
    error(message: string, meta?: object): any;
    critical(message: string, meta?: object): any;
}
export declare const createLogger: (config: Config) => Logger;
