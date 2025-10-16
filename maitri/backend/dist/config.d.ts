export interface Config {
    env: string;
    port: number;
    frontend: {
        url: string;
    };
    database: {
        path: string;
    };
    ai: {
        serviceUrl: string;
        timeout: number;
    };
    logging: {
        level: string;
        file: string;
    };
    features: {
        enableTTS: boolean;
        enableEmotionDetection: boolean;
        enableConversation: boolean;
    };
}
export declare const config: Config;
//# sourceMappingURL=config.d.ts.map