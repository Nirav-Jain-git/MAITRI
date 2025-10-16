import express from 'express';
declare class App {
    private app;
    private server;
    private io;
    private databaseService;
    private socketService;
    private aiService;
    constructor();
    private setupMiddleware;
    private setupRoutes;
    private setupErrorHandling;
    start(): Promise<void>;
    stop(): Promise<void>;
    getApp(): express.Application;
}
declare const app: App;
export default app;
//# sourceMappingURL=index.d.ts.map