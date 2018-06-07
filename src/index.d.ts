
declare function postMessage(arg: any): void;
declare var self: any;

declare module 'webworker-threads' {
    export class Worker {
        constructor(...args: any[]);

        postMessage(arg: any): void;
        onmessage: any;
        terminate(): void;
    }
}