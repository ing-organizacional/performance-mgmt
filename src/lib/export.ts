/**
 * Export system - Modular architecture
 * This file maintains backward compatibility while using the new modular structure
 */

// Re-export everything from the new modular export system
export * from './export/index'

// The new modular structure is organized as follows:
// - ./export/types.ts - All TypeScript interfaces and type definitions
// - ./export/data.ts - Data fetching utilities (getEvaluationData, getCompanyEvaluations, generateAnalytics)
// - ./export/pdf-utils.ts - PDF utility functions (getRatingText, getRatingColor, getPDFLabels, calculateAverages)
// - ./export/pdf-individual.ts - Individual evaluation PDF generation
// - ./export/pdf-department.ts - Department PDF with executive dashboard
// - ./export/pdf-multi.ts - Multi-evaluation/company-wide PDF generation
// - ./export/excel.ts - Excel generation functionality
// - ./export/index.ts - Public API and re-exports

/**
 * BENEFITS OF THE NEW MODULAR STRUCTURE:
 * 
 * 1. MAINTAINABILITY:
 *    - Each module has a single responsibility
 *    - Easy to locate and modify specific functionality
 *    - Reduced cognitive load when working on specific features
 * 
 * 2. TESTABILITY:
 *    - Individual modules can be tested in isolation
 *    - Mock dependencies more easily
 *    - Better test coverage and reliability
 * 
 * 3. REUSABILITY:
 *    - Utility functions can be imported independently
 *    - PDF generators can be mixed and matched
 *    - Data functions reusable across different export types
 * 
 * 4. COLLABORATION:
 *    - Multiple developers can work on different modules simultaneously
 *    - Clear boundaries prevent conflicts
 *    - Easier code reviews with focused changes
 * 
 * 5. PERFORMANCE:
 *    - Better tree-shaking in bundlers
 *    - Only import what you need
 *    - Reduced memory footprint
 * 
 * 6. SCALABILITY:
 *    - Easy to add new export formats (PowerPoint, Word, etc.)
 *    - Simple to extend existing functionality
 *    - Clear patterns for future development
 */

// File size reduction: 1580 lines → ~200 lines per module (8 modules)
// This provides better organization and maintainability while preserving all functionality