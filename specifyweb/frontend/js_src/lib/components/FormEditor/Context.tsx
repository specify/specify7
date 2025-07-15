import React from 'react';

/**
 * If true, form is rendered in a form editor. Disables auto focus and
 * adds edit controls. Not using FormEditorContext to prevent circular
 * dependency and to not needlessly increase main bundle size
 */
export const InFormEditorContext = React.createContext<boolean>(false);
InFormEditorContext.displayName = 'InFormEditorContext';
