import React, { useState, useEffect, useRef } from 'react';
import { User, Tenant } from '../types';
import { Mic, MicOff, Volume2, VolumeX, X, Sparkles, Radio, CheckCircle, Shield } from 'lucide-react';

interface VoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  tenant: Tenant | null;
}

export const VoiceModal: React.FC<VoiceModalProps> = ({
  isOpen,
  onClose,
  user,
  tenant,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastResponse, setLastResponse] = useState('');
  const [citations, setCitations] = useState<{ title: string; snippet: string }[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [muted, setMuted] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!isOpen) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      window.speechSynthesis?.cancel();
      return;
    }

    // Connect WebSocket to /live-voice
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/live-voice`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnectionStatus('connected');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'voice_response') {
          setLastResponse(data.text);
          setCitations(data.citations || []);
          setIsListening(false);

          // Speak response using browser speech synthesis
          if (!muted && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(data.text);
            utterance.rate = 1.05;
            utterance.pitch = 1.0;
            utterance.onstart = () => setIsSpeaking(true);
            utterance.onend = () => setIsSpeaking(false);
            window.speechSynthesis.speak(utterance);
          }
        }
      } catch (err) {
        console.error('WS parse error:', err);
      }
    };

    ws.onerror = () => {
      setConnectionStatus('error');
    };

    // Initialize speech recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (event: any) => {
        const text = Array.from(event.results)
          .map((res: any) => res[0].transcript)
          .join('');
        setTranscript(text);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }

    return () => {
      ws.close();
      window.speechSynthesis?.cancel();
    };
  }, [isOpen]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      window.speechSynthesis?.cancel();
      setIsSpeaking(false);
      setTranscript('');
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (err) {
        console.warn('Speech recognition start:', err);
      }
    }
  };

  const handleSendVoiceQuery = (queryText: string) => {
    if (!queryText.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    wsRef.current.send(JSON.stringify({
      type: 'voice_query',
      text: queryText,
      tenantId: user.tenantId,
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-6 text-slate-100 relative overflow-hidden">
        {/* Glow background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 relative z-10">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white">Live Voice Conversation</h3>
                <span className="px-1.5 py-0.5 text-[9px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800 rounded">
                  gemini-3.8-live
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Grounded real-time spoken intelligence for {tenant ? tenant.name : user.tenantId}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Central Audio Wave Visualization */}
        <div className="flex flex-col items-center justify-center py-6 space-y-4 relative z-10">
          <button
            type="button"
            onClick={toggleListening}
            className={`w-24 h-24 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
              isListening
                ? 'bg-rose-600 shadow-rose-600/50 scale-105 animate-pulse ring-4 ring-rose-400/30'
                : isSpeaking
                ? 'bg-cyan-600 shadow-cyan-600/50 ring-4 ring-cyan-400/30'
                : 'bg-slate-800 hover:bg-slate-750 border border-slate-700'
            }`}
          >
            {isListening ? (
              <Mic className="w-10 h-10 text-white" />
            ) : isSpeaking ? (
              <Volume2 className="w-10 h-10 text-white animate-bounce" />
            ) : (
              <Mic className="w-10 h-10 text-cyan-400" />
            )}
          </button>

          <div className="text-center">
            <span className="text-xs font-semibold text-slate-200 block">
              {isListening
                ? 'Listening... Speak your question now'
                : isSpeaking
                ? 'Gemini 3.8 Live is speaking...'
                : 'Click the microphone to start speaking'}
            </span>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              Strictly queries your company's authorized knowledge base
            </span>
          </div>

          {/* Animated voice frequency bars */}
          <div className="flex items-center space-x-1 h-6">
            {[40, 70, 95, 60, 85, 45, 90, 75, 55, 35].map((h, idx) => (
              <div
                key={idx}
                className={`w-1 rounded-full transition-all duration-150 ${
                  isListening
                    ? 'bg-rose-400'
                    : isSpeaking
                    ? 'bg-cyan-400'
                    : 'bg-slate-700'
                }`}
                style={{
                  height: (isListening || isSpeaking) ? `${Math.max(8, Math.round(h * Math.random()))}px` : '6px',
                }}
              />
            ))}
          </div>
        </div>

        {/* Live Speech Transcript & Response Preview */}
        <div className="space-y-3 relative z-10">
          {/* Quick Voice / Text Input */}
          <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 rounded-xl p-1.5">
            <input
              type="text"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Speak or type your question for Gemini 3.8 Live..."
              className="flex-1 bg-transparent px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && transcript.trim()) {
                  handleSendVoiceQuery(transcript);
                }
              }}
            />
            <button
              type="button"
              onClick={() => handleSendVoiceQuery(transcript)}
              disabled={!transcript.trim()}
              className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg disabled:opacity-40 transition-colors"
            >
              Ask Voice
            </button>
          </div>

          {lastResponse && (
            <div className="p-3.5 rounded-xl bg-slate-850 border border-slate-750 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-cyan-400 uppercase font-semibold flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 mr-1" />
                  <span>Gemini 3.8 Live Response:</span>
                </span>
                <button
                  onClick={() => setMuted(!muted)}
                  className="text-slate-400 hover:text-slate-200 text-xs flex items-center space-x-1"
                >
                  {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  <span>{muted ? 'Unmute' : 'Mute'}</span>
                </button>
              </div>
              <p className="text-slate-200 leading-relaxed">{lastResponse}</p>

              {citations.length > 0 && (
                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                  <span className="font-semibold text-slate-300">Grounded Source: </span>
                  {citations[0].title}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Voice Prompt Suggestions */}
        <div className="border-t border-slate-800 pt-3 relative z-10">
          <span className="text-[11px] text-slate-400 uppercase font-semibold block mb-2">Try asking:</span>
          <div className="flex flex-wrap gap-1.5">
            {[
              'What are the Project Falcon specs?',
              'What is the daily per diem meal allowance?',
              'What is the emergency safety protocol?',
            ].map((suggest, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setTranscript(suggest);
                  handleSendVoiceQuery(suggest);
                }}
                className="px-2.5 py-1 bg-slate-850 hover:bg-slate-800 text-slate-300 text-[11px] rounded-lg border border-slate-750 transition-colors"
              >
                "{suggest}"
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800 relative z-10">
          <span className="flex items-center space-x-1">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span>Encrypted Audio Channel</span>
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium"
          >
            Close Voice Chat
          </button>
        </div>
      </div>
    </div>
  );
};
