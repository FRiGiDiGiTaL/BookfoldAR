import React, { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import type { PageData, CalibrationData, Transform, MarkNavigation } from "./types";

// Dynamically import client-only components to prevent SSR issues
const ControlPanel = dynamic(() => import("./components/ControlPanel").then(mod => ({ default: mod.ControlPanel })), {
  ssr: false,
  loading: () => (
    <div className="w-full md:w-96 glass-panel-dark p-4 flex-shrink-0 shadow-2xl">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-700 rounded mb-4"></div>
        <div className="space-y-3">
          <div className="h-16 bg-gray-700 rounded"></div>
          <div className="h-12 bg-gray-700 rounded"></div>
          <div className="h-12 bg-gray-700 rounded"></div>
        </div>
      </div>
    </div>
  )
});

const CameraView = dynamic(() => import("./components/CameraView").then(mod => ({ default: mod.CameraView })), {
  ssr: false,
  loading: () => (
    <div className="flex-1 bg-gradient-to-b from-black via-gray-900 to-black flex items-center justify-center min-h-[400px]">
      <div className="text-white text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-400 border-t-transparent mx-auto mb-4"></div>
        <p className="text-xl">Loading AR Camera...</p>
      </div>
    </div>
  )
});

const parseInstructions = (text: string): string[] => {
  const lines = text.split("\n");
  const instructionsMap = new Map<number, string>();
  let maxPage = 0;
  const lineRegex = /^\s*(\d+(?:-\d+)?(?:,\s*\d+(?:-\d+)?)*)\s+([0-9.,\s]+)/;

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith("#") || trimmedLine.startsWith("PAGE") || trimmedLine === "")
      continue;

    const match = trimmedLine.match(lineRegex);
    if (!match) continue;

    const pageSpec = match[1];
    const measurements = match[2].trim().replace(/,\s*$/, "");

    const pageNumbers: number[] = [];
    const parts = pageSpec.replace(/\s/g, "").split(",");

    for (const part of parts) {
      if (part.includes("-")) {
        const [startStr] = part.split("-");
        const start = parseInt(startStr, 10);
        if (!isNaN(start) && start % 2 !== 0) {
          pageNumbers.push(start);
        }
      } else {
        const pageNum = parseInt(part, 10);
        if (!isNaN(pageNum) && pageNum % 2 !== 0) {
          pageNumbers.push(pageNum);
        }
      }
    }

    for (const pageNum of pageNumbers) {
      const pageIndex = pageNum - 1;
      if (pageIndex >= 0) {
        instructionsMap.set(pageIndex, measurements);
        if (pageNum > maxPage) {
          maxPage = pageNum;
        }
      }
    }
  }

  if (maxPage === 0) return [];

  const newInstructionsArray: string[] = Array(maxPage).fill("");
  for (const [index, marks] of instructionsMap.entries()) {
    if (index < newInstructionsArray.length) {
      newInstructionsArray[index] = marks;
    }
  }
  return newInstructionsArray;
};

const MainApp: React.FC = () => {
  const [isClient, setIsClient] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>(
    "✨ Enter book dimensions and start camera for enhanced AR experience"
  );

  const initialInstructionsText = `PAGE        Measurements in CM
# Example pattern below - try PDF import for easier setup!
17-18        0.5, 7.9, 8.0, 9.6, 9.8, 10.0, 10.1, 20.5
19-20        0.5, 20.5
21-22        0.5, 8.4, 8.5, 10.7, 10.9, 20.5`;

  const [pageData, setPageData] = useState<PageData>({
    heightCm: 0,
    widthCm: 0,
    paddingTopCm: 0,
    paddingBottomCm: 0,
    instructionsText: initialInstructionsText,
    parsedInstructions: parseInstructions(initialInstructionsText),
    currentPage: 16,
  });

  const [calibrationData, setCalibrationData] = useState<CalibrationData>({
    pixelsPerCm: null,
  });

  const [markNavigation, setMarkNavigation] = useState<MarkNavigation>({
    showAllMarks: true,
    currentMarkIndex: 0,
  });

  const [transform, setTransform] = useState<Transform>({ scale: 1, x: 0, y: 0 });

  // Enhanced features state
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [gridType, setGridType] = useState<"rule-of-thirds" | "quarters" | "golden-ratio">(
    "rule-of-thirds"
  );
  const [gridOpacity, setGridOpacity] = useState<number>(0.4);

  // Particle effects state
  const [triggerParticles, setTriggerParticles] = useState<boolean>(false);

  // Set client flag after mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleInstructionsTextChange = useCallback((text: string) => {
    const newParsedInstructions = parseInstructions(text);
    setPageData((prev) => {
      let newCurrentPage = prev.currentPage;
      if (
        newCurrentPage >= newParsedInstructions.length ||
        newParsedInstructions[newCurrentPage] === ""
      ) {
        const firstAvailablePage = newParsedInstructions.findIndex((p) => p !== "");
        newCurrentPage = firstAvailablePage !== -1 ? firstAvailablePage : 0;
      }
      return {
        ...prev,
        instructionsText: text,
        parsedInstructions: newParsedInstructions,
        currentPage: newCurrentPage,
      };
    });
    setMarkNavigation({ showAllMarks: true, currentMarkIndex: 0 });
  }, []);

  const currentMarksCm = useCallback((): number[] => {
    if (pageData.currentPage >= pageData.parsedInstructions.length) return [];
    const instructionString = pageData.parsedInstructions[pageData.currentPage];
    if (!instructionString) return [];
    return instructionString
      .split(",")
      .map((s) => parseFloat(s.trim()))
      .filter((n) => !isNaN(n));
  }, [pageData.parsedInstructions, pageData.currentPage])();

  // Reset current mark index when page changes or when marks change
  useEffect(() => {
    setMarkNavigation((prev) => ({
      ...prev,
      currentMarkIndex: Math.min(
        prev.currentMarkIndex,
        Math.max(0, currentMarksCm.length - 1)
      ),
    }));
  }, [currentMarksCm.length, pageData.currentPage]);

  const handleNextPage = useCallback(() => {
    setPageData((prev) => {
      for (let i = prev.currentPage + 1; i < prev.parsedInstructions.length; i++) {
        if (prev.parsedInstructions[i]) {
          setStatusMessage(`✨ Advanced to Page ${i + 1} with enhanced AR visualization`);
          setTriggerParticles(true);
          setTimeout(() => setTriggerParticles(false), 100);
          return { ...prev, currentPage: i };
        }
      }
      setStatusMessage(`Reached the last page with marks (${prev.currentPage + 1})`);
      return prev;
    });
    setMarkNavigation({ showAllMarks: true, currentMarkIndex: 0 });
  }, [setStatusMessage]);

  const handlePrevPage = useCallback(() => {
    setPageData((prev) => {
      for (let i = prev.currentPage - 1; i >= 0; i--) {
        if (prev.parsedInstructions[i]) {
          setStatusMessage(`✨ Viewing Page ${i + 1} with enhanced AR features`);
          setTriggerParticles(true);
          setTimeout(() => setTriggerParticles(false), 100);
          return { ...prev, currentPage: i };
        }
      }
      setStatusMessage(`Already on the first page with marks (${prev.currentPage + 1})`);
      return prev;
    });
    setMarkNavigation({ showAllMarks: true, currentMarkIndex: 0 });
  }, [setStatusMessage]);

  const handleMarkNavigation = useCallback(
    (action: "next" | "prev" | "toggleAll") => {
      setMarkNavigation((prev) => {
        if (action === "toggleAll") {
          const newShowAll = !prev.showAllMarks;
          setStatusMessage(
            newShowAll
              ? "✨ Showing all marks with particle effects"
              : "🎯 Single mark mode with enhanced focus"
          );
          setTriggerParticles(true);
          setTimeout(() => setTriggerParticles(false), 100);
          return { ...prev, showAllMarks: newShowAll };
        }

        if (action === "next") {
          const nextIndex = prev.currentMarkIndex + 1;

          if (nextIndex >= currentMarksCm.length) {
            setStatusMessage("🔄 Cycling to first mark");
            return { showAllMarks: false, currentMarkIndex: 0 };
          }

          setStatusMessage(
            `📏 Mark ${nextIndex + 1}/${currentMarksCm.length}: ${currentMarksCm[
              nextIndex
            ]?.toFixed(1)}cm`
          );
          return { showAllMarks: false, currentMarkIndex: nextIndex };
        }

        if (action === "prev") {
          const prevIndex =
            prev.currentMarkIndex === 0
              ? currentMarksCm.length - 1
              : prev.currentMarkIndex - 1;
          setStatusMessage(
            `📏 Mark ${prevIndex + 1}/${currentMarksCm.length}: ${currentMarksCm[
              prevIndex
            ]?.toFixed(1)}cm`
          );
          return { showAllMarks: false, currentMarkIndex: prevIndex };
        }

        return prev;
      });
    },
    [currentMarksCm.length, setStatusMessage]
  );

  const handleCalibrate = useCallback(() => {
    setStatusMessage(
      "✨ Enhanced AR calibration complete! Particle effects, glassmorphism UI, and grid alignment ready."
    );
    setTriggerParticles(true);
    setTimeout(() => setTriggerParticles(false), 100);
  }, []);

  // Don't render until client-side to prevent hydration mismatches
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-400 border-t-transparent mx-auto mb-4"></div>
          <p className="text-xl">Loading BookfoldAR...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-gray-100">
      {/* Single responsive layout that works on all screen sizes */}
      <div className="flex flex-col md:flex-row min-h-screen">
        {/* Control Panel - Full width on mobile, fixed width on desktop */}
        <div className="w-full md:w-96 md:flex-shrink-0">
          <ControlPanel
            isCameraActive={isCameraActive}
            setIsCameraActive={setIsCameraActive}
            pageData={pageData}
            setPageData={setPageData}
            calibrationData={calibrationData}
            setCalibrationData={setCalibrationData}
            handleInstructionsTextChange={handleInstructionsTextChange}
            statusMessage={statusMessage}
            setStatusMessage={setStatusMessage}
            transform={transform}
            setTransform={setTransform}
            markNavigation={markNavigation}
            currentMarksCm={currentMarksCm}
            handleMarkNavigation={handleMarkNavigation}
            handleNextPage={handleNextPage}
            handlePrevPage={handlePrevPage}
            onCalibrate={handleCalibrate}
            showGrid={showGrid}
            setShowGrid={setShowGrid}
            gridType={gridType}
            setGridType={setGridType}
            gridOpacity={gridOpacity}
            setGridOpacity={setGridOpacity}
          />
        </div>

        {/* Camera View - Takes remaining space */}
        <div className="flex-1 bg-gradient-to-b from-black via-gray-900 to-black flex items-center justify-center relative min-h-[400px] md:min-h-screen">
          <CameraView
            isCameraActive={isCameraActive}
            calibrationData={calibrationData}
            setCalibrationData={setCalibrationData}
            pageData={pageData}
            marksCm={currentMarksCm}
            markNavigation={markNavigation}
            transform={transform}
            setTransform={setTransform}
            setStatusMessage={setStatusMessage}
            onCalibrate={handleCalibrate}
            onMarkNavigation={handleMarkNavigation}
            onNextPage={handleNextPage}
            onPrevPage={handlePrevPage}
            showGrid={showGrid}
            gridType={gridType}
            gridOpacity={gridOpacity}
            triggerParticles={triggerParticles}
          />
        </div>
      </div>

      {/* Debug info - remove this in production */}
      <div className="fixed bottom-4 right-4 bg-black/50 text-white text-xs p-2 rounded opacity-50 pointer-events-none md:hidden">
        Mobile Layout Active
      </div>
      <div className="fixed bottom-4 right-4 bg-black/50 text-white text-xs p-2 rounded opacity-50 pointer-events-none hidden md:block">
        Desktop Layout Active
      </div>
    </div>
  );
};

export default MainApp;