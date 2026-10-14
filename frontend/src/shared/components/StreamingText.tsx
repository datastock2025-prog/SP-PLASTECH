import React, { useEffect, useState, useRef } from 'react';
import { SanitizedHtml } from './SanitizedHtml';

export interface StreamingTextProps {
  /** Static text or dynamically fed text to stream with typewriter effect */
  text?: string;
  /** Optional Server-Sent Events (SSE) stream endpoint */
  sseUrl?: string;
  /** Optional WebSocket stream URL */
  wsUrl?: string;
  /** Optional ReadableStream for fetch-based AI streaming responses */
  stream?: ReadableStream<Uint8Array | string> | null;
  /** Speed of typewriter token generation in milliseconds (default: 18ms) */
  speedMs?: number;
  /** Tokens/characters typed per tick (default: 2) */
  chunkSize?: number;
  /** ClassName styling for text container */
  className?: string;
  /** Callback fired when stream or typewriter completes */
  onComplete?: (fullText: string) => void;
  /** Callback fired on each newly appended token */
  onToken?: (token: string, currentFullText: string) => void;
  /** Callback fired on connection error */
  onError?: (err: Error | Event) => void;
  /** Show typewriter blinking cursor */
  showCursor?: boolean;
  /** Cursor color class (default: bg-[#E8622C]) */
  cursorClassName?: string;
  /** Pause the typewriter animation */
  paused?: boolean;
  /** Tag container to render (default: 'span') */
  tag?: 'div' | 'span' | 'p' | 'article' | 'section';
}

/**
 * AI Stack Directive Component: Streaming UI
 * Renders AI text token-by-token with typewriter pacing, supporting SSE, WebSockets, ReadableStreams, or text feeds.
 * Sanitized via DOMPurify to guarantee XSS prevention.
 */
export const StreamingText: React.FC<StreamingTextProps> = ({
  text = '',
  sseUrl,
  wsUrl,
  stream,
  speedMs = 18,
  chunkSize = 2,
  className = '',
  onComplete,
  onToken,
  onError,
  showCursor = true,
  cursorClassName = 'bg-[#E8622C]',
  paused = false,
  tag = 'span',
}) => {
  const [displayedText, setDisplayedText] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [cursorVisible, setCursorVisible] = useState<boolean>(true);

  // Target text buffer that the typewriter drains towards
  const targetTextRef = useRef<string>('');
  const displayedTextRef = useRef<string>('');
  const isStreamingRef = useRef<boolean>(false);
  const onCompleteRef = useRef(onComplete);
  const onTokenRef = useRef(onToken);
  const onErrorRef = useRef(onError);

  onCompleteRef.current = onComplete;
  onTokenRef.current = onToken;
  onErrorRef.current = onError;

  displayedTextRef.current = displayedText;
  isStreamingRef.current = isStreaming;

  // Blinking cursor animation
  useEffect(() => {
    if (!showCursor || !isStreaming) return;
    const interval = setInterval(() => {
      setCursorVisible((prev) => !prev);
    }, 450);
    return () => clearInterval(interval);
  }, [showCursor, isStreaming]);

  // Smooth Typewriter Loop: Drains targetTextRef into displayedText at speedMs intervals
  useEffect(() => {
    if (paused) return;

    const interval = setInterval(() => {
      const currentLen = displayedTextRef.current.length;
      const targetLen = targetTextRef.current.length;

      if (currentLen < targetLen) {
        const step = Math.min(chunkSize, targetLen - currentLen);
        const nextChars = targetTextRef.current.slice(currentLen, currentLen + step);
        const updated = displayedTextRef.current + nextChars;
        setDisplayedText(updated);
        onTokenRef.current?.(nextChars, updated);
      } else if (currentLen >= targetLen && isStreamingRef.current && targetLen > 0) {
        // If external stream has completed and all characters are drained
        if (!sseUrl && !wsUrl && !stream) {
          setIsStreaming(false);
          onCompleteRef.current?.(targetTextRef.current);
        }
      }
    }, speedMs);

    return () => clearInterval(interval);
  }, [paused, speedMs, chunkSize, sseUrl, wsUrl, stream]);

  // 1. SSE Stream Handling
  useEffect(() => {
    if (!sseUrl) return;

    setIsStreaming(true);
    setDisplayedText('');
    targetTextRef.current = '';

    const eventSource = new EventSource(sseUrl);

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        const token = data.token || data.content || data.chunk || data.delta?.text || '';
        targetTextRef.current += token;
      } catch {
        targetTextRef.current += event.data;
      }
    };

    eventSource.onmessage = handleMessage;
    eventSource.addEventListener('token', handleMessage);
    eventSource.addEventListener('chunk', handleMessage);
    eventSource.addEventListener('delta', handleMessage);

    const handleDone = () => {
      setIsStreaming(false);
      eventSource.close();
      onCompleteRef.current?.(targetTextRef.current);
    };

    eventSource.addEventListener('done', handleDone);
    eventSource.addEventListener('complete', handleDone);

    eventSource.onerror = (err) => {
      setIsStreaming(false);
      eventSource.close();
      onErrorRef.current?.(err);
    };

    return () => {
      eventSource.close();
    };
  }, [sseUrl]);

  // 2. WebSocket Stream Handling
  useEffect(() => {
    if (!wsUrl || sseUrl) return;

    setIsStreaming(true);
    setDisplayedText('');
    targetTextRef.current = '';

    let socket: WebSocket | null = null;
    try {
      socket = new WebSocket(wsUrl);

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'complete' || data.done === true) {
            setIsStreaming(false);
            socket?.close();
            onCompleteRef.current?.(targetTextRef.current);
            return;
          }
          const token = data.token || data.content || data.chunk || '';
          targetTextRef.current += token;
        } catch {
          targetTextRef.current += event.data;
        }
      };

      socket.onerror = (err) => {
        setIsStreaming(false);
        onErrorRef.current?.(err);
      };

      socket.onclose = () => {
        setIsStreaming(false);
      };
    } catch (err: any) {
      setIsStreaming(false);
      onErrorRef.current?.(err);
    }

    return () => {
      socket?.close();
    };
  }, [wsUrl, sseUrl]);

  // 3. ReadableStream Handling (Fetch SSE / HTTP Chunked)
  useEffect(() => {
    if (!stream || sseUrl || wsUrl) return;

    setIsStreaming(true);
    setDisplayedText('');
    targetTextRef.current = '';
    let isCancelled = false;

    const readStream = async () => {
      const reader = stream.getReader();
      const decoder = new TextDecoder();

      try {
        while (!isCancelled) {
          const { done, value } = await reader.read();
          if (done) break;

          let chunk = '';
          if (typeof value === 'string') {
            chunk = value;
          } else if (value instanceof Uint8Array) {
            chunk = decoder.decode(value, { stream: true });
          }

          if (chunk.startsWith('data:')) {
            const lines = chunk.split('\n');
            for (const line of lines) {
              if (line.startsWith('data:')) {
                const content = line.slice(5).trim();
                if (content === '[DONE]') break;
                try {
                  const parsed = JSON.parse(content);
                  targetTextRef.current += parsed.token || parsed.content || parsed.text || '';
                } catch {
                  targetTextRef.current += content;
                }
              }
            }
          } else {
            targetTextRef.current += chunk;
          }
        }
        if (!isCancelled) {
          setIsStreaming(false);
          onCompleteRef.current?.(targetTextRef.current);
        }
      } catch (err: any) {
        if (!isCancelled) {
          setIsStreaming(false);
          onErrorRef.current?.(err);
        }
      } finally {
        reader.releaseLock();
      }
    };

    readStream();

    return () => {
      isCancelled = true;
    };
  }, [stream, sseUrl, wsUrl]);

  // 4. Static / Dynamic Text Feed Handling
  useEffect(() => {
    if (sseUrl || wsUrl || stream) return;

    if (!text) {
      setDisplayedText('');
      targetTextRef.current = '';
      setIsStreaming(false);
      return;
    }

    targetTextRef.current = text;
    setIsStreaming(true);
  }, [text, sseUrl, wsUrl, stream]);

  const formattedHtml = displayedText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br/>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 rounded bg-black/10 font-mono text-[11px]">$1</code>');

  return (
    <div
      role="status"
      aria-live="polite"
      className={`relative inline-block font-sans ${className}`}
    >
      <SanitizedHtml html={formattedHtml} tag={tag} />
      {showCursor && isStreaming && (
        <span
          aria-hidden="true"
          className={`inline-block w-1.5 h-4 ml-0.5 align-middle rounded-xs ${cursorClassName} ${
            cursorVisible ? 'opacity-100' : 'opacity-0'
          } transition-opacity duration-75`}
        />
      )}
    </div>
  );
};

export default StreamingText;
