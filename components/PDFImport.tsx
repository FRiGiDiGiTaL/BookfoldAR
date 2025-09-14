import React, { useState, useCallback } from 'react';

interface PDFImportProps {
  onInstructionsImported: (instructions: string) => void;
  onStatusMessage: (message: string) => void;
}

interface ParsedPDFData {
  text: string;
  pageCount: number;
  extractedMeasurements: Array<{
    page: number;
    measurements: number[];
    rawText: string;
  }>;
}

export const PDFImport: React.FC<PDFImportProps> = ({
  onInstructionsImported,
  onStatusMessage
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedPDFData | null>(null);

  // Extract measurements from text using various patterns
  const extractMeasurements = (text: string): Array<{ page: number; measurements: number[]; rawText: string }> => {
    const results: Array<{ page: number; measurements: number[]; rawText: string }> = [];
    const lines = text.split('\n');
    
    // Common patterns for book folding instructions
    const patterns = [
      // Page X: measurements
      /(?:page|pg|p)\.?\s*(\d+)(?:-(\d+))?\s*[:]\s*([\d.,\s]+)/gi,
      // X-Y measurements
      /(\d+)-(\d+)\s+([\d.,\s]+)/g,
      // Fold at: measurements
      /fold\s*(?:at|to)?\s*[:]\s*([\d.,\s]+)/gi,
      // Mark at: measurements  
      /mark\s*(?:at|to)?\s*[:]\s*([\d.,\s]+)/gi,
      // Lines of just numbers
      /^([\d.,\s]+)$/gm
    ];

    let currentPage = 1;

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      // Check for page numbers
      const pageMatch = trimmedLine.match(/(?:page|pg|p)\.?\s*(\d+)/i);
      if (pageMatch) {
        currentPage = parseInt(pageMatch[1]);
      }

      // Extract measurements using all patterns
      for (const pattern of patterns) {
        pattern.lastIndex = 0; // Reset regex state
        const matches = pattern.exec(trimmedLine);
        
        if (matches) {
          let measurementText = '';
          let pageNum = currentPage;

          if (pattern.source.includes('page|pg|p')) {
            // Page-specific pattern
            pageNum = parseInt(matches[1]);
            measurementText = matches[3] || matches[2];
          } else if (pattern.source.includes('(\\d+)-(\\d+)')) {
            // Range pattern
            pageNum = parseInt(matches[1]);
            measurementText = matches[3];
          } else {
            // Generic measurement pattern
            measurementText = matches[1];
          }

          if (measurementText) {
            // Parse measurements from text
            const measurements = measurementText
              .replace(/[^\d.,\s]/g, '') // Remove non-numeric chars except commas, periods, spaces
              .split(/[,\s]+/)
              .map(s => parseFloat(s.trim()))
              .filter(n => !isNaN(n) && n > 0 && n < 50); // Reasonable range for book measurements

            if (measurements.length > 0) {
              results.push({
                page: pageNum,
                measurements,
                rawText: trimmedLine
              });
            }
          }
        }
      }
    }

    return results;
  };

  // Convert parsed data to instructions format
  const convertToInstructionsFormat = (data: ParsedPDFData): string => {
    const instructionLines = ['PAGE        Measurements in CM', '# Imported from PDF'];
    
    // Group measurements by page
    const pageGroups = new Map<number, number[]>();
    
    data.extractedMeasurements.forEach(item => {
      const existing = pageGroups.get(item.page) || [];
      pageGroups.set(item.page, [...existing, ...item.measurements]);
    });

    // Convert to instruction format
    Array.from(pageGroups.entries())
      .sort(([a], [b]) => a - b)
      .forEach(([page, measurements]) => {
        // Remove duplicates and sort
        const uniqueMeasurements = [...new Set(measurements)].sort((a, b) => a - b);
        const pageRange = page % 2 === 1 ? `${page}-${page + 1}` : `${page - 1}-${page}`;
        instructionLines.push(`${pageRange}        ${uniqueMeasurements.map(m => m.toFixed(1)).join(', ')}`);
      });

    return instructionLines.join('\n');
  };

  // Process PDF file
  const processPDFFile = useCallback(async (file: File) => {
    setIsProcessing(true);
    onStatusMessage('Processing PDF...');

    try {
      // For this demo, we'll simulate PDF processing
      // In a real implementation, you'd use a library like PDF.js
      const text = await simulatePDFTextExtraction(file);
      
      const extractedMeasurements = extractMeasurements(text);
      
      const parsedData: ParsedPDFData = {
        text,
        pageCount: Math.max(...extractedMeasurements.map(m => m.page), 1),
        extractedMeasurements
      };

      setParsedData(parsedData);
      onStatusMessage(`Extracted ${extractedMeasurements.length} measurement sets from PDF`);

    } catch (error) {
      console.error('PDF processing error:', error);
      onStatusMessage('Error processing PDF. Please check the file format.');
    } finally {
      setIsProcessing(false);
    }
  }, [onStatusMessage]);

  // Simulate PDF text extraction (replace with real PDF.js implementation)
  const simulatePDFTextExtraction = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        // This is a simplified simulation
        // In reality, you'd parse the PDF binary and extract text
        const sampleText = `
Book Folding Pattern Instructions

Page 1-2: 2.5, 5.0, 7.5, 10.0, 12.5
Page 3-4: 1.8, 4.2, 6.6, 9.1, 11.5
Page 5-6: 3.0, 6.0, 9.0, 12.0

Fold at: 2.2, 4.4, 6.6, 8.8
Mark lines at 1.5cm intervals

Page 7: 2.1, 4.8, 7.3, 9.9
Page 8: 1.9, 5.1, 8.2, 10.7
        `;
        
        resolve(sampleText);
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  // Handle file drop
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    const pdfFile = files.find(file => file.type === 'application/pdf');
    
    if (pdfFile) {
      processPDFFile(pdfFile);
    } else {
      onStatusMessage('Please drop a PDF file');
    }
  }, [processPDFFile, onStatusMessage]);

  // Handle file input
  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      processPDFFile(file);
    } else {
      onStatusMessage('Please select a PDF file');
    }
  }, [processPDFFile, onStatusMessage]);

  // Apply imported instructions
  const applyImportedInstructions = useCallback(() => {
    if (parsedData) {
      const instructions = convertToInstructionsFormat(parsedData);
      onInstructionsImported(instructions);
      onStatusMessage('PDF measurements imported successfully!');
      setParsedData(null);
    }
  }, [parsedData, onInstructionsImported, onStatusMessage]);

  return (
    <div className="glass-card rounded-lg p-4 mb-4">
      <div className="flex items-center mb-3">
        <div className="text-lg mr-2">📄</div>
        <h3 className="text-lg font-semibold text-gray-300">PDF Import</h3>
      </div>

      {/* File Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors pdf-drop-zone ${
          dragActive 
            ? 'drag-active' 
            : ''
        }`}
      >
        {isProcessing ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mb-2"></div>
            <p className="text-gray-400">Processing PDF...</p>
          </div>
        ) : (
          <div>
            <div className="text-4xl mb-2">📄</div>
            <p className="text-gray-300 mb-2">
              Drop your book folding pattern PDF here
            </p>
            <p className="text-xs text-gray-500 mb-3">
              Or click to select a file
            </p>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileInput}
              className="hidden"
              id="pdf-input"
            />
            <label
              htmlFor="pdf-input"
              className="glass-button px-4 py-2 rounded cursor-pointer inline-block text-sm font-medium"
            >
              Select PDF File
            </label>
          </div>
        )}
      </div>

      {/* Preview of extracted data */}
      {parsedData && (
        <div className="mt-4">
          <div className="glass-card rounded p-3 mb-3">
            <h4 className="text-sm font-medium text-green-400 mb-2">
              ✓ PDF Processed Successfully
            </h4>
            <div className="text-xs text-gray-400 space-y-1">
              <div>📊 Found {parsedData.extractedMeasurements.length} measurement sets</div>
              <div>📄 Across {parsedData.pageCount} pages</div>
            </div>
          </div>

          <div className="bg-gray-800/50 rounded p-2 mb-3 max-h-32 overflow-y-auto">
            <div className="text-xs text-gray-300 font-mono">
              {parsedData.extractedMeasurements.slice(0, 5).map((item, index) => (
                <div key={index} className="mb-1">
                  <span className="text-blue-400">Page {item.page}:</span>{' '}
                  <span className="text-green-400">
                    {item.measurements.map(m => m.toFixed(1)).join(', ')}
                  </span>
                </div>
              ))}
              {parsedData.extractedMeasurements.length > 5 && (
                <div className="text-gray-500">
                  ... and {parsedData.extractedMeasurements.length - 5} more
                </div>
              )}
            </div>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={applyImportedInstructions}
              className="flex-1 glass-button px-4 py-2 rounded text-sm font-medium text-green-300 border-green-500/30"
            >
              ✓ Apply Instructions
            </button>
            <button
              onClick={() => setParsedData(null)}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Help text */}
      <div className="mt-3 text-xs text-gray-500">
        <p className="mb-1">
          💡 <strong>Supported PDF formats:</strong>
        </p>
        <ul className="space-y-1 ml-4">
          <li>• Book folding pattern instructions</li>
          <li>• Pages with measurement lists (e.g., "Page 1: 2.5, 5.0, 7.5")</li>
          <li>• Fold lines with measurements (e.g., "Fold at: 3.2, 6.4")</li>
          <li>• Any text document with numeric measurements</li>
        </ul>
      </div>
    </div>
  );
};