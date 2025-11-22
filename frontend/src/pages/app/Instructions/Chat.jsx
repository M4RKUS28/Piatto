import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PiMicrophone } from 'react-icons/pi';
import { useTranslation } from 'react-i18next';
import { getPromptHistory, askCookingQuestion } from '../../../api/cookingApi';
import { unlockAudio } from '../../../utils/audioContext';

/**
 * Chat component - AI chat functionality for cooking steps
 */
const Chat = ({ cookingSessionId, voiceAssistant, voiceAssistantBusy }) => {
  const { t } = useTranslation('instructions');
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input field when chat opens
  useEffect(() => {
    // Use setTimeout to ensure focus happens after all DOM updates
    const timer = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Load chat history on mount
  useEffect(() => {
    const loadHistory = async () => {
      if (!cookingSessionId) return;

      setIsLoading(true);
      setError(null);

      try {
        const history = await getPromptHistory(cookingSessionId);

        // Transform history into messages array
        // Format: [user1, ai1, user2, ai2, ...]
        const chatMessages = [];
        const maxLength = Math.max(
          history.prompts?.length || 0,
          history.responses?.length || 0
        );

        for (let i = 0; i < maxLength; i++) {
          if (history.prompts[i]) {
            chatMessages.push({
              type: 'user',
              text: history.prompts[i],
              timestamp: Date.now() - (maxLength - i) * 1000
            });
          }
          if (history.responses[i]) {
            chatMessages.push({
              type: 'ai',
              text: history.responses[i],
              timestamp: Date.now() - (maxLength - i - 0.5) * 1000
            });
          }
        }

        setMessages(chatMessages);
      } catch (err) {
        console.error('Failed to load chat history:', err);
        setError(t('chat.errorLoadingHistory', 'Error loading chat history'));
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, [cookingSessionId]);

  // Handle sending a message
  const handleSend = async () => {
    if (!inputValue.trim() || isSending || !cookingSessionId) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setIsSending(true);
    setError(null);

    // Add user message immediately
    setMessages(prev => [...prev, {
      type: 'user',
      text: userMessage,
      timestamp: Date.now()
    }]);

    try {
      // Send question to backend
      const response = await askCookingQuestion(cookingSessionId, userMessage);

      // Add AI response
      // The response contains the full history, so we take the last response
      if (response.responses && response.responses.length > 0) {
        const lastResponse = response.responses[response.responses.length - 1];
        setMessages(prev => [...prev, {
          type: 'ai',
          text: lastResponse,
          timestamp: Date.now()
        }]);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      setError(t('chat.errorSendingMessage', 'Error sending message'));
      // Remove the user message that failed
      setMessages(prev => prev.slice(0, -1));
      // Restore input value
      setInputValue(userMessage);
    } finally {
      setIsSending(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#035035] border-t-transparent mb-2"></div>
        <p className="text-sm text-[#2D2D2D] opacity-50">{t('chat.loading', 'Loading chat...')}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs mb-2">
          {error}
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto mb-3 space-y-3">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[#2D2D2D] opacity-50">
            <p className="text-sm text-center">
              {t('chat.emptyPrompt', 'Ask a question about this step!')}<br />
              {t('chat.emptyDescription', 'The AI assistant is happy to help.')}
            </p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                  message.type === 'user'
                    ? 'bg-[#035035] text-white rounded-br-sm'
                    : 'bg-[#F5F5F5] text-[#2D2D2D] rounded-bl-sm'
                }`}
              >
                {message.type === 'ai' ? (
                  <ReactMarkdown
                    className="markdown-content text-sm leading-relaxed text-inherit break-words"
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: (props) => <p className="mb-2 last:mb-0" {...props} />,
                      ul: (props) => <ul className="list-disc pl-5 mb-2 last:mb-0" {...props} />,
                      ol: (props) => <ol className="list-decimal pl-5 mb-2 last:mb-0" {...props} />,
                      li: (props) => <li className="mb-1 last:mb-0" {...props} />,
                      code: ({ inline, className, children, ...props }) => (
                        <code
                          className={`${inline ? 'px-1 py-0.5 rounded-md bg-[#ECECEC] text-[#1F1F1F]' : 'block bg-[#1F1F1F] text-white text-xs rounded-lg p-3 overflow-x-auto'} ${className || ''}`.trim()}
                          {...props}
                        >
                          {children}
                        </code>
                      ),
                      a: ({ href, ...props }) => (
                        <a
                          className="text-[#035035] underline break-words"
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          {...props}
                        />
                      )
                    }}
                  >
                    {message.text}
                  </ReactMarkdown>
                ) : (
                  <p className="whitespace-pre-wrap break-words">{message.text}</p>
                )}
              </div>
            </div>
          ))
        )}
        {isSending && (
          <div className="flex justify-start">
            <div className="bg-[#F5F5F5] px-3 py-2 rounded-2xl rounded-bl-sm">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-[#035035] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-[#035035] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-[#035035] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="flex gap-2 pt-3 border-t border-gray-200">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={t('chat.inputPlaceholder', 'Ask a question...')}
          disabled={isSending}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#035035] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        <button
          onClick={handleSend}
          disabled={!inputValue.trim() || isSending}
          className="px-4 py-2 bg-[#035035] hover:bg-[#046847] text-white rounded-full text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#035035]"
        >
          {isSending ? '...' : t('chat.send', 'Send')}
        </button>
        {voiceAssistant && (
          <button
            onClick={() => {
              unlockAudio().catch(() => {});
              voiceAssistant.startRecording?.();
            }}
            disabled={voiceAssistantBusy}
            className="w-10 h-10 flex items-center justify-center bg-[#035035] hover:bg-[#046847] text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#035035]"
            title={t('chat.startRecording', 'Start voice recording')}
          >
            <PiMicrophone className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Chat;
