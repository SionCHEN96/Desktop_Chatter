import React from 'react';
import './MessageComponent.css'; // 引入局部样式文件

const MessageComponent = ({ text, isUser = false }) => {
    return (
        <div className={`message-container ${isUser ? 'user-message' : 'ai-message'}`}>
            {text}
        </div>
    );
};

export default MessageComponent;