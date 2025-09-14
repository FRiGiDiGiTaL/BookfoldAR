import React from 'react';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';

interface VoiceControlProps {
  onNextPage: () => void;
  onPrevPage: () => void;
  onToggleMarks: () => void;
  onStatusMessage: (message: string) => void;
}

export const VoiceControl: React.FC<VoiceControlProps> = ({
  onNextPage,
  onPrevPage,
  onToggleMarks,
  onStatusMessage,
}) => {
  // Voice commands with status messages
  const voiceCommands = {
    nextPage: () => {
      onNextPage();
      onStatusMessage("🎤 Voice command: Next page");
    },
    prevPage: () => {
      onPrevPage();
      onStatusMessage("🎤 Voice command: Previous page");
    },
    toggleMarks: () => {
      onToggleMarks();
      onStatusMessage("🎤 Voice command: Toggle marks");
    },
  };

  const { voiceState, startListening, stopListening, commandPatterns } = 
    useVoiceRecognition(voiceCommands);

  if (!voiceState.isSupported) {
    return (
      <div className="bg-gray-700/50 border border-gray-600 rounded-md p-3 mb-4">
        <div className="text-orange-400 text-sm">
          🎤 Voice recognition not supported in this browser
        </div>
        <div className="text-xs text-gray-400 mt-1">
          Try Chrome, Edge, or Safari for voice control
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-700/50 border border-gray-600 rounded-md p-3 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-300 flex items-center">
          🎤 Voice Control
        </h3>
        <button
          onClick={voiceState.isListening ? stopListening : startListening}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            voiceState.isListening 
              ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse' 
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {voiceState.isListening ? '🔴 Stop' : '🎤 Start'}
        </button>
      </div>

      {/* Status Display */}
      <div className="mb-3">
        <div className="flex items-center space-x-2 text-sm">
          <span className="text-gray-400">Status:</span>
          <span className={`font-medium ${
            voiceState.isListening ? 'text-green-400' : 'text-gray-500'
          }`}>
            {voiceState.isListening ? '🟢 Listening...' : '⚫ Stopped'}
          </span>
        </div>
        
        {voiceState.lastCommand && (
          <div className="mt-2 p-2 bg-blue-900/30 border border-blue-700 rounded">
            <div className="text-blue-300 text-sm font-medium">
              Last Command: "{voiceState.lastCommand}"
            </div>
            <div className="text-blue-400 text-xs">
              Confidence: {voiceState.confidence.toFixed(0)}%
            </div>
          </div>
        )}

        {voiceState.error && (
          <div className="mt-2 p-2 bg-red-900/30 border border-red-700 rounded">
            <div className="text-red-300 text-sm">
              ⚠️ {voiceState.error}
            </div>
          </div>
        )}
      </div>

      {/* Command Reference */}
      <div className="text-xs text-gray-400">
        <div className="font-medium mb-2">Available Commands:</div>
        <div className="space-y-1">
          <div>
            <span className="text-green-400">Next Page:</span> 
            <span className="ml-2">"next", "next page", "forward", "advance"</span>
          </div>
          <div>
            <span className="text-blue-400">Previous Page:</span>
            <span className="ml-2">"previous", "back", "go back"</span>
          </div>
          <div>
            <span className="text-yellow-400">Toggle Marks:</span>
            <span className="ml-2">"toggle marks", "show marks", "marks"</span>
          </div>
        </div>
        
        {voiceState.isListening && (
          <div className="mt-2 text-center text-cyan-400 animate-pulse">
            🎤 Say a command clearly...
          </div>
        )}
      </div>
    </div>
  );
};