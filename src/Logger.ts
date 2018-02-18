
export default class Logger {
    private static logLevel = 3;

    public static setLogLevel(level: number): void {
        Logger.logLevel = level;
    }

    public static log(level: number, message: string) {
        if (level <= Logger.logLevel) console.log(message);
    }
}