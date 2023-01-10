/**
 * Localization strings used for Interactions
 *
 * @module
 */

import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

export const interactionsText = createDictionary({
  interactions: {
    'en-us': 'Interactions',
    'ru-ru': 'Взаимодействия',
    'es-es': 'Interacciones',
    'fr-fr': 'Interactions',
    'uk-ua': 'Взаємодії',
  },
  addItems: {
    'en-us': 'Add Items',
    'ru-ru': 'Добавить элементы',
    'es-es': 'Añadir elementos',
    'fr-fr': 'Ajouter des articles',
    'uk-ua': 'Додати предмети',
  },
  recordReturn: {
    'en-us': '{modelName:string} Return',
    'ru-ru': 'Возврат {modelName:string}',
    'es-es': '{modelName:string} Devuelve',
    'fr-fr': '{modelName:string} Retour',
    'uk-ua': '{modelName:string} Повернення',
  },
  createRecord: {
    'en-us': 'Create {modelName:string}',
    'ru-ru': 'Создать {modelName:string}',
    'es-es': 'Crear {modelName:string}',
    'fr-fr': 'Créer {modelName:string}',
    'uk-ua': 'Створити {modelName:string}',
  },
  missing: {
    'en-us': 'Missing:',
    'ru-ru': 'Отсутствует:',
    'es-es': 'Desaparecidos:',
    'fr-fr': 'Disparus:',
    'uk-ua': 'Відсутні:',
  },
  preparationsNotFound: {
    'en-us': 'No preparations were found.',
    'ru-ru': 'Никаких препаратов не обнаружено.',
    'es-es': 'No se encontraron preparados.',
    'fr-fr': "Aucune préparation n'a été trouvée.",
    'uk-ua': 'Препаратів не виявлено.',
  },
  problemsFound: {
    'en-us': 'There are problems with the entry:',
    'ru-ru': 'Обнаружены ошибки:',
    'es-es': 'Hay problemas con la entrada:',
    'fr-fr': "Il y a des problèmes avec l'entrée :",
    'uk-ua': 'Є проблеми з входом:',
  },
  byChoosingRecordSet: {
    comment: 'See documentation for syntax for plural rules',
    'en-us': 'By choosing a recordset ({{count:none | one | ??}} available)',
    'ru-ru': 'Выбрав набор записей (доступно {count:number|formatted})',
    'es-es':
      'Eligiendo un juego de registros ({{count:none | one | ??}} disponible)',
    'fr-fr': `
      En choisissant un jeu d'enregistrements ({{count:none | one | ??}}
      disponible)
    `,
    'uk-ua': 'Вибравши набір записів (доступно {{count:none | one | ??}})',
  },
  byEnteringNumbers: {
    comment: `
      Field name is localized. Coming from Schema Configuration. I.e, By
      entering Catalog Numbers
    `,
    'en-us': 'By entering {fieldName:string}s',
    'ru-ru': 'Ввести {fieldName:string}',
    'es-es': 'Introduciendo {fieldName:string}s',
    'fr-fr': 'En saisissant {fieldName:string}s',
    'uk-ua': 'Ввівши {fieldName:string}s',
  },
  withoutPreparations: {
    'en-us': 'Without preparations',
    'ru-ru': 'Без подготовки',
    'es-es': 'sin preparaciones',
    'fr-fr': 'Sans préparations',
    'uk-ua': 'Без препаратів',
  },
  addUnassociated: {
    'en-us': 'Add unassociated item',
    'ru-ru': 'Добавить несвязанный элемент',
    'es-es': 'Agregar elemento no asociado',
    'fr-fr': 'Ajouter un élément non associé',
    'uk-ua': 'Додати непов’язаний елемент',
  },
  preparations: {
    'en-us': 'Preparations',
    'ru-ru': 'Препараты',
    'es-es': 'Preparativos',
    'fr-fr': 'Les préparatifs',
    'uk-ua': 'препарати',
  },
  preparationsCanNotBeReturned: {
    'en-us': 'Preparations cannot be returned in this context.',
    'ru-ru': 'Препараты не могут быть возвращены в этом контексте.',
    'es-es': 'Los preparados no se pueden devolver en este contexto.',
    'fr-fr': 'Les préparations ne peuvent être retournées dans ce cadre.',
    'uk-ua': 'У цьому контексті препарати не повертаються.',
  },
  noUnresolvedPreparations: {
    'en-us': 'There are no unresolved preparations for this loan.',
    'ru-ru': 'Незавершенных приготовлений по этому кредиту нет.',
    'es-es': 'No hay preparativos pendientes para este préstamo.',
    'fr-fr': "Il n'y a pas de préparatifs non résolus pour ce prêt.",
    'uk-ua': 'Немає жодної невирішеної підготовки щодо цієї позики.',
  },
  unresolved: {
    'en-us': 'Unresolved',
    'ru-ru': 'Нерешенные',
    'es-es': 'Irresoluto',
    'fr-fr': 'Non résolu',
    'uk-ua': 'Невирішено',
  },
  return: {
    'en-us': 'Return',
    'ru-ru': 'Возвращение',
    'es-es': 'Devolver',
    'fr-fr': 'Retour',
    'uk-ua': 'Повернення',
  },
  resolve: {
    'en-us': 'Resolve',
    'ru-ru': 'Разрешить',
    'es-es': 'Resolver',
    'fr-fr': 'Résoudre',
    'uk-ua': "Розв'язати",
  },
  returnAllPreparations: {
    'en-us': 'Return all preparations',
    'ru-ru': 'Вернуть все препараты',
    'es-es': 'Devolver todos los preparativos',
    'fr-fr': 'Retourner toutes les préparations',
    'uk-ua': 'Повернути всі препарати',
  },
  returnSelectedPreparations: {
    'en-us': 'Return selected preparations',
    'ru-ru': 'Вернуть выбранные препараты',
    'es-es': 'Devolver preparaciones seleccionadas',
    'fr-fr': 'Retourner les préparations sélectionnées',
    'uk-ua': 'Повернути обрані препарати',
  },
  selectAllAvailablePreparations: {
    'en-us': 'Select all available preparations',
    'ru-ru': 'Выбрать все доступные препараты',
    'es-es': 'Seleccione todas las preparaciones disponibles',
    'fr-fr': 'Sélectionnez toutes les préparations disponibles',
    'uk-ua': 'Виберіть усі доступні препарати',
  },
  selectAll: {
    'en-us': 'Select All',
    'ru-ru': 'Выбрать все',
    'es-es': 'Seleccionar todo',
    'fr-fr': 'Tout sélectionner',
    'uk-ua': 'Вибрати все',
  },
  selectedAmount: {
    'en-us': 'Selected Amount',
    'ru-ru': 'Выбранная сумма',
    'es-es': 'Importe seleccionado',
    'fr-fr': 'Montant sélectionné',
    'uk-ua': 'Вибрана сума',
  },
  returnedAmount: {
    'en-us': 'Returned Amount',
    'ru-ru': 'Возвращенно',
    'es-es': 'Importe devuelto',
    'fr-fr': 'Montant retourné',
    'uk-ua': 'Повернена сума',
  },
  resolvedAmount: {
    'en-us': 'Resolved Amount',
    'ru-ru': 'Решенный',
    'es-es': 'Importe resuelto',
    'fr-fr': 'Montant résolu',
    'uk-ua': 'Вирішена сума',
  },
  prepReturnFormatter: {
    comment: 'Used to format preparations in the prep return dialog',
    'en-us': '{tableName:string}: {resource: string}',
    'ru-ru': '{tableName:string}: {resource: string}',
    'es-es': '{tableName:string}: {resource: string}',
    'fr-fr': '{tableName : chaîne} : {ressource : chaîne}',
    'uk-ua': '{tableName:string}: {ресурс: string}',
  },
  resolvedLoans: {
    'en-us': 'Resolved Loans',
    'ru-ru': 'Решение Заемы',
    'es-es': 'Préstamos Resueltos',
    'fr-fr': 'Prêts résolus',
    'uk-ua': 'Вирішені позики',
  },
  openLoans: {
    'en-us': 'Open Loans',
    'ru-ru': 'Открытые займы',
    'es-es': 'Préstamos abiertos',
    'fr-fr': 'Prêts ouverts',
    'uk-ua': 'Відкриті кредити',
  },
  gifts: {
    'en-us': 'Gifts',
    'ru-ru': 'Подарки',
    'es-es': 'Regalos',
    'fr-fr': 'Cadeaux',
    'uk-ua': 'Подарунки',
  },
  exchanges: {
    'en-us': 'Exchanges',
    'ru-ru': 'Обмены',
    'es-es': 'Intercambios',
    'fr-fr': 'Échanges',
    'uk-ua': 'Обміни',
  },
  unCataloged: {
    'en-us': 'uncataloged',
    'ru-ru': 'некаталогизированный',
    'es-es': 'descatalogado',
    'fr-fr': 'non catalogué',
    'uk-ua': 'некаталогований',
  },
  returnedPreparations: {
    'en-us': 'Returned Preparations',
    'ru-ru': 'Возвращенные препараты',
    'es-es': 'Preparaciones devueltas',
    'fr-fr': 'Préparations retournées',
    'uk-ua': 'Повернені препарати',
  },
  returnedAndSaved: {
    'en-us':
      '{count:number|formatted} preparations have been returned and saved.',
    'ru-ru': '{count:number|formatted} препарата возвращены и сохранены.',
    'es-es':
      '{count:number|formatted} los preparativos se han devuelto y guardado.',
    'fr-fr': `
      Les préparations {count:number|formatted} ont été renvoyées et
      enregistrées.
    `,
    'uk-ua': 'Препарати {count:number|formatted} повернуто та збережено.',
  },
  deselectAll: {
    'en-us': 'Deselect all',
    'ru-ru': 'Отменить выбор',
    'es-es': 'Deseleccionar todo',
    'fr-fr': 'Tout déselectionner',
    'uk-ua': 'Зняти вибір із усіх',
  },
  available: {
    'en-us': 'Available',
    'ru-ru': 'В наличии',
    'es-es': 'Disponible',
    'fr-fr': 'Disponible',
    'uk-ua': 'в наявності',
  },
  unavailable: {
    'en-us': 'Unavailable',
    'ru-ru': 'Недоступен',
    'es-es': 'Indisponible',
    'fr-fr': 'Indisponible',
    'uk-ua': 'Недоступний',
  },
  returnLoan: {
    'en-us': 'Return Loan',
    'ru-ru': 'Возврат Заема',
    'es-es': 'Préstamo de devolución',
    'fr-fr': 'Prêt de retour',
    'uk-ua': 'Повернення кредиту',
  },
  printInvoice: {
    'en-us': 'Print Invoice',
    'ru-ru': 'Распечатать Накладную',
    'es-es': 'Imprimir factura',
    'fr-fr': "La facture d'impression",
    'uk-ua': 'Роздрукувати рахунок-фактуру',
  },
  loanWithoutPreparation: {
    'en-us': 'Loan w/o Preps',
    'ru-ru': 'Заем без Препаратов',
    'es-es': 'Préstamo sin preparación',
    'fr-fr': 'Prêt sans préparation',
    'uk-ua': 'Позика без підготовки',
  },
  loanWithoutPreparationDescription: {
    'en-us': 'Create a loan with no preparations',
    'ru-ru': 'Создать Заем без препаратов',
    'es-es': 'Crear un préstamo sin preparativos',
    'fr-fr': 'Créer un prêt sans préparation',
    'uk-ua': 'Оформіть позику без підготовки',
  },
  createLoan: {
    'en-us': 'Create a Loan',
    'ru-ru': 'Создать Заем',
    'es-es': 'Crear un préstamo',
    'fr-fr': 'Créer un prêt',
    'uk-ua': 'Створіть позику',
  },
  editLoan: {
    'en-us': 'Edit Loan',
    'ru-ru': 'Редактировать Заем',
    'es-es': 'Editar préstamo',
    'fr-fr': 'Modifier le prêt',
    'uk-ua': 'Редагувати кредит',
  },
  createdGift: {
    'en-us': 'Create a Gift',
    'ru-ru': 'Создать Дар',
    'es-es': 'Crear un regalo',
    'fr-fr': 'Créer un cadeau',
    'uk-ua': 'Створіть подарунок',
  },
  editGift: {
    'en-us': 'Edit Gift',
    'ru-ru': 'Редактировать Дар',
    'es-es': 'Editar regalo',
    'fr-fr': 'Modifier le cadeau',
    'uk-ua': 'Редагувати подарунок',
  },
  createInformationRequest: {
    'en-us': 'Create Information Request',
    'ru-ru': 'Создать Экспресс Запрос',
    'es-es': 'Crear solicitud de información',
    'fr-fr': "Créer une demande d'informations",
    'uk-ua': 'Створити інформаційний запит',
  },
} as const);
