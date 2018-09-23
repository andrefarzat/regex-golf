import * as fs from 'fs';
import * as path from 'path';
import * as Moment from 'moment';
import * as winston from 'winston';

import Individual from './models/Individual';
import LocalSearch from './localsearch/LocalSearch';

export enum LogLevel {
    error = 0,
    warn = 1,
    info = 2,
    verbose = 3,
    debug = 4,
    silly = 5,
}

export default class Logger {
    protected static logLevel = LogLevel.warn;
    protected static instanceName: string;
    protected static _wiston: winston.Logger;

    protected static get wiston() {
        if (!this._wiston) {
            let reportRootDir = path.join(__dirname, '..', 'results', 'current');

            let errorLog = path.join(reportRootDir, 'error.log');
            let instanceInfo = path.join(reportRootDir, `${this.instanceName}.log`);

            this._wiston = winston.createLogger({
                level: LogLevel[this.logLevel],
                format: winston.format.json(),
                transports: [
                    // new winston.transports.Console(),
                    new winston.transports.File({ filename: errorLog, level: 'error' }),
                    new winston.transports.File({ filename: instanceInfo, level: 'info' }),
                ]
            });
        }

        return this._wiston;
    }

    public static init(config: {logLevel: LogLevel, instanceName: string}) {
        this.logLevel = config.logLevel;
        this.instanceName = config.instanceName;
    }

    public static log(logLevel: LogLevel, message: string) {
        this.wiston.log(LogLevel[logLevel].toString(), message);
    }

    public static error(...message: string[]) {
        this.log(LogLevel.error, message.join(' '));
    }

    public static warn(...message: string[]) {
        this.log(LogLevel.error, message.join(' '));
    }

    public static info(...message: string[]) {
        this.log(LogLevel.info, message.join(' '));
    }

    public static verbose(...message: string[]) {
        this.log(LogLevel.verbose, message.join(' '));
    }

    public static debug(...message: string[]) {
        this.log(LogLevel.debug, message.join(' '));
    }

    public static silly(...message: string[]) {
        this.log(LogLevel.silly, message.join(' '));
    }
}