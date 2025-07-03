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
    'pt-br': 'Interações',
  },
  addItems: {
    'en-us': 'Add Items',
    'ru-ru': 'Добавить элементы',
    'es-es': 'Agregar elementos',
    'fr-fr': 'Ajouter des objets',
    'uk-ua': 'Додати елементи',
    'de-ch': 'Elemente hinzufügen',
    'pt-br': 'Adicionar itens',
  },
  recordReturn: {
    'en-us': '{table:string} Return',
    'ru-ru': '{table:string} Возврат',
    'es-es': '{table:string} Regresar',
    'fr-fr': '{table:string} Retour',
    'uk-ua': '{table:string} Повернення',
    'de-ch': '{table:string} Rückkehr',
    'pt-br': '{table:string} Retornar',
  },
  noInteractions: {
    comment: 'Example: There are no interactions linked to this {preparation}',
    'en-us':
      'There are no interactions linked to this {preparationTable:string}.',
  },
  preparationsNotFoundFor: {
    comment:
      'Example: No preparation records were found for the following records:',
    'en-us':
      'No {preparationTable:string} records were found for the following records:',
  },
  preparationsNotAvailableFor: {
    'en-us': `
      No {preparationTable:string} records are available for at least one type of preparation in the
      following records:
    `,
  },
  problemsFound: {
    'en-us': 'There are problems with the entry:',
    'ru-ru': 'Возникли проблемы с записью:',
    'es-es': 'Hay problemas con la entrada:',
    'fr-fr': 'Il y a des problèmes avec la saisie :',
    'uk-ua': 'Є проблеми зі вступом:',
    'de-ch': 'Es gibt Probleme mit dem Eintrag:',
    'pt-br': 'Há problemas com a entrada:',
  },
  byChoosingRecordSet: {
    comment: 'See documentation for syntax for plural rules',
    'en-us': 'By choosing a recordset ({{count:none | one | ??}} available)',
    'ru-ru': 'Выбрав набор записей (доступно {{count:none | one | ??}})',
    'es-es':
      'Al elegir un conjunto de registros ({{count:none | one | ??}} disponibles)',
    'fr-fr':
      "En choisissant un jeu d'enregistrements ({{count:none | one | ??}} disponible)",
    'uk-ua': 'Вибравши набір записів (доступно {{count:none | one | ??}})',
    'de-ch':
      'Durch wählen eines Datensatzes ({{count:none | one | ??}} available)',
    'pt-br':
      'Escolhendo um conjunto de registros ({{count:none | one | ??}} disponível)',
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
    'pt-br': 'Ao inserir {fieldName:string}s',
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
    'uk-ua': "Додати непов'язаний елемент",
    'de-ch': 'Nicht assoziierter Gegenstand hinzufügen',
    'pt-br': 'Adicionar item não associado',
  },
  preparations: {
    'en-us': 'Add {preparationTable:string}',
  },
  preparationsCanNotBeReturned: {
    'en-us':
      '{preparationTable:string} records cannot be returned in this context.',
  },
  noUnresolvedPreparations: {
    'en-us':
      'There are no unresolved {loanPreparationsLabel:string} for this {loanTableLabel:string}.',
  },
  unresolved: {
    'en-us': 'Unresolved',
    'ru-ru': 'Нерешенный',
    'es-es': 'Irresoluto',
    'fr-fr': 'Non résolu',
    'uk-ua': 'Невирішено',
    'de-ch': 'Ungelöst',
    'pt-br': 'Não resolvido',
  },
  return: {
    comment: 'Verb',
    'en-us': 'Return',
    'ru-ru': 'Возвращаться',
    'es-es': 'Devolver',
    'fr-fr': 'Retour',
    'uk-ua': 'Повернення',
    'de-ch': 'Rückgabe',
    'pt-br': 'Retornar',
  },
  resolve: {
    comment: 'As in "Resolve preparations"',
    'en-us': 'Resolve',
    'ru-ru': 'Решать',
    'es-es': 'Resolver',
    'fr-fr': 'Résoudre',
    'uk-ua': 'Вирішити',
    'de-ch': 'Lösen',
    'pt-br': 'Resolver',
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
    'pt-br': 'Selecionar tudo',
  },
  selectedAmount: {
    'en-us': 'Selected Amount',
    'ru-ru': 'Выбранная сумма',
    'es-es': 'Cantidad seleccionada',
    'fr-fr': 'Quantité sélectionnée',
    'uk-ua': 'Вибрана сума',
    'de-ch': 'Ausgewählte Anzahl',
    'pt-br': 'Quantidade selecionada',
  },
  returnedAmount: {
    'en-us': 'Returned Amount',
    'ru-ru': 'Возвращенная сумма',
    'es-es': 'Cantidad devuelta',
    'fr-fr': 'Quantité retournée',
    'uk-ua': 'Повернена сума',
    'de-ch': 'Zurückgegebene Anzahl',
    'pt-br': 'Valor Devolvido',
  },
  resolvedAmount: {
    'en-us': 'Resolved Amount',
    'ru-ru': 'Решенная сумма',
    'es-es': 'Monto Resuelto',
    'fr-fr': 'Montant résolu',
    'uk-ua': 'Вирішена сума',
    'de-ch': 'Gelöste Anzahl',
    'pt-br': 'Valor resolvido',
  },
  prepReturnFormatter: {
    comment: 'Used to format preparations in the prep return dialog',
    'en-us': '{tableName:string}: {resource:string}',
    'ru-ru': '{tableName:string}: {resource:string}',
    'es-es': '{tableName:string}: {resource:string}',
    'fr-fr': '{tableName:string}: {resource:string}',
    'uk-ua': "{tableName:string}': {resource:string}",
    'de-ch': '{tableName:string}: {resource:string}',
    'pt-br': '{tableName:string}: {resource:string}',
  },
  tableLabelRecords: {
    comment: 'Example: Exchange In records',
    'en-us': '{tableLabel:string} records',
  },
  unCataloged: {
    'en-us': 'uncataloged',
    'ru-ru': 'некаталогизированный',
    'es-es': 'sin catalogar',
    'fr-fr': 'non catalogué',
    'uk-ua': 'некаталогізований',
    'de-ch': 'nicht katalogisiert',
    'pt-br': 'não catalogado',
  },
  returnedPreparations: {
    comment: 'Example: Preparation records',
    'en-us': 'Returned {tablePreparation:string} records',
    'es-es': 'Se devolvieron {tablePreparation:string} registros',
    'fr-fr': 'Enregistrements {tablePreparation:string} renvoyés',
    'ru-ru': 'Возвращено {tablePreparation:string} записей',
    'uk-ua': 'Повернуто записів {tablePreparation:string}',
    'de-ch': 'Zurückgegebene {tablePreparation:string} Datensätze',
    'pt-br': 'Registros retornados {tablePreparation:string}',
  },
  returnedAndSaved: {
    comment: 'Example: 2 Preparation records have been returned and saved',
    'en-us':
      '{count:number|formatted} {tablePreparation:string} records have been returned and saved',
    'es-es':
      'Se han devuelto y guardado {count:number|formatted} {tablePreparation:string} registros',
    'fr-fr':
      '{count:number|formatted} {tablePreparation:string} enregistrements ont été renvoyés et enregistrés',
    'ru-ru':
      '{count:number|formatted} {tablePreparation:string} записей были возвращены и сохранены',
    'uk-ua':
      'Повернуто та збережено записів {count:number|formatted} {tablePreparation:string}',
    'de-ch':
      '{count:number|formatted} {tablePreparation:string} Datensätze wurden zurückgegeben und gespeichert',
    'pt-br':
      '{count:number|formatted} {tablePreparation:string} registros foram retornados e salvos',
  },
  deselectAll: {
    'en-us': 'Deselect all',
    'ru-ru': 'Отменить выбор всех',
    'es-es': 'Deseleccionar todo',
    'fr-fr': 'Désélectionner tout',
    'uk-ua': 'Зняти вибір усіх',
    'de-ch': 'Alle abwählen',
    'pt-br': 'Desmarcar tudo',
  },
  available: {
    'en-us': 'Available',
    'ru-ru': 'Доступный',
    'es-es': 'Disponible',
    'fr-fr': 'Disponible',
    'uk-ua': 'Доступно',
    'de-ch': 'Verfügbar',
    'pt-br': 'Disponível',
  },
  unavailable: {
    'en-us': 'Unavailable',
    'ru-ru': 'Недоступно',
    'es-es': 'Indisponible',
    'fr-fr': 'Indisponible',
    'uk-ua': 'Недоступно',
    'de-ch': 'Nicht verfügbar',
    'pt-br': 'Indisponível',
  },
  returnLoan: {
    comment: 'Example: Return Loan records',
    'en-us': 'Return {tableLoan:string} records',
    'es-es': 'Devolver {tableLoan:string} registros',
    'fr-fr': 'Renvoyer les enregistrements {tableLoan:string}',
    'ru-ru': 'Возврат {tableLoan:string} записей',
    'uk-ua': 'Повернути записи {tableLoan:string}',
    'de-ch': '{tableLoan:string} Datensätze zurückgeben',
    'pt-br': 'Retornar {tableLoan:string} registros',
  },
  createRecord: {
    comment: 'Example: Create a Loan',
    'en-us': 'Create {table:string}',
    'es-es': 'Crear {table:string}',
    'fr-fr': 'Créer {table:string}',
    'ru-ru': 'Создать {table:string}',
    'uk-ua': 'Створити {table:string}',
    'de-ch': 'Erstelle {table:string}',
    'pt-br': 'Criar {table:string}',
  },
  noPreparationsWarning: {
    'en-us':
      'None of these objects have {preparationTable:string} records. Would you like to continue?',
  },
  continue: {
    'en-us': 'Continue',
    'de-ch': 'Weitermachen',
    'es-es': 'Continuar',
    'fr-fr': 'Continuer',
    'ru-ru': 'Продолжать',
    'uk-ua': 'Продовжити',
    'pt-br': 'Continuar',
  },
  notAvailable: {
    'en-us': 'Not available',
    'de-ch': 'Nicht verfügbar',
    'es-es': 'No disponible',
    'fr-fr': 'Pas disponible',
    'pt-br': 'Não disponível',
    'ru-ru': 'Нет в наличии',
    'uk-ua': 'Не доступно',
  },
} as const);
