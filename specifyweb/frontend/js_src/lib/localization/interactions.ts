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
    'de-ch': 'Interaktionen',
  },
  addItems: {
    'en-us': 'Add Items',
    'ru-ru': 'Добавить элементы',
    'es-es': 'Añadir elementos',
    'fr-fr': 'Ajouter des articles',
    'uk-ua': 'Додати',
    'de-ch': 'Elemente hinzufügen',
  },
  recordReturn: {
    'en-us': '{table:string} Return',
    'ru-ru': '{table:string} Возврат',
    'es-es': '{table:string} Devuelve',
    'fr-fr': '{table:string} Retour',
    'uk-ua': 'Повернення {table:string}',
    'de-ch': '{table:string} Zurück',
  },
  preparationsNotFoundFor: {
    'en-us': 'No preparations were found for the following Catalog Numbers:',
    'de-ch':
      'Für die folgenden Katalognummern wurden keine Präparate gefunden:',
    'es-es': `
      No se encontraron preparaciones para los siguientes números de catálogo:
    `,
    'fr-fr': `
      Aucune préparation n'a été trouvée pour les numéros de catalogue suivants
      :
    `,
    'ru-ru': 'Не найдены препараты для следующих каталожных номеров:',
    'uk-ua': 'Не знайдено препаратів для наступних каталожних номерів:',
  },
  problemsFound: {
    'en-us': 'There are problems with the entry:',
    'ru-ru': 'Обнаружены ошибки:',
    'es-es': 'Esta entrada da problemas:',
    'fr-fr': "Il y a des problèmes avec l'entrée :",
    'uk-ua': 'Знайдено помилки:',
    'de-ch': 'Es gibt Probleme mit dem Eintrag:',
  },
  byChoosingRecordSet: {
    comment: 'See documentation for syntax for plural rules',
    'en-us': 'By choosing a recordset ({{count:none | one | ??}} available)',
    'ru-ru': 'Выбрав набор записей (доступно {{count:none | one | ??}})',
    'es-es': `
      Eligiendo conjunto de registros ({{count:inguno | uno | ??}} disponible)
    `,
    'fr-fr': `
      En choisissant un jeu d'enregistrements ({{count:none | one | ??}}
      disponible)
    `,
    'uk-ua': 'Вибравши набір записів (доступно {{count:нуль | один | ??}})',
    'de-ch':
      'Durch wählen eines Datensatzes ({{count:none | one | ??}} available)',
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
    'uk-ua': 'Ввівши декілька {fieldName:string}',
    'de-ch': 'Durch Eingabe von {fieldName:string}s',
  },
  withoutPreparations: {
    'en-us': 'Without preparations',
    'ru-ru': 'Без подготовки',
    'es-es': 'Sin preparaciones',
    'fr-fr': 'Sans préparations',
    'uk-ua': 'Без препаратів',
    'de-ch': 'Ohne Präparate',
  },
  continueWithoutPreparations: {
    'en-us': 'Continue without preparations',
  },
  addUnassociated: {
    'en-us': 'Add unassociated item',
    'ru-ru': 'Добавить несвязанный элемент',
    'es-es': 'Añadir elemento no asociado',
    'fr-fr': 'Ajouter un élément non associé',
    'uk-ua': 'Додати неприв’язаний елемент',
    'de-ch': 'Nicht assoziierter Gegenstand hinzufügen',
  },
  preparations: {
    'en-us': 'Preparations',
    'ru-ru': 'Препараты',
    'es-es': 'Preparaciones',
    'fr-fr': 'Les préparatifs',
    'uk-ua': 'Препарати',
    'de-ch': 'Präparate',
  },
  preparationsCanNotBeReturned: {
    'en-us': 'Preparations cannot be returned in this context.',
    'ru-ru': 'Препараты не могут быть возвращены в этом контексте.',
    'es-es': 'No se pueden devolver las preparaciones en este contexto.',
    'fr-fr': 'Les préparations ne peuvent être retournées dans ce cadre.',
    'uk-ua': 'У цьому контексті препарати не повертаються.',
    'de-ch': 'Präparate können in diesem Kontext nicht zurückgegeben werden.',
  },
  noUnresolvedPreparations: {
    'en-us': 'There are no unresolved preparations for this loan.',
    'ru-ru': 'Незавершенных приготовлений по этому кредиту нет.',
    'es-es': 'No hay preparaciones sin resolver para este préstamo.',
    'fr-fr': "Il n'y a pas de préparatifs non résolus pour ce prêt.",
    'uk-ua': 'Немає жодної невирішеної підготовки щодо цієї позики.',
    'de-ch': 'Für dieses Ausleihe bestehen keine ungelösten Vorbereitungen.',
  },
  unresolved: {
    'en-us': 'Unresolved',
    'ru-ru': 'Нерешенные',
    'es-es': 'Sin resolver',
    'fr-fr': 'Non résolu',
    'uk-ua': 'Невирішені',
    'de-ch': 'Ungelöst',
  },
  return: {
    comment: 'Verb',
    'en-us': 'Return',
    'ru-ru': 'Возвращение',
    'es-es': 'Devolver',
    'fr-fr': 'Retour',
    'uk-ua': 'Повернути',
    'de-ch': 'Rückgabe',
  },
  resolve: {
    comment: 'As in "Resolve preparations"',
    'en-us': 'Resolve',
    'ru-ru': 'Разрешить',
    'es-es': 'Resolver',
    'fr-fr': 'Résoudre',
    'uk-ua': 'Вирішити',
    'de-ch': 'Lösen',
  },
  returnAllPreparations: {
    'en-us': 'Return all preparations',
    'ru-ru': 'Вернуть все препараты',
    'es-es': 'Devolver todas las preparaciones',
    'fr-fr': 'Retourner toutes les préparations',
    'uk-ua': 'Повернути всі препарати',
    'de-ch': 'Alle Präparate zurückgeben',
  },
  returnSelectedPreparations: {
    'en-us': 'Return selected preparations',
    'ru-ru': 'Вернуть выбранные препараты',
    'es-es': 'Devolver preparaciones seleccionadas',
    'fr-fr': 'Retourner les préparations sélectionnées',
    'uk-ua': 'Повернути обрані препарати',
    'de-ch': 'Ausgewählte Präparate zurückgeben',
  },
  selectAllAvailablePreparations: {
    'en-us': 'Select all available preparations',
    'ru-ru': 'Выбрать все доступные препараты',
    'es-es': 'Seleccionar todas las preparaciones disponibles',
    'fr-fr': 'Sélectionnez toutes les préparations disponibles',
    'uk-ua': 'Вибрати усі доступні препарати',
    'de-ch': 'Alle verfügbaren Präparate auswählen',
  },
  selectAll: {
    'en-us': 'Select All',
    'ru-ru': 'Выбрать все',
    'es-es': 'Seleccionar todo',
    'fr-fr': 'Tout sélectionner',
    'uk-ua': 'Вибрати всі',
    'de-ch': 'Alle auswählen',
  },
  selectedAmount: {
    'en-us': 'Selected Amount',
    'ru-ru': 'Выбранная сумма',
    'es-es': 'Cantiidad seleccionada',
    'fr-fr': 'Montant sélectionné',
    'uk-ua': 'Вибрана кількість',
    'de-ch': 'Ausgewählte Anzahl',
  },
  returnedAmount: {
    'en-us': 'Returned Amount',
    'ru-ru': 'Возвращенно',
    'es-es': 'Cantidad devuelta',
    'fr-fr': 'Montant retourné',
    'uk-ua': 'Повернена кількість',
    'de-ch': 'Zurückgegebene Anzahl',
  },
  resolvedAmount: {
    'en-us': 'Resolved Amount',
    'ru-ru': 'Решенный',
    'es-es': 'Cantidad resuelta',
    'fr-fr': 'Montant résolu',
    'uk-ua': 'Вирішена кількість',
    'de-ch': 'Gelöste Anzahl',
  },
  prepReturnFormatter: {
    comment: 'Used to format preparations in the prep return dialog',
    'en-us': '{tableName:string}: {resource:string}',
    'ru-ru': '{tableName:string}: {resource:string}',
    'es-es': '{tableName:string}: {resource:string}',
    'fr-fr': '{tableName:string} : {resource:string}',
    'uk-ua': '{tableName:string}: {resource:string}',
    'de-ch': '{tableName:string}: {resource:string}',
  },
  resolvedLoans: {
    comment: 'Example: Resolved Loan records',
    'en-us': 'Resolved {loanTable:string} records',
    'es-es': 'Préstamos resueltos',
    'fr-fr': 'Enregistrements {loanTable:string} résolus',
    'ru-ru': 'Решено {loanTable:string} записей',
    'uk-ua': 'Вирішені {loanTable:string} записи',
    'de-ch': '{loanTable:string}-Datensätze behoben',
  },
  openLoans: {
    comment: 'Example: Open Loan records',
    'en-us': 'Open {loanTable:string} records',
    'es-es': 'Préstamos abiertos',
    'fr-fr': 'Ouvrir les enregistrements {loanTable:string}',
    'ru-ru': 'Открыть {loanTable:string} записей',
    'uk-ua': 'Відкрити {loanTable:string} записи',
    'de-ch': 'Öffnen Sie {loanTable:string}-Datensätze',
  },
  gifts: {
    comment: 'Example: Gift records',
    'en-us': '{giftTable:string} records',
    'es-es': 'Regalos',
    'fr-fr': '{giftTable:string} enregistrements',
    'ru-ru': '{giftTable:string} записи',
    'uk-ua': '{giftTable:string} записи',
    'de-ch': '{giftTable:string} Datensätze',
  },
  exchanges: {
    comment: 'Example: Exchange In / Exchnage Out records',
    'en-us': '{exhangeInTable:string} / {exhangeOutTable:string} records',
    'es-es': 'Intercambios',
    'fr-fr':
      '{exhangeInTable:string} / {exhangeOutTable:string} enregistrements',
    'ru-ru': '{exhangeInTable:string} / {exhangeOutTable:string} записи',
    'uk-ua': 'Записи {exhangeInTable:string} / {exhangeOutTable:string}',
    'de-ch': '{exhangeInTable:string} / {exhangeOutTable:string} Datensätze',
  },
  unCataloged: {
    'en-us': 'uncataloged',
    'ru-ru': 'некаталогизированный',
    'es-es': 'descatalogado',
    'fr-fr': 'non catalogué',
    'uk-ua': 'некаталогований',
    'de-ch': 'nicht katalogisiert',
  },
  returnedPreparations: {
    comment: 'Example: Preparation records',
    'en-us': 'Returned {tablePreparation:string} records',
    'es-es': 'Registros {tablePreparation:string} devueltos',
    'fr-fr': 'Enregistrements {tablePreparation:string} renvoyés',
    'ru-ru': 'Возвращено {tablePreparation:string} записей',
    'uk-ua': 'Повернуто {tablePreparation:string} записів',
    'de-ch': 'Zurückgegebene {tablePreparation:string} Datensätze',
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
      {count:number|formatted} записів {tablePreparation:string} повернуто та
      збережено
    `,
    'de-ch': `
      {count:number|formatted} {tablePreparation:string} Datensätze wurden
      zurückgegeben und gespeichert
    `,
  },
  deselectAll: {
    'en-us': 'Deselect all',
    'ru-ru': 'Отменить выбор',
    'es-es': 'Deseleccionar todo',
    'fr-fr': 'Tout déselectionner',
    'uk-ua': 'Зняти вибір із усіх',
    'de-ch': 'Alle abwählen',
  },
  available: {
    'en-us': 'Available',
    'ru-ru': 'В наличии',
    'es-es': 'Disponible',
    'fr-fr': 'Disponible',
    'uk-ua': 'В наявності',
    'de-ch': 'Verfügbar',
  },
  unavailable: {
    'en-us': 'Unavailable',
    'ru-ru': 'Недоступен',
    'es-es': 'Indisponible',
    'fr-fr': 'Indisponible',
    'uk-ua': 'Недоступні',
    'de-ch': 'Nicht verfügbar',
  },
  returnLoan: {
    comment: 'Example: Return Loan records',
    'en-us': 'Return {tableLoan:string} records',
    'es-es': 'Devolver registros {tableLoan:string}',
    'fr-fr': 'Renvoyer les enregistrements {tableLoan:string}',
    'ru-ru': 'Вернуть записи {tableLoan:string}',
    'uk-ua': 'Повернути {tableLoan:string} записи',
    'de-ch': 'Gibt {tableLoan:string} Datensätze zurück',
  },
  printInvoice: {
    'en-us': 'Print Invoice',
    'ru-ru': 'Распечатать Накладную',
    'es-es': 'Imprimir factura',
    'fr-fr': "La facture d'impression",
    'uk-ua': 'Роздрукувати рахунок-фактуру',
    'de-ch': 'Rechnung drucken',
  },
  loanWithoutPreparation: {
    comment: 'Example: Loan w/o Preparation records',
    'en-us': '{tableLoan:string} w/o {tablePreparation:string} records',
    'es-es': '{tableLoan:string} sin registros {tablePreparation:string}',
    'fr-fr':
      '{tableLoan:string} sans enregistrements {tablePreparation:string}',
    'ru-ru': '{tableLoan:string} без записей {tablePreparation:string}',
    'uk-ua': '{tableLoan:string} без {tablePreparation:string} записів',
    'de-ch': '{tableLoan:string} ohne {tablePreparation:string} Datensätze',
  },
  loanWithoutPreparationDescription: {
    comment: 'Example: Create a Loan with no Preparation records',
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
      'Створіть {tableLoan:string} без {tablePreparation:string} записів',
    'de-ch': `
      Erstellen Sie ein {tableLoan:string} ohne
      {tablePreparation:string}-Datensätze
    `,
  },
  createRecord: {
    comment: 'Example: Create a Loan',
    'en-us': 'Create {table:string}',
    'es-es': 'Crear {table:string}',
    'fr-fr': 'Créer {table:string}',
    'ru-ru': 'Создать {table:string}',
    'uk-ua': 'Створити {table:string}',
    'de-ch': 'Erstelle {table:string}',
  },
  editRecord: {
    comment: 'Example: Edit a Loan',
    'en-us': 'Edit {table:string}',
    'es-es': 'Editar {table:string}',
    'fr-fr': 'Modifier {table:string}',
    'ru-ru': 'Изменить {table:string}',
    'uk-ua': 'Редагувати {table:string}',
    'de-ch': 'Bearbeiten {table:string}',
  },
  noPreparationsWarning: {
    'en-us':
      'None of these objects have preparations. Would you like to continue?',
  },
} as const);
