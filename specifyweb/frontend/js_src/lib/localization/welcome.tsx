/**
 * Localization strings for the welcome screen
 *
 * @module
 */

import React from 'react';

import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

export const welcomeText = createDictionary({
  pageTitle: {
    'en-us': 'Welcome',
    'ru-ru': 'Добро пожаловать',
    ca: 'Welcome',
    'es-es': 'Welcome',
  },
  aboutSpecify: {
    'en-us': 'About Specify 7',
    'ru-ru': 'О Specify 7',
    ca: 'About Specify 7',
    'es-es': 'About Specify 7',
  },
  taxonTiles: {
    'en-us': 'Taxon Tiles',
    'ru-ru': 'Плитки таксонов',
    ca: 'Taxon Tiles',
    'es-es': 'Taxon Tiles',
  },
  taxonTilesDescription: {
    'en-us': (count: number) =>
      `Showing Taxa with ${count} or more Collection Objects`,
    'ru-ru': (count: number) =>
      `Показаны таксоны с ${count} или более экземплярами`,
    ca: (count: number) =>
      `Showing Taxa with ${count} or more Collection Objects`,
    'es-es': (count: number) =>
      `Showing Taxa with ${count} or more Collection Objects`,
  },
  fullAddress: {
    'en-us': (
      <>
        Specify Collections Consortium
        <br />
        Biodiversity Institute
        <br />
        University of Kansas
        <br />
        1345 Jayhawk Blvd.
        <br />
        Lawrence, KS 66045 USA
      </>
    ),
    'ru-ru': (
      <>
        Specify Collections Consortium
        <br />
        Biodiversity Institute
        <br />
        University of Kansas
        <br />
        1345 Jayhawk Blvd.
        <br />
        Lawrence, KS 66045 USA
      </>
    ),
    ca: (
      <>
        Specify Collections Consortium
        <br />
        Biodiversity Institute
        <br />
        University of Kansas
        <br />
        1345 Jayhawk Blvd.
        <br />
        Lawrence, KS 66045 USA
      </>
    ),
    'es-es': (
      <>
        Specify Collections Consortium
        <br />
        Biodiversity Institute
        <br />
        University of Kansas
        <br />
        1345 Jayhawk Blvd.
        <br />
        Lawrence, KS 66045 USA
      </>
    ),
  },
  disclosure: {
    'en-us': `
      Specify software is a product of the Specify Collections Consortium that
      is governed and funded by its member institutions. Consortium Founding
      Members include: Commonwealth Scientific and Industrial Research
      Organisation (CSIRO), Denmark Consortium of Museums, University of
      Florida, University of Kansas, and University of Michigan. The Consortium
      operates under the non-profit, 501(c)3, U.S. tax status of the University
      of Kansas Center for Research. Specify was supported from 1996 to 2018 by
      grants from the U.S. National Science Foundation.`,
    'ru-ru': `
      Specify software является продуктом консорциума Specify Collections.
      который управляется и финансируется организациями-членами.
      Члены-учредители консорциума включают: Commonwealth Scientific and
      Industrial Research Organisation (CSIRO), University of Michigan,
      University of Florida, Denmark Consortium of Museums и University of
      Kansas. Консорциум действует под некоммерческой организацией, 501(c)3,
      налоговым статусом США университета University of Kansas. Specify
      поддерживался с 1996 по 2018 год грантами фонда U.S. National Science 
      Foundation.`,
    ca: `
      Specify software is a product of the Specify Collections Consortium that
      is governed and funded by its member institutions. Consortium Founding
      Members include: Commonwealth Scientific and Industrial Research
      Organisation (CSIRO), Denmark Consortium of Museums, University of
      Florida, University of Kansas, and University of Michigan. The Consortium
      operates under the non-profit, 501(c)3, U.S. tax status of the University
      of Kansas Center for Research. Specify was supported from 1996 to 2018 by
      grants from the U.S. National Science Foundation.`,
    'es-es': `
      Specify software is a product of the Specify Collections Consortium that
      is governed and funded by its member institutions. Consortium Founding
      Members include: Commonwealth Scientific and Industrial Research
      Organisation (CSIRO), Denmark Consortium of Museums, University of
      Florida, University of Kansas, and University of Michigan. The Consortium
      operates under the non-profit, 501(c)3, U.S. tax status of the University
      of Kansas Center for Research. Specify was supported from 1996 to 2018 by
      grants from the U.S. National Science Foundation.`,
  },
  licence: {
    'en-us': `
      Specify 7, Copyright 2022, University of Kansas Center for Research.
      Specify comes with ABSOLUTELY NO WARRANTY. This is free, open-source
      software licensed under GNU General Public License v2.`,
    'ru-ru': `
      Specify 7, Авторские права 2022, University of Kansas для исследования.
      Specify поставляется с СОВЕРШЕННО ОТСУТСТВИЕМ ГАРАНТИИ. Это
      бесплатное программное обеспечение с открытым исходным кодом под лицензией
      GNU General Public License v2.`,
    ca: `
      Specify 7, Copyright 2022, University of Kansas Center for Research.
      Specify comes with ABSOLUTELY NO WARRANTY. This is free, open-source
      software licensed under GNU General Public License v2.`,
    'es-es': `
      Specify 7, Copyright 2022, University of Kansas Center for Research.
      Specify comes with ABSOLUTELY NO WARRANTY. This is free, open-source
      software licensed under GNU General Public License v2.`,
  },
  systemInformation: {
    'en-us': 'System Information',
    'ru-ru': 'Системная информация',
    ca: 'System Information',
    'es-es': 'System Information',
  },
  specifyVersion: {
    'en-us': 'Specify 7 Version:',
    'ru-ru': 'Specify 7 Версия:',
    ca: 'Specify 7 Version:',
    'es-es': 'Specify 7 Version:',
  },
  specifySixVersion: {
    'en-us': 'Specify 6 Version:',
    'ru-ru': 'Specify 6 Версия:',
    ca: 'Specify 6 Version:',
    'es-es': 'Specify 6 Version:',
  },
  databaseVersion: {
    'en-us': 'Database Version:',
    'ru-ru': 'Версия базы данных:',
    ca: 'Database Version:',
    'es-es': 'Database Version:',
  },
  schemaVersion: {
    'en-us': 'DB Schema Version:',
    'ru-ru': 'Версия схемы базы данных:',
    ca: 'DB Schema Version:',
    'es-es': 'DB Schema Version:',
  },
  databaseName: {
    'en-us': 'Database Name:',
    'ru-ru': 'Имя базы данных:',
    ca: 'Database Name:',
    'es-es': 'Database Name:',
  },
  discipline: {
    'en-us': 'Discipline:',
    'ru-ru': 'Дисциплина:',
    ca: 'Discipline:',
    'es-es': 'Discipline:',
  },
  isaNumber: {
    'en-us': 'ISA Number:',
    'ru-ru': 'Номер ISA:',
    ca: 'ISA Number:',
    'es-es': 'ISA Number:',
  },
  browser: {
    'en-us': 'Browser:',
    'ru-ru': 'Браузер:',
    ca: 'Browser:',
    'es-es': 'Browser:',
  },
  // TODO:
  databaseCreationDate: {
    'en-us': 'DB Creation Date:',
    'ru-ru': 'DB Creation Date:',
    ca: 'DB Creation Date:',
    'es-es': 'DB Creation Date:',
  },
});
