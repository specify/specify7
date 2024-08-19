/**
 * Localization strings used by Record Merging tool
 *
 * @module
 */

import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

export const mergingText = createDictionary({
  recordMerging: {
    'en-us': 'Record Merging',
    'ru-ru': 'Объединение записей',
    'de-ch': 'Datensatzzusammenführung',
    'es-es': 'Fusión de registros',
    'fr-fr': "Fusion d'enregistrements",
    'uk-ua': "Об'єднання записів",
  },
  mergeRecords: {
    'en-us': 'Merge Records',
    'ru-ru': 'Объединить записи',
    'de-ch': 'Datensätze zusammenführen',
    'es-es': 'Fusionar registros',
    'fr-fr': 'Fusionner les enregistrements',
    'uk-ua': 'Об’єднати записи',
  },
  mergedRecord: {
    'en-us': 'Merged Record',
    'ru-ru': 'Объединенная запись',
    'de-ch': 'Zusammengeführter Datensatz',
    'es-es': 'Registro fusionado',
    'fr-fr': 'Enregistrement fusionné',
    'uk-ua': 'Об’єднаний запис',
  },
  showConflictingFieldsOnly: {
    'en-us': 'Show conflicting fields only',
    'ru-ru': 'Показывать только конфликтующие поля',
    'de-ch': 'Nur in Konflikt stehende Felder anzeigen',
    'es-es': 'Mostrar solo campos en conflicto',
    'fr-fr': 'Afficher uniquement les champs en conflit',
    'uk-ua': 'Показувати лише конфліктуючі поля',
  },
  newMergedRecord: {
    'en-us': 'New merged record',
    'ru-ru': 'Новая объединенная запись',
    'de-ch': 'Neuer zusammengeführter Datensatz',
    'es-es': 'Nuevo registro fusionado',
    'fr-fr': 'Nouvel enregistrement fusionné',
    'uk-ua': "Новий об'єднаний запис",
  },
  duplicateRecord: {
    'en-us': 'Preview {index:number|formatted}',
    'ru-ru': 'Предварительный просмотр {index:number|formatted}',
    'de-ch': 'Vorschau {index:number|formatted}',
    'es-es': 'Vista previa de {index:number|formatted}',
    'fr-fr': 'Aperçu {index:number|formatted}',
    'uk-ua': 'Попередній перегляд {index:number|formatted}',
  },
  nRecords: {
    'en-us': '{count:number|formatted} records',
    'ru-ru': '{count:number|formatted} записи',
    'de-ch': '{count:number|formatted} Datensätze',
    'es-es': '{count:number|formatted} registros',
    'fr-fr': '{count:number|formatted} enregistrements',
    'uk-ua': '{count:number|formatted} записи',
  },
  subViewControls: {
    'en-us': 'Sub-view Controls',
    'ru-ru': 'Элементы управления подпредставлением',
    'de-ch': 'Unteransichtssteuerung',
    'es-es': 'Controles de vista parcial',
    'fr-fr': 'Contrôles de sous-vue',
    'uk-ua': 'Елементи керування вкладеним переглядом',
  },
  mergeFields: {
    comment: 'Example: "Merge Addresses"',
    'en-us': 'Merge {field:string}',
    'ru-ru': 'Объединить {field:string}',
    'de-ch': 'Zusammenführen {field:string}',
    'es-es': 'Fusionar {field:string}',
    'fr-fr': 'Fusionner {field:string}',
    'uk-ua': "Об'єднати {field:string}",
  },
  autoPopulate: {
    'en-us': 'Auto-populate',
    'de-ch': 'Automatisch ausfüllen',
    'es-es': 'Autocompletar',
    'fr-fr': 'Remplir automatiquement',
    'ru-ru': 'Автозаполнение',
    'uk-ua': 'Автоматичне заповнення',
  },
  dismissFromMerging: {
    'en-us': 'Dismiss from merging',
    'de-ch': 'Vom Zusammenführen ausschließen',
    'es-es': 'Descartar la fusión',
    'fr-fr': 'Interdire la fusion',
    'ru-ru': 'Отклонить от слияния',
    'uk-ua': 'Відхилити від об’єднання',
  },
  agentContainsGroupDescription: {
    'en-us': 'Agents contain group members',
    'es-es': 'Los agentes contienen miembros de grupo',
    'de-ch': 'Zusammengeführter Datensatz',
    'fr-fr': 'Enregistrement fusionné',
    'ru-ru': 'Объединенная запись',
    'uk-ua': 'Об’єднаний запис',
  },
  recordNotBeMergedReason: {
    'en-us': 'The following records cannot be merged. Reason:',
    'de-ch':
      'Die folgenden Datensätze können nicht zusammengeführt werden. Grund:',
    'es-es': 'Los siguientes registros no se pueden fusionar. Razón:',
    'fr-fr':
      'Les enregistrements suivants ne peuvent pas être fusionnés. Raison:',
    'ru-ru': 'Следующие записи невозможно объединить. Причина:',
    'uk-ua': 'Наступні записи не можна об’єднати. Причина:',
  },
  someCannotBeMerged: {
    'en-us': 'Some records cannot be merged',
    'es-es': 'Algunos registros no se pueden fusionar',
    'de-ch': 'Beim Zusammenführen ist ein Fehler aufgetreten.',
    'fr-fr': "Quelque chose s'est mal passé pendant le processus de fusion.",
    'ru-ru': 'Что-то пошло не так в процессе слияния.',
    'uk-ua': 'Щось пішло не так під час процесу об’єднання.',
  },
  mergeOthers: {
    'en-us': 'Merge others',
    'de-ch': 'Andere zusammenführen',
    'es-es': 'Fusionar otros',
    'fr-fr': 'Fusionner les autres',
    'ru-ru': 'Объединить других',
    'uk-ua': 'Об’єднати інші',
  },
  warningMergeText: {
    'en-us': `
      Before proceeding, please note that the following action may interrupt
      other users. This action may cause delays or temporary unavailability of
      certain features for Specify users. Please consider the impact on their
      experience. This merge cannot be undone
    `,
    'de-ch': `
      Bevor Sie fortfahren, beachten Sie bitte, dass die folgende Aktion andere
      Benutzer unterbrechen kann. Diese Aktion kann zu Verzögerungen oder einer
      vorübergehenden Nichtverfügbarkeit bestimmter Funktionen für
      Specify-Benutzer führen. Bitte bedenken Sie die Auswirkungen auf deren
      Benutzererfahrung. Diese Zusammenführung kann nicht rückgängig gemacht
      werden.
    `,
    'es-es': `
      Antes de continuar, tenga en cuenta que la siguiente acción puede
      interrumpir a otros usuarios. Esta acción puede provocar retrasos o
      indisponibilidad temporal de determinadas funciones para los usuarios de
      Specify. Tenga en cuenta las repercusiones que puedan experimentar. Esta
      fusión no se puede deshacer
    `,
    'fr-fr': `
      Avant de continuer, veuillez noter que l'action suivante peut interrompre
      les autres utilisateurs. Cette action peut entraîner des retards ou une
      indisponibilité temporaire de certaines fonctionnalités pour les
      utilisateurs Specify. Veuillez considérer l’impact sur leur expérience.
      Cette fusion est irréversible
    `,
    'ru-ru': `
      Прежде чем продолжить, обратите внимание, что следующее действие может
      помешать другим пользователям. Это действие может привести к задержкам или
      временной недоступности определенных функций для пользователей Specify.
      Пожалуйста, учтите влияние на их опыт. Это объединение невозможно
      отменить.
    `,
    'uk-ua': `
      Перш ніж продовжити, зауважте, що наступна дія може перешкодити іншим
      користувачам. Ця дія може призвести до затримок або тимчасової
      недоступності певних функцій для користувачів Specify. Будь ласка,
      врахуйте вплив на їхній досвід. Це об’єднання не можна скасувати
    `,
  },
  mergeFailed: {
    'en-us': 'Merge Failed',
    'de-ch': 'Zusammenführung fehlgeschlagen',
    'es-es': 'Fusión fallida',
    'fr-fr': 'Échec de la fusion',
    'ru-ru': 'Слияние не удалось',
    'uk-ua': 'Не вдалося злити',
  },
  mergeSucceeded: {
    'en-us': 'Merge Succeeded',
    'de-ch': 'Zusammenführung erfolgreich',
    'es-es': 'Fusión exitosa',
    'fr-fr': 'Fusion réussie',
    'ru-ru': 'Слияние выполнено успешно',
    'uk-ua': 'Злиття виконано',
  },
  merging: {
    'en-us': 'Merging',
    'de-ch': 'Zusammenführen',
    'es-es': 'Fusionando',
    'fr-fr': 'Fusion',
    'ru-ru': 'Слияние',
    'uk-ua': 'Злиття',
  },
  mergingHasStarted: {
    'en-us': 'The merge process has started.',
    'de-ch': 'Der Zusammenführungsprozess wurde gestartet.',
    'es-es': 'El proceso de fusión ha comenzado.',
    'fr-fr': 'Le processus de fusion a commencé.',
    'ru-ru': 'Процесс слияния начался.',
    'uk-ua': 'Процес об’єднання розпочато.',
  },
  mergingHasSucceeded: {
    'en-us': 'The merge process has succeeded.',
    'de-ch': 'Der Zusammenführungsprozess war erfolgreich.',
    'es-es': 'El proceso de fusión ha sido exitoso.',
    'fr-fr': 'Le processus de fusion a réussi.',
    'ru-ru': 'Процесс слияния завершился успешно.',
    'uk-ua': 'Процес об’єднання завершився успішно.',
  },
  mergingHasFailed: {
    'en-us': 'The merge process has failed.',
    'de-ch': 'Der Zusammenführungsprozess ist fehlgeschlagen.',
    'es-es': 'El proceso de fusión ha fallado.',
    'fr-fr': 'Le processus de fusion a échoué.',
    'ru-ru': 'Процесс слияния не удался.',
    'uk-ua': 'Помилка процесу об’єднання.',
  },
  mergingHasBeenCanceled: {
    'en-us': 'The merge process has been cancelled.',
    'de-ch': 'Der Zusammenführungsprozess wurde abgebrochen.',
    'es-es': 'Se ha cancelado el proceso de fusión.',
    'fr-fr': 'Le processus de fusion a été annulé.',
    'ru-ru': 'Процесс слияния отменен.',
    'uk-ua': 'Процес об’єднання скасовано.',
  },
  retryMerge: {
    'en-us': 'Retry merge.',
    'de-ch': 'Zusammenführung erneut versuchen.',
    'es-es': 'Reintentar la fusión.',
    'fr-fr': 'Réessayez la fusion.',
    'ru-ru': 'Повторите попытку объединения.',
    'uk-ua': 'Повторити об’єднання.',
  },
  mergingWentWrong: {
    'en-us': 'Something went wrong during the merging process.',
    'de-ch': 'Beim Zusammenführen ist ein Fehler aufgetreten.',
    'es-es': 'Algo salió mal durante el proceso de fusión.',
    'fr-fr': "Quelque chose s'est mal passé pendant le processus de fusion.",
    'ru-ru': 'Что-то пошло не так в процессе слияния.',
    'uk-ua': 'Щось пішло не так під час процесу об’єднання.',
  },
  linkedRecords: {
    'en-us': 'Linked Records',
    'de-ch': 'Verknüpfte Datensätze',
    'es-es': 'Registros vinculados',
    'fr-fr': 'Enregistrements liés',
    'ru-ru': 'Связанные записи',
    'uk-ua': "Пов'язані записи",
  },
} as const);
