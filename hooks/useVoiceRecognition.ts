import { useRef, useCallback, useEffect, useState } from 'react';

interface VoiceState {
  isListening: boolean;
  isSupported: boolean;
  lastCommand: string | null;
  confidence: number;
  error: string | null;
}

interface VoiceCommands {
  nextPage: () => void;
  prevPage: () => void;
  toggleMarks: () => void;
}

export const useVoiceRecognition = (commands: VoiceCommands) => {
  const [voiceState, setVoiceState] = useState<VoiceState>({
    isListening: false,
    isSupported: typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window),
    lastCommand: null,
    confidence: 0,
    error: null,
  });

  const recognitionRef = useRef<any>(null);
  const commandTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Define voice commands and their variations
  const commandPatterns = {
    next: [
      'next', 'next page', 'forward', 'go forward', 'advance', 
      'turn page', 'page forward', 'continue', 'proceed'
    ],
    prev: [
      'previous', 'prev', 'back', 'go back', 'previous page', 
      'page back', 'return', 'backward'
    ],
    toggleMarks: [
      'toggle marks', 'show marks', 'hide marks', 'marks', 
      'toggle view', 'switch view', 'change view'
    ]
  };

  // Initialize speech recognition
  const initializeRecognition = useCallback(() => {
    if (!voiceState.isSupported) return null;

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 3;

    recognition.onstart = () => {
      setVoiceState(prev => ({ 
        ...prev, 
        isListening: true, 
        error: null 
      }));
    };

    recognition.onend = () => {
      setVoiceState(prev => ({ 
        ...prev, 
        isListening: false 
      }));
      
      // Auto-restart if it was stopped unexpectedly
      if (recognitionRef.current) {
        setTimeout(() => {
          try {
            recognition.start();
          } catch (e) {
            console.log('Recognition restart failed:', e);
          }
        }, 1000);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setVoiceState(prev => ({ 
        ...prev, 
        error: `Recognition error: ${event.error}`,
        isListening: false 
      }));
    };

    recognition.onresult = (event: any) => {
      const results = event.results;
      const lastResult = results[results.length - 1];
      
      if (lastResult.isFinal) {
        const transcript = lastResult[0].transcript.toLowerCase().trim();
        const confidence = lastResult[0].confidence;
        
        console.log('Voice command heard:', transcript, 'Confidence:', confidence);
        
        setVoiceState(prev => ({ 
          ...prev, 
          lastCommand: transcript,
          confidence: confidence * 100
        }));

        // Clear previous command timeout
        if (commandTimeoutRef.current) {
          clearTimeout(commandTimeoutRef.current);
        }

        // Process the command
        processVoiceCommand(transcript, confidence);

        // Clear the last command after 3 seconds
        commandTimeoutRef.current = setTimeout(() => {
          setVoiceState(prev => ({ ...prev, lastCommand: null, confidence: 0 }));
        }, 3000);
      }
    };

    return recognition;
  }, [voiceState.isSupported]);

  // Process voice commands
  const processVoiceCommand = useCallback((transcript: string, confidence: number) => {
    const minConfidence = 0.6; // 60% confidence threshold
    
    if (confidence < minConfidence) {
      console.log('Command confidence too low:', confidence);
      return;
    }

    const normalizedTranscript = transcript.toLowerCase().trim();

    // Check for next page commands
    if (commandPatterns.next.some(pattern => 
      normalizedTranscript.includes(pattern) || 
      normalizedTranscript === pattern
    )) {
      console.log('Executing: Next Page');
      commands.nextPage();
      return;
    }

    // Check for previous page commands
    if (commandPatterns.prev.some(pattern => 
      normalizedTranscript.includes(pattern) || 
      normalizedTranscript === pattern
    )) {
      console.log('Executing: Previous Page');
      commands.prevPage();
      return;
    }

    // Check for toggle marks commands
    if (commandPatterns.toggleMarks.some(pattern => 
      normalizedTranscript.includes(pattern) || 
      normalizedTranscript === pattern
    )) {
      console.log('Executing: Toggle Marks');
      commands.toggleMarks();
      return;
    }

    console.log('No matching command found for:', transcript);
  }, [commands]);

  // Start voice recognition
  const startListening = useCallback(() => {
    if (!voiceState.isSupported) {
      setVoiceState(prev => ({ 
        ...prev, 
        error: 'Speech recognition not supported in this browser' 
      }));
      return;
    }

    if (!recognitionRef.current) {
      recognitionRef.current = initializeRecognition();
    }

    try {
      recognitionRef.current?.start();
    } catch (e) {
      console.error('Failed to start recognition:', e);
      setVoiceState(prev => ({ 
        ...prev, 
        error: 'Failed to start voice recognition' 
      }));
    }
  }, [voiceState.isSupported, initializeRecognition]);

  // Stop voice recognition
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    if (commandTimeoutRef.current) {
      clearTimeout(commandTimeoutRef.current);
      commandTimeoutRef.current = null;
    }

    setVoiceState(prev => ({ 
      ...prev, 
      isListening: false,
      lastCommand: null,
      confidence: 0
    }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return {
    voiceState,
    startListening,
    stopListening,
    commandPatterns, // Export for display purposes
  };
};