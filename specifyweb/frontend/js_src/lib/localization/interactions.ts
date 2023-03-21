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
    'fr-fr': 'Ajouter des éléments',
    'uk-ua': 'Додати предмети',
  },
  recordReturn: {
    'en-us': '{modelName:string} Return',
    'ru-ru': 'Возврат {modelName:string}',
    'es-es': '{modelName:string} Devuelve',
    'fr-fr': '{modelName:string} Retourner',
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
    'fr-fr': 'Manquant:',
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
    'fr-fr': "Il y a des problèmes avec l'entrée:",
    'uk-ua': 'Є проблеми з входом:',
  },
  byChoosingRecordSet: {
    comment: 'See documentation for syntax for plural rules',
    'en-us': 'By choosing a recordset ({{count:none | one | ??}} available)',
    'ru-ru': 'Выбрав набор записей (доступно {{count:none | one | ??}})',
    'es-es':
      'Eligiendo un juego de registros ({{count:none | uno | ??}} available)',
    'fr-fr': `
      En choisissant un jeu d'enregistrements ({{count:none | one | ??}}
      disponible(s))
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
    'fr-fr': 'En entrant {fieldName:string}s',
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
    'en-us': '{tableName:string}: {resource:string}',
    'ru-ru': '{tableName:string}: {resource:string}',
    'es-es': '{tableName:string}: {resource:string}',
    'fr-fr': '{tableName:string} : {resource:string}',
    'uk-ua': '{tableName:string}: {resource:string}',
  },
  resolvedLoans: {
    comment: 'Example: Resolved Loan records',
    'en-us': 'Resolved {loanTable:string} records',
    'es-es': 'Registros resueltos {loanTable:string}',
    'fr-fr': 'Enregistrements {loanTable:string} résolus',
    'ru-ru': 'Решено {loanTable:string} записей',
    'uk-ua': 'Вирішено записи {loanTable:string}.',
  },
  openLoans: {
    comment: 'Example: Open Loan records',
    'en-us': 'Open {loanTable:string} records',
    'es-es': 'Abrir registros {loanTable:string}',
    'fr-fr': 'Ouvrir les enregistrements {loanTable:string}',
    'ru-ru': 'Открыть {loanTable:string} записей',
    'uk-ua': 'Відкрийте записи {loanTable:string}.',
  },
  gifts: {
    comment: 'Example: Gift records',
    'en-us': '{giftTable:string} records',
    'es-es': '{giftTable:string} registros',
    'fr-fr': '{giftTable:string} enregistrements',
    'ru-ru': '{giftTable:string} записи',
    'uk-ua': '{giftTable:string} записи',
  },
  exchanges: {
    comment: 'Example: Exchange In / Exchnage Out records',
    'en-us': '{exhangeInTable:string} / {exhangeOutTable:string} records',
    'es-es': '{exhangeInTable:string} / {exhangeOutTable:string} registros',
    'fr-fr':
      '{exhangeInTable:string} / {exhangeOutTable:string} enregistrements',
    'ru-ru': '{exhangeInTable:string} / {exhangeOutTable:string} записи',
    'uk-ua': 'Записи {exhangeInTable:string} / {exhangeOutTable:string}.',
  },
  unCataloged: {
    'en-us': 'uncataloged',
    'ru-ru': 'некаталогизированный',
    'es-es': 'descatalogado',
    'fr-fr': 'non catalogué',
    'uk-ua': 'некаталогований',
  },
  returnedPreparations: {
    comment: 'Example: Preparation records',
    'en-us': 'Returned {tablePreparation:string} records',
    'es-es': 'Registros {tablePreparation:string} devueltos',
    'fr-fr': 'Enregistrements {tablePreparation:string} renvoyés',
    'ru-ru': 'Возвращено {tablePreparation:string} записей',
    'uk-ua': 'Повернуто {tablePreparation:string} записів',
  },
  returnedAndSaved: {
    comment: 'Example: 2 Preparation records have been returned and saved',
    'en-us': `
      {count:number|formatted} {tablePreparation:string} records have been
      returned and saved
    `,
    'es-es': `
      {count:number|formatted} {tablePreparation:string} registros han sido
      devueltos y guardados
    `,
    'fr-fr': `
      {count:number|formatted} {tablePreparation:string} enregistrements ont été
      renvoyés et sauvegardés
    `,
    'ru-ru': `
      {count:number|formatted} {tablePreparation:string} записей возвращены и
      сохранены
    `,
    'uk-ua': `
      Записи {count:number|formatted} {tablePreparation:string} повернуто та
      збережено
    `,
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
    comment: 'Example: Return Loan records',
    'en-us': 'Return {tableLoan:string} records',
    'es-es': 'Devolver registros {tableLoan:string}',
    'fr-fr': 'Renvoyer les enregistrements {tableLoan:string}',
    'ru-ru': 'Вернуть записи {tableLoan:string}',
    'uk-ua': 'Повернути записи {tableLoan:string}.',
  },
  printInvoice: {
    'en-us': 'Print Invoice',
    'ru-ru': 'Распечатать Накладную',
    'es-es': 'Imprimir factura',
    'fr-fr': "La facture d'impression",
    'uk-ua': 'Роздрукувати рахунок-фактуру',
  },
  loanWithoutPreparation: {
    comment: 'Example: Loan records w/o Preparation records',
    'en-us': '{tableLoan:string} w/o {tablePreparation:string} records',
    'es-es': '{tableLoan:string} sin registros {tablePreparation:string}',
    'fr-fr':
      '{tableLoan:string} sans enregistrements {tablePreparation:string}',
    'ru-ru': '{tableLoan:string} без записей {tablePreparation:string}',
    'uk-ua': '{tableLoan:string} без записів {tablePreparation:string}.',
  },
  loanWithoutPreparationDescription: {
    comment: 'Example: Create a Loan records with no Preparation records',
    'en-us':
      'Create a {tableLoan:string} with no {tablePreparation:string} records',
    'es-es':
      'Cree un {tableLoan:string} sin registros {tablePreparation:string}',
    'fr-fr': `
      Créer un {tableLoan:string} sans enregistrements {tablePreparation:string}
    `,
    'ru-ru':
      'Создайте {tableLoan:string} без записей {tablePreparation:string}',
    'uk-ua':
      'Створіть {tableLoan:string} без записів {tablePreparation:string}.',
  },
  createLoan: {
    comment: 'Example: Create a Loan',
    'en-us': 'Create a {tableLoan:string}',
    'es-es': 'Crear un {tableLoan:string}',
    'fr-fr': 'Créer un {tableGift:string}',
    'ru-ru': 'Создайте {tableLoan:string}',
    'uk-ua': 'Створити {tableGift:string}',
  },
  editLoan: {
    comment: 'Example: Edit a Loan',
    'en-us': 'Edit {tableLoan:string}',
    'es-es': 'Editar {tableLoan:string}',
    'fr-fr': 'Modifier {tableLoan:string}',
    'ru-ru': 'Изменить {tableLoan:string}',
    'uk-ua': 'Редагувати {tableLoan:string}',
  },
  createdGift: {
    comment: 'Example: Create a Gift',
    'en-us': 'Create a {tableGift:string}',
    'es-es': 'Crear una {tableGift:string}',
    'fr-fr': 'Créer un {tableGift:string}',
    'ru-ru': 'Создайте {tableLoan:string}',
    'uk-ua': 'Створити {tableGift:string}',
  },
  editGift: {
    comment: 'Example: Edit a Gift',
    'en-us': 'Edit {tableGift:string}',
    'es-es': 'Edite {tableGift:string}',
    'fr-fr': 'Modifier {tableLoan:string}',
    'ru-ru': 'Изменить {tableLoan:string}',
    'uk-ua': 'Редагувати {tableLoan:string}',
  },
  createInformationRequest: {
    comment: 'Example: Create a Infrormation Request',
    'en-us': 'Create {tableInformationRequest:string}',
    'es-es': 'Crear {tableInformationRequest:string}',
    'fr-fr': 'Créer {tableInformationRequest:string}',
    'ru-ru': 'Создать {tableInformationRequest:string}',
    'uk-ua': 'Створити {modelName:string}',
  },
} as const);
