import { createDictionary, createHeader } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

const treeText = createDictionary({
  badStructure: {
    'en-us': 'Bad tree structure.',
    'ru-ru': 'Bad tree structure.',
  },
  // TreeContextMenu
  cancelAction: {
    'en-us': 'Cancel action',
    'ru-ru': 'Cancel action',
  },
  merge: {
    'en-us': 'Merge',
    'ru-ru': 'Merge',
  },
  undoSynonymy: {
    'en-us': 'Undo Synonymy',
    'ru-ru': 'Undo Synonymy',
  },
  synonymize: {
    'en-us': 'Synonymize',
    'ru-ru': 'Synonymize',
  },
  actionFailedDialogTitle: {
    'en-us': 'Operation failed',
    'ru-ru': 'Operation failed',
  },
  actionFailedDialogHeader: {
    'en-us': createHeader('Operation failed'),
    'ru-ru': createHeader('Operation failed'),
  },
  actionFailedDialogMessage: {
    'en-us':
      'The operation could not be completed due to the following errors:',
    'ru-ru':
      'The operation could not be completed due to the following errors:',
  },
  moveNode: {
    'en-us': 'Move node',
    'ru-ru': 'Move node',
  },
  moveNodeHere: {
    'en-us': (nodeName: string) => `Move ${nodeName} here`,
    'ru-ru': (nodeName: string) => `Move ${nodeName} here`,
  },
  nodeMoveMessage: {
    'en-us': (treeName: string, nodeName: string, parentName: string) => `
      The ${treeName} node <em>${nodeName}</em> will be placed, along with
      all of its descendants, under the new parent <em>${parentName}</em>.`,
    'ru-ru': (treeName: string, nodeName: string, parentName: string) => `
      The ${treeName} node <em>${nodeName}</em> will be placed, along with
      all of its descendants, under the new parent <em>${parentName}</em>.`,
  },
  nodeMoveHintMessage: {
    'en-us': (nodeName: string) =>
      `Right-click to select a new parent for <em>${nodeName}</em>.`,
    'ru-ru': (nodeName: string) =>
      `Right-click to select a new parent for <em>${nodeName}</em>.`,
  },
  mergeNode: {
    'en-us': 'Merge node',
    'ru-ru': 'Merge node',
  },
  mergeNodeHere: {
    'en-us': (nodeName: string) => `Merge ${nodeName} here`,
    'ru-ru': (nodeName: string) => `Merge ${nodeName} here`,
  },
  mergeNodeHintMessage: {
    'en-us': (nodeName: string) =>
      `Right-click to select a target for <em>${nodeName}</em> to be merged
    into.`,
    'ru-ru': (nodeName: string) =>
      `Right-click to select a target for <em>${nodeName}</em> to be merged
    into.`,
  },
  mergeNodeMessage: {
    'en-us': (treeName: string, nodeName: string, parentName: string) => `
      All references to ${treeName} node <em>${nodeName}</em> will be replaced
      with <em>${parentName}</em>, and all descendants of <em>${nodeName}</em>
      will be moved to <em>${parentName}</em> with any descendants matching
      in name and rank being themselves merged recursively.`,
    'ru-ru': (treeName: string, nodeName: string, parentName: string) => `
      All references to ${treeName} node <em>${nodeName}</em> will be replaced
      with <em>${parentName}</em>, and all descendants of <em>${nodeName}</em>
      will be moved to <em>${parentName}</em> with any descendants matching
      in name and rank being themselves merged recursively.`,
  },
  synonymizeNode: {
    'en-us': 'Synonymize node',
    'ru-ru': 'Synonymize node',
  },
  makeSynonym: {
    'en-us': (nodeName: string, synonymName: string) =>
      `Make ${nodeName} a synonym of ${synonymName}`,
    'ru-ru': (nodeName: string, synonymName: string) =>
      `Make ${nodeName} a synonym of ${synonymName}`,
  },
  synonymizeNodeHintMessage: {
    'en-us': (nodeName: string) =>
      `Right-click to select a target for <em>${nodeName}</em> to be
      synonymized to.`,
    'ru-ru': (nodeName: string) =>
      `Right-click to select a target for <em>${nodeName}</em> to be
      synonymized to.`,
  },
  synonymizeMessage: {
    'en-us': (treeName: string, nodeName: string, synonymName: string) =>
      `The ${treeName} node <em>${nodeName}</em> will be made a synonym
      of <em>${synonymName}</em>.`,
    'ru-ru': (treeName: string, nodeName: string, synonymName: string) =>
      `The ${treeName} node <em>${nodeName}</em> will be made a synonym
      of <em>${synonymName}</em>.`,
  },
  unsynonymizeNode: {
    'en-us': 'Unsynonymize node',
    'ru-ru': 'Unsynonymize node',
  },
  unsynonymizeNodeMessage: {
    'en-us': (treeName: string, nodeName: string, synonymName: string) =>
      `The ${treeName} node <em>${nodeName}</em> will no longer be a
      synonym of <em>${synonymName}</em>.`,
    'ru-ru': (treeName: string, nodeName: string, synonymName: string) =>
      `The ${treeName} node <em>${nodeName}</em> will no longer be a
      synonym of <em>${synonymName}</em>.`,
  },
  // TreeNodeView
  acceptedName: {
    'en-us': 'Preferred:',
    'ru-ru': 'Preferred:',
  },
  // TreeView
  treeViewTitle: {
    'en-us': (treeName: string) => `${treeName} Tree`,
    'ru-ru': (treeName: string) => `${treeName} Tree`,
  },
  searchTreePlaceholder: {
    'en-us': 'Search Tree',
    'ru-ru': 'Search Tree',
  },
  remember: {
    'en-us': 'Remember',
    'ru-ru': 'Remember',
  },
  rememberButtonDescription: {
    'en-us': 'Save Tree Layout',
    'ru-ru': 'Save Tree Layout',
  },
  restore: {
    'en-us': 'Restore',
    'ru-ru': 'Restore',
  },
  restoreButtonDescription: {
    'en-us': 'Display Saved Tree Layout',
    'ru-ru': 'Display Saved Tree Layout',
  },
  forget: {
    'en-us': 'Forget',
    'ru-ru': 'Forget',
  },
  forgetButtonDescription: {
    'en-us': 'Forget Saved Tree Layout',
    'ru-ru': 'Forget Saved Tree Layout',
  },
  opened: {
    'en-us': 'Opened',
    'ru-ru': 'Opened',
  },
  closed: {
    'en-us': 'Closed',
    'ru-ru': 'Closed',
  },
  leafNode: {
    'en-us': 'Leaf Node',
    'ru-ru': 'Leaf Node',
  },
});

export default treeText;
