// components/ControlPanel.tsx - Updated with UserDashboard Integration
import React, { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import type {
  PageData,
  CalibrationData,
  Transform,
  MarkNavigation,
} from "../types";
import {
  CameraIcon,
  RulerIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  EyeIcon,
} from "./Icons";
import { GridControls } from "./GridLines";
import { PDFImport } from "./PDFImport";

// VoiceControl is client-only (microphone access), so load dynamically
const VoiceControl = dynamic(
  () => import("./VoiceControl").then(mod => ({ default: mod.VoiceControl })),
  { 
    ssr: false,
    loading: () => (
      <div className="glass-card rounded-lg p-4 text-center">
        <div className="text-gray-400 text-sm">Loading voice controls...</div>
      </div>
    )
  }
);

interface ControlPanelProps {
  isCameraActive: boolean;
  setIsCameraActive: (active: boolean) => void;
  pageData: PageData;
  setPageData: React.Dispatch<React.SetStateAction<PageData>>;
  calibrationData: CalibrationData;
  setCalibrationData: React.Dispatch<React.SetStateAction<CalibrationData>>;
  handleInstructionsTextChange: (text: string) => void;
  statusMessage: string;
  setStatusMessage: (message: string) => void;
  transform: Transform;
  setTransform: React.Dispatch<React.SetStateAction<Transform>>;
  markNavigation: MarkNavigation;
  currentMarksCm: number[];
  handleMarkNavigation: (action: "next" | "prev" | "toggleAll") => void;
  handleNextPage: () => void;
  handlePrevPage: () => void;
  onCalibrate: () => void;
  showGrid: boolean;
  setShowGrid: (show: boolean) => void;
  gridType: "rule-of-thirds" | "quarters" | "golden-ratio";
  setGridType: (type: "rule-of-thirds" | "quarters" | "golden-ratio") => void;
  gridOpacity: number;
  setGridOpacity: (opacity: number) => void;
}

interface CollapsibleSectionProps {
  stepNumber: number;
  title: string;
  instruction: string;
  isExpanded: boolean;
  onToggle: () => void;
  isComplete?: boolean;
  children: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  stepNumber,
  title,
  instruction,
  isExpanded,
  onToggle,
  isComplete = false,
  children,
}) => (
  <div className="mb-3 glass-card rounded-lg overflow-hidden shadow-lg">
    <button
      onClick={onToggle}
      className="w-full px-4 py-3 glass-button hover:glass-status-success transition-all duration-300 flex items-center justify-between text-left"
    >
      <div className="flex items-center">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/20 border border-blue-400/30 mr-3">
          <span className="text-blue-400 font-bold text-sm">{stepNumber}</span>
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-yellow-300 flex items-center justify-between">
            <span>{title}</span>
            {isComplete && (
              <span className="ml-2 text-green-400 text-sm animate-pulse">✨</span>
            )}
          </h2>
          <p className="text-xs text-blue-300 mt-1">{instruction}</p>
        </div>
      </div>
      <div className="ml-4 flex-shrink-0">
        {isExpanded ? (
          <ChevronUpIcon className="w-5 h-5 text-gray-400 transform transition-transform" />
        ) : (
          <ChevronDownIcon className="w-5 h-5 text-gray-400 transform transition-transform" />
        )}
      </div>
    </button>

    <div
      className={`transition-all duration-300 ease-in-out ${
        isExpanded ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
      } overflow-hidden`}
    >
      <div className="p-4 pt-2 glass-panel-dark">{children}</div>
    </div>
  </div>
);

const InputGroup: React.FC<{
  label: string;
  children: React.ReactNode;
  centered?: boolean;
}> = ({ label, children, centered = false }) => (
  <div className="mb-4">
    <label
      className={`block text-sm font-medium text-gray-300 mb-2 ${
        centered ? "text-center" : ""
      }`}
    >
      {label}
    </label>
    {children}
  </div>
);

const NumberInput: React.FC<{
  value: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  unit: string;
  placeholder?: string;
}> = ({ value, onChange, unit, placeholder }) => (
  <div className="flex items-center">
    <input
      type="number"
      value={value || ""}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full glass-input text-white focus:glass-status-success transition-all duration-300 rounded-md py-2 px-3"
      step="0.1"
      min="0.1"
    />
    <span className="ml-3 text-gray-400 font-medium">{unit}</span>
  </div>
);

// Enhanced button component with glassmorphism effects
const PressButton: React.FC<{
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  title?: string;
  variant?: "default" | "primary" | "success" | "warning";
}> = ({
  onClick,
  children,
  className = "",
  disabled = false,
  title,
  variant = "default",
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const handleMouseDown = () => setIsPressed(true);
  const handleMouseUp = () => setIsPressed(false);
  const handleMouseLeave = () => setIsPressed(false);

  const getVariantClasses = () => {
    switch (variant) {
      case "primary":
        return "glass-button border-blue-400/50 hover:glass-status-success";
      case "success":
        return "glass-status-success hover:border-green-300";
      case "warning":
        return "glass-status-warning hover:border-yellow-300";
      default:
        return "glass-button hover:bg-white/10";
    }
  };

  return (
    <button
      onClick={onClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      disabled={disabled}
      title={title}
      className={`transition-all duration-300 transform ${
        isPressed && !disabled ? "scale-95 brightness-125" : "hover:scale-105"
      } ${getVariantClasses()} ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      } ${className}`}
    >
      {children}
    </button>
  );
};

// Main ControlPanel Component
export const ControlPanel: React.FC<ControlPanelProps> = ({
  isCameraActive,
  setIsCameraActive,
  pageData,
  setPageData,
  calibrationData,
  setCalibrationData,
  handleInstructionsTextChange,
  statusMessage,
  setStatusMessage,
  transform,
  setTransform,
  markNavigation,
  currentMarksCm,
  handleMarkNavigation,
  handleNextPage,
  handlePrevPage,
  onCalibrate,
  showGrid,
  setShowGrid,
  gridType,
  setGridType,
  gridOpacity,
  setGridOpacity,
}) => {
  // State for raw input and formatted output
  const [rawInput, setRawInput] = useState('');
  const [formattedOutput, setFormattedOutput] = useState('');

  // Collapsible panel state - Step 1 starts expanded
  const [expandedPanels, setExpandedPanels] = useState<Record<number, boolean>>({
    1: true, // Book Dimensions starts expanded
    2: false,
    3: false,
    4: false, // Combined Page & Mark Navigation
    5: false, // PDF Import
    6: false  // Manual Marking Instructions
  });

  // Function to clean and format book folding input
  const cleanBookFoldingInput = useCallback((raw: string): string => {
    if (!raw || !raw.trim()) return '';
    
    const lines = raw.trim().split("\n");
    let result: string[] = [];
    let autoPage = 1;
    
    for (let line of lines) {
      line = line.trim();
      if (!line) continue;
      
      // Skip comment lines
      if (line.startsWith('#')) {
        result.push(line);
        continue;
      }
      
      // Remove common prefixes
      line = line.replace(/^(Page|Pg|P)\.?\s*/i, "");
      line = line.replace(/[:]/g, " "); // Replace colons with spaces
      
      // Try to extract explicit page number
      const pageMatch = line.match(/^(\d+)\s+(.*)$/);
      let measurements: string;
      let pageNumbers: string;
      
      if (pageMatch) {
        // Explicit page number found
        const pageNo = parseInt(pageMatch[1]);
        measurements = pageMatch[2];
        pageNumbers = pageNo + "-" + (pageNo + 1);
      } else {
        // No explicit page number, use auto-incrementing
        measurements = line;
        pageNumbers = autoPage + "-" + (autoPage + 1);
        autoPage += 2;
      }
      
      // Clean up measurements: normalize separators
      measurements = measurements
        .replace(/[|;]/g, ",")           // Replace pipes and semicolons with commas
        .replace(/\s+/g, " ")           // Multiple spaces to single space
        .replace(/,\s*,/g, ",")         // Remove double commas
        .replace(/,\s+/g, ", ")         // Normalize comma spacing
        .replace(/\s*,/g, ",")          // Remove space before comma
        .replace(/,/g, ", ")            // Add space after comma
        .replace(/,\s*$/, "")           // Remove trailing comma
        .trim();
      
      // Only add if we have actual measurements
      if (measurements && measurements.match(/\d/)) {
        result.push(pageNumbers + "    " + measurements);
      }
    }
    
    return result.join("\n");
  }, []);

  // Handle raw input changes
  const handleRawInputChange = useCallback((value: string) => {
    setRawInput(value);
    const cleaned = cleanBookFoldingInput(value);
    setFormattedOutput(cleaned);
  }, [cleanBookFoldingInput]);

  // Apply formatted output to main instructions
  const applyFormattedOutput = useCallback(() => {
    if (formattedOutput.trim()) {
      handleInstructionsTextChange(formattedOutput);
      // Clear the input boxes after applying
      setRawInput('');
      setFormattedOutput('');
    }
  }, [formattedOutput, handleInstructionsTextChange]);

  const togglePanel = (stepNumber: number) => {
    setExpandedPanels(prev => ({
      ...prev,
      [stepNumber]: !prev[stepNumber]
    }));
  };

  const handlePageDataChange = (field: keyof PageData, value: number) => {
    setPageData(prev => ({ ...prev, [field]: value }));
  };

  const handleInstructionsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    handleInstructionsTextChange(e.target.value);
  };
  
  const resetCalibration = () => {
    setCalibrationData({ pixelsPerCm: null });
    setStatusMessage("✨ Calibration reset. Position book and calibrate again for enhanced AR features.");
  };

  const handleCalibrate = () => {
    console.log('Calibrate button clicked!');
    if (pageData.heightCm > 0) {
      const pixelsPerCm = 100;
      setCalibrationData({ pixelsPerCm });
      setStatusMessage("✨ Enhanced AR calibration complete! Position book and use cut marks with particle effects.");
      // Auto-expand next step when calibration is complete
      setExpandedPanels(prev => ({ ...prev, 2: false, 3: true }));
    } else {
      setStatusMessage("Please enter book height before calibrating.");
    }
    onCalibrate();
  };

  const firstMarkedPageIndex = pageData.parsedInstructions.findIndex(p => !!p);
  let lastMarkedPageIndex = -1;
  for (let i = pageData.parsedInstructions.length - 1; i >= 0; i--) {
    if (pageData.parsedInstructions[i]) {
      lastMarkedPageIndex = i;
      break;
    }
  }

  // Determine completion status for each step
  const stepCompletion = {
    1: pageData.heightCm > 0,
    2: calibrationData.pixelsPerCm !== null,
    3: true, // Voice control is always "ready"
    4: pageData.parsedInstructions.some(p => p !== '') && currentMarksCm.length > 0,
    5: true, // PDF import is always available
    6: pageData.parsedInstructions.filter(p => p).length > 0
  };

  return (
    <aside className="w-full glass-panel-dark p-4 flex-shrink-0 shadow-2xl md:w-96 md:h-screen md:overflow-y-auto border-r border-gray-600/30 overflow-y-auto max-h-screen">
      <div className="flex items-center mb-6">
        <div className="relative">
          <RulerIcon className="w-8 h-8 mr-3 text-blue-400" />
          <div className="absolute inset-0 rounded-full border-2 border-blue-400/20 animate-ping"></div>
        </div>
        <h1 className="text-2xl font-bold relative">
          <span 
            className="animated-gradient-text"
            style={{
              fontFamily: "'Orbitron', monospace",
              fontWeight: 'bold',
              letterSpacing: '0.05em',
              background: 'linear-gradient(45deg, #3b82f6, #8b5cf6, #06b6d4, #10b981, #3b82f6)',
              backgroundSize: '300% 300%',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              color: 'transparent',
              animation: 'gradientShift 3s ease-in-out infinite, textGlow 2s ease-in-out infinite alternate',
              filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.5))'
            }}
          >
            BookfoldAR
          </span>
        </h1>
      </div>
      
      <style dangerouslySetInnerHTML={{
        __html: `
          @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');
          
          @keyframes gradientShift {
            0%, 100% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
          }
          
          @keyframes textGlow {
            0% {
              filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.3)) drop-shadow(0 0 16px rgba(139, 92, 246, 0.2));
            }
            100% {
              filter: drop-shadow(0 0 12px rgba(59, 130, 246, 0.6)) drop-shadow(0 0 24px rgba(139, 92, 246, 0.4));
            }
          }
        `
      }} />

            <div className="space-y-3">
        {/* Book Dimensions */}
        <CollapsibleSection
          stepNumber={1}
          title="Book Dimensions"
          instruction="Enter your book's physical measurements to set up the enhanced AR camera view."
          isExpanded={expandedPanels[1]}
          onToggle={() => togglePanel(1)}
          isComplete={stepCompletion[1]}
        >
          <InputGroup label="Page Height">
            <NumberInput 
              value={pageData.heightCm} 
              onChange={(e) => handlePageDataChange('heightCm', parseFloat(e.target.value) || 0)} 
              unit="cm"
              placeholder="From top to bottom"
            />
          </InputGroup>
          <InputGroup label="Top Padding">
            <NumberInput 
              value={pageData.paddingTopCm} 
              onChange={(e) => handlePageDataChange('paddingTopCm', parseFloat(e.target.value) || 0)} 
              unit="cm"
              placeholder="Blank space on top"
            />
          </InputGroup>
          <InputGroup label="Bottom Padding">
            <NumberInput 
              value={pageData.paddingBottomCm} 
              onChange={(e) => handlePageDataChange('paddingBottomCm', parseFloat(e.target.value) || 0)} 
              unit="cm"
              placeholder="Blank space on bottom"
            />
          </InputGroup>
        </CollapsibleSection>

        {/* Enhanced Camera & AR Overlay */}
        <CollapsibleSection
          stepNumber={2}
          title="Enhanced AR Camera"
          instruction="Start the camera with glassmorphism UI, align your book with guides, then calibrate for AR effects."
          isExpanded={expandedPanels[2]}
          onToggle={() => togglePanel(2)}
          isComplete={stepCompletion[2]}
        >
          <PressButton
            onClick={() => setIsCameraActive(!isCameraActive)}
            variant={isCameraActive ? 'warning' : 'success'}
            className="w-full flex items-center justify-center px-4 py-3 text-sm font-medium rounded-lg shadow-lg mb-4"
          >
            <CameraIcon className="w-5 h-5 mr-2" />
            <span className="flex items-center">
              {isCameraActive ? (
                <>
                  <span className="animate-pulse mr-2">🔴</span>
                  Stop Enhanced AR Camera
                </>
              ) : (
                <>
                  <span className="animate-bounce mr-2">✨</span>
                  Start Enhanced AR Camera
                </>
              )}
            </span>
          </PressButton>

          {/* Manual Calibrate button */}
          {isCameraActive && !calibrationData.pixelsPerCm && (
            <PressButton
              onClick={handleCalibrate}
              disabled={pageData.heightCm <= 0}
              variant={pageData.heightCm > 0 ? 'primary' : 'default'}
              className="w-full px-4 py-3 rounded-lg text-sm font-medium mb-4"
              title={pageData.heightCm <= 0 ? "Please enter book height first" : "Click to start the enhanced AR overlay system"}
            >
              <span className="flex items-center justify-center">
                {pageData.heightCm <= 0 ? (
                  <>
                    <span className="mr-2">⚠️</span>
                    Enter Height First
                  </>
                ) : (
                  <>
                    <span className="animate-spin mr-2">✨</span>
                    Start Enhanced AR Overlay
                  </>
                )}
              </span>
            </PressButton>
          )}

          {/* Enhanced zoom control */}
          <div className="mb-4">
            <label className="block text-sm text-gray-300 mb-2 flex items-center">
              <span className="mr-2">🔍</span>
              AR View Scale: {transform.scale.toFixed(2)}x
            </label>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.05"
              value={transform.scale}
              onChange={(e) => setTransform(t => ({ ...t, scale: parseFloat(e.target.value) }))}
              className="w-full h-2 glass-input rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          {/* Grid Controls Integration */}
          <GridControls
            isVisible={showGrid}
            onToggle={() => setShowGrid(!showGrid)}
            gridType={gridType}
            onGridTypeChange={setGridType}
            opacity={gridOpacity}
            onOpacityChange={setGridOpacity}
          />

          {calibrationData.pixelsPerCm && (
            <PressButton
              onClick={resetCalibration}
              variant="warning"
              className="w-full px-4 py-3 rounded-lg text-sm font-medium"
            >
              <span className="flex items-center justify-center">
                <span className="animate-bounce mr-2">🔄</span>
                Reset AR Calibration
              </span>
            </PressButton>
          )}
        </CollapsibleSection>

        {/* Enhanced Voice Control */}
        <CollapsibleSection
          stepNumber={3}
          title="Voice Control"
          instruction="Use voice commands to navigate hands-free while folding your book with AR assistance."
          isExpanded={expandedPanels[3]}
          onToggle={() => togglePanel(3)}
          isComplete={stepCompletion[3]}
        >
          <VoiceControl
            onNextPage={handleNextPage}
            onPrevPage={handlePrevPage}
            onToggleMarks={() => handleMarkNavigation('toggleAll')}
            onStatusMessage={setStatusMessage}
          />
        </CollapsibleSection>

        {/* Enhanced Page & Mark Navigation */}
        <CollapsibleSection
          stepNumber={4}
          title="AR Page & Mark Navigation"
          instruction="Navigate between pages and individual fold marks with enhanced visual feedback."
          isExpanded={expandedPanels[4]}
          onToggle={() => togglePanel(4)}
          isComplete={stepCompletion[4]}
        >
          {/* Enhanced Page Navigation Section */}
          <div className="text-center mb-6">
            <InputGroup 
              label={`📖 Page ${pageData.currentPage + 1} of ${pageData.parsedInstructions.length}`}
              centered={true}
            >
              <div className="flex justify-center space-x-4">
                <PressButton
                  onClick={handlePrevPage}
                  disabled={pageData.currentPage <= firstMarkedPageIndex}
                  variant="primary"
                  className="px-6 py-3 rounded-xl text-lg font-medium flex items-center"
                >
                  <ChevronLeftIcon className="w-6 h-6 mr-1"/>
                  <span>Prev</span>
                </PressButton>
                <PressButton
                  onClick={handleNextPage}
                  disabled={pageData.currentPage >= lastMarkedPageIndex}
                  variant="primary"
                  className="px-6 py-3 rounded-xl text-lg font-medium flex items-center"
                >
                  <span>Next</span>
                  <ChevronRightIcon className="w-6 h-6 ml-1"/>
                </PressButton>
              </div>
            </InputGroup>
          </div>

          {/* Enhanced Mark Display Section */}
          <div className="text-center mb-6">
            <div className="glass-card p-4 rounded-lg min-h-[90px] flex flex-col justify-center border border-purple-400/30">
              {currentMarksCm.length > 0 ? (
                <div className="text-lg text-gray-200 font-medium">
                  <div className="flex justify-center items-center mb-2">
                    <span className="animate-pulse mr-2">📏</span>
                    <span>Total marks: {currentMarksCm.length}</span>
                    {!markNavigation.showAllMarks && (
                      <span className="text-pink-300 font-mono ml-4 px-2 py-1 glass-status-warning rounded-lg">
                        {currentMarksCm[markNavigation.currentMarkIndex]?.toFixed(1)}cm
                      </span>
                    )}
                  </div>
                  {!markNavigation.showAllMarks && (
                    <div className="text-center text-gray-400 flex items-center justify-center">
                      <span className="animate-bounce mr-1">🎯</span>
                      Mark {markNavigation.currentMarkIndex + 1} of {currentMarksCm.length}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-lg text-gray-400 flex items-center justify-center">
                  <span className="mr-2">⚠️</span>
                  No marks available for current page
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Mark Mode Toggle Buttons */}
          <div className="flex space-x-2 mb-4">
            <PressButton
              onClick={() => handleMarkNavigation('toggleAll')}
              variant={markNavigation.showAllMarks ? 'success' : 'default'}
              className="flex-1 flex items-center justify-center px-4 py-3 text-sm font-medium rounded-lg"
            >
              <EyeIcon className="w-4 h-4 mr-2" />
              <span className="flex items-center">
                {markNavigation.showAllMarks && <span className="animate-pulse mr-1">✨</span>}
                All Marks
              </span>
            </PressButton>
            <PressButton
              onClick={() => handleMarkNavigation('toggleAll')}
              variant={!markNavigation.showAllMarks ? 'success' : 'default'}
              className="flex-1 flex items-center justify-center px-4 py-3 text-sm font-medium rounded-lg"
            >
              <EyeIcon className="w-4 h-4 mr-2" />
              <span className="flex items-center">
                {!markNavigation.showAllMarks && <span className="animate-pulse mr-1">🎯</span>}
                Single Mark
              </span>
            </PressButton>
          </div>

          {/* Enhanced Mark Navigation Buttons */}
          {currentMarksCm.length > 1 && (
            <div className="text-center">
              <InputGroup label="🎯 Navigate Marks with AR Effects" centered={true}>
                <div className="flex justify-center space-x-4">
                  <PressButton
                    onClick={() => handleMarkNavigation('prev')}
                    variant="primary"
                    className="px-6 py-3 rounded-xl text-lg font-medium flex items-center"
                    title="Previous Mark"
                  >
                    <ChevronUpIcon className="w-6 h-6 mr-2"/>
                    <span>Up</span>
                  </PressButton>
                  <PressButton
                    onClick={() => handleMarkNavigation('next')}
                    variant="primary"
                    className="px-6 py-3 rounded-xl text-lg font-medium flex items-center"
                    title="Next Mark"
                  >
                    <span>Down</span>
                    <ChevronDownIcon className="w-6 h-6 ml-2"/>
                  </PressButton>
                </div>
              </InputGroup>
            </div>
          )}
        </CollapsibleSection>

        {/* PDF Import Section */}
        <CollapsibleSection
          stepNumber={5}
          title="PDF Import"
          instruction="Upload a PDF with book folding instructions to automatically extract measurements."
          isExpanded={expandedPanels[5]}
          onToggle={() => togglePanel(5)}
          isComplete={stepCompletion[5]}
        >
          <PDFImport
            onInstructionsImported={handleInstructionsTextChange}
            onStatusMessage={setStatusMessage}
          />
        </CollapsibleSection>

        {/* Enhanced Manual Marking Instructions */}
        <CollapsibleSection
          stepNumber={6}
          title="Manual Marking Instructions"
          instruction="Define which pages have fold marks and specify measurements for enhanced AR visualization."
          isExpanded={expandedPanels[6]}
          onToggle={() => togglePanel(6)}
          isComplete={stepCompletion[6]}
        >
          <div className="space-y-4">
            {/* Enhanced Raw Input Area */}
            <InputGroup label="📋 Paste Your Measurements (any format)">
              <textarea
                value={rawInput}
                onChange={(e) => handleRawInputChange(e.target.value)}
                placeholder="Paste measurements here... (e.g., Page 1 2.2 5.5 7.7, 8.1, 8.9 | 9.3, 10.0 | 11.0)"
                rows={4}
                className="w-full glass-input text-white focus:glass-status-success transition-all duration-300 rounded-lg py-3 px-4 font-mono text-sm placeholder-gray-400 border border-gray-500/30"
              />
            </InputGroup>

            {/* Enhanced Auto-formatted Output */}
            <div className="glass-status-success rounded-lg p-4 border border-blue-500/50">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-blue-300 flex items-center">
                  <span className="animate-spin mr-2">✨</span>
                  Auto-Formatted Output:
                </label>
                <PressButton
                  onClick={applyFormattedOutput}
                  disabled={!formattedOutput.trim()}
                  variant={formattedOutput.trim() ? 'success' : 'default'}
                  className="px-4 py-2 text-xs rounded-lg"
                >
                  <span className="flex items-center">
                    <span className="mr-1">✓</span>
                    Apply to AR
                  </span>
                </PressButton>
              </div>
              <pre className="glass-card p-3 rounded-lg text-green-400 font-mono text-xs whitespace-pre-wrap min-h-[80px] border border-gray-600/50">
                {formattedOutput || 'Cleaned output will appear here with AR enhancements...'}
              </pre>
            </div>

            {/* Enhanced Manual Entry Area */}
            <InputGroup label="✏️ Manual Entry / Final Instructions">
              <textarea
                value={pageData.instructionsText}
                onChange={handleInstructionsChange}
                rows={6}
                className="w-full glass-input text-white focus:glass-status-success transition-all duration-300 rounded-lg py-3 px-4 font-mono text-sm border border-gray-500/30"
                placeholder="1-2    0.1, 0.5, 1.0, 10.0&#10;3-4    0.2, 0.8, 9.5&#10;5-6    0.3, 1.2, 2.1, 8.8"
              />
            </InputGroup>

            {/* Enhanced Format Help */}
            <div className="glass-card rounded-lg p-4 text-xs text-gray-300 border border-purple-400/30">
              <h4 className="text-white font-semibold mb-3 flex items-center">
                <span className="animate-bounce mr-2">📝</span>
                Supported Input Formats for AR:
              </h4>
              <div className="grid grid-cols-1 gap-2">
                <div className="flex items-start">
                  <span className="text-blue-400 mr-2">•</span>
                  <span><span className="text-green-400">Page 1 2.2 5.5 7.7, 8.1</span> → Auto-converts to AR format</span>
                </div>
                <div className="flex items-start">
                  <span className="text-blue-400 mr-2">•</span>
                  <span><span className="text-green-400">1 2.2, 5.5 | 7.7 | 8.1</span> → Handles pipes and commas</span>
                </div>
                <div className="flex items-start">
                  <span className="text-blue-400 mr-2">•</span>
                  <span><span className="text-green-400">Page 5: 1.1, 2.2, 3.3</span> → Removes extra text</span>
                </div>
                <div className="flex items-start">
                  <span className="text-yellow-400 mr-2">✨</span>
                  <span><span className="text-yellow-400">AR Final:</span> <span className="text-blue-400">1-2    2.2, 5.5, 7.7, 8.1</span></span>
                </div>
              </div>
            </div>
          </div>
          
          {pageData.parsedInstructions.length > 0 && (
            <div className="mt-3 glass-status-success p-3 rounded-lg border border-green-500/50">
              <p className="text-sm text-green-300 font-medium flex items-center">
                <span className="animate-pulse mr-2">✨</span>
                Parsed {pageData.parsedInstructions.filter(p => p).length} pages with AR-enhanced marks successfully
              </p>
            </div>
          )}
        </CollapsibleSection>
      </div>
    </aside>
  );
};