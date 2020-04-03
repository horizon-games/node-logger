import * as winston from 'winston';
export interface Config {
    service: string;
    level?: string;
    json?: boolean;
    concise?: boolean;
    tags?: object;
}
export interface Logger extends winston.Logger {
    config: Config;
    createEntry(fields?: object): LogEntry;
    critical(message: string, ...meta: any[]): winston.Logger;
}
export interface LogEntry {
    fields: object;
    set(k: string, v: object): any;
    get(k: string): any;
    log(level: string, message: string): any;
    debug(message: string): any;
    info(message: string): any;
    warn(message: string): any;
    error(message: string): any;
    critical(message: string): any;
}
export declare const createLogger: (config: Config) => Logger;
