import { JSDOM } from 'jsdom';

// Create a new JSDOM instance
/**
 * FEATURE: Allow customizing the JSDOM userAgent, platform, and other global
 * properties
 * See https://github.com/jsdom/jsdom#advanced-configuration
 * See https://github.com/specify/specify7/pull/5389
 */
const { window } = new JSDOM('<!DOCTYPE html><p>Hello world</p>');

// Define window and other globals
globalThis.window = window;
globalThis.document = window.document;

// You can also define other browser-specific globals as needed
global.HTMLElement = window.HTMLElement;
global.XMLHttpRequest = window.XMLHttpRequest;
