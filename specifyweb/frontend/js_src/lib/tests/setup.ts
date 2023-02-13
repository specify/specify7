/**
 * Setup file. This runs for each test file
 */

import '@testing-library/jest-dom';
import './__mocks__/CSS';
import './__mocks__/Response';
import './__mocks__/matchMedia';

import { configure } from '@testing-library/react';
import failOnConsole from 'jest-fail-on-console';

// Fail a test if it calls console.error or console.log
failOnConsole();

/*
 * TEST: add a custom serializer for the SpecifyTable and
 *    LiteralField/Relationship objects
 */

configure({
  throwSuggestions: true,
});
