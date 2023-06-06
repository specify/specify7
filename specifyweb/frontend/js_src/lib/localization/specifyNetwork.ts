/**
 * Localization strings for the Specify Network integration
 */

import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

export const specifyNetworkText = createDictionary({
  specifyNetwork: {
    'en-us': 'Specify Network',
    'ru-ru': 'Specify Network',
    'es-es': 'Specify red',
    'fr-fr': 'Réseau Specify',
    'uk-ua': 'Specify Network',
    'de-ch': 'Specify Network',
  },
  occurrenceOrGuidRequired: {
    'en-us': 'Species Name or GUID must be provided to display this page',
    'de-ch': `
      Um diese Seite anzuzeigen, muss der Artname oder die GUID angegeben werden
    `,
    'es-es': `
      Se debe proporcionar el nombre de la especie o GUID para mostrar esta
      página
    `,
    'fr-fr': `
      Le nom de l'espèce ou le GUID doit être fourni pour afficher cette page
    `,
    'ru-ru': `
      Для отображения этой страницы необходимо указать название вида или GUID.
    `,
    'uk-ua':
      'Щоб відобразити цю сторінку, необхідно вказати назву виду або GUID',
  },
  noDataError: {
    'en-us': 'Unable to find any data for this request',
    'de-ch': 'Für diese Anfrage konnten keine Daten gefunden werden',
    'es-es': 'No se puede encontrar ningún dato para esta solicitud',
    'fr-fr': 'Impossible de trouver des données pour cette demande',
    'ru-ru': 'Не удалось найти данные для этого запроса',
    'uk-ua': 'Неможливо знайти дані для цього запиту',
  },
  noDataErrorDescription: {
    'en-us': 'Please try searching for a different record',
    'de-ch': 'Versuchen Sie bitte, nach einem anderen Datensatz zu suchen',
    'es-es': 'Intente buscar un registro diferente',
    'fr-fr': 'Veuillez essayer de rechercher un autre enregistrement',
    'ru-ru': 'Пожалуйста, попробуйте найти другую запись',
    'uk-ua': 'Будь ласка, спробуйте знайти інший запис',
  },
  dataQuality: {
    'en-us': 'Data Quality',
    'de-ch': 'Datenqualität',
    'es-es': 'Calidad de datos',
    'fr-fr': 'Qualité des données',
    'ru-ru': 'Качество данных',
    'uk-ua': 'Якість даних',
  },
  reportedBy: {
    'en-us': 'Reported by {provider:string}',
    'de-ch': 'Gemeldet von {provider:string}',
    'es-es': 'Reportado por {provider:string}',
    'fr-fr': 'Signalé par {provider:string}',
    'ru-ru': 'Об этом сообщил {provider:string}',
    'uk-ua': 'Повідомив {provider:string}',
  },
  collectionDate: {
    'en-us': 'Collection Date',
    'de-ch': 'Abholtermin',
    'es-es': 'Fecha de colección',
    'fr-fr': 'Date de collecte',
    'ru-ru': 'Дата сбора',
    'uk-ua': 'Дата збору',
  },
  mapDetails: {
    'en-us': 'Details',
    'de-ch': 'Einzelheiten',
    'es-es': 'Detalles',
    'fr-fr': 'Détails',
    'ru-ru': 'Подробности',
    'uk-ua': 'Подробиці',
  },
  mapDescription: {
    'en-us':
      'This map shows occurrences of this taxon from the iDigBio and GBIF aggregators.',
  },
  iDigBioDescription: {
    'en-us': `
      Occurrences recorded in iDigBio are shown as round green points, except for those from the current collection recorded in iDigBio that are round red points. Zooming in on the red points brings up a blue teardrop pin, clicking on the pin executes a locality query in Specify that shows all of the species in the current Specify database collected from that location.
    `,
  },
  gbifDescription: {
    'en-us': `
      For GBIF data, individual points and clusters of points are shown as hexagons of different colors ranging from yellow to orange to red. Dark red hexagons corresponding to densest distributions of collected specimens of that species.
    `,
  },
  connectToGbif: {
    'en-us': 'Connect to GBIF',
    'de-ch': 'Stellen Sie eine Verbindung zu GBIF her',
    'es-es': 'Conéctese a GBIF',
    'fr-fr': 'Connectez-vous au GBIF',
    'ru-ru': 'Подключиться к GBIF',
    'uk-ua': 'Підключіться до GBIF',
  },
  searchForInstitution: {
    'en-us': 'Search for your institution:',
    'de-ch': 'Suchen Sie nach Ihrer Institution:',
    'es-es': 'Busque su institución:',
    'fr-fr': 'Recherchez votre établissement :',
    'ru-ru': 'Найдите свое учреждение:',
    'uk-ua': 'Шукайте свій заклад:',
  },
  institutionDistributionMap: {
    'en-us': `
      Distribution map of all of the digitized specimens curated in your
      Institution
    `,
    'de-ch': `
      Verbreitungskarte aller in Ihrer Institution kuratierten digitalisierten
      Exemplare
    `,
    'es-es': `
      Mapa de distribución de todos los especímenes digitalizados curados en su
      Institución
    `,
    'fr-fr': `
      Carte de distribution de tous les spécimens numérisés conservés dans votre
      institution
    `,
    'ru-ru': `
      Карта распределения всех оцифрованных образцов, хранящихся в вашем
      учреждении
    `,
    'uk-ua': `
      Карта розповсюдження всіх оцифрованих зразків, курованих у вашій установі
    `,
  },
  collectionDistributionMap: {
    'en-us': `
      Distribution map of all of the digitized specimens curated in your
      Collection
    `,
    'de-ch': `
      Verbreitungskarte aller in Ihrer Sammlung kuratierten digitalisierten
      Exemplare
    `,
    'es-es': `
      Mapa de distribución de todos los especímenes digitalizados conservados en
      su Colección
    `,
    'fr-fr': `
      Carte de distribution de tous les spécimens numérisés conservés dans votre
      collection
    `,
    'ru-ru': `
      Карта распределения всех оцифрованных образцов, хранящихся в вашей
      коллекции.
    `,
    'uk-ua': 'Карта розповсюдження всіх оцифрованих зразків у вашій колекції',
  },
  startYear: {
    'en-us': 'Start Year',
    'de-ch': 'Startjahr',
    'es-es': 'Año de inicio',
    'fr-fr': 'Année de début',
    'ru-ru': 'Год начала',
    'uk-ua': 'Рік початку',
  },
  endYear: {
    'en-us': 'End Year',
    'de-ch': 'Jahresende',
    'es-es': 'Año final',
    'fr-fr': "Fin d'année",
    'ru-ru': 'Конец года',
    'uk-ua': 'Кінцевий рік',
  },
} as const);
