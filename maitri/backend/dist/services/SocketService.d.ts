import { Server } from 'socket.io';
import { AIService } from './AIService';
export declare class SocketService {
    private io;
    private aiService;
    constructor(io: Server, aiService: AIService);
    setupHandlers(): void;
}
//# sourceMappingURL=SocketService.d.ts.map