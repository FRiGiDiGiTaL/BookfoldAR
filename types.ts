export interface PageData {
  heightCm: number;
  widthCm: number;  // Added width for proper video sizing
  paddingTopCm: number;
  paddingBottomCm: number;
  instructionsText: string;
  parsedInstructions: string[];
  currentPage: number;
}

export interface CalibrationData {
  pixelsPerCm: number | null;
}

export interface Transform {
  scale: number;
  x: number;
  y: number;
}

export interface MarkNavigation {
  showAllMarks: boolean;
  currentMarkIndex: number;
}

// Additional interface for grid settings
export interface GridSettings {
  showGrid: boolean;
  gridType: 'rule-of-thirds' | 'custom';
  opacity: number;
}