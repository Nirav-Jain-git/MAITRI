"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationValidation = exports.EmotionValidation = exports.SessionValidation = void 0;
exports.SessionValidation = {
    start: {
        userId: { required: true, type: 'string', minLength: 1 }
    }
};
exports.EmotionValidation = {
    detect: {
        sessionId: { required: true, type: 'string', minLength: 1 },
        imageData: { required: false, type: 'string' },
        audioData: { required: false, type: 'string' }
    }
};
exports.ConversationValidation = {
    message: {
        message: { required: true, type: 'string', minLength: 1, maxLength: 2000 },
        conversationId: { required: true, type: 'string', minLength: 1 }
    }
};
//# sourceMappingURL=index.js.map