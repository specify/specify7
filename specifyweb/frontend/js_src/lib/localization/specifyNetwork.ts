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
      'This map shows all occurrences of this taxon from iDigBio and GBIF.',
    'de-ch':
      'Diese Karte zeigt alle Vorkommen dieses Taxons aus iDigBio und GBIF.',
    'es-es': `
      Este mapa muestra todas las ocurrencias de este taxón de iDigBio y GBIF.
    `,
    'fr-fr': `
      Cette carte montre toutes les occurrences de ce taxon d'iDigBio et GBIF.
    `,
    'ru-ru':
      'На этой карте показаны все вхождения этого таксона из iDigBio и GBIF.',
    'uk-ua':
      'Ця карта показує всі випадки появи цього таксону з iDigBio та GBIF.',
  },
  iDigBioDescription: {
    'en-us': `
      iDigBio points are represented as green dots on the map. Of those, the
      occurrences published to iDigBio from the current collection are red.
    `,
    'de-ch': `
      Bitte vergewissern Sie sich, dass Ihr Browser keine Pop-up-Fenster
      blockiert, und versuchen Sie es erneut.
    `,
    'es-es': `
      Los puntos iDigBio se representan como puntos verdes en el mapa. De esas,
      las ocurrencias publicadas en iDigBio de la colección actual están en
      rojo.
    `,
    'fr-fr': `
      Les points iDigBio sont représentés par des points verts sur la carte.
      Parmi ceux-ci, les occurrences publiées sur iDigBio à partir de la
      collection actuelle sont rouges.
    `,
    'ru-ru': `
      Точки iDigBio представлены на карте зелеными точками. Из них вхождения,
      опубликованные в iDigBio из текущей коллекции, отмечены красным цветом.
    `,
    'uk-ua': `
      Точки iDigBio представлені на карті зеленими крапками. З них опубліковані
      в iDigBio випадки з поточної колекції червоні.
    `,
  },
  gbifDescription: {
    'en-us': `
      For GBIF data, individual points and clusters of points are shown as
      hexagons of different shading ranging from yellow to orange to red with
      the dark red hexagons corresponding to densest distributions of points.
    `,
    'de-ch': `
      Bei GBIF-Daten werden einzelne Punkte und Punktcluster als Sechsecke mit
      unterschiedlichen Schattierungen von Gelb über Orange bis Rot
      dargestellt, wobei die dunkelroten Sechsecke den dichtesten
      Punktverteilungen entsprechen.
    `,
    'es-es': `
      Para los datos de GBIF, los puntos individuales y los grupos de puntos se
      muestran como hexágonos de diferente sombreado que van desde el amarillo
      hasta el naranja y el rojo, y los hexágonos de color rojo oscuro
      corresponden a las distribuciones de puntos más densas.
    `,
    'fr-fr': `
      Pour les données GBIF, les points individuels et les groupes de points
      sont représentés par des hexagones de différentes nuances allant du jaune
      à l'orange au rouge, les hexagones rouge foncé correspondant aux
      distributions de points les plus denses.
    `,
    'ru-ru': `
      Для данных GBIF отдельные точки и группы точек показаны в виде
      шестиугольников разного оттенка от желтого до оранжевого и красного,
      причем темно-красные шестиугольники соответствуют наиболее плотному
      распределению точек.
    `,
    'uk-ua': `
      Для даних GBIF окремі точки та кластери точок показані у вигляді
      шестикутників різного відтінку від жовтого до оранжевого та червоного,
      причому темно-червоні шестикутники відповідають найщільнішому розподілу
      точок.
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
