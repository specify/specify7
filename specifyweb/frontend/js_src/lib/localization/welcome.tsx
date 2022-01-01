import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

const welcomeText = createDictionary({
  pageTitle: 'Welcome',

  taxonTiles: 'Taxon Tiles',
  taxonTilesDescription: (count: number) =>
    `Showing Taxa with ${count} or more Collection Objects`,

  aboutSpecifyDialogTitle: 'About Specify',
  fullAddress: `
    Specify Collections Consortium<br>
    Biodiversity Institute<br>
    University of Kansas<br>
    1345 Jayhawk Blvd.<br>
    Lawrence, KS 66045 USA`,
  disclosure: `
    Specify Software is a product of the Specify Collections Consortium
    that is funded by its member institutions. Consortium Founding Members
    include: University of Michigan, University of Florida, Denmark
    Consortium of Museums, and the University of Kansas. The Consortium
    operates under the non-profit, 501(c)3, U.S. tax status of the University of
    Kansas Center for Research. Specify was supported previously by
    multiple awards from the U.S. National Science Foundation.`,
  licence: `
    Specify 7 Copyright © 2022 University of Kansas Center for
    Research. Specify comes with ABSOLUTELY NO WARRANTY. This is
    free software licensed under GNU General Public License 2
    (GPL2).`,
  systemInformation: 'System Information',
  version: 'Version:',
  specifySixVersion: 'Specify 6 Version:',
  databaseVersion: 'Database Version:',
  schemaVersion: 'Schema Version:',
  databaseName: 'Database Name:',
  institution: 'Institution:',
  discipline: 'Discipline:',
  collection: 'Collection:',
  isaNumber: 'ISA Number:',
  browser: 'Browser',
});

export default welcomeText;
