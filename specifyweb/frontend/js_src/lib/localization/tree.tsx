import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./utils.tsx before editing this file

const treeText = createDictionary({
  badStructure: 'Bad tree structure.',

  // TreeContextMenu
  cancelAction: 'Cancel action',
  query: 'Query',
  view: 'View',
  edit: 'Edit',
  addChild: 'Add child',
  move: 'Move',
  merge: 'Merge',
  undoSynonymy: 'Undo Synonymy',
  synonymize: 'Synonymize',
  actionFailedDialogTitle: 'Failed',
  actionFailedDialogMessage:
    'The operation could not be completed due to the following:',
  moveNode: 'Move node',
  moveNodeHere: (nodeName: string) => `Move ${nodeName} here`,
  nodeMoveMessage: (treeName: string, nodeName: string, parentName: string) => `
    The ${treeName} node <em>${nodeName}</em> will be placed, along with
    all of its descendants, under the new parent <em>${parentName}</em>.`,
  nodeMoveHintMessage: (nodeName: string) =>
    `Right-click to select a new parent for <em>${nodeName}</em>.`,
  mergeNode: 'Merge node',
  mergeNodeHere: (nodeName: string) => `Merge ${nodeName} here`,
  mergeNodeHintMessage: (nodeName: string) =>
    `Right-click to select a target for <em>${nodeName}</em> to be merged
    into.`,
  mergeNodeMessage: (
    treeName: string,
    nodeName: string,
    parentName: string
  ) => `
    All references to ${treeName} node <em>${nodeName}</em> will be replaced
    with <em>${parentName}</em>, and all descendants of <em>${nodeName}</em>
    will be moved to <em>${parentName}</em> with any descendants matching
    in name and rank being themselves merged recursively.`,
  synonymizeNode: 'Synonymize node',
  makeSynonym: (nodeName: string, synonymName: string) =>
    `Make ${nodeName} a synonym of ${synonymName}`,
  synonymizeNodeHintMessage: (nodeName: string) =>
    `Right-click to select a target for <em>${nodeName}</em> to be
    synonymized to.`,
  synonymizeMessage: (
    treeName: string,
    nodeName: string,
    synonymName: string
  ) =>
    `The ${treeName} node <em>${nodeName}</em> will be made a synonym
    of <em>${synonymName}</em>.`,
  unsynonymizeNode: 'Unsynonymize node',
  unsynonymizeNodeMessage: (
    treeName: string,
    nodeName: string,
    synonymName: string
  ) =>
    `The ${treeName} node <em>${nodeName}</em> will no longer be a
    synonym of <em>${synonymName}</em>.`,

  // TreeNodeView
  acceptedName: 'Preferred:',

  // TreeView
  searchTreePlaceholder: 'Search Tree',
  remember: 'Remember',
  rememberButtonDescription: 'Save Tree Layout',
  restore: 'Restore',
  restoreButtonDescription: 'Display Saved Tree Layout',
  forget: 'Forget',
  forgetButtonDescription: 'Forget Saved Tree Layout',
});

export default treeText;
