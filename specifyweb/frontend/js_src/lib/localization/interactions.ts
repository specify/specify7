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
    'en-us': 'No preparations were found for the following records:',
    'de-ch': 'Für folgende Datensätze wurden keine Präparate gefunden:',
    'es-es': 'No se encontraron preparativos para los siguientes registros:',
    'fr-fr':
      "Aucune préparation n'a été trouvée pour les enregistrements suivants :",
    'ru-ru': 'Никаких приготовлений не обнаружено для следующих записей:',
    'uk-ua': 'Не знайдено жодних препаратів для таких записів:',
  },
  preparationsNotAvailableFor: {
    'en-us': `
      No preparations are available for at least one type of preparation in the
      following records:
    `,
    'de-ch': `
      Für mindestens eine Präparationsart sind in folgenden Datensätzen keine
      Präparate vorhanden:
    `,
    'es-es': `
      No hay preparados disponibles para al menos un tipo de preparado en los
      siguientes registros:
    `,
    'fr-fr': `
      Aucune préparation n'est disponible pour au moins un type de préparation
      dans les enregistrements suivants :
    `,
    'ru-ru': `
      В следующих записях отсутствуют препараты хотя бы для одного типа
      препаратов:
    `,
    'uk-ua': `
      У таких записах відсутні препарати принаймні для одного типу препарату:
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
  catalogNumberAlreadyUsed: {
    'en-us': 'Catalog numbers already used:',
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
    'en-us': 'Without preparations',
    'ru-ru': 'Без подготовки',
    'es-es': 'Sin preparativos',
    'fr-fr': 'Sans préparations',
    'uk-ua': 'Без препаратів',
    'de-ch': 'Ohne Präparate',
  },
  continueWithoutPreparations: {
    'en-us': 'Continue without preparations',
    'de-ch': 'Weiter ohne Vorbereitungen',
    'es-es': 'Continuar sin preparativos',
    'fr-fr': 'Continuer sans préparation',
    'ru-ru': 'Продолжить без подготовки',
    'uk-ua': 'Продовжуйте без підготовки',
  },
  continueWithoutCollectionObject: {
    'en-us': 'Continue without collection object',
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
    'en-us': 'Preparations',
    'ru-ru': 'Препараты',
    'es-es': 'Preparativos',
    'fr-fr': 'Preparations',
    'uk-ua': 'препарати',
    'de-ch': 'Präparate',
  },
  preparationsCanNotBeReturned: {
    'en-us': 'Preparations cannot be returned in this context.',
    'ru-ru': 'В этом случае препараты не подлежат возврату.',
    'es-es': 'En este contexto, los preparados no se pueden devolver.',
    'fr-fr': 'Les preparations ne peuvent être renvoyées dans ce contexte.',
    'uk-ua': 'У цьому контексті препарати не повертаються.',
    'de-ch': 'Präparate können in diesem Kontext nicht zurückgegeben werden.',
  },
  noUnresolvedPreparations: {
    'en-us': 'There are no unresolved preparations for this loan.',
    'ru-ru': 'Нет никаких нерешенных приготовлений к этому кредиту.',
    'es-es': 'No hay preparativos pendientes para este préstamo.',
    'fr-fr': 'Il n’y a pas de preparations non retournées pour ce prêt.',
    'uk-ua': 'Немає жодної невирішеної підготовки щодо цієї позики.',
    'de-ch': 'Für dieses Ausleihe bestehen keine ungelösten Vorbereitungen.',
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
    'en-us': 'Return all preparations',
    'ru-ru': 'Добавить элементы',
    'es-es': '[X0X] Regresar',
    'fr-fr': 'Retourner toutes les préparations',
    'uk-ua': '[X0X] Повернення',
    'de-ch': 'Alle Präparate zurückgeben',
  },
  returnSelectedPreparations: {
    'en-us': 'Return selected preparations',
    'ru-ru': 'Вернуть выбранные препараты',
    'es-es': 'Devolver los preparados seleccionados',
    'fr-fr': 'Retourner les préparations sélectionnées',
    'uk-ua': 'Повернути обрані препарати',
    'de-ch': 'Ausgewählte Präparate zurückgeben',
  },
  selectAllAvailablePreparations: {
    'en-us': 'Select all available preparations',
    'ru-ru': 'Выбрать все доступные препараты',
    'es-es': 'Seleccione todas las preparaciones disponibles',
    'fr-fr': 'Sélectionnez toutes les préparations disponibles',
    'uk-ua': 'Виберіть усі доступні препарати',
    'de-ch': 'Alle verfügbaren Präparate auswählen',
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
  exchanges: {
    comment: 'Example: Exchange In / Exchnage Out records',
    'en-us': '{exhangeInTable:string} / {exhangeOutTable:string} records',
    'es-es': 'Registros {exhangeInTable:string} / {exhangeOutTable:string}',
    'fr-fr':
      'Enregistrements {exhangeInTable:string} / {exhangeOutTable:string}',
    'ru-ru': '{exhangeInTable:string} / {exhangeOutTable:string} записи',
    'uk-ua': 'Записи {exhangeInTable:string} / {exhangeOutTable:string}.',
    'de-ch': '{exhangeInTable:string} / {exhangeOutTable:string} Datensätze',
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
