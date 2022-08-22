/**
 * Setup file. This runs for each test file
 */

import './__mocks__/CSS';
import './__mocks__/Response';

import failOnConsole from 'jest-fail-on-console';
import { configure } from '@testing-library/dom';

// Fail a test if it calls console.error or console.log
failOnConsole();

/*
 * TEST: add a custom serializer for the SpecifyModel and
 *    LiteralField/Relationship objects
 */

configure({
  throwSuggestions: true,
});
