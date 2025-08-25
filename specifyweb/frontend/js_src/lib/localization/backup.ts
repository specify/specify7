/**
 * Localization strings used by Backup UI and notifications
 *
 * @module
 */

import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

export const backupText = createDictionary({
  completed: {
    'en-us': 'Backup completed successfully.',
  },
  failed: {
    'en-us': 'Backup failed.',
  },
  previousFound: {
    'en-us': 'A previous backup was found:',
  },
  previousNone: {
    'en-us': 'No previous backup was found. Start a new one?',
  },
  previousSizeMB: {
    'en-us': '({size:string} MB)',
  },
  lastBackupOn: {
    'en-us': 'This backup was created on {date:string}',
  },
  checkPreviousFailed: {
    'en-us': 'Failed to check previous backup.',
  },
  startFailed: {
    'en-us': 'Backup start failed.',
  },
  databaseBackupCompleted: {
    'en-us': 'Database backup completed.',
  },
  databaseBackupFailed: {
    'en-us': 'Database backup failed.',
  },
  compressing: {
    "en-us": "Compressing...",
  },
} as const);
