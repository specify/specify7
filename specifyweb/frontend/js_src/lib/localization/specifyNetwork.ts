/**
 * Localization strings for the Specify Network integration
 */

import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

export const specifyNetworkText = createDictionary({
  specifyNetwork: {
    'en-us': 'Specify Network',
    'ru-ru': 'Укажите сеть',
    'es-es': 'Specify red',
    'fr-fr': 'Réseau Specify',
    'uk-ua': 'Specify Network',
    'de-ch': 'Specify Network',
  },
  occurrenceOrGuidRequired: {
    'en-us': 'Species Name or GUID must be provided to display this page',
    'de-ch': `
      Zur Anzeige dieser Seite muss der Artenname oder die GUID angegeben werden
    `,
    'es-es': `
      Se debe proporcionar el nombre de especie o el GUID para mostrar esta
      página
    `,
    'fr-fr': `
      Le nom de l'espèce ou le GUID doit être fourni pour afficher cette page.
    `,
    'ru-ru': `
      Для отображения этой страницы необходимо указать название вида или GUID.
    `,
    'uk-ua':
      'Щоб відобразити цю сторінку, потрібно вказати назву виду або GUID',
  },
  noDataError: {
    'en-us': 'Unable to find any data for this request',
    'de-ch': 'Zu dieser Anfrage konnten keine Daten gefunden werden',
    'es-es': 'No se encuentran datos para esta solicitud',
    'fr-fr': 'Impossible de trouver des données pour cette demande',
    'ru-ru': 'Не удалось найти данные для этого запроса.',
    'uk-ua': 'Неможливо знайти дані для цього запиту',
  },
  noDataErrorDescription: {
    'en-us': 'Please try searching for a different record',
    'de-ch': 'Bitte versuchen Sie, nach einem anderen Datensatz zu suchen',
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
    'fr-fr': 'Rapporté par {provider:string}',
    'ru-ru': 'Сообщил {provider:string}',
    'uk-ua': 'Повідомив {provider:string}',
  },
  collectionDate: {
    'en-us': 'Collection Date',
    'de-ch': 'Abholtermin',
    'es-es': 'Fecha de colecta',
    'fr-fr': 'Date de collecte',
    'ru-ru': 'Дата сбора',
    'uk-ua': 'Дата збору',
  },
  mapDescription: {
    'en-us': `
      This map shows occurrences of this taxon from the iDigBio and GBIF
      aggregators.
    `,
    'de-ch': `
      Diese Karte zeigt Vorkommen dieses Taxons aus den Aggregatoren iDigBio und
      GBIF.
    `,
    'es-es': `
      Este mapa muestra los registros de este taxón en los agregadores iDigBio y
      GBIF.
    `,
    'fr-fr': `
      Cette carte montre les occurrences de ce taxon provenant des agrégateurs
      iDigBio et GBIF.
    `,
    'ru-ru': `
      На этой карте показано появление этого таксона в агрегаторах iDigBio и
      GBIF.
    `,
    'uk-ua': `
      Ця карта показує випадки появи цього таксону з агрегаторів iDigBio та
      GBIF.
    `,
  },
  iDigBioDescription: {
    'en-us': `
      Occurrences recorded in iDigBio are shown as round green points, except
      for those from the current collection recorded in iDigBio that are round
      red points. Zooming in on the red points brings up a blue teardrop pin,
      clicking on the pin executes a locality query in Specify that shows all of
      the species in the current Specify database collected from that location.
    `,
    'de-ch': `
      In iDigBio erfasste Vorkommen werden als runde grüne Punkte angezeigt, mit
      Ausnahme der Vorkommen aus der aktuellen in iDigBio erfassten Sammlung,
      die runde rote Punkte sind. Wenn Sie die roten Punkte vergrößern, wird
      eine blaue Stecknadel in Tropfenform angezeigt. Wenn Sie auf die
      Stecknadel klicken, wird in Specify eine Standortabfrage ausgeführt, die
      alle Arten in der aktuellen Specify-Datenbank anzeigt, die an diesem
      Standort gesammelt wurden.
    `,
    'es-es': `
      Los registros recogidos en iDigBio se muestran como puntos verdes
      redondos, excepto los de esta colección, registrados en iDigBio, que son
      puntos rojos redondos. Al acercarse a los puntos rojos, aparece una
      chincheta en forma de lágrima azul; al hacer clic en la chincheta, se
      ejecuta una consulta de localidad en Specify que muestra todas las
      especies en la base de datos actual de Specify colectadas en esa
      localización.
    `,
    'fr-fr': `
      Les occurrences enregistrées dans iDigBio sont représentées par des points
      verts ronds, à l'exception de celles de la collection actuelle
      enregistrées dans iDigBio qui sont des points rouges ronds. Un zoom avant
      sur les points rouges fait apparaître une épingle en forme de larme
      bleue, un clic sur l'épingle exécute une requête de localité dans Specify
      qui affiche toutes les espèces de la base de données Specify actuelle
      collectée à partir de cet emplacement.
    `,
    'ru-ru': `
      Вхождения, записанные в iDigBio, отображаются круглыми зелеными точками,
      за исключением событий из текущей коллекции, записанных в iDigBio, которые
      имеют круглые красные точки. При увеличении красных точек появляется
      синяя каплевидная булавка, щелчок по ней вызывает запрос местоположения в
      Specify, который показывает все виды в текущей базе данных Specify,
      собранные из этого местоположения.
    `,
    'uk-ua': `
      Випадки, записані в iDigBio, відображаються круглими зеленими точками, за
      винятком випадків із поточної колекції, записаної в iDigBio, які мають
      круглі червоні точки. Збільшення масштабу червоних крапок відкриває
      блакитну шпильку-сльозинку, клацання шпильки виконує запит місцевості в
      Specify, який показує всі види в поточній базі даних Specify, зібрані з
      цього місця.
    `,
  },
  gbifDescription: {
    'en-us': `
      For GBIF data, individual points and clusters of points are shown as
      hexagons of different colors ranging from yellow to orange to red. Dark
      red hexagons corresponding to densest distributions of collected specimens
      of that species.
    `,
    'de-ch': `
      Bei GBIF-Daten werden einzelne Punkte und Punktcluster als Sechsecke in
      unterschiedlichen Farben von Gelb über Orange bis Rot angezeigt.
      Dunkelrote Sechsecke entsprechen der dichtesten Verteilung gesammelter
      Exemplare dieser Art.
    `,
    'es-es': `
      Para los datos de GBIF, los puntos individuales y los grupos de puntos se
      muestran como hexágonos de diferentes colores que van del amarillo al
      naranja y al rojo. Hexágonos de color rojo oscuro que corresponden a las
      distribuciones más densas de especímenes colectados de esa especie.
    `,
    'fr-fr': `
      Pour les données GBIF, les points individuels et les groupes de points
      sont représentés sous forme d'hexagones de différentes couleurs allant du
      jaune à l'orange en passant par le rouge. Hexagones rouge foncé
      correspondant aux distributions les plus denses de spécimens collectés de
      cette espèce.
    `,
    'ru-ru': `
      Для данных GBIF отдельные точки и группы точек отображаются в виде
      шестиугольников разного цвета: от желтого до оранжевого и красного.
      Темно-красные шестиугольники соответствуют наиболее плотному
      распространению собранных экземпляров этого вида.
    `,
    'uk-ua': `
      Для даних GBIF окремі точки та кластери точок відображаються у вигляді
      шестикутників різних кольорів від жовтого до оранжевого та червоного.
      Темно-червоні шестикутники відповідають найщільнішому розподілу зібраних
      зразків цього виду.
    `,
  },
  connectToGbif: {
    'en-us': 'Connect to GBIF',
    'de-ch': 'Mit GBIF verbinden',
    'es-es': 'Conectarse a GBIF',
    'fr-fr': 'Connectez-vous au GBIF',
    'ru-ru': 'Подключиться к GBIF',
    'uk-ua': 'Підключіться до GBIF',
  },
  searchForInstitution: {
    'en-us': 'Search for your institution:',
    'de-ch': 'Mit GBIF verbinden',
    'es-es': 'Busque su institución:',
    'fr-fr': 'Connectez-vous au GBIF',
    'ru-ru': 'Подключиться к ГБИФ',
    'uk-ua': 'Підключіться до GBIF',
  },
  institutionDistributionMap: {
    'en-us': `
      Distribution map of all of the digitized specimens curated in your
      Institution
    `,
    'de-ch': `
      Verbreitungskarte aller digitalisierten Exemplare, die in Ihrer
      Institution kuratiert werden
    `,
    'es-es': `
      Mapa de distribución de todos los ejemplares digitalizados conservados en
      su Institución
    `,
    'fr-fr': `
      Carte de répartition de tous les spécimens numérisés conservés dans votre
      institution
    `,
    'ru-ru': `
      Карта распространения всех оцифрованных образцов, хранящихся в вашем
      учреждении
    `,
    'uk-ua': `
      Карта розповсюдження всіх оцифрованих зразків, збережених у вашій установі
    `,
  },
  collectionDistributionMap: {
    'en-us': `
      Distribution map of all of the digitized specimens curated in your
      Collection
    `,
    'de-ch': 'Verbreitungskarte aller digitalisierten Exemplare Ihrer Sammlung',
    'es-es': `
      Mapa de distribución de todos los ejemplares digitalizados conservados en
      su Colección
    `,
    'fr-fr': `
      Carte de répartition de tous les spécimens numérisés conservés dans votre
      collection
    `,
    'ru-ru': `
      Карта распространения всех оцифрованных образцов, хранящихся в вашей
      коллекции.
    `,
    'uk-ua': `
      Карта розповсюдження всіх оцифрованих зразків, збережених у вашій колекції
    `,
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
    'de-ch': 'Ende des Jahres',
    'es-es': 'Año final',
    'fr-fr': "Fin d'année",
    'ru-ru': 'Конец года',
    'uk-ua': 'Кінцевий рік',
  },
} as const);
