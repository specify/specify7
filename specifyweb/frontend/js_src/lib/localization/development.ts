/**
 * Strings used by developer tools and error messages. Low priority for
 * localization
 *
 * @module
 */

import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

export const developmentText = createDictionary({
  crashReportVisualizer: {
    'en-us': 'Crash Report Visualizer',
  },
  downloadAsHtml: {
    'en-us': 'Download as HTML',
  },
  details: {
    'en-us': 'Details',
  },
} as const);
