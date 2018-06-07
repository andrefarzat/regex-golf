

declare module 'webworker-ng' {
    export class WebWorker {
        constructor(...args: any[]);

        postMessage(arg: any): void;
        onmessage: any;
        terminate(): void;
    }
}