/**
 * Localization strings for the Data Views component
 *
 * @module
 */

import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

export const dataViewsText = createDictionary({
  dataViewsTitle: {
    comment: 'The name of the component',
    'en-us': 'Data Views',
    'de-ch': 'dataViewsTitle',
    'es-es': 'dataViewsTítulo',
    'fr-fr': 'dataViewsTitre',
    'hr-hr': 'Naslov prikaza podataka',
    nb: 'dataViewsTittel',
    'pt-br': 'títuloDasVisualizaçõesDeDados',
    'ru-ru': 'dataViewsTitle',
    'uk-ua': 'dataViewsTitle',
  },
  tableRecords: {
    comment: 'Used as a dialog header within the Data Views component',
    'en-us': '{tableLabel:string} Records',
    'de-ch': 'tableRecords',
    'es-es': 'registros de tabla',
    'fr-fr': 'tableRecords',
    'hr-hr': 'Zapisi tablice',
    nb: 'tabellOppføringer',
    'pt-br': 'registros da tabela',
    'ru-ru': 'tableRecords',
    'uk-ua': 'tableRecords',
  },
  configureDataViews: {
    'en-us': 'Configure {dataViews:string} tables',
    'de-ch': 'Datenansichten konfigurieren',
    'es-es': 'configurarDataViews',
    'fr-fr': 'configurerDataViews',
    'hr-hr': 'configureDataViews',
    nb: 'configureDataViews',
    'pt-br': 'configurarVisualizaçõesDeDados',
    'ru-ru': 'configureDataViews',
    'uk-ua': 'configureDataViews',
  },
  dataViewQueries: {
    comment: 'The name of the Data View query app resource type',
    'en-us': 'Data View Queries',
    'de-ch': 'dataViewQueries',
    'es-es': 'Consultas de vista de datos',
    'fr-fr': 'Requêtes dataView',
    'hr-hr': 'upiti za prikaz podataka',
    nb: 'dataViewQueries',
    'pt-br': 'consultas de visualização de dados',
    'ru-ru': 'dataViewQueries',
    'uk-ua': 'Запити на перегляд даних',
  },
  splitViewByDefault: {
    'en-us': 'Enable {splitView:string} by default',
    'de-ch': 'splitViewByDefault',
    'es-es': 'splitViewByDefault',
    'fr-fr': 'splitViewByDefault',
    'hr-hr': 'splitViewByDefault',
    nb: 'deltVisningByStandard',
    'pt-br': 'splitViewByDefault',
    'ru-ru': 'splitViewByDefault',
    'uk-ua': 'splitViewByDefault',
  },
  configureQuery: {
    'en-us': 'Configure query',
    'de-ch': 'configureQuery',
    'es-es': 'configurarConsulta',
    'fr-fr': 'configureQuery',
    'hr-hr': 'configureQuery',
    nb: 'configureQuery',
    'pt-br': 'configureQuery',
    'ru-ru': 'configureQuery',
    'uk-ua': 'configureQuery',
  },
  splitViewDescription: {
    'en-us':
      '{splitView:string} displays query results alongside a record preview, allowing you to review records without leaving the results list.',
    'de-ch': 'Beschreibung der geteilten Ansicht',
    'es-es': 'Descripción de la vista dividida',
    'fr-fr': 'description de splitView',
    'hr-hr': 'Opis splitViewa',
    nb: 'splitViewBeskrivelse',
    'pt-br': 'Descrição da visualização dividida',
    'ru-ru': 'splitViewDescription',
    'uk-ua': 'Опис splitView',
  },
  splitViewOrientation: {
    'en-us': 'Default {splitView:string} orientation',
    'de-ch': 'splitViewOrientation',
    'es-es': 'orientación de vista dividida',
    'fr-fr': 'splitViewOrientation',
    'hr-hr': 'podijeljena orijentacija prikaza',
    nb: 'splitViewOrientation',
    'pt-br': 'orientação de visualização dividida',
    'ru-ru': 'splitViewOrientation',
    'uk-ua': 'splitViewOrientation',
  },
} as const);
