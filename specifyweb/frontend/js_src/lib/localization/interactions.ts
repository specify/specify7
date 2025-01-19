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
  noInteractions: {
    comment: 'Example: There are no interactions linked to this {preparation}',
    'en-us':
      'There are no interactions linked to this {preparationTable:string}.',
  },
  addItems: {
    'en-us': 'Add Items',
    'ru-ru': 'Добавить элементы',
    'es-es': 'Agregar elementos',
    'fr-fr': 'Ajouter des objets',
    'uk-ua': 'Додати предмети',
    'de-ch': 'Elemente hinzufügen',
  },
  recordReturn: {
    'en-us': '{table:string} Return',
    'ru-ru': '{table:string} Возврат',
    'es-es': '{table:string} Regresar',
    'fr-fr': '{table:string} Retour',
    'uk-ua': '{table:string} Повернення',
    'de-ch': '{table:string} Datensätze',
  },
  preparationsNotFoundFor: {
    comment: 'Example: No preparation records were found for the following records:',
    'en-us': 'No {preparationTable:string} records were found for the following records:',
  },
  preparationsNotAvailableFor: {
    'en-us': `
      No {preparationTable:string} records are available for at least one type of preparation in the
      following records:
    `,
  },
  problemsFound: {
    'en-us': 'There are problems with the entry:',
    'ru-ru': 'Есть проблемы со входом:',
    'es-es': 'Hay problemas con la entrada:',
    'fr-fr': 'Il y a des problèmes avec la saisie :',
    'uk-ua': 'Є проблеми з входом:',
    'de-ch': 'Es gibt Probleme mit dem Eintrag:',
  },
  byChoosingRecordSet: {
    comment: 'See documentation for syntax for plural rules',
    'en-us': 'By choosing a recordset ({{count:none | one | ??}} available)',
    'ru-ru': 'Выбрав набор записей (доступен {{count:none | один | ??}})',
    'es-es': `
      Eligiendo un conjunto de registros ({{count:none | one | ??}} disponible)
    `,
    'fr-fr': `
      En choisissant un jeu d'enregistrements ({{count:none | one | ??}}
      disponible)
    `,
    'uk-ua': 'Вибравши набір записів (доступно {{count:none | one | ??}})',
    'de-ch':
      'Durch wählen eines Datensatzes ({{count:none | one | ??}} available)',
  },
  byEnteringNumbers: {
    comment: `
      Field name is localized. Coming from Schema Configuration. I.e, By
      entering Catalog Numbers
    `,
    'en-us': 'By entering {fieldName:string}s',
    'ru-ru': 'Введя {fieldName:string}s',
    'es-es': 'Ingresando {fieldName:string}s',
    'fr-fr': 'En saisissant les {fieldName:string}',
    'uk-ua': 'Ввівши {fieldName:string}s',
    'de-ch': 'Durch Eingabe von {fieldName:string}s',
  },
  withoutPreparations: {
    'en-us': 'No {preparationTable:string}',
  },
  continueWithoutPreparations: {
    'en-us': 'Continue without {preparationTable:string}',
  },
  addUnassociated: {
    'en-us': 'Add unassociated item',
    'ru-ru': 'Добавить несвязанный элемент',
    'es-es': 'Agregar elemento no asociado',
    'fr-fr': 'Ajouter un objet non associé',
    'uk-ua': 'Додати непов’язаний елемент',
    'de-ch': 'Nicht assoziierter Gegenstand hinzufügen',
  },
  preparations: {
    'en-us': 'Add {preparationTable:string}',
  },
  preparationsCanNotBeReturned: {
    'en-us': '{preparationTable:string} records cannot be returned in this context.',
  },
  noUnresolvedPreparations: {
    'en-us': 'There are no unresolved {loanPreparationsLabel:string}.',
  },
  unresolved: {
    'en-us': 'Unresolved',
    'ru-ru': 'нерешенный',
    'es-es': 'Irresoluto',
    'fr-fr': 'Non résolu',
    'uk-ua': 'Невирішено',
    'de-ch': 'Ungelöst',
  },
  return: {
    comment: 'Verb',
    'en-us': 'Return',
    'ru-ru': 'Возвращаться',
    'es-es': 'Devolver',
    'fr-fr': 'Retour',
    'uk-ua': 'Повернення',
    'de-ch': 'Rückgabe',
  },
  resolve: {
    comment: 'As in "Resolve preparations"',
    'en-us': 'Resolve',
    'ru-ru': 'Решать',
    'es-es': 'Resolver',
    'fr-fr': 'Résoudre',
    'uk-ua': "Розв'язати",
    'de-ch': 'Lösen',
  },
  returnAllPreparations: {
    'en-us': 'Return all {preparationTable:string} records',
  },
  returnSelectedPreparations: {
    'en-us': 'Return selected {preparationTable:string} records',
  },
  selectAllAvailablePreparations: {
    'en-us': 'Select all available {preparationTable:string} records',
  },
  selectAll: {
    'en-us': 'Select All',
    'ru-ru': 'Выбрать все',
    'es-es': 'Seleccionar todo',
    'fr-fr': 'Tout sélectionner',
    'uk-ua': 'Вибрати все',
    'de-ch': 'Alle auswählen',
  },
  selectedAmount: {
    'en-us': 'Selected Amount',
    'ru-ru': 'Выбранная сумма',
    'es-es': 'Monto seleccionado',
    'fr-fr': 'Quantité sélectionnée',
    'uk-ua': 'Вибрана сума',
    'de-ch': 'Ausgewählte Anzahl',
  },
  returnedAmount: {
    'en-us': 'Returned Amount',
    'ru-ru': 'Возвращенная сумма',
    'es-es': 'Monto devuelto',
    'fr-fr': 'Quantité retournée',
    'uk-ua': 'Повернена сума',
    'de-ch': 'Zurückgegebene Anzahl',
  },
  resolvedAmount: {
    'en-us': 'Resolved Amount',
    'ru-ru': 'Решенная сумма',
    'es-es': 'Monto Resuelto',
    'fr-fr': 'Montant résolu',
    'uk-ua': 'Вирішена сума',
    'de-ch': 'Gelöste Anzahl',
  },
  prepReturnFormatter: {
    comment: 'Used to format preparations in the prep return dialog',
    'en-us': '{tableName:string}: {resource:string}',
    'ru-ru': '[Х0Х]: [Х20Х]',
    'es-es': '{tableName:string}: {resource:string}',
    'fr-fr': '{tableName:string} : {resource:string}',
    'uk-ua': '{tableName:string}: {resource:string}',
    'de-ch': '{tableName:string}: {resource:string}',
  },
  resolvedLoans: {
    comment: 'Example: Resolved Loan records',
    'en-us': 'Resolved {loanTable:string} records',
    'es-es': 'Registros {loanTable:string} resueltos',
    'fr-fr': 'Enregistrements {loanTable:string} résolus',
    'ru-ru': 'Решенные записи {loanTable:string}',
    'uk-ua': 'Вирішено записи {loanTable:string}.',
    'de-ch': 'Aufgelöste {loanTable:string}-Datensätze',
  },
  openLoans: {
    comment: 'Example: Open Loan records',
    'en-us': 'Open {loanTable:string} records',
    'es-es': 'Abrir registros {loanTable:string}',
    'fr-fr': 'Ouvrir les enregistrements {loanTable:string}',
    'ru-ru': 'Открыть записи {loanTable:string}',
    'uk-ua': 'Відкрийте записи {loanTable:string}.',
    'de-ch': 'Offene {loanTable:string}-Datensätze',
  },
  gifts: {
    comment: 'Example: Gift records',
    'en-us': '{giftTable:string} records',
    'es-es': '{giftTable:string} registros',
    'fr-fr': '{giftTable:string} enregistrements',
    'ru-ru': '{giftTable:string} записи',
    'uk-ua': '{giftTable:string} записи',
    'de-ch': '{giftTable:string} Datensätze',
  },
  disposals: {
    comment: 'Example: Disposal records',
    'en-us': '{disposalTable:string} records',
    'es-es': '{disposalTable:string} registros',
    'fr-fr': '{disposalTable:string} enregistrements',
    'ru-ru': '{disposalTable:string} записи',
    'uk-ua': '{disposalTable:string} записи',
    'de-ch': '{disposalTable:string} Datensätze',
  },
  exchangeOut: {
    comment: 'Example: Exchange Out records',
    'en-us': '{exchangeOutTable:string} records',
    'es-es': '{exchangeOutTable:string} registros',
    'fr-fr': '{exchangeOutTable:string} enregistrements',
    'ru-ru': '{exchangeOutTable:string} записи',
    'uk-ua': '{exchangeOutTable:string} записи',
    'de-ch': '{exchangeOutTable:string} Datensätze',
  },
  exchangeIn: {
    comment: 'Example: Exchange In records',
    'en-us': '{exchangeInTable:string} records',
    'es-es': '{exchangeInTable:string} registros',
    'fr-fr': '{exchangeInTable:string} enregistrements',
    'ru-ru': '{exchangeInTable:string} записи',
    'uk-ua': '{exchangeInTable:string} записи',
    'de-ch': '{exchangeInTable:string} Datensätze',
  },
  unCataloged: {
    'en-us': 'uncataloged',
    'ru-ru': 'не внесенный в каталог',
    'es-es': 'sin catalogar',
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
      Los registros {count:number|formatted} {tablePreparation:string} se han
      devuelto y guardado
    `,
    'fr-fr': `
      Les enregistrements {count:number|formatted} {tablePreparation:string} ont
      été renvoyés et enregistrés
    `,
    'ru-ru': `
      {count:number|formatted} {tablePreparation:string} записи возвращены и
      сохранены
    `,
    'uk-ua': `
      Записи {count:number|formatted} {tablePreparation:string} повернуто та
      збережено
    `,
    'de-ch': `
      {count:number|formatted} {tablePreparation:string} Datensätze wurden
      zurückgegeben und gespeichert
    `,
  },
  deselectAll: {
    'en-us': 'Deselect all',
    'ru-ru': 'Убрать выделение со всего',
    'es-es': 'Deseleccionar todo',
    'fr-fr': 'Tout déselectionner',
    'uk-ua': 'Зняти вибір із усіх',
    'de-ch': 'Alle abwählen',
  },
  available: {
    'en-us': 'Available',
    'ru-ru': 'Доступный',
    'es-es': 'Disponible',
    'fr-fr': 'Disponible',
    'uk-ua': 'в наявності',
    'de-ch': 'Verfügbar',
  },
  unavailable: {
    'en-us': 'Unavailable',
    'ru-ru': 'Недоступен',
    'es-es': 'Indisponible',
    'fr-fr': 'Indisponible',
    'uk-ua': 'Недоступний',
    'de-ch': 'Nicht verfügbar',
  },
  returnLoan: {
    comment: 'Example: Return Loan records',
    'en-us': 'Return {tableLoan:string} records',
    'es-es': 'Devolver registros {tableLoan:string}',
    'fr-fr': 'Renvoyer les enregistrements {tableLoan:string}',
    'ru-ru': 'Вернуть {tableLoan:string} записей',
    'uk-ua': 'Повернути записи {tableLoan:string}.',
    'de-ch': '{tableLoan:string} Datensätze zurückgeben',
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
  noPreparationsWarning: {
    'en-us':
      'None of these objects have preparations. Would you like to continue?',
    'de-ch': `
      Für keines dieser Objekte liegen Vorbereitungen vor. Möchten Sie
      fortfahren?
    `,
    'es-es':
      'Ninguno de estos objetos tiene preparaciones. ¿Te gustaria continuar?',
    'fr-fr': "Aucun de ces objets n'a de préparation. Voulez-vous continuer?",
    'ru-ru': `
      Ни один из этих объектов не имеет подготовки. Желаете ли вы продолжить?
    `,
    'uk-ua': "Жоден із цих об'єктів не має підготовки. Бажаєте продовжити?",
  },
  continue: {
    'en-us': 'Continue',
    'de-ch': 'Weitermachen',
    'es-es': 'Continuar sin preparativos',
    'fr-fr': 'Continuer sans préparation',
    'ru-ru': 'Продолжить без подготовки',
    'uk-ua': 'Продовжуйте без підготовки',
  },
} as const);
