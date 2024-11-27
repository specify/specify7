import { JSDOM } from 'jsdom';

// Create a new JSDOM instance
const { window } = new JSDOM('<!DOCTYPE html><p>Hello world</p>');

// Define window and other globals
globalThis.window = window;
globalThis.document = window.document;

// You can also define other browser-specific globals as needed
global.HTMLElement = window.HTMLElement;
global.XMLHttpRequest = window.XMLHttpRequest;
