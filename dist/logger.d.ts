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
    log(level: string, message: string, ...fields: object[]): any;
    debug(message: string, ...fields: object[]): any;
    info(message: string, ...fields: object[]): any;
    warn(message: string, ...fields: object[]): any;
    error(message: string, ...fields: object[]): any;
    critical(message: string, ...fields: object[]): any;
}
export interface LogEntry {
    fields: object;
    set(k: string, v: object): any;
    get(k: string): any;
    log(level: string, message: string, ...fields: object[]): any;
    debug(message: string, ...fields: object[]): any;
    info(message: string, ...fields: object[]): any;
    warn(message: string, ...fields: object[]): any;
    error(message: string, ...fields: object[]): any;
    critical(message: string, ...fields: object[]): any;
}
export declare const createLogger: (config: Config) => Logger;
