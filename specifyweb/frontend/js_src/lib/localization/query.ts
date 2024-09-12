/**
 * Localization strings from the query builder
 *
 * @module
 */

import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

export const queryText = createDictionary({
  query: {
    'en-us': 'Query',
    'ru-ru': 'Запрос',
    'es-es': 'Consulta',
    'fr-fr': 'Requête',
    'uk-ua': 'Запит',
    'de-ch': 'Abfrage',
  },
  queries: {
    'en-us': 'Queries',
    'ru-ru': 'Запросы',
    'es-es': 'Consultas',
    'fr-fr': 'Requêtes',
    'uk-ua': 'Запити',
    'de-ch': 'Abfragen',
  },
  queryBuilder: {
    'en-us': 'Query Builder',
    'ru-ru': 'Конструктор запросов',
    'es-es': 'Generador de consultas',
    'fr-fr': 'Générateur de requêtes',
    'uk-ua': 'Конструктор запитів',
    'de-ch': 'Query Builder',
  },
  newQueryName: {
    'en-us': 'New Query',
    'es-es': 'Nueva consulta',
    'uk-ua': 'Новий запит',
    'de-ch': 'Neue Abfrage',
    'fr-fr': 'Nouvelle requête',
    'ru-ru': 'Новый запрос',
  },
  searchFields: {
    comment: `
      Used in a Query Combo Box's hover-over message to show which fields are
      being searched on
    `,
    'en-us': 'Searched fields',
    'ru-ru': 'Поля поиска',
    'es-es': 'Campos buscados',
    'fr-fr': 'Champs recherchés',
    'uk-ua': 'Пошукові поля',
    'de-ch': 'Durchsuchte Felder',
  },
  any: {
    'en-us': 'Any',
    'ru-ru': 'Любой',
    'es-es': 'Cualquiera',
    'fr-fr': "N'importe lequel",
    'uk-ua': 'Будь-який',
    'de-ch': 'Beliebig',
  },
  startValue: {
    'en-us': 'Start Value',
    'ru-ru': 'Начальное значение',
    'es-es': 'Valor inicial',
    'fr-fr': 'Valeur de départ',
    'uk-ua': 'Початкове значення',
    'de-ch': 'Startwert',
  },
  endValue: {
    'en-us': 'End Value',
    'ru-ru': 'Конечная стоимость',
    'es-es': 'Valor final',
    'fr-fr': 'Valeur finale',
    'uk-ua': 'Кінцеве значення',
    'de-ch': 'Endwert',
  },
  saveQuery: {
    'en-us': 'Save Query',
    'ru-ru': 'Сохранить запрос',
    'es-es': 'Guardar consulta',
    'fr-fr': 'Enregistrer la requête',
    'uk-ua': 'Зберегти запит',
    'de-ch': 'Abfrage speichern',
  },
  saveClonedQuery: {
    'en-us': 'Save query as...',
    'ru-ru': 'Сохранить запрос как...',
    'es-es': 'Guardar consulta como...',
    'fr-fr': 'Enregistrer la requête sous...',
    'uk-ua': 'Зберегти запит як...',
    'de-ch': 'Abfrage speichern unter...',
  },
  saveClonedQueryDescription: {
    'en-us': `
      The query will be saved with a new name leaving the current query
      unchanged.
    `,
    'ru-ru': `
      Запрос будет сохранен под новым именем, а текущий запрос останется без
      изменений.
    `,
    'es-es': `
      La consulta se guardará con un nombre nuevo dejando la consulta actual sin
      cambios.
    `,
    'fr-fr': `
      La requête sera enregistrée sous un nouveau nom, laissant la requête
      actuelle inchangée.
    `,
    'uk-ua': `
      Запит буде збережено з новою назвою, а поточний запит залишиться без змін.
    `,
    'de-ch': `
      Die Abfrage wird unter einem neuen Namen gespeichert, die aktuelle Abfrage
      bleibt unverändert.
    `,
  },
  queryDeleteIncomplete: {
    'en-us': 'Query definition contains incomplete fields',
    'ru-ru': 'Определение запроса содержит неполные поля',
    'es-es': 'La definición de consulta contiene campos incompletos',
    'fr-fr': 'La définition de la requête contient des champs incomplets',
    'uk-ua': 'Визначення запиту містить незаповнені поля',
    'de-ch': 'Die Abfragedefinition enthält unvollständige Felder',
  },
  queryDeleteIncompleteDescription: {
    'en-us': `
      There are uncompleted fields in the query definition. Do you want to
      remove them?
    `,
    'ru-ru':
      'В определении запроса есть незаполненные поля. Вы хотите удалить их?',
    'es-es': `
      Hay campos incompletos en la definición de la consulta. ¿Quieres
      eliminarlos?
    `,
    'fr-fr': `
      Il y a des champs incomplets dans la définition de requête. Voulez-vous
      les supprimer ?
    `,
    'uk-ua': 'У визначенні запиту є незаповнені поля. Ви хочете видалити їх?',
    'de-ch': `
      Die Abfragedefinition enthält unvollständige Felder. Möchten Sie diese
      entfernen?
    `,
  },
  queryUnloadProtect: {
    'en-us': 'The new or modified query definition has not been saved',
    'ru-ru': 'Новое или измененное определение запроса не сохранено.',
    'es-es': 'La definición de consulta nueva o modificada no se ha guardado',
    'fr-fr':
      "La définition de requête nouvelle ou modifiée n'a pas été enregistrée",
    'uk-ua': 'Нове або змінене визначення запиту не було збережено',
    'de-ch':
      'Die neue oder geänderte Abfragedefinition wurde nicht gespeichert',
  },
  recordSetToQuery: {
    comment: 'Example: Creating a Record Set from Query',
    'en-us': 'Creating a {recordSetTable:string} from Query',
    'ru-ru': 'Создание {recordSetTable:string} из запроса',
    'es-es': 'Creando un {recordSetTable:string} desde la consulta',
    'fr-fr': "Création d'un {recordSetTable:string} à partir d'une requête",
    'uk-ua': 'Створення {recordSetTable:string} із запиту',
    'de-ch': 'Erstellen eines {recordSetTable:string} aus einer Abfrage',
  },
  recordSetToQueryDescription: {
    'en-us': 'Generating {recordSetTable:string}...',
    'ru-ru': 'Генерация {recordSetTable:string}...',
    'es-es': 'Generando {recordSetTable:string}...',
    'fr-fr': 'Génération de {recordSetTable:string}...',
    'uk-ua': 'Створення {recordSetTable:string}...',
    'de-ch': '{recordSetTable:string} wird generiert...',
  },
  recordSetCreated: {
    'en-us': '{recordSetTable:string} Created',
    'ru-ru': '{recordSetTable:string} Создано',
    'es-es': '{recordSetTable:string} Fue creado',
    'fr-fr': '{recordSetTable:string} Créé',
    'uk-ua': '{recordSetTable:string} Створено',
    'de-ch': '{recordSetTable:string} Erstellt',
  },
  missingCoordinatesForKml: {
    'en-us': 'Unable to export to KML',
    'ru-ru': 'Невозможно экспортировать в KML.',
    'es-es': 'No se puede exportar a KML',
    'fr-fr': "Impossible d'exporter vers KML",
    'uk-ua': 'Не вдалося експортувати в KML',
    'de-ch': 'Export in KML nicht möglich',
  },
  missingCoordinatesForKmlDescription: {
    'en-us': 'Please add latitude and longitude fields to the query.',
    'ru-ru': 'Добавьте в запрос поля широты и долготы.',
    'es-es': 'Agregar los campos de latitud y longitud a la consulta.',
    'fr-fr':
      'Veuillez ajouter les champs de latitude et de longitude à la requête.',
    'uk-ua': 'Будь ласка, додайте поля широти та довготи до запиту.',
    'de-ch': 'Bitte fügen Sie der Abfrage Breiten- und Längengradfelder hinzu.',
  },
  queryExportStarted: {
    'en-us': 'Export File Being Created',
    'ru-ru': 'Создаваемый файл экспорта',
    'es-es': 'Archivo de exportación en proceso de creación',
    'fr-fr': 'Exporter le fichier en cours de création',
    'uk-ua': 'Експортний файл створюється',
    'de-ch': 'Exportdatei wird erstellt',
  },
  queryExportStartedDescription: {
    'en-us': `
      A notification will appear when the export file is complete and ready for
      download.
    `,
    'es-es': `
      Aparecerá una notificación cuando el archivo de exportación esté completo
      y listo para descargar.
    `,
    'uk-ua': `
      Коли файл експорту буде завершено та готовий до завантаження, з’явиться
      сповіщення.
    `,
    'de-ch': `
      Wenn die Exportdatei vollständig ist und zum Download bereit steht, wird
      eine Benachrichtigung angezeigt.
    `,
    'fr-fr': `
      Une notification apparaîtra lorsque le fichier d'exportation sera terminé
      et prêt à être téléchargé.
    `,
    'ru-ru': `
      Когда файл экспорта будет завершен и готов к загрузке, появится
      уведомление.
    `,
  },
  invalidPicklistValue: {
    comment: 'Used when selected pick list value is not one of allowed values',
    'en-us': '{value:string} (current, invalid value)',
    'ru-ru': '{value:string} (текущее, неверное значение)',
    'es-es': '{value:string} (valor actual no válido)',
    'fr-fr': '{value:string} (valeur actuelle non valide)',
    'uk-ua': '{value:string} (поточне, недійсне значення)',
    'de-ch': '{value:string} (aktueller, ungültiger Wert)',
  },
  queryRecordSetTitle: {
    comment: 'Used in query builder header when querying on record set',
    'en-us': `
      Query: "{queryName:string}" on
      {recordSetTable:string}: "{recordSetName:string}"
    `,
    'ru-ru': `
      Запрос: «{queryName:string}» на
      {recordSetTable:string}: «{recordSetName:string}»
    `,
    'es-es': `
      Consulta: "{queryName:string}" en
      {recordSetTable:string}: "{recordSetName:string}"
    `,
    'fr-fr': `
      Requête : "{queryName:string}" sur
      {recordSetTable:string} : "{recordSetName:string}"
    `,
    'uk-ua': `
      Запит: "{queryName:string}" на
      {recordSetTable:string}: "{recordSetName:string}"
    `,
    'de-ch': `
      Abfrage: "{queryName:string}" auf
      {recordSetTable:string}: "{recordSetName:string}"
    `,
  },
  treeQueryName: {
    comment: 'Used in query builder header when querying on tree node usages',
    'en-us': '{tableName:string} using "{nodeFullName:string}"',
    'ru-ru': '{tableName:string} с помощью «{nodeFullName:string}»',
    'es-es': '{tableName:string} usando "{nodeFullName:string}"',
    'fr-fr': '{tableName:string} en utilisant "{nodeFullName:string}"',
    'uk-ua': '{tableName:string} за допомогою "{nodeFullName:string}"',
    'de-ch': '{tableName:string} mit "{nodeFullName:string}"',
  },
  newButtonDescription: {
    'en-us': 'Add New Field',
    'ru-ru': 'Настройка видимых таблиц запросов',
    'es-es': 'Agregar nuevo campo',
    'fr-fr': 'Configurer les tables de requêtes visibles',
    'uk-ua': 'Додати нове поле',
    'de-ch': 'Neues Feld hinzufügen',
  },
  countOnly: {
    comment: 'Verb',
    'en-us': 'Count',
    'ru-ru': 'Считать',
    'es-es': 'Recuento',
    'fr-fr': 'Compter',
    'uk-ua': 'Рахувати',
    'de-ch': 'Zählen',
  },
  distinct: {
    'en-us': 'Distinct',
    'ru-ru': 'Отчетливый',
    'es-es': 'Distinto',
    'fr-fr': 'Distinct',
    'uk-ua': 'Виразний',
    'de-ch': 'Unterscheidbar',
  },
  createCsv: {
    'en-us': 'Create CSV',
    'ru-ru': 'Создать CSV-файл',
    'es-es': 'Crear CSV',
    'fr-fr': 'Créer un CSV',
    'uk-ua': 'Створити CSV',
    'de-ch': 'CSV erstellen',
  },
  createKml: {
    'en-us': 'Create KML',
    'ru-ru': 'Создать KML',
    'es-es': 'Crear KML',
    'fr-fr': 'Créer un KML',
    'uk-ua': 'Створіть KML',
    'de-ch': 'KML erstellen',
  },
  createRecordSet: {
    'en-us': 'Create {recordSetTable:string}',
    'ru-ru': 'Создать {recordSetTable:string}',
    'es-es': 'Crear {recordSetTable:string}',
    'fr-fr': 'Créer {recordSetTable:string}',
    'uk-ua': 'Створити {modelName:string}',
    'de-ch': 'Erstellen {recordSetTable:string}',
  },
  saveAs: {
    'en-us': 'Save As',
    'es-es': 'Guardar como',
    'uk-ua': 'Зберегти як',
    'de-ch': 'Export in KML nicht möglich',
    'fr-fr': "Impossible d'exporter vers KML",
    'ru-ru': 'Невозможно экспортировать в KML.',
  },
  anyRank: {
    'en-us': '(any rank)',
    'ru-ru': '(любой ранг)',
    'es-es': '(cualquier rango)',
    'fr-fr': "(n'importe quel rang)",
    'uk-ua': '(будь-який ранг)',
    'de-ch': '(jeder Rang)',
  },
  anyTree: {
    'en-us': '(any tree)',
  },
  moveUp: {
    comment: 'As in move it up',
    'en-us': 'Move Up',
    'ru-ru': 'Выберите форматтер',
    'es-es': 'Mover hacia arriba',
    'fr-fr': 'Choisir le formateur',
    'uk-ua': 'Рухатися вгору',
    'de-ch': 'Nach oben',
  },
  moveDown: {
    comment: 'As in move it down',
    'en-us': 'Move Down',
    'ru-ru': 'Вниз',
    'es-es': 'Mover hacia abajo',
    'fr-fr': 'Descendre',
    'uk-ua': 'Рухатися вниз',
    'de-ch': 'Sich abwärts bewegen',
  },
  sort: {
    'en-us': 'Sort',
    'ru-ru': 'Сортировать',
    'es-es': 'Ordenar',
    'fr-fr': 'Trier',
    'uk-ua': 'Сортувати',
    'de-ch': 'Sortieren',
  },
  ascendingSort: {
    'en-us': 'Ascending Sort',
    'ru-ru': 'Сортировка по возрастанию',
    'es-es': 'Orden ascendente',
    'fr-fr': 'Tri ascendant',
    'uk-ua': 'Сортування за зростанням',
    'de-ch': 'Aufsteigende Sortierung',
  },
  descendingSort: {
    'en-us': 'Descending Sort',
    'ru-ru': 'Сортировка по убыванию',
    'es-es': 'Orden descendente',
    'fr-fr': 'Tri décroissant',
    'uk-ua': 'Сортування за спаданням',
    'de-ch': 'Absteigende Sortierung',
  },
  negate: {
    comment: 'as in negate query condition',
    'en-us': 'Negate',
    'ru-ru': 'Отрицать',
    'es-es': 'Negar',
    'fr-fr': 'Nier',
    'uk-ua': 'Заперечувати',
    'de-ch': 'Negieren',
  },
  showButtonDescription: {
    'en-us': 'Show in results',
    'es-es': 'Mostrar en resultados',
    'uk-ua': 'Показати в результатах',
    'de-ch': '(formatiert)',
    'fr-fr': 'Afficher dans les résultats',
    'ru-ru': 'Показать в результатах',
  },
  aggregatedInline: {
    'en-us': '(aggregated)',
    'ru-ru': '(агрегированный)',
    'es-es': '(agregado)',
    'fr-fr': '(agrégé)',
    'uk-ua': '(узагальнено)',
    'de-ch': '(aggregiert)',
  },
  formattedInline: {
    'en-us': '(formatted)',
    'ru-ru': '(отформатированный)',
    'es-es': '(formateado)',
    'fr-fr': '(formaté)',
    'uk-ua': '(відформатований)',
    'de-ch': '(formatiert)',
  },
  like: {
    'en-us': 'Like',
    'ru-ru': 'Нравиться',
    'es-es': 'Como',
    'fr-fr': 'Comme',
    'uk-ua': 'Люблю',
    'de-ch': 'Wie',
  },
  likeDescription: {
    comment: 'Explains the use of special symbols for the "like" query filter',
    'en-us': `
      Use "%" to match any number of characters.

      Use "_" to match a single character
    `,
    'ru-ru': `
      Используйте «%» для соответствия любому количеству символов.

      Используйте «_» для соответствия одному символу
    `,
    'es-es': `
      Usar "%" para hacer coincidir cualquier número de caracteres.

      Usar "_" para hacer coincidir un solo carácter
    `,
    'fr-fr': `
      Utilisez "%" pour faire correspondre n\'importe quel nombre de caractères.

      Utilisez "_" pour faire correspondre un seul caractère
    `,
    'uk-ua': `
      Використовуйте "%", щоб відповідати будь-якій кількості символів.

      Використовуйте "_", щоб відповідати одному символу
    `,
    'de-ch': `
      Verwenden Sie „%“, um eine beliebige Anzahl von Zeichen abzugleichen.

      Verwenden Sie „_“, um ein einzelnes Zeichen abzugleichen
    `,
  },
  equal: {
    'en-us': 'Equal',
    'ru-ru': 'Результаты запроса',
    'es-es': 'Igual',
    'fr-fr': 'Résultats de la requête',
    'uk-ua': 'Рівні',
    'de-ch': 'Gleich',
  },
  greaterThan: {
    'en-us': 'Greater than',
    'ru-ru': 'Больше чем',
    'es-es': 'Mayor que',
    'fr-fr': 'Plus grand que',
    'uk-ua': 'Більш чим',
    'de-ch': 'Größer als',
  },
  lessThan: {
    'en-us': 'Less than',
    'ru-ru': 'Меньше, чем',
    'es-es': 'Menor que',
    'fr-fr': 'Moins que',
    'uk-ua': 'Менше ніж',
    'de-ch': 'Weniger als',
  },
  greaterOrEqualTo: {
    'en-us': 'Greater or Equal to',
    'ru-ru': 'Больше или равно',
    'es-es': 'Mayor o igual a',
    'fr-fr': 'Supérieur ou égal à',
    'uk-ua': 'Більше або дорівнює',
    'de-ch': 'Größer oder gleich',
  },
  lessOrEqualTo: {
    'en-us': 'Less or Equal to',
    'ru-ru': 'Меньше или равно',
    'es-es': 'Menor o igual a',
    'fr-fr': 'Inférieur ou égal à',
    'uk-ua': 'Менше або дорівнює',
    'de-ch': 'Kleiner oder gleich',
  },
  true: {
    'en-us': 'True',
    'ru-ru': 'Истинный',
    'es-es': 'Verdadero',
    'fr-fr': 'Vrai',
    'uk-ua': 'правда',
    'de-ch': 'WAHR',
  },
  false: {
    'en-us': 'False',
    'ru-ru': 'ЛОЖЬ',
    'es-es': 'Falso',
    'fr-fr': 'FAUX',
    'uk-ua': 'помилковий',
    'de-ch': 'FALSCH',
  },
  trueOrNull: {
    'en-us': 'True or Empty',
    'ru-ru': 'Истина или Пусто',
    'es-es': 'Verdadero o vacío',
    'fr-fr': 'Vrai ou vide',
    'uk-ua': 'True або Empty',
    'de-ch': 'Wahr oder leer',
  },
  falseOrNull: {
    'en-us': 'False or Empty',
    'ru-ru': 'Ложь или пусто',
    'es-es': 'Falso o vacío',
    'fr-fr': 'Faux ou vide',
    'uk-ua': 'False або Empty',
    'de-ch': 'Nach oben',
  },
  between: {
    'en-us': 'Between',
    'ru-ru': 'Десинонимизация дерева',
    'es-es': 'Entre',
    'fr-fr': 'Désynonymisation des arbres',
    'uk-ua': 'Між',
    'de-ch': 'Zwischen',
  },
  in: {
    'en-us': 'In',
    'ru-ru': 'В',
    'es-es': 'En',
    'fr-fr': 'Dans',
    'uk-ua': 'в',
    'de-ch': 'In',
  },
  inDescription: {
    'en-us': 'A comma-separated list of values',
    'ru-ru': 'Список значений, разделенных запятыми.',
    'es-es': 'Una lista de valores separados por comas',
    'fr-fr': 'Une liste de valeurs séparées par des virgules',
    'uk-ua': 'Список значень, розділених комами',
    'de-ch': 'Datensätze anzeigen',
  },
  contains: {
    'en-us': 'Contains',
    'ru-ru': 'Содержит',
    'es-es': 'Contiene',
    'fr-fr': 'Contient',
    'uk-ua': 'Містить',
    'de-ch': 'Enthält',
  },
  empty: {
    'en-us': 'Empty',
    'ru-ru': 'Пустой',
    'es-es': 'Vacío',
    'fr-fr': 'Vide',
    'uk-ua': 'Порожній',
    'de-ch': 'Leer',
  },
  and: {
    'en-us': 'and',
    'ru-ru': 'и',
    'es-es': 'y',
    'fr-fr': 'et',
    'uk-ua': 'і',
    'de-ch': 'Und',
  },
  startsWith: {
    'en-us': 'Starts With',
    'ru-ru': 'Начинается с',
    'es-es': 'Comienza con',
    'fr-fr': 'Commence avec',
    'uk-ua': 'Починається з',
    'de-ch': 'Beginnt mit',
  },
  or: {
    'en-us': 'or',
    'ru-ru': 'или',
    'es-es': 'o',
    'fr-fr': 'ou',
    'uk-ua': 'або',
    'de-ch': 'oder',
  },
  yes: {
    'en-us': 'Yes',
    'ru-ru': 'Да',
    'es-es': 'Sí',
    'fr-fr': 'Oui',
    'uk-ua': 'Так',
    'de-ch': 'Ja',
  },
  noPreparationsToReturn: {
    'en-us': 'There are no unresolved items to return',
    'ru-ru': 'Нет нерешенных вопросов для возврата',
    'es-es': 'No hay items sin resolver para devolver',
    'fr-fr': "Il n'y a aucun article non résolu à retourner",
    'uk-ua': 'Немає невирішених елементів для повернення',
    'de-ch':
      'Es gibt keine ungelösten Elemente, die zurückgegeben werden müssen',
  },
  itemsReturned: {
    'en-us': 'Items have been returned',
    'ru-ru': 'Товары были возвращены',
    'es-es': 'Los items han sido devueltos',
    'fr-fr': 'Les articles ont été retournés',
    'uk-ua': 'Товари повернуто',
    'de-ch': 'Artikel wurden zurückgegeben',
  },
  queryResults: {
    'en-us': 'Query Results',
    'ru-ru': 'Результаты запроса',
    'es-es': 'Resultados de la consulta',
    'fr-fr': 'Résultats de la requête',
    'uk-ua': 'Результати запиту',
    'de-ch': 'Abfrageergebnisse',
  },
  browseInForms: {
    'en-us': 'Browse in Forms',
    'ru-ru': 'Просмотр в формах',
    'es-es': 'Navegar en formularios',
    'fr-fr': 'Parcourir dans les formulaires',
    'uk-ua': 'Перегляд у Формах',
    'de-ch': 'In Formularen stöbern',
  },
  configureQueryTables: {
    'en-us': 'Configure visible query tables',
    'ru-ru': 'Настройка видимых таблиц запросов',
    'es-es': 'Configurar tablas de consulta visibles',
    'fr-fr': 'Configurer les tables de requêtes visibles',
    'uk-ua': 'Налаштувати видимі таблиці запитів',
    'de-ch': 'Konfigurieren sichtbarer Abfragetabellen',
  },
  exportQueryForDwca: {
    'en-us': 'Export query for DwCA definition',
    'ru-ru': 'Экспортный запрос для определения DwCA',
    'es-es': 'Consulta de exportación para una definición DwCA',
    'fr-fr': "Requête d'exportation pour la définition DwCA",
    'uk-ua': 'Експорт запиту для визначення DwCA',
    'de-ch': 'Exportabfrage für DwCA-Definition',
  },
  exportQueryAsReport: {
    'en-us': 'Define report based on query',
    'ru-ru': 'Определить отчет на основе запроса',
    'es-es': 'Definir informe basado en consulta',
    'fr-fr': 'Définir un rapport basé sur une requête',
    'uk-ua': 'Визначити звіт на основі запиту',
    'de-ch': 'Definieren Sie den Bericht basierend auf der Abfrage',
  },
  exportQueryAsLabel: {
    'en-us': 'Define label based on query',
    'ru-ru': 'Определить метку на основе запроса',
    'es-es': 'Definir etiqueta basada en la consulta',
    'fr-fr': "Définir une étiquette en fonction d'une requête",
    'uk-ua': 'Визначте мітку на основі запиту',
    'de-ch': 'Label basierend auf Abfrage definieren',
  },
  treeMerge: {
    comment: 'Audit Log Action Type',
    'en-us': 'Tree Merge',
    'ru-ru': 'Слияние деревьев',
    'es-es': 'Fusión de árboles',
    'fr-fr': "Fusion d'arbres",
    'uk-ua': "Об'єднання дерев",
    'de-ch': 'Baumzusammenführung',
  },
  treeMove: {
    comment: 'Audit Log Action Type',
    'en-us': 'Tree Move',
    'ru-ru': 'Перемещение дерева',
    'es-es': 'Mover el árbol',
    'fr-fr': "Déplacement d'un arbre",
    'uk-ua': 'Переміщення дерева',
    'de-ch': 'Baum verschieben',
  },
  treeSynonymize: {
    comment: 'Audit Log Action Type',
    'en-us': 'Tree Synonymize',
    'ru-ru': 'Синонимизировать дерево',
    'es-es': 'Sinonimizar árbol',
    'fr-fr': 'Synonymie d’arbre',
    'uk-ua': 'Синонімізувати дерево',
    'de-ch': 'Baum synonymisieren',
  },
  treeDesynonymize: {
    comment: 'Audit Log Action Type',
    'en-us': 'Tree Desynonymize',
    'ru-ru': 'Десинонимизация дерева',
    'es-es': 'Desinonimizar árbol',
    'fr-fr': 'Désynonymisation des arbres',
    'uk-ua': 'Десинонімізація дерева',
    'de-ch': 'Baum Desynonymisieren',
  },
  treeBulkMove: {
    comment: 'Audit Log Action Type',
    'en-us': 'Tree Bulk Move',
    'de-ch': 'Massenverschiebung von Bäumen',
    'es-es': 'Movimiento masivo de árboles',
    'fr-fr': "Déplacement groupé d'arbres",
    'ru-ru': 'Массовое перемещение дерева',
    'uk-ua': 'Масове переміщення дерева',
  },
  tooLongErrorMessage: {
    'en-us': `
      Field value is too long. Max allowed length is
      {maxLength:number|formatted}
    `,
    'ru-ru': `
      Значение поля слишком длинное. Максимально допустимая длина
      — {maxLength:number|formatted}
    `,
    'es-es': `
      El valor del campo es demasiado largo. La longitud máxima permitida es
      {maxLength:number|formatted}
    `,
    'fr-fr': `
      La valeur du champ est trop longue. La longueur maximale autorisée est de
      {maxLength:number|formatted}
    `,
    'uk-ua': `
      Значення поля задовге. Максимальна дозволена довжина
      {maxLength:number|formatted}
    `,
    'de-ch': `
      Der Feldwert ist zu lang. Die maximal zulässige Länge beträgt
      {maxLength:number|formatted}
    `,
  },
  future: {
    'en-us': 'in the future',
    'de-ch': 'Exportdatei wird erstellt',
    'es-es': 'en el futuro',
    'fr-fr': "à l'avenir",
    'ru-ru': 'в будущем',
    'uk-ua': 'в майбутньому',
  },
  past: {
    'en-us': 'in the past',
    'de-ch': 'in der Vergangenheit',
    'es-es': 'en el pasado',
    'fr-fr': 'dans le passé',
    'ru-ru': 'в прошлом',
    'uk-ua': 'в минулому',
  },
  day: {
    'en-us': 'Days',
    'es-es': 'Días',
    'fr-fr': 'Jours',
    'ru-ru': 'Дни',
    'uk-ua': 'днів',
    'de-ch': 'Tage',
  },
  week: {
    'en-us': 'Weeks',
    'de-ch': 'Wochen',
    'es-es': 'Semanas',
    'fr-fr': 'Semaines',
    'ru-ru': 'Недели',
    'uk-ua': 'тижнів',
  },
  month: {
    'en-us': 'Months',
    'de-ch': 'Monate',
    'es-es': 'Meses',
    'fr-fr': 'Mois',
    'ru-ru': 'Месяцы',
    'uk-ua': 'Місяці',
  },
  year: {
    'en-us': 'Years',
    'de-ch': 'Jahre',
    'es-es': 'Años',
    'fr-fr': 'Années',
    'ru-ru': 'Годы',
    'uk-ua': 'років',
  },
  relativeDate: {
    comment: `
      Used in query builder lines, will be shown as a number followed by a
      period of time (ie: day, month or week) then a direction (past or future)
    `,
    'en-us': `
      
      <count>{size:number}</count> <length>{type:string}</length> <direction>{direction:string}</direction>
      
    `,
    'de-ch': `
      
      <count>{size:number}</count> <length>{type:string}</length> <direction>{direction:string}</direction>
      
    `,
    'es-es': `
      
      <count>{size:number}</count> <length>{type:string}</length> <direction>{direction:string}</direction>
      
    `,
    'fr-fr': `
      
      <count>{size:number}</count> <length>{type:string}</length> <direction>{direction:string}</direction>
      
    `,
    'ru-ru': `
      
      <count>{size:number}</count> <length>{type:string}</length> <direction>{direction:string}</direction>
      
    `,
    'uk-ua': `
      
      <count>{size:number}</count> <length>{type:string}</length> <direction>{direction:string}</direction>
      
    `,
  },
  importHiddenFields: {
    'en-us': 'The following fields are hidden in the query you imported:',
    'es-es': 'Los siguientes campos están ocultos en la consulta que importó:',
    'fr-fr': `
      Les champs suivants sont masqués dans la requête que vous avez importée :
    `,
    'ru-ru': 'Следующие поля скрыты в импортированном запросе:',
    'uk-ua': 'В імпортованому вами запиті приховано такі поля:',
    'de-ch': `
      In der von Ihnen importierten Abfrage sind folgende Felder ausgeblendet:
    `,
  },
  importNoReadPermission: {
    'en-us':
      'The query you imported contains tables you do not have read access to:',
    'es-es': `
      La consulta que importó contiene tablas a las que no tiene acceso de
      lectura:
    `,
    'fr-fr': `
      La requête que vous avez importée contient des tables auxquelles vous
      n'avez pas accès en lecture :
    `,
    'ru-ru': `
      Импортированный запрос содержит таблицы, к которым у вас нет доступа на
      чтение:
    `,
    'uk-ua': `
      Запит, який ви імпортували, містить таблиці, до яких ви не маєте доступу
      на читання:
    `,
    'de-ch': `
      Die von Ihnen importierte Abfrage enthält Tabellen, auf die Sie keinen
      Lesezugriff haben:
    `,
  },
  noReadPermission: {
    'en-us': 'No read permission',
    'es-es': 'Sin permiso de lectura',
    'fr-fr': 'Aucune autorisation de lecture',
    'ru-ru': 'Нет разрешения на чтение',
    'uk-ua': 'Немає дозволу на читання',
    'de-ch': 'Keine Leseberechtigung',
  },
  switchToRelative: {
    'en-us': 'Switch to relative',
    'de-ch': 'Wechseln zu relativ',
    'es-es': 'Cambiar a relativo',
    'fr-fr': 'Passer au relatif',
    'ru-ru': 'Переключиться на относительный',
    'uk-ua': 'Перейти до відносного',
  },
  switchToAbsolute: {
    'en-us': 'Switch to absolute',
    'de-ch': 'Wechseln zu absolut',
    'es-es': 'Cambiar a absoluto',
    'fr-fr': "Passer à l'absolu",
    'ru-ru': 'Переключиться на абсолют',
    'uk-ua': 'Перейти до відносного',
  },
  scrollToEditor: {
    'en-us': 'Scroll to editor',
    'de-ch': 'Zum Editor scrollen',
    'es-es': 'Desplazarse al editor',
    'uk-ua': 'Перейдіть до редактора',
    'fr-fr': "Faites défiler jusqu'à l'éditeur",
    'ru-ru': 'Прокрутите до редактора',
  },
  viewRecords: {
    'en-us': 'View records',
    'de-ch': 'Datensätze anzeigen',
    'es-es': 'Elige el formateador',
    'fr-fr': 'Afficher les enregistrements',
    'ru-ru': 'Просмотр записей',
    'uk-ua': 'Переглянути записи',
  },
  chooseFormatter: {
    'en-us': 'Choose formatter',
    'de-ch': 'Formatierer auswählen',
    'es-es': 'Elige el formateador',
    'fr-fr': 'Choisir le formateur',
    'ru-ru': 'Выберите форматтер',
    'uk-ua': 'Виберіть форматер',
  },
  range: {
    'en-us': 'Range',
  },
} as const);
