import { Logger, LogEntry } from './logger';
export declare const requestLogger: (logger: Logger) => (req: any, res: any, next: any) => void;
export declare const getLogEntry: (req: any) => LogEntry;
export declare const requestRecoverer: (error: any, req: any, res: any, next: any) => void;
