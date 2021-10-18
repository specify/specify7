import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

const welcomeText = createDictionary({
  pageTitle: {
    'en-us': 'Welcome',
  },
  mainPage: {
    'en-us': 'Main Page',
  },
  aboutSpecifyButtonDescription: {
    'en-us': 'About Specify',
  },
  taxonTiles: {
    'en-us': 'Taxon Tiles',
  },
  taxonTilesDescription: {
    'en-us': (count: number) =>
      `Showing Taxa with ${count} or more Collection Objects`,
  },
  aboutSpecifyDialogTitle: {
    'en-us': 'About Specify',
  },
  fullAddress: {
    'en-us': `
      Specify Collections Consortium<br>
      Biodiversity Institute<br>
      University of Kansas<br>
      1345 Jayhawk Blvd.<br>
      Lawrence, KS 66045 USA`,
  },
  disclosure: {
    'en-us': `
      Specify Software is a product of the Specify Collections Consortium
      that is funded by its member institutions. Consortium Founding Members
      include: University of Michigan, University of Florida, Denmark
      Consortium of Museums, and the University of Kansas. The Consortium
      operates under the non-profit, 501(c)3, U.S. tax status of the University of
      Kansas Center for Research. Specify was supported previously by
      multiple awards from the U.S. National Science Foundation.`,
  },
  licence: {
    'en-us': `
      Specify 7 Copyright © 2021 University of Kansas Center for
      Research. Specify comes with ABSOLUTELY NO WARRANTY. This is
      free software licensed under GNU General Public License 2
      (GPL2).`,
  },
  systemInformation: {
    'en-us': 'System Information',
  },
  version: {
    'en-us': 'Version:',
  },
  specifySixVersion: {
    'en-us': 'Specify 6 Version:',
  },
  databaseVersion: {
    'en-us': 'Database Version:',
  },
  schemaVersion: {
    'en-us': 'Schema Version:',
  },
  databaseName: {
    'en-us': 'Database Name:',
  },
  institution: {
    'en-us': 'Institution:',
  },
  discipline: {
    'en-us': 'Discipline:',
  },
  collection: {
    'en-us': 'Collection:',
  },
  isaNumber: {
    'en-us': 'ISA Number:',
  },
  browser: {
    'en-us': 'Browser',
  },
});

export default welcomeText;
