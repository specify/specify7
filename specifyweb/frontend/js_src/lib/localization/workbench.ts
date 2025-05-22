/**
 * Localization strings used by the WorkBench (not workbench mapper)
 *
 * @module
 */

import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

export const wbText = createDictionary({
  workBench: {
    'en-us': 'WorkBench',
    'ru-ru': 'WorkBench',
    'es-es': 'banco de trabajo',
    'fr-fr': 'Table de travail',
    'uk-ua': 'WorkBench',
    'de-ch': 'WorkBench',
  },
  uploadPlan: {
    'en-us': 'Upload Plan',
    'de-ch': 'Upload-Plan',
    'es-es': `
      Tenga en cuenta que la validación en vivo es una función experimental y no
      sustituye a la validación regular.
    `,
    'fr-fr': 'Télécharger le forfait',
    'ru-ru': `
      Обратите внимание, что живая проверка — это экспериментальная функция,
      которая не заменяет обычную проверку.
    `,
    'uk-ua': 'План завантаження',
  },
  rollback: {
    'en-us': 'Roll Back',
    'ru-ru': 'Откат',
    'es-es': 'Retroceder',
    'fr-fr': 'Retour en arriere',
    'uk-ua': 'Відкат',
    'de-ch': 'Rollback',
  },
  validate: {
    'en-us': 'Validate',
    'ru-ru': 'Проверить',
    'es-es': 'Validar',
    'fr-fr': 'Valider',
    'uk-ua': 'Перевірити',
    'de-ch': 'Validieren',
  },
  validation: {
    'en-us': 'Validation',
    'ru-ru': 'Проверка',
    'es-es': 'Validación',
    'fr-fr': 'Validation',
    'uk-ua': 'Перевірка',
    'de-ch': 'Validierung',
  },
  upload: {
    'en-us': 'Upload',
    'ru-ru': 'Загрузка',
    'es-es': 'Cargar',
    'fr-fr': 'Télécharger',
    'uk-ua': 'Завантажити',
    'de-ch': 'Hochladen',
  },
  rollingBack: {
    'en-us': 'Rolling Back',
    'ru-ru': 'Откат',
    'es-es': 'Retrocediendo',
    'fr-fr': 'Reculer',
    'uk-ua': 'Відкат назад',
    'de-ch': 'Zurück rollen',
  },
  uploading: {
    'en-us': 'Uploading',
    'ru-ru': 'Загрузка',
    'es-es': 'Cargando',
    'fr-fr': 'Téléchargement',
    'uk-ua': 'Завантаження',
    'de-ch': 'Hochladen',
  },
  validating: {
    'en-us': 'Validating',
    'ru-ru': 'Проверка',
    'es-es': 'Validando',
    'fr-fr': 'Validation',
    'uk-ua': 'Перевірка',
    'de-ch': 'Validierung',
  },
  disambiguate: {
    'en-us': 'Disambiguate',
    'ru-ru': 'Устранить Неоднозначность',
    'es-es': 'Desambiguar',
    'fr-fr': "Lever l'ambiguïté",
    'uk-ua': 'Усунути неоднозначність',
    'de-ch': 'Disambiguieren',
  },
  fillDown: {
    'en-us': 'Fill Down',
    'ru-ru': 'Заполнить Вниз',
    'es-es': 'Rellenar hacia Abajo',
    'fr-fr': 'Remplissez',
    'uk-ua': 'Заповнити вниз',
    'de-ch': 'Abfüllen',
  },
  fillUp: {
    'en-us': 'Fill Up',
    'ru-ru': 'Заполнить Вверх',
    'es-es': 'Rellenar hacia Arriba',
    'fr-fr': 'Remplir',
    'uk-ua': 'Заповнити',
    'de-ch': 'Auffüllen',
  },
  revert: {
    'en-us': 'Revert',
    'ru-ru': 'Вернуть',
    'es-es': 'Revertir',
    'fr-fr': 'Revenir',
    'uk-ua': 'Повернути',
    'de-ch': 'Zurückkehren',
  },
  dataCheck: {
    'en-us': 'Live Validation',
    'ru-ru': 'Проверка данных',
    'es-es': 'Verificar Datos',
    'fr-fr': 'Vérification des données',
    'uk-ua': 'Перевірка даних',
    'de-ch': 'Live-Validierung',
  },
  dataCheckOn: {
    'en-us': 'Live Validation: On',
    'ru-ru': 'Проверка данных: вкл.',
    'es-es': 'Verificar Datos: ON',
    'fr-fr': 'Vérification des données : activée',
    'uk-ua': 'Перевірка даних: увімкнено',
    'de-ch': 'Live-Validierung: Ein',
  },
  dataCheckDescription: {
    'en-us': `
      Note, live validation is an experimental feature and is not a substitute
      for regular validation.
    `,
    'de-ch': `
      Beachten Sie, dass die Live-Validierung eine experimentelle Funktion ist
      und keinen Ersatz für die regelmäßige Validierung darstellt.
    `,
    'es-es': `
      Tenga en cuenta que la validación en vivo es una función experimental y no
      sustituye a la validación regular.
    `,
    'fr-fr': `
      Notez que la validation en direct est une fonctionnalité expérimentale et
      ne remplace pas la validation régulière.
    `,
    'ru-ru': `
      Обратите внимание, что живая проверка — это экспериментальная функция,
      которая не заменяет обычную проверку.
    `,
    'uk-ua': `
      Зауважте, що перевірка в реальному часі є експериментальною функцією і не
      замінює звичайну перевірку.
    `,
  },
  changeOwner: {
    'en-us': 'Change Owner',
    'ru-ru': 'Сменить владельца',
    'es-es': 'Cambiar Propietario',
    'fr-fr': 'Changer de propriétaire',
    'uk-ua': 'Змінити власника',
    'de-ch': 'Besitzer wechseln',
  },
  convertCoordinates: {
    'en-us': 'Convert Coordinates',
    'ru-ru': 'Преобразовать координаты',
    'es-es': 'Convertir Coordenadas',
    'fr-fr': 'Convertir les coordonnées',
    'uk-ua': 'Перетворення координат',
    'de-ch': 'Koordinaten konvertieren',
  },
  navigation: {
    'en-us': 'Navigation',
    'ru-ru': 'Навигация',
    'es-es': 'Navegación',
    'fr-fr': 'La navigation',
    'uk-ua': 'Навігація',
    'de-ch': 'Navigation',
  },
  replace: {
    'en-us': 'Replace',
    'ru-ru': 'Заменять',
    'es-es': 'Sustituir',
    'fr-fr': 'Remplacer',
    'uk-ua': 'Замінити',
    'de-ch': 'Ersetzen',
  },
  replacementValue: {
    'en-us': 'Replacement value',
    'ru-ru': 'Замена',
    'es-es': 'Valor a sustituir',
    'fr-fr': 'Valeur de remplacement',
    'uk-ua': 'Відновна вартість',
    'de-ch': 'Wiederbeschaffungswert',
  },
  searchResults: {
    'en-us': 'Search Results',
    'ru-ru': 'Результаты Поиска',
    'es-es': 'Buscar resultados',
    'fr-fr': 'Résultats de recherche',
    'uk-ua': 'Результати пошуку',
    'de-ch': 'Suchergebnisse',
  },
  clickToToggle: {
    'en-us': 'Click to toggle visibility',
    'ru-ru': 'Нажмите, чтобы переключить видимость',
    'es-es': 'Pinchar para alternar visibilidad',
    'fr-fr': 'Cliquez pour basculer la visibilité',
    'uk-ua': 'Натисніть, щоб увімкнути видимість',
    'de-ch': 'Klicken, um die Sichtbarkeit umzuschalten',
  },
  configureSearchReplace: {
    'en-us': 'Configure Search & Replace',
    'ru-ru': 'Настроить поиск и замену',
    'es-es': 'Configurar Consulta y Sustitución',
    'fr-fr': 'Configurer la recherche et le remplacement',
    'uk-ua': 'Налаштувати пошук і заміну',
    'de-ch': 'Suchen und Ersetzen konfigurieren',
  },
  modifiedCells: {
    'en-us': 'Modified Cells',
    'ru-ru': 'Модифицированные клетки',
    'es-es': 'Celdas Modificadas',
    'fr-fr': 'Cellules modifiées',
    'uk-ua': 'Модифіковані клітини',
    'de-ch': 'Modifizierte Zellen',
  },
  newCells: {
    'en-us': 'New Cells',
    'ru-ru': 'Новые клетки',
    'es-es': 'Celdas Nuevas',
    'fr-fr': 'Nouvelles cellules',
    'uk-ua': 'Нові клітини',
    'de-ch': 'Neue Zellen',
  },
  errorCells: {
    'en-us': 'Error Cells',
    'ru-ru': 'Ячейки с ошибками',
    'es-es': 'Celdas con Error',
    'fr-fr': "Cellules d'erreur",
    'uk-ua': 'Комірки помилок',
    'de-ch': 'Fehlerzellen',
  },
  dataEditor: {
    'en-us': 'Data Editor',
    'ru-ru': 'Редактор данных',
    'es-es': 'Editor de Datos',
    'fr-fr': 'Éditeur de données',
    'uk-ua': 'Редактор даних',
    'de-ch': 'Dateneditor',
  },
  noDisambiguationResults: {
    'en-us': 'Unable to disambiguate',
    'ru-ru': 'Невозможно устранить неуверенность',
    'es-es': 'No se puede desambiguar',
    'fr-fr': "Impossible de lever l'ambiguïté",
    'uk-ua': 'Неможливо усунути неоднозначність',
    'de-ch': 'Kann nicht eindeutig bestimmt werden',
  },
  noDisambiguationResultsDescription: {
    'en-us': `
      None of the matched records currently exist in the database. This can
      happen if all of the matching records were deleted since the validation
      process occurred, or if all of the matches were ambiguous with respect
      other records in this data set. In the latter case, you will need to add
      fields and values to the data set to resolve the ambiguity.
    `,
    'ru-ru': `
      Ни одна из совпадающих записей в настоящее время не существует в базе
      данных. Это может произойти, если все совпадающие записи были удалены с
      моментапроверки, или если все совпадения были неоднозначными по отношению
      к другим записям в этом наборе данных. В последнем случае вы потребуется
      добавить новые поля и значения в набор данных, чтобы разрешить
      двусмысленность.
    `,
    'es-es': `
      Ninguno de los registros coincidentes existe actualmente en la base de
      datos. Esto puede suceder si se eliminaron todos los registros
      coincidentes desde que se produjo el proceso de validación, o si todas las
      coincidencias fueron ambiguas con respecto a otros registros en este
      conjunto de datos. En el último caso, deberá agregar campos y valores al
      conjunto de datos para resolver la ambigüedad.
    `,
    'fr-fr': `
      Aucun des enregistrements correspondants n'existe actuellement dans la
      base de données. Cela peut se produire si tous les enregistrements
      correspondants ont été supprimés depuis le processus de validation, ou si
      toutes les correspondances étaient ambiguës par rapport aux autres
      enregistrements de cet ensemble de données. Dans ce dernier cas, vous
      devrez ajouter des champs et des valeurs à l'ensemble de données pour
      lever l'ambiguïté.
    `,
    'uk-ua': `
      Жоден із відповідних записів наразі не існує в базі даних. Це може
      статися, якщо всі відповідні записи було видалено після процесу перевірки
      або якщо всі збіги були неоднозначними щодо інших записів у цьому наборі
      даних. В останньому випадку вам потрібно буде додати поля та значення до
      набору даних, щоб усунути неоднозначність.
    `,
    'de-ch': `
      Keiner der übereinstimmenden Datensätze ist derzeit in der Datenbank
      vorhanden. Dies kann passieren, wenn alle übereinstimmenden Datensätze
      seit dem Validierungsprozess gelöscht wurden oder wenn alle
      Übereinstimmungen in Bezug auf andere Datensätze in diesem Datensatz
      mehrdeutig waren. Im letzteren Fall müssen Sie dem Datensatz Felder und
      Werte hinzufügen, um die Mehrdeutigkeit aufzulösen.
    `,
  },
  disambiguateMatches: {
    'en-us': 'Disambiguate Multiple Record Matches',
    'ru-ru': 'Устранение неоднозначности',
    'es-es': 'Eliminar la ambigüedad de coincidencias de registros múltiples',
    'fr-fr':
      "Lever l'ambiguïté des correspondances d'enregistrements multiples",
    'uk-ua': 'Усуньте неоднозначність збігів кількох записів',
    'de-ch': 'Mehrere Datensatzübereinstimmungen eindeutig machen',
  },
  applyAllUnavailable: {
    'en-us': '"Apply All" is not available while Data Check is in progress.',
    'ru-ru': '«Применить все» недоступно, пока выполняется проверка данных.',
    'es-es': '"Aplicar a Todos" no está disponible durante la Verificación.',
    'fr-fr': `
      « Appliquer tout » n'est pas disponible lorsque la vérification des
      données est en cours.
    `,
    'uk-ua':
      'Функція «Застосувати все» недоступна, поки триває перевірка даних.',
    'de-ch':
      '„Alle anwenden“ ist nicht verfügbar, während die Datenprüfung läuft.',
  },
  beginRollback: {
    'en-us': 'Begin Data Set Roll Back?',
    'ru-ru': 'Начать откат набора данных?',
    'es-es': '¿Comenzar reversión del conjunto de datos?',
    'fr-fr': "Commencer la restauration de l'ensemble de données ?",
    'uk-ua': 'Почати відкат набору даних?',
    'de-ch': 'Mit dem Zurücksetzen des Datensatzes beginnen?',
  },
  beginRollbackDescription: {
    'en-us': `
      Rolling back will remove the new data records this Data Set added to the
      Specify database. The entire rollback will be cancelled if any of the
      uploaded data have been referenced (re-used) by other data records since
      they were uploaded.
    `,
    'ru-ru': `
      Откат удалит новые записи данных, которые этот набор данных добавил в базу
      данных Specify. Весь откат будет отменен, если на загруженные данные
      ссылаются другие записи данных с момента они были загружены.
    `,
    'es-es': `
      La reversión eliminará los nuevos registros de datos que este conjunto de
      datos agregó a la base de datos de especificación. La reversión completa
      se cancelará si alguno de los datos cargados ha sido referenciado
      (reutilizado) por otros registros de datos desde que se cargaron.
    `,
    'fr-fr': `
      La restauration supprimera les nouveaux enregistrements de données que cet
      ensemble de données a ajoutés à la base de données Specify. L'intégralité
      de la restauration sera annulée si l'une des données téléchargées a été
      référencée (réutilisée) par d'autres enregistrements de données depuis
      leur téléchargement.
    `,
    'uk-ua': `
      Відкат видалить нові записи даних, додані цим набором даних до бази даних
      Specify. Повний відкат буде скасовано, якщо на будь-які завантажені дані
      посилалися (повторно використовували) інші записи даних після їх
      завантаження.
    `,
    'de-ch': `
      Durch das Zurücksetzen werden die neuen Datensätze gelöscht, die dieser
      Datensatz zur angegebenen Datenbank hinzugefügt hat. Das gesamte
      Zurücksetzen wird abgebrochen, wenn seit dem Hochladen auf hochgeladene
      Daten von anderen Datensätzen verwiesen (wiederverwendet) wurde.
    `,
  },
  startUpload: {
    'en-us': 'Begin Data Set Upload?',
    'ru-ru': 'Начать загрузку набора данных?',
    'es-es': '¿Comenzar carga de conjunto de datos?',
    'fr-fr': "Commencer le téléchargement de l'ensemble de données ?",
    'uk-ua': 'Почати завантаження набору даних?',
    'de-ch': 'Hochladen des Datensatzes beginnen?',
  },
  startUploadDescription: {
    'en-us':
      'Uploading the Data Set will add the data to the Specify database.',
    'ru-ru': 'Загрузка набора данных добавит данные в базу данных Specify.',
    'es-es': `
      Cargar el conjunto de datos agregará los datos a la base de datos de
      especificación.
    `,
    'fr-fr': `
      Le téléchargement de l'ensemble de données ajoutera les données à la base
      de données Specify.
    `,
    'uk-ua': 'Завантаження набору даних додасть дані до бази даних Specify.',
    'de-ch': `
      Durch das Hochladen des Datensatzes werden die Daten zur angegebenen
      Datenbank hinzugefügt.
    `,
  },
  deleteDataSet: {
    'en-us': 'Delete this Data Set?',
    'ru-ru': 'Удалить этот набор данных?',
    'es-es': '¿Eliminar este conjunto de datos?',
    'fr-fr': 'Supprimer cet ensemble de données ?',
    'uk-ua': 'Видалити цей набір даних?',
    'de-ch': 'Diesen Datensatz löschen?',
  },
  deleteDataSetDescription: {
    'en-us': `
      Deleting a Data Set permanently removes it and its Upload Plan. Data
      mappings will no longer be available for re-use with other Data Sets. Also
      after deleting, Rollback will no longer be an option for an uploaded Data
      Set.
    `,
    'ru-ru': `
      Удаление набора данных приводит к безвозвратному удалению его и его плана
      загрузки. План загрузки не будут доступным для повторного использования;
      Отката не будет возможным для загруженного набора данных.
    `,
    'es-es': `
      Eliminar un conjunto de datos lo elimina de forma permanente junto con su
      plan de carga. Las asignaciones de datos ya no estarán disponibles para su
      reutilización con otros conjuntos de datos. Además, después de eliminar,
      la reversión ya no será una opción para un conjunto de datos cargado.
    `,
    'fr-fr': `
      La suppression d'un ensemble de données le supprime définitivement ainsi
      que son plan de téléchargement. Les mappages de données ne pourront plus
      être réutilisés avec d'autres ensembles de données. De plus, après la
      suppression, la restauration ne sera plus une option pour un ensemble de
      données téléchargé.
    `,
    'uk-ua': `
      Видалення набору даних остаточно видаляє його та його план завантаження.
      Зіставлення даних більше не буде доступним для повторного використання з
      іншими наборами даних. Крім того, після видалення відкат більше не буде
      доступним для завантаженого набору даних.
    `,
    'de-ch': `
      Durch das Löschen eines Datensatzes werden dieser und sein Upload-Plan
      dauerhaft entfernt. Datenzuordnungen sind dann nicht mehr für die
      Wiederverwendung mit anderen Datensätzen verfügbar. Außerdem ist nach dem
      Löschen für einen hochgeladenen Datensatz kein Rollback mehr möglich.
    `,
  },
  dataSetDeleted: {
    'en-us': 'Data Set successfully deleted',
    'ru-ru': 'Набор данных успешно удален',
    'es-es': 'Conjunto de datos eliminado con éxito',
    'fr-fr': 'Ensemble de données supprimé avec succès',
    'uk-ua': 'Набір даних успішно видалено',
    'de-ch': 'Datensatz erfolgreich gelöscht',
  },
  dataSetDeletedDescription: {
    'en-us': 'Data Set successfully deleted.',
    'ru-ru': 'Набор данных успешно удален.',
    'es-es': 'Conjunto de datos eliminado con éxito.',
    'fr-fr': 'Ensemble de données supprimé avec succès.',
    'uk-ua': 'Набір даних успішно видалено.',
    'de-ch': 'Datensatz erfolgreich gelöscht.',
  },
  revertChanges: {
    'en-us': 'Revert Unsaved Changes?',
    'ru-ru': 'Отменить несохраненные изменения?',
    'es-es': '¿Revertir cambios no guardados?',
    'fr-fr': 'Annuler les modifications non enregistrées ?',
    'uk-ua': 'Скасувати незбережені зміни?',
    'de-ch': 'Nicht gespeicherte Änderungen rückgängig machen?',
  },
  revertChangesDescription: {
    'en-us': `
      This action will discard all changes made to the Data Set since the last
      Save.
    `,
    'ru-ru': `
      Это действие приведет к отмене всех изменений, внесенных в набор данных с
      момента последнего сохранение.
    `,
    'es-es': `
      Esta acción descartará todos los cambios realizados en el conjunto de
      datos desde la última vez que se guardó.
    `,
    'fr-fr': `
      Cette action annulera toutes les modifications apportées à l'ensemble de
      données depuis le dernier enregistrement.
    `,
    'uk-ua': `
      Ця дія призведе до скасування всіх змін, внесених до набору даних після
      останнього збереження.
    `,
    'de-ch': `
      Durch diese Aktion werden alle seit der letzten Speicherung am Datensatz
      vorgenommenen Änderungen verworfen.
    `,
  },
  saving: {
    'en-us': 'Saving...',
    'ru-ru': 'Сохранение...',
    'es-es': 'Ahorro...',
    'fr-fr': 'Économie...',
    'uk-ua': 'Збереження...',
    'de-ch': 'Speichern...',
  },
  wbUnloadProtect: {
    'en-us': 'Changes to this Data Set have not been Saved.',
    'ru-ru': 'Изменения в этом наборе данных не были сохранены.',
    'es-es': 'Los cambios a este conjunto de datos no se han guardado.',
    'fr-fr': `
      Les modifications apportées à cet ensemble de données n'ont pas été
      enregistrées.
    `,
    'uk-ua': 'Зміни в цьому наборі даних не збережено.',
    'de-ch': 'Änderungen an diesem Datensatz wurden nicht gespeichert.',
  },
  noMatchErrorMessage: {
    'en-us': 'No matching record for must-match table.',
    'ru-ru':
      'Нет соответствующей записи для таблицы обязательного соответствия.',
    'es-es': 'No hay registro que coincida en tabla de coincidencia obligada.',
    'fr-fr': `
      Aucun enregistrement correspondant pour la table à correspondance
      obligatoire.
    `,
    'uk-ua':
      'Немає відповідного запису для таблиці обов’язкової відповідності.',
    'de-ch': 'Kein passender Datensatz für die Must-Match-Tabelle.',
  },
  matchedMultipleErrorMessage: {
    'en-us': `
      This value matches two or more existing database records and the match
      must be disambiguated before uploading.
    `,
    'ru-ru': `
      Это значение соответствует двум или более существующим записям базы данных
      и совпадению
    `,
    'es-es': `
      Este valor coincide con dos o más registros existentes en la base de datos
      y han de desambigüarse antes de cargar.
    `,
    'fr-fr': `
      Cette valeur correspond à deux enregistrements de base de données
      existants ou plus et la correspondance doit être levée avant le
      téléchargement.
    `,
    'uk-ua': `
      Це значення збігається з двома чи більше існуючими записами бази даних, і
      збіг необхідно усунути перед завантаженням.
    `,
    'de-ch': `
      Dieser Wert stimmt mit zwei oder mehreren vorhandenen Datenbankeinträgen
      überein und die Übereinstimmung muss vor dem Hochladen eindeutig geklärt
      werden.
    `,
  },
  validationNoErrors: {
    'en-us': 'Validate Completed with No Errors',
    'ru-ru': 'Проверка завершена без ошибок',
    'es-es': 'Validar completado sin errores',
    'fr-fr': 'Validation terminée sans erreur',
    'uk-ua': 'Перевірка завершена без помилок',
    'de-ch': 'Status des Datensatz-Uploads',
  },
  validationNoErrorsDescription: {
    'en-us': `
      Validation found no errors, it is ready to be uploaded into the database.
    `,
    'ru-ru': `
      Проверка завершена без ошибок. Этот набора данных готов к загрузке в базу
      данных.
    `,
    'es-es': `
      La validación no encontró errores, está listo para ser cargado en la base
      de datos.
    `,
    'fr-fr': `
      La validation n'a trouvé aucune erreur, elle est prête à être téléchargée
      dans la base de données.
    `,
    'uk-ua': `
      Перевірка не виявила помилок, вона готова до завантаження в базу даних.
    `,
    'de-ch': `
      Bei der Validierung wurden keine Fehler gefunden. Der Upload kann nun in
      die Datenbank erfolgen.
    `,
  },
  validationReEditWarning: {
    'en-us': `
      Note: If this Data Set is edited and re-saved, Validate should be re-run
      prior to Uploading to verify that no errors have been introduced.
    `,
    'ru-ru': `
      Примечание: Если этот набор данных отредактирован и повторно сохранен,
      начать проверку снова, чтобы убедиться, что ошибок не было введено.
    `,
    'es-es': `
      Nota: si este conjunto de datos se edita y se vuelve a guardar, se debe
      volver a ejecutar Validar antes de cargar para verificar que no se hayan
      introducido errores.
    `,
    'fr-fr': `
      Remarque : Si cet ensemble de données est modifié et réenregistré, la
      validation doit être réexécutée avant le téléchargement pour vérifier
      qu'aucune erreur n'a été introduite.
    `,
    'uk-ua': `
      Примітка. Якщо цей набір даних відредаговано та повторно збережено, перед
      завантаженням слід повторно запустити перевірку, щоб переконатися, що не
      було допущено помилок.
    `,
    'de-ch': `
      Hinweis: Wenn dieser Datensatz bearbeitet und erneut gespeichert wird,
      sollte die Validierung vor dem Hochladen erneut ausgeführt werden, um
      sicherzustellen, dass keine Fehler aufgetreten sind.
    `,
  },
  validationErrors: {
    'en-us': 'Validate Completed with Errors',
    'ru-ru': 'Проверка завершена с ошибками',
    'es-es': 'Validar completado con errores',
    'fr-fr': 'Valider terminé avec des erreurs',
    'uk-ua': 'Перевірка виконана з помилками',
    'de-ch': 'Validierung mit Fehlern abgeschlossen',
  },
  validationErrorsDescription: {
    'en-us': 'Validation found errors in the Data Set.',
    'ru-ru': 'Проверка обнаружила ошибки в наборе данных.',
    'es-es': 'La validación encontró errores en el conjunto de datos.',
    'fr-fr': "La validation a détecté des erreurs dans l'ensemble de données.",
    'uk-ua': 'Перевірка виявила помилки в наборі даних.',
    'de-ch': 'Bei der Validierung wurden Fehler im Datensatz gefunden.',
  },
  uploadSuccessful: {
    'en-us': 'Upload Completed with No Errors',
    'ru-ru': 'Загрузка завершена без ошибок',
    'es-es': 'Carga completada sin errores',
    'fr-fr': 'Téléchargement terminé sans erreur',
    'uk-ua': 'Завантаження завершено без помилок',
    'de-ch': 'Upload ohne Fehler abgeschlossen',
  },
  uploadSuccessfulDescription: {
    'en-us': `
      Click on the "Results" button to see the number of new records added to
      each database table.
    `,
    'ru-ru': `
      Нажмите кнопку «Результаты», чтобы увидеть количество новых записей
      добавлен в каждую таблицу базы данных
    `,
    'es-es': `
      Haga clic en el botón "Resultados" para ver la cantidad de nuevos
      registros agregados a cada tabla de la base de datos.
    `,
    'fr-fr': `
      Cliquez sur le bouton « Résultats » pour voir le nombre de nouveaux
      enregistrements ajoutés à chaque table de la base de données.
    `,
    'uk-ua': `
      Натисніть кнопку «Результати», щоб побачити кількість нових записів,
      доданих до кожної таблиці бази даних.
    `,
    'de-ch': `
      Klicken Sie auf die Schaltfläche „Ergebnisse“, um die Anzahl der neuen
      Datensätze anzuzeigen, die jeder Datenbanktabelle hinzugefügt wurden.
    `,
  },
  uploadErrors: {
    'en-us': 'Upload Failed due to Error Cells',
    'ru-ru': 'Ошибка загрузки из-за ошибок',
    'es-es': 'Carga fallida debido a celdas de error',
    'fr-fr': "Échec du téléchargement en raison de cellules d'erreur",
    'uk-ua': 'Помилка завантаження через клітинки помилок',
    'de-ch': 'Der Upload ist aufgrund fehlerhafter Zellen fehlgeschlagen',
  },
  uploadErrorsDescription: {
    'en-us': 'The upload failed due to one or more cell value errors.',
    'ru-ru':
      'Загрузка не удалась из-за одной или нескольких ошибок значений ячеек.',
    'es-es': 'La carga falló debido a uno o más errores de valor de celda.',
    'fr-fr': `
      Le téléchargement a échoué en raison d'une ou plusieurs erreurs de valeur
      de cellule.
    `,
    'uk-ua':
      'Помилка завантаження через одну або кілька помилок значення клітинки.',
    'de-ch': `
      Der Upload ist aufgrund eines oder mehrerer Zellenwertfehler
      fehlgeschlagen.
    `,
  },
  uploadErrorsSecondDescription: {
    'en-us': `
      Validate the Data Set and review the mouseover hints for each error cell,
      then make the appropriate corrections. Save and retry the {type:string}.
    `,
  },
  dataSetRollback: {
    'en-us': 'Data Set was rolled back successfully',
    'ru-ru': 'Набор данных был успешно откат',
    'es-es': 'El conjunto de datos se revirtió con éxito',
    'fr-fr': "L'ensemble de données a été restauré avec succès",
    'uk-ua': 'Набір даних успішно повернуто',
    'de-ch': 'Der Datensatz wurde erfolgreich zurückgesetzt',
  },
  dataSetRollbackDescription: {
    'en-us':
      'This Rolledback Data Set is saved, and can be edited or re-uploaded.',
    'ru-ru': `
      Этот набор данных отката сохранянен, и его можно редактировать или
      повторно загружать.
    `,
    'es-es': `
      Este conjunto de datos revertidos se guarda y se puede editar o volver a
      cargar.
    `,
    'fr-fr': `
      Cet ensemble de données restaurées est enregistré et peut être modifié ou
      téléchargé à nouveau.
    `,
    'uk-ua': `
      Цей відкочений набір даних зберігається та може бути відредагований або
      повторно завантажений.
    `,
    'de-ch': `
      Dieser zurückgesetzte Datensatz wird gespeichert und kann bearbeitet oder
      erneut hochgeladen werden.
    `,
  },
  validationCanceled: {
    'en-us': 'Validation Cancelled',
    'ru-ru': 'Проверка отменена',
    'es-es': 'Validación cancelada',
    'fr-fr': 'Validation annulée',
    'uk-ua': 'Перевірку скасовано',
    'de-ch': 'Validierung abgebrochen',
  },
  validationCanceledDescription: {
    'en-us': 'Data Set Validation cancelled.',
    'ru-ru': 'Проверка набора данных отменена.',
    'es-es': 'Se canceló la validación del conjunto de datos.',
    'fr-fr': "Validation de l'ensemble de données annulée.",
    'uk-ua': 'Перевірку набору даних скасовано.',
    'de-ch': 'Datensatzvalidierung abgebrochen.',
  },
  rollbackCanceled: {
    'en-us': 'Rollback Cancelled',
    'ru-ru': 'Загрузка отменена',
    'es-es': 'Reversión cancelada',
    'fr-fr': 'Restauration annulée',
    'uk-ua': 'Відкат скасовано',
    'de-ch': 'Rollback abgebrochen',
  },
  rollbackCanceledDescription: {
    'en-us': 'Data Set Rollback cancelled.',
    'ru-ru': 'Откат набора данных отменен.',
    'es-es': 'Reversión del conjunto de datos cancelada.',
    'fr-fr': 'Restauration de l’ensemble de données annulée.',
    'uk-ua': 'Відкат набору даних скасовано.',
    'de-ch': 'Datensatz-Rollback abgebrochen.',
  },
  uploadCanceled: {
    'en-us': 'Upload Cancelled',
    'ru-ru': 'Загрузка отменена',
    'es-es': 'Subida cancelada',
    'de-ch': 'Datensatzvalidierung abgebrochen.',
    'fr-fr': 'Téléchargement annulé',
    'uk-ua': 'Завантаження скасовано',
  },
  uploadCanceledDescription: {
    'en-us': 'Data Set Upload cancelled.',
    'ru-ru': 'Загрузка набора данных отменена.',
    'es-es': 'Carga de conjunto de datos cancelada.',
    'fr-fr': "Téléchargement de l'ensemble de données annulé.",
    'uk-ua': 'Завантаження набору даних скасовано.',
    'de-ch': 'Der Upload des Datensatzes wurde abgebrochen.',
  },
  coordinateConverter: {
    'en-us': 'Geocoordinate Format',
    'ru-ru': 'Геокоординатный формат',
    'es-es': 'Formato de geocoordenadas',
    'fr-fr': 'Format de géocoordonnée',
    'uk-ua': 'Формат геокоординат',
    'de-ch': 'Geokoordinatenformat',
  },
  coordinateConverterDescription: {
    'en-us': 'Choose a preferred Geocoordinate format',
    'ru-ru': 'Выберите предпочтительный формат геокоординат',
    'es-es': 'Elija un formato de geocoordenada preferido',
    'fr-fr': 'Choisissez un format de géocoordonnée préféré',
    'uk-ua': 'Виберіть потрібний формат геокоординат',
    'de-ch': 'Wählen Sie ein bevorzugtes Geokoordinatenformat',
  },
  emptyStringInline: {
    comment: `
      When empty string is used as a default value for a column, this is shown
      instead
    `,
    'en-us': '(empty string)',
    'ru-ru': '(пуста строка)',
    'es-es': '(cadena vacía)',
    'fr-fr': '(chaîne vide)',
    'uk-ua': '(порожній рядок)',
    'de-ch': '(leerer String)',
  },
  wbUploadedUnavailable: {
    'en-us': 'The data set must be validated or uploaded',
    'ru-ru': 'The data set must be validated or uploaded',
    'es-es': 'Se ha de validar o cargar el conjunto de datos',
    'fr-fr': "L'ensemble de données doit être validé ou téléchargé",
    'uk-ua': 'Набір даних має бути перевірений або завантажений',
    'de-ch': 'Der Datensatz muss validiert oder hochgeladen werden',
  },
  wbValidateUnavailable: {
    'en-us':
      'An Upload Plan needs to defined before this Data Set can be Validated',
    'ru-ru': `
      План загрузки должен быть определен до того, как этот набор данных может
      быть проверен
    `,
    'es-es': `
      Se necesita definir un Plan de Carga antes de poder Validar este Conjunto
      de Datos
    `,
    'fr-fr': `
      Un plan de téléchargement doit être défini avant que cet ensemble de
      données puisse être validé
    `,
    'uk-ua': `
      Перед перевіркою цього набору даних необхідно визначити план завантаження
    `,
    'de-ch': `
      Bevor dieser Datensatz validiert werden kann, muss ein Upload-Plan
      definiert werden
    `,
  },
  unavailableWhileEditing: {
    'en-us': 'This action requires all changes to be saved',
    'ru-ru': 'Это действие требует сохранения всех изменений',
    'es-es': 'Esta acción requiere que se guarden todos los cambios',
    'fr-fr': `
      Cette action nécessite que toutes les modifications soient enregistrées
    `,
    'uk-ua': 'Ця дія вимагає збереження всіх змін',
    'de-ch': 'Diese Aktion erfordert das Speichern aller Änderungen',
  },
  uploadUnavailableWhileHasErrors: {
    'en-us': 'Upload is unavailable while some cells have validation errors',
    'ru-ru': `
      Загрузка недоступна, в то время как в некоторых ячейках есть ошибки
      проверки
    `,
    'es-es':
      'Carga de datos no disponible si hay celdas con error de validación',
    'fr-fr': `
      L'importation n'est pas disponible alors que certaines cellules comportent
      des erreurs de validation
    `,
    'uk-ua': `
      Завантаження недоступне, оскільки в деяких клітинках є помилки перевірки
    `,
    'de-ch': `
      Der Upload ist nicht möglich, da einige Zellen Validierungsfehler
      aufweisen
    `,
  },
  unavailableWhileViewingResults: {
    'en-us': 'This action is unavailable while viewing the upload results',
    'ru-ru': 'Это действие недоступно при просмотре результатов загрузки',
    'es-es': `
      Acción no disponible cuando se visualizan resultados de la carga de datos
    `,
    'fr-fr': `
      Cette action n'est pas disponible lors de l'affichage des résultats du
      téléchargement
    `,
    'uk-ua': 'Ця дія недоступна під час перегляду результатів завантаження',
    'de-ch':
      'Diese Aktion ist beim Anzeigen der Upload-Ergebnisse nicht verfügbar.',
  },
  unavailableWhileValidating: {
    'en-us': 'This action is unavailable while Data Check is in progress',
    'ru-ru': 'Это действие недоступно, пока выполняется проверка данных',
    'es-es': 'Acción no disponible durante la Comprobación de Datos',
    'fr-fr': `
      Cette action n'est pas disponible lorsque la vérification des données est
      en cours
    `,
    'uk-ua': 'Ця дія недоступна, поки триває перевірка даних',
    'de-ch': `
      Diese Aktion ist nicht verfügbar, während die Datenüberprüfung ausgeführt
      wird.
    `,
  },
  unavailableWithoutLocality: {
    'en-us': 'This tool requires locality columns to be mapped',
    'ru-ru':
      'Этот инструмент требует, чтобы столбцы координат были сопоставлены',
    'es-es':
      'Esta herramienta requiere Columnas de Localidad mapeadas/asignadas',
    'fr-fr': 'Cet outil nécessite que les colonnes de localité soient mappées',
    'uk-ua': 'Цей інструмент вимагає відображення стовпців місцевості',
    'de-ch': 'Für dieses Tool müssen Ortsspalten zugeordnet werden',
  },
  unavailableWhenUploaded: {
    'en-us': 'This tool does not work with uploaded Data Sets',
    'ru-ru': 'Этот инструмент не работает с загруженными наборами данных',
    'es-es': 'Esta herramienta no funciona con Conjuntos de Datos cargados',
    'fr-fr':
      'Cet outil ne fonctionne pas avec les ensembles de données téléchargés',
    'uk-ua': 'Цей інструмент не працює із завантаженими наборами даних',
    'de-ch': 'Dieses Tool funktioniert nicht mit hochgeladenen Datensätzen',
  },
  dataSetDeletedOrNotFound: {
    'en-us': 'Data Set was deleted by another session.',
    'ru-ru': 'Набор данных был удален другим сеансом.',
    'es-es': 'Otra sesión ha eliminado el conjunro de datos.',
    'fr-fr': "L'ensemble de données a été supprimé par une autre session.",
    'uk-ua': 'Набір даних видалено іншим сеансом.',
    'de-ch': 'Der Datensatz wurde von einer anderen Sitzung gelöscht.',
  },
  includeDmsSymbols: {
    'en-us': 'Include DMS Symbols',
    'ru-ru': 'Включить символы DMS',
    'es-es': 'Incluir Símbolos DMS',
    'fr-fr': 'Inclure les symboles DMS',
    'uk-ua': 'Додайте символи DMS',
    'de-ch': 'DMS-Symbole einbinden',
  },
  uploadResults: {
    'en-us': 'Upload Results',
    'ru-ru': 'Результаты загрузки',
    'es-es': 'Cargar Resultados',
    'de-ch': 'Ergebnisse hochladen',
    'fr-fr': 'Télécharger le forfait',
    'uk-ua': 'План завантаження',
  },
  noUploadResultsAvailable: {
    'en-us': 'No upload results are available for this cell',
    'ru-ru': 'Для этой ячейки нет результатов загрузки',
    'es-es': 'No hay resultados de carga disponibles para esta celda',
    'fr-fr':
      "Aucun résultat de téléchargement n'est disponible pour cette cellule",
    'uk-ua': 'Для цієї клітинки немає результатів завантаження',
    'de-ch': 'Für diese Zelle sind keine Upload-Ergebnisse verfügbar',
  },
  navigationOptions: {
    'en-us': 'Navigation Options',
    'ru-ru': 'Опции навигации',
    'es-es': 'Opciones de navegación',
    'fr-fr': 'Options de navigation',
    'uk-ua': 'Параметри навігації',
    'de-ch': 'Navigationsoptionen',
  },
  cursorPriority: {
    'en-us': 'Cursor Priority',
    'ru-ru': 'Приоритет курсора',
    'es-es': 'Prioridad del cursor',
    'fr-fr': 'Priorité du curseur',
    'uk-ua': 'Пріоритет курсору',
    'de-ch': 'Cursorpriorität',
  },
  columnFirst: {
    'en-us': 'Column first',
    'ru-ru': 'Столбец за столбцом',
    'es-es': 'Primero Columna',
    'de-ch': 'Zurück rollen',
    'fr-fr': 'Colonne en premier',
    'uk-ua': 'Колонка перша',
  },
  rowFirst: {
    'en-us': 'Row first',
    'ru-ru': 'Ряд за рядом',
    'es-es': 'Primero Fila',
    'fr-fr': 'Première rangée',
    'uk-ua': 'Перший ряд',
    'de-ch': 'Reihe zuerst',
  },
  searchOptions: {
    'en-us': 'Search Options',
    'ru-ru': 'Параметры поиска',
    'es-es': 'Opciones de búsqueda',
    'fr-fr': 'Options de recherche',
    'uk-ua': 'Параметри пошуку',
    'de-ch': 'Suchoptionen',
  },
  findEntireCellsOnly: {
    'en-us': 'Find entire cells only',
    'ru-ru': 'Найти только целые ячейки',
    'es-es': 'Encontrar solo celdas completas',
    'fr-fr': 'Rechercher uniquement des cellules entières',
    'uk-ua': 'Знайти лише цілі клітини',
    'de-ch': 'Nur ganze Zellen finden',
  },
  matchCase: {
    'en-us': 'Match case',
    'ru-ru': 'Учитывать регистр',
    'es-es': 'Coincidir mayúsculas y minúsculas',
    'fr-fr': 'Cas de correspondance',
    'uk-ua': 'Відмінок сірника',
    'de-ch': 'Groß-/Kleinschreibung beachten',
  },
  useRegularExpression: {
    'en-us': 'Use regular expression',
    'ru-ru': 'Использовать регулярное выражение',
    'es-es': 'Usar expresión regular',
    'fr-fr': 'Utiliser une expression régulière',
    'uk-ua': 'Використовуйте регулярний вираз',
    'de-ch': 'Verwenden Sie reguläre Ausdrücke',
  },
  liveUpdate: {
    'en-us': 'Live search',
    'ru-ru': 'Живой поиск',
    'es-es': 'Búsqueda en vivo',
    'fr-fr': 'Recherche en direct',
    'uk-ua': 'Живий пошук',
    'de-ch': 'Live-Suche',
  },
  replaceOptions: {
    'en-us': 'Replace Options',
    'ru-ru': 'Параметры замены',
    'es-es': 'Opciones de reemplazo',
    'fr-fr': 'Options de remplacement',
    'uk-ua': 'Параметри заміни',
    'de-ch': 'Ersetzungsoptionen',
  },
  replaceMode: {
    'en-us': 'Replace Mode',
    'ru-ru': 'Режим замены',
    'es-es': 'Modo de reemplazo',
    'fr-fr': 'Mode de remplacement',
    'uk-ua': 'Режим заміни',
    'de-ch': 'Ersetzungsmodus',
  },
  replaceAll: {
    'en-us': 'Replace all matches',
    'ru-ru': 'Заменить все совпадения',
    'es-es': 'Reemplazar todas las coincidencias',
    'fr-fr': 'Remplacer toutes les correspondances',
    'uk-ua': 'Замінити всі збіги',
    'de-ch': 'Alle Übereinstimmungen ersetzen',
  },
  replaceNext: {
    'en-us': 'Replace next occurrence',
    'ru-ru': 'Заменить следующее происшествие',
    'es-es': 'Reemplazar siguiente aparición',
    'fr-fr': "Remplacer l'occurrence suivante",
    'uk-ua': 'Замінити наступне входження',
    'de-ch': 'Nächstes Vorkommen ersetzen',
  },
  importDataSet: {
    'en-us': 'Import Data Set',
    'ru-ru': 'Импортировать набор данных',
    'es-es': 'Importar conjunto de datos',
    'fr-fr': 'Importer un ensemble de données',
    'uk-ua': 'Імпорт набору даних',
    'de-ch': 'Datensatz importieren',
  },
  wbImportHeader: {
    'en-us': 'Import a File to Create a New Data Set',
    'ru-ru': 'Импортируйте файл для создания нового набора данных',
    'es-es': 'Importar Archivo para Crear Nuevo Conjunto de Datos',
    'fr-fr': 'Importer un fichier pour créer un nouvel ensemble de données',
    'uk-ua': 'Імпортуйте файл, щоб створити новий набір даних',
    'de-ch': 'Importieren einer Datei zum Erstellen eines neuen Datensatzes',
  },
  previewDataSet: {
    'en-us': 'Preview Dataset',
    'ru-ru': 'Предварительный просмотр набора данных',
    'es-es': 'Vista previa de Conjunto de Datos',
    'fr-fr': "Aperçu de l'ensemble de données",
    'uk-ua': 'Попередній перегляд набору даних',
    'de-ch': 'Datensatzvorschau',
  },
  errorImporting: {
    'en-us': 'The following error(s) occurred while importing the file:',
    'ru-ru': 'При импорте файла произошли следующие ошибки:',
    'es-es': 'Se produjeron los siguientes errores al importar el archivo:',
    'fr-fr': `
      Les erreurs suivantes se sont produites lors de l'importation du fichier :
    `,
    'uk-ua': 'Під час імпортування файлу виникли такі помилки:',
    'de-ch': 'Beim Importieren der Datei sind folgende Fehler aufgetreten:',
  },
  corruptFile: {
    'en-us': 'The file {fileName:string} is corrupt or contains no data!',
    'ru-ru': 'Файл {fileName:string} поврежден или не содержит данных!',
    'es-es': '¡El archivo {fileName:string} está corrupto o no contiene datos!',
    'fr-fr': `
      Le fichier {fileName:string} est corrompu ou ne contient aucune donnée !
    `,
    'uk-ua': 'Файл {fileName:string} пошкоджено або не містить даних!',
    'de-ch':
      'Die Datei {fileName:string} ist beschädigt oder enthält keine Daten!',
  },
  characterEncoding: {
    'en-us': 'Character encoding:',
    'ru-ru': 'Кодировка символов:',
    'es-es': 'Codificación de caracteres:',
    'fr-fr': 'Encodage de caractère:',
    'uk-ua': 'Кодування символів:',
    'de-ch': 'Zeichenkodierung:',
  },
  delimiter: {
    'en-us': 'Delimiter:',
    'ru-ru': 'Разделитель:',
    'es-es': 'Delimitador:',
    'fr-fr': 'Délimiteur :',
    'uk-ua': 'роздільник:',
    'de-ch': 'Trennzeichen:',
  },
  comma: {
    'en-us': 'Comma',
    'ru-ru': 'Запятая',
    'es-es': 'Coma',
    'fr-fr': 'Virgule',
    'uk-ua': 'Кома',
    'de-ch': 'Komma',
  },
  semicolon: {
    'en-us': 'Semicolon',
    'ru-ru': 'Точка с запятой',
    'es-es': 'Punto y coma',
    'fr-fr': 'Point-virgule',
    'uk-ua': 'Крапка з комою',
    'de-ch': 'Semikolon',
  },
  tab: {
    'en-us': 'Tab',
    'ru-ru': 'Табуляция',
    'es-es': 'Pestaña',
    'fr-fr': 'Languette',
    'uk-ua': 'вкладка',
    'de-ch': 'Tab',
  },
  space: {
    'en-us': 'Space',
    'ru-ru': 'Пробел',
    'es-es': 'Espacio',
    'fr-fr': 'Espace',
    'uk-ua': 'космос',
    'de-ch': 'Raum',
  },
  pipe: {
    'en-us': 'Pipe',
    'ru-ru': 'Вертикальная черта',
    'es-es': 'Tubo',
    'fr-fr': 'Tuyau',
    'uk-ua': 'Труба',
    'de-ch': 'Rohr',
  },
  determineAutomatically: {
    'en-us': 'Determine automatically',
    'ru-ru': 'Определить автоматически',
    'es-es': 'Determinar automáticamente',
    'uk-ua': 'Регістр сірників',
    'de-ch': 'Groß-/Kleinschreibung beachten',
    'fr-fr': 'Déterminer automatiquement',
  },
  chooseDataSetName: {
    'en-us': 'Name for New Data Set:',
    'ru-ru': 'Имя для нового набора данных:',
    'es-es': 'Nombre para Nuevo Conjunto de Datos:',
    'de-ch': 'Reihe zuerst',
    'fr-fr': 'Nom du nouvel ensemble de données :',
    'uk-ua': 'Назва нового набору даних:',
  },
  firstRowIsHeader: {
    'en-us': 'First Row is Header:',
    'ru-ru': 'Первая строка является заголовок:',
    'es-es': 'La primera Fila es el Encabezado:',
    'fr-fr': "La première ligne est l'en-tête :",
    'uk-ua': 'Перший рядок – заголовок:',
    'de-ch': 'Die erste Zeile ist die Kopfzeile:',
  },
  importFile: {
    'en-us': 'Import file',
    'ru-ru': 'Импортировать файл',
    'es-es': 'Importar archivo',
    'fr-fr': 'Importer le fichier',
    'uk-ua': 'Імпорт файлу',
    'de-ch': 'Datei importieren',
  },
  columnName: {
    'en-us': 'Column {columnIndex:number}',
    'ru-ru': 'Столбец {columnIndex:number}',
    'es-es': 'Columna {columnIndex:number}',
    'fr-fr': 'Colonne {columnIndex:number}',
    'uk-ua': 'Стовпчик {columnIndex:number}',
    'de-ch': 'Spalte {columnIndex:number}',
  },
  newDataSetName: {
    'en-us': 'New Data Set {date}',
    'ru-ru': 'Новый набор данных {date}',
    'es-es': 'Nuevo Conjunto de Datos {date}',
    'fr-fr': 'Nouvel ensemble de données {date}',
    'uk-ua': 'Новий набір даних {date}',
    'de-ch': 'Neuer Datensatz {date}',
  },
  dataSets: {
    'en-us': '{variant:string} Data Sets',
  },
  wbsDialogEmpty: {
    'en-us': 'Currently no Data Sets exist.',
    'ru-ru': 'В настоящее время наборов данных не существует.',
    'es-es': 'Actualmente no existen conjuntos de datos.',
    'fr-fr': "Actuellement, aucun ensemble de données n'existe.",
    'uk-ua': 'Наразі не існує наборів даних.',
    'de-ch': 'Derzeit sind keine Datensätze vorhanden.',
  },
  createDataSetInstructions: {
    'en-us': 'Use "Import a file" or "Create New" to make a new one.',
    'ru-ru': `
      Используйте «Импортировать файл» или «Создать новый», чтобы создать новый.
    `,
    'es-es':
      'Usar "Importar un archivo" o "Crear Nuevo" para generar uno nuevo.',
    'fr-fr': `
      Utilisez « Importer un fichier » ou « Créer un nouveau » pour en créer un
      nouveau.
    `,
    'uk-ua': `
      Використовуйте «Імпортувати файл» або «Створити новий», щоб створити
      новий.
    `,
    'de-ch': `
      Verwenden Sie „Datei importieren“ oder „Neu erstellen“, um eine neue zu
      erstellen.
    `,
  },
  createNew: {
    'en-us': 'Create New',
    'ru-ru': 'Создайте новый',
    'es-es': 'Crear Nuevo',
    'fr-fr': 'Créer un nouveau',
    'uk-ua': 'Створити новий',
    'de-ch': 'Erstelle neu',
  },
  dataSetMeta: {
    'en-us': 'Data Set Properties',
    'ru-ru': 'Свойства набора данных',
    'es-es': 'Propiedades del conjunto de datos',
    'fr-fr': "Propriétés de l'ensemble de données",
    'uk-ua': 'Властивості набору даних',
    'de-ch': 'Dataset-Eigenschaften',
  },
  dataSetName: {
    'en-us': 'Data Set Name',
    'ru-ru': 'Название набора данных',
    'es-es': 'Nombre de Conjunto de Datos',
    'fr-fr': "Nom de l'ensemble de données",
    'uk-ua': 'Назва набору даних',
    'de-ch': 'Datensatzname',
  },
  numberOfRows: {
    'en-us': 'Number of rows',
    'ru-ru': 'Количество рядов',
    'es-es': 'Número de filas',
    'fr-fr': 'Nombre de rangées',
    'uk-ua': 'Кількість рядів',
    'de-ch': 'Anzahl der Reihen',
  },
  numberOfColumns: {
    'en-us': 'Number of columns',
    'ru-ru': 'Количество столбцов',
    'es-es': 'Número de columnas',
    'fr-fr': 'Le nombre de colonnes',
    'uk-ua': 'Кількість стовпців',
    'de-ch': 'Anzahl der Spalten',
  },
  importedFileName: {
    'en-us': 'Import file name',
    'ru-ru': 'Имя файла импорта',
    'es-es': 'Importar nombre de archivo',
    'fr-fr': "Nom du fichier d'importation",
    'uk-ua': "Імпортувати ім'я файлу",
    'de-ch': 'Name der Importdatei',
  },
  noFileName: {
    'en-us': '(no file name)',
    'ru-ru': '(файл без имени)',
    'es-es': '(sin nombre de archivo)',
    'fr-fr': '(pas de nom de fichier)',
    'uk-ua': '(без імені файлу)',
    'de-ch': '(kein Dateiname)',
  },
  changeDataSetOwner: {
    'en-us': 'Change Data Set Owner',
    'ru-ru': 'Изменить владельца набора данных',
    'es-es': 'Cambiar propietario del conjunto de datos',
    'fr-fr': "Modifier le propriétaire de l'ensemble de données",
    'uk-ua': 'Змінити власника набору даних',
    'de-ch': 'Datensatzbesitzer ändern',
  },
  changeDataSetOwnerDescription: {
    'en-us': 'Select New Owner:',
    'ru-ru': 'Выберите нового владельца:',
    'es-es': 'Seleccionar nuevo propietario:',
    'fr-fr': 'Sélectionnez un nouveau propriétaire :',
    'uk-ua': 'Виберіть нового власника:',
    'de-ch': 'Neuen Besitzer auswählen:',
  },
  dataSetOwnerChanged: {
    'en-us': 'Data Set owner changed',
    'ru-ru': 'Владелец набора данных изменен',
    'es-es': 'El propietario del conjunto de datos cambió',
    'fr-fr': "Le propriétaire de l'ensemble de données a changé",
    'uk-ua': 'Змінено власника набору даних',
    'de-ch': 'Datensatzbesitzer geändert',
  },
  dataSet: {
    'en-us': 'Data Set',
    'ru-ru': 'Набор данных',
    'es-es': 'Conjunto de Datos',
    'uk-ua': 'Набір даних',
    'de-ch': 'Datensatz',
    'fr-fr': 'Base de données',
  },
  dataSetTimestampUploaded: {
    'en-us': 'Timestamp Uploaded',
    'de-ch': 'Zeitstempel Hochgeladen',
    'es-es': 'Marca de tiempo cargada',
    'fr-fr': 'Horodatage téléchargé',
    'ru-ru': 'Временная метка загружена',
    'uk-ua': 'Мітка часу завантажено',
  },
  dataSetUploadedLabel: {
    'en-us': '(Uploaded, Read-Only)',
    'ru-ru': '(Загружено, только для чтения)',
    'es-es': '(Cargado, Solo lectura)',
    'fr-fr': '(Téléchargé, lecture seule)',
    'uk-ua': '(Завантажено, лише для читання)',
    'de-ch': '(Hochgeladen, schreibgeschützt)',
  },
  wbStatusUnupload: {
    'en-us': 'Data Set Rollback Status',
    'ru-ru': 'Состояние отката набора данных',
    'es-es': 'Estado de reversión del conjunto de datos',
    'fr-fr': "État de restauration de l'ensemble de données",
    'uk-ua': 'Статус відкату набору даних',
    'de-ch': 'Datensatz-Rollbackstatus',
  },
  wbStatusUpload: {
    'en-us': 'Data Set Upload Status',
    'ru-ru': 'Состояние загрузки набора данных',
    'es-es': 'Estado de carga del conjunto de datos',
    'fr-fr': "Une erreur s'est produite pendant [X22X]",
    'uk-ua': 'Під час [X22X] сталася помилка',
    'de-ch': 'Status des Datensatz-Uploads',
  },
  wbStatusValidation: {
    'en-us': 'Data Set Validation Status',
    'ru-ru': 'Статус проверки набора данных',
    'es-es': 'Estado de validación del conjunto de datos',
    'fr-fr': "Statut de validation de l'ensemble de données",
    'uk-ua': 'Статус перевірки набору даних',
    'de-ch': 'Validierungsstatus des Datensatzes',
  },
  aborting: {
    'en-us': 'Aborting...',
    'ru-ru': 'Прерывание...',
    'es-es': 'Abortando...',
    'fr-fr': 'Abandonner...',
    'uk-ua': 'Переривання...',
    'de-ch': 'Abbrechen...',
  },
  wbStatusAbortFailed: {
    'en-us': 'Failed aborting {operationName:string}. Please try again later',
    'ru-ru': `
      Не удалось прервать операцию {operationName:string}. Пожалуйста,
      попробуйте позже
    `,
    'es-es': `
      No se pudo abortar {operationName:string}. Por favor inténtelo más tarde
    `,
    'fr-fr': `
      Échec de l'abandon de {operationName:string}. Veuillez réessayer plus tard
    `,
    'uk-ua': `
      Не вдалося перервати {operationName:string}. Будь-ласка спробуйте пізніше
    `,
    'de-ch': `
      Abbruch fehlgeschlagen {operationName:string}. Bitte versuchen Sie es
      später erneut
    `,
  },
  wbStatusOperationNoProgress: {
    comment: 'E.x, Validating...',
    'en-us': '{operationName:string}...',
    'ru-ru': '{operationName:string}...',
    'es-es': '{operationName:string}...',
    'fr-fr': '{operationName:string}...',
    'uk-ua': '{operationName:string}...',
    'de-ch': '{operationName:string} …',
  },
  wbStatusOperationProgress: {
    comment: 'E.x, Validating row 999/1,000',
    'en-us': `
      {operationName:string} row
      {current:number|formatted}/{total:number|formatted}
    `,
    'ru-ru': `
      {operationName:string} строка
      {current:number|formatted}/{total:number|formatted}
    `,
    'es-es': `
      {operationName:string} fila
      {current:number|formatted}/{total:number|formatted}
    `,
    'fr-fr': `
      {operationName:string} ligne
      {current:number|formatted}/{total:number|formatted}
    `,
    'uk-ua': `
      {operationName:string} рядок
      {current:number|formatted}/{total:number|formatted}
    `,
    'de-ch': `
      {operationName:string} Zeile
      {current:number|formatted}/{total:number|formatted}
    `,
  },
  wbStatusPendingDescription: {
    'en-us': '{operationName:string} of this Data Set should begin shortly.',
    'ru-ru': `
      {operationName:string} этого набора данных должно начаться в ближайшее
      время.
    `,
    'es-es': `
      {operationName:string} de este Conjunto de Datos debería comenzar en
      breve.
    `,
    'fr-fr': `
      {operationName:string} de cet ensemble de données devrait commencer sous
      peu.
    `,
    'uk-ua':
      '{operationName:string} цього набору даних має початися незабаром.',
    'de-ch':
      '{operationName:string} dieses Datensatzes sollte in Kürze beginnen.',
  },
  wbStatusPendingSecondDescription: {
    'en-us': `
      If this message persists for longer than 30 seconds, the
      {operationName:string} process is busy with another Data Set. Please try
      again later.
    `,
    'ru-ru': `
      Если это сообщение отображается дольше 30 секунд процесс
      {operationName:string} занят другим набором данных. Пожалуйста, попробуй
      снова позже.
    `,
    'es-es': `
      Si este mensaje persiste por más de 30 segundos, el proceso
      {operationName:string} está ocupado con otro Conjunto de Datos. Por favor
      inténtelo más tarde.
    `,
    'fr-fr': `
      Si ce message persiste plus de 30 secondes, le processus
      {operationName:string} est occupé avec un autre ensemble de données.
      Veuillez réessayer plus tard.
    `,
    'uk-ua': `
      Якщо це повідомлення зберігається довше 30 секунд, процес
      {operationName:string} зайнятий іншим набором даних. Будь-ласка спробуйте
      пізніше.
    `,
    'de-ch': `
      Wenn diese Meldung länger als 30 Sekunden angezeigt wird, ist der Prozess
      {operationName:string} mit einem anderen Datensatz beschäftigt. Bitte
      versuchen Sie es später erneut.
    `,
  },
  stop: {
    'en-us': 'Stop',
    'ru-ru': 'Стоп',
    'es-es': 'Deténgase',
    'fr-fr': 'Arrêt',
    'uk-ua': 'СТІЙ',
    'de-ch': 'Stoppen',
  },
  wbStatusError: {
    'en-us': 'Error occurred during {operationName:string}',
    'ru-ru': 'Произошла ошибка во время {operationName:string}',
    'es-es': 'Ocurrió un error durante {operationName:string}',
    'fr-fr': "Une erreur s'est produite pendant {operationName:string}",
    'uk-ua': 'Під час {operationName:string} сталася помилка',
    'de-ch': 'Fehler aufgetreten während {operationName:string}',
  },
  updatingTrees: {
    'en-us': 'Updating trees...',
    'ru-ru': 'Обновление деревьев...',
    'es-es': 'Actualizando árboles...',
    'fr-fr': 'Mise à jour des arbres...',
    'uk-ua': 'Оновлення дерев...',
    'de-ch': 'Bäume werden aktualisiert...',
  },
  recordSetName: {
    comment: `
      Default name of the record that would be created based on upload results
    `,
    'en-us': 'WB upload of "{dataSet:string}"',
    'ru-ru': 'WB загрузка "{dataSet:string}"',
    'es-es': 'Carga de WB de "{dataSet:string}"',
    'fr-fr': 'Téléchargement WB de "{dataSet:string}"',
    'uk-ua': 'WB завантаження "{dataSet:string}"',
    'de-ch': 'WB-Upload von „{dataSet:string}“',
  },
  ambiguousTaxaChild: {
    'en-us': '{node:string} {author:string} (in {parent:string})',
    'ru-ru': '{node:string} {author:string} (в {parent:string})',
    'es-es': '{node:string} {author:string} (en {parent:string})',
    'de-ch': '{node:string} {author:string} (in {parent:string})',
    'fr-fr': '{node:string} {author:string} (dans {parent:string})',
    'uk-ua': '{node:string} {author:string} (у {parent:string})',
  },
  updatedCells: {
    'en-us': 'Updated Cells',
  },
  deletedCells: {
    'en-us': 'Deleted Cells',
  },
  affectedResults: {
    'en-us': 'Records affected',
  },
  potentialAffectedResults: {
    'en-us': 'Potential records affected',
  },
  wbAffectedDescription: {
    'en-us': 'Number of new records affected in each table:',
  },
  wbAffectedPotentialDescription: {
    'en-us': 'Number of new records that would be affected in each table:',
  },
  recordsCreated: {
    'en-us': 'Records created',
  },
  recordsUpdated: {
    'en-us': 'Records updated',
  },
  recordsDeleted: {
    'en-us': 'Records deleted (not including dependents)',
  },
  recordsMatchedAndChanged: {
    'en-us': 'Records matched, different from current related',
  },
  matchAndChanged: {
    'en-us': 'Matched and changed cells',
  },
} as const);
