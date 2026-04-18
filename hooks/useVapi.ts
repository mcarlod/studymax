import {IBook, Messages} from "@/types";
import {useAuth} from "@clerk/nextjs"
import {useState, useRef, useEffect, useCallback} from "react";
import {ASSISTANT_ID, DEFAULT_VOICE, VOICE_SETTINGS} from "@/lib/constants";
import {startVoiceSession, endVoiceSession} from "@/lib/actions/session.actions";
import Vapi from '@vapi-ai/web';
import {getVoice} from "@/lib/utils";
import {PLAN_LIMITS, getPlanFromClerk} from "@/lib/subscription-constants";
import {useRouter} from "next/navigation";

export type CallStatus = 'idle' | 'connecting' | 'starting' | 'listening' | 'thinking' | 'speaking';

const useLatestRef = <T>(value: T) => {
    const ref = useRef(value);
    useEffect(() => {
        ref.current = value;
    }, [value]);
    return ref;
}

const VAPI_API_KEY = process.env.NEXT_PUBLIC_VAPI_API_KEY?.startsWith('=') 
    ? process.env.NEXT_PUBLIC_VAPI_API_KEY.slice(1) 
    : process.env.NEXT_PUBLIC_VAPI_API_KEY;

const TIMER_INTERVAL_MS = 1000;
const SECONDS_PER_MINUTE = 60;
const TIME_WARNING_THRESHOLD = 60;

let vapi: InstanceType<typeof Vapi>;

function getVapi() {
    if (!vapi) {
        if (!VAPI_API_KEY) {
            throw new Error("No VAPI API key provided");
        }

        vapi = new Vapi(VAPI_API_KEY);
    }

    return vapi;
}

export function useVapi(book: IBook) {
    const { userId, has } = useAuth();
    const router = useRouter();

    const plan = getPlanFromClerk(has);
    const limits = PLAN_LIMITS[plan];

    const [status, setStatus] = useState<CallStatus>('idle');
    const [messages, setMessages] = useState<Messages[]>([]);
    const [currentMessage, setCurrentMessage] = useState('');
    const [currentUserMessage, setCurrentUserMessage] = useState('');
    const [duration, setDuration] = useState(0);
    const [limitError, setLimitError] = useState<string | null>(null);
    const [isBillingError, setIsBillingError] = useState(false);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number | null>(null);
    const sessionIdRef = useRef<string | null>(null);
    const isStoppingRef = useRef(false);

    // Finalize session exactly once
    const finalizeVoiceSession = useCallback(async (durationSeconds: number) => {
        const sessionId = sessionIdRef.current;
        if (!sessionId) return;
        
        sessionIdRef.current = null; // Mark as handled
        console.log("Finalizing voice session:", sessionId, "duration:", durationSeconds);
        
        try {
            await endVoiceSession(sessionId, durationSeconds);
        } catch (err) {
            console.error('Failed to end voice session:', err);
        }
    }, []);

    // Keep refs in sync with latest values for use in callbacks
    const maxDurationSeconds = limits.maxDurationPerSession * 60;
    const maxDurationRef = useLatestRef(maxDurationSeconds);
    const durationRef = useLatestRef(duration);
    const finalizeRef = useLatestRef(finalizeVoiceSession);
    const voice = book.persona || DEFAULT_VOICE;

    console.log("VAPI KEY:", VAPI_API_KEY);
    console.log("ASSISTANT:", ASSISTANT_ID);

    // Set up Vapi event listeners
    useEffect(() => {
        const currentDurationRef = durationRef;
        const currentMaxDurationRef = maxDurationRef;

        console.log("Registering Vapi handlers");

        const handlers = {
            'call-start': () => {
                isStoppingRef.current = false;
                setStatus('starting'); // AI speaks first, wait for it
                setCurrentMessage('');
                setCurrentUserMessage('');

                // Start duration timer
                startTimeRef.current = Date.now();
                setDuration(0);
                timerRef.current = setInterval(() => {
                    if (startTimeRef.current) {
                        const newDuration = Math.floor((Date.now() - startTimeRef.current) / TIMER_INTERVAL_MS);
                        setDuration(newDuration);

                        // Check duration limit
                        if (newDuration >= currentMaxDurationRef.current) {
                            if (!isStoppingRef.current) {
                                isStoppingRef.current = true;
                                if (timerRef.current) {
                                    clearInterval(timerRef.current);
                                    timerRef.current = null;
                                }
                                getVapi().stop();
                                setLimitError(
                                    `Session time limit (${Math.floor(
                                        currentMaxDurationRef.current / SECONDS_PER_MINUTE,
                                    )} minutes) reached. Redirecting to home...`,
                                );
                                setTimeout(() => {
                                    router.push('/');
                                }, 3000);
                            }
                        }
                    }
                }, TIMER_INTERVAL_MS);
            },

            'call-end': () => {
                // Don't reset isStoppingRef here - delayed events may still fire
                setStatus('idle');
                setCurrentMessage('');
                setCurrentUserMessage('');

                // Stop timer
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                }

                // End session tracking
                finalizeRef.current(currentDurationRef.current);

                startTimeRef.current = null;
            },

            'speech-start': () => {
                if (!isStoppingRef.current) {
                    setStatus('speaking');
                }
            },
            'speech-end': () => {
                if (!isStoppingRef.current) {
                    // After AI finishes speaking, we check if it's because it's waiting for a tool or if it's done.
                    // If it was speaking and now stopped, it might be listening to the user.
                    // But if it just said "let me check", it will move to 'thinking' soon.
                    // For now, we set it to listening, but the message handler will override it if thinking starts.
                    setStatus('listening');
                }
            },

            message: (message: any) => {
                // Handle different message types from Vapi
                if (message.type === 'transcript') {
                    // User finished speaking → AI is thinking
                    if (message.role === 'user' && message.transcriptType === 'final') {
                        if (!isStoppingRef.current) {
                            setStatus('thinking');
                        }
                        setCurrentUserMessage('');
                    }

                    // Partial user transcript → show real-time typing
                    if (message.role === 'user' && message.transcriptType === 'partial') {
                        setCurrentUserMessage(message.transcript);
                        return;
                    }

                    // Partial AI transcript → show word-by-word
                    if (message.role === 'assistant' && message.transcriptType === 'partial') {
                        setCurrentMessage(message.transcript);
                        return;
                    }

                    // Final transcript → add to messages
                    if (message.transcriptType === 'final') {
                        if (message.role === 'assistant') setCurrentMessage('');
                        if (message.role === 'user') setCurrentUserMessage('');

                        setMessages((prev) => {
                            const lastMessage = prev[prev.length - 1];
                            const isDupe = lastMessage && lastMessage.role === message.role && lastMessage.content === message.transcript;
                            return isDupe ? prev : [...prev, { role: message.role, content: message.transcript }];
                        });
                    }
                }

                // AI is calling a tool → thinking
                if (message.type === 'tool-calls') {
                    if (!isStoppingRef.current) {
                        setStatus('thinking');
                    }
                }
            },

            error: (error: any) => {
                console.error('Vapi error detail:', {
                    message: error.message,
                    name: error.name,
                    stack: error.stack,
                    ...error
                });
                // Don't reset isStoppingRef here - delayed events may still fire
                setStatus('idle');
                setCurrentMessage('');
                setCurrentUserMessage('');

                // Stop timer on error
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                }

                // End session tracking on error
                if (sessionIdRef.current) {
                    endVoiceSession(sessionIdRef.current, durationRef.current).catch((err) =>
                        console.error('Failed to end voice session on error:', err),
                    );
                    sessionIdRef.current = null;
                }

                // Show user-friendly error message
                const errorMessage = error.message?.toLowerCase() || '';
                if (errorMessage.includes('timeout') || errorMessage.includes('silence')) {
                    setLimitError('Session ended due to inactivity. Click the mic to start again.');
                } else if (errorMessage.includes('network') || errorMessage.includes('connection')) {
                    setLimitError('Connection lost. Please check your internet and try again.');
                } else {
                    setLimitError('Session ended unexpectedly. Click the mic to start again.');
                }

                startTimeRef.current = null;
            },
        };

        // Register all handlers
        Object.entries(handlers).forEach(([event, handler]) => {
            getVapi().on(event as keyof typeof handlers, handler as () => void);
        });

        return () => {
            console.log("Cleaning up Vapi handlers");
            // End active session on unmount
            if (sessionIdRef.current) {
                getVapi().stop();
                finalizeRef.current(currentDurationRef.current);
            }
            // Cleanup handlers
            Object.entries(handlers).forEach(([event, handler]) => {
                getVapi().off(event as keyof typeof handlers, handler as () => void);
            });
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [book.title, book.author, book._id, voice, durationRef, maxDurationRef]);

    const start = useCallback(async () => {
        if (!userId) {
            setLimitError('Please sign in to start a voice session.');
            return;
        }

        setLimitError(null);
        setIsBillingError(false);
        setStatus('connecting');

        try {
            // Check session limits and create session record
            const result = await startVoiceSession(book._id);

            if (!result.success) {
                setLimitError(result.error || 'Session limit reached. Please upgrade your plan.');
                setIsBillingError(!!result.isBillingError);
                setStatus('idle');
                return;
            }

            sessionIdRef.current = result.sessionId || null;
            // Note: Server-returned maxDurationMinutes is informational only
            // The actual limit is enforced by useLatestRef(limits.maxSessionMinutes * 60)

            const firstMessage = messages.length === 0
                ? `Hey, good to meet you. Quick question before we dive in - have you actually read ${book.title} yet, or are we starting fresh?`
                : undefined;

            // Map current messages to Vapi's expected format if history exists
            const modelMessages = messages.length > 0 
                ? messages.map(msg => ({
                    role: msg.role === 'user' ? 'user' : 'assistant',
                    content: msg.content
                }))
                : undefined;

            await getVapi().start(ASSISTANT_ID, {
                firstMessage,
                model: modelMessages ? {
                    messages: modelMessages
                } : undefined,
                variableValues: {
                    title: book.title,
                    author: book.author,
                    bookId: book._id.toString(),
                    userId: userId,
                },
                voice: {
                    provider: '11labs' as const,
                    voiceId: getVoice(voice).id,
                    model: 'eleven_turbo_v2_5' as const,
                    stability: VOICE_SETTINGS.stability,
                    similarityBoost: VOICE_SETTINGS.similarityBoost,
                    style: VOICE_SETTINGS.style,
                    useSpeakerBoost: VOICE_SETTINGS.useSpeakerBoost,
                },
            });
        } catch (err) {
            console.error('Failed to start call:', err);
            finalizeRef.current(0);
            setStatus('idle');
            setLimitError('Failed to start voice session. Please try again.');
        }
    }, [book._id, book.title, book.author, voice, userId, messages]);

    const stop = useCallback(() => {
        isStoppingRef.current = true;
        getVapi().stop();
    }, []);

    const clearError = useCallback(() => {
        setLimitError(null);
        setIsBillingError(false);
    }, []);

    const isActive =
        status === 'starting' ||
        status === 'listening' ||
        status === 'thinking' ||
        status === 'speaking';

    // Calculate remaining time
    const remainingSeconds = Math.max(0, maxDurationSeconds - duration);
    const showTimeWarning =
        isActive && remainingSeconds <= TIME_WARNING_THRESHOLD && remainingSeconds > 0;

    console.log("Vapi state:", { status, messagesCount: messages.length, duration });

    return {
        status,
        isActive,
        messages,
        currentMessage,
        currentUserMessage,
        duration,
        start,
        stop,
        limitError,
        isBillingError,
        clearError,
        maxDurationSeconds,
        remainingSeconds,
        showTimeWarning,
        isStopping: isStoppingRef.current,
    };
}

export default useVapi;