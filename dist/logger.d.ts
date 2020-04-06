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
    createEntry(defaultPath?: string): LogEntry;
    write(level: string, message: string, rootFields: object[], pathFields: object[], path: string | null): any;
    log(level: string, message: string, ...fields: object[]): any;
    debug(message: string, ...fields: object[]): any;
    info(message: string, ...fields: object[]): any;
    warn(message: string, ...fields: object[]): any;
    error(message: string, ...fields: object[]): any;
    critical(message: string, ...fields: object[]): any;
}
export interface LogEntry {
    path: string | null;
    rootFields: object;
    pathFields: object;
    set(k: string, v: any, rootField?: boolean): any;
    get(k: string, rootField?: boolean): any;
    log(level: string, message: string, ...fields: object[]): any;
    debug(message: string, ...fields: object[]): any;
    info(message: string, ...fields: object[]): any;
    warn(message: string, ...fields: object[]): any;
    error(message: string, ...fields: object[]): any;
    critical(message: string, ...fields: object[]): any;
}
export declare const createLogger: (config: Config) => Logger;
