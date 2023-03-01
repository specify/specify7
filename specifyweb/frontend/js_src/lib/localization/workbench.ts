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
  },
  rollback: {
    'en-us': 'Roll Back',
    'ru-ru': 'Откат',
    'es-es': 'Retroceder',
    'fr-fr': 'Retour en arriere',
    'uk-ua': 'Відкат',
  },
  validate: {
    'en-us': 'Validate',
    'ru-ru': 'Проверить',
    'es-es': 'Validar',
    'fr-fr': 'Valider',
    'uk-ua': 'Перевірити',
  },
  validation: {
    'en-us': 'Validation',
    'ru-ru': 'Проверка',
    'es-es': 'Validación',
    'fr-fr': 'Validation',
    'uk-ua': 'Перевірка',
  },
  upload: {
    'en-us': 'Upload',
    'ru-ru': 'Загрузка',
    'es-es': 'Subir',
    'fr-fr': 'Télécharger',
    'uk-ua': 'Завантажити',
  },
  rollingBack: {
    'en-us': 'Rolling Back',
    'ru-ru': 'Откат',
    'es-es': 'Retrocediendo',
    'fr-fr': 'Reculer',
    'uk-ua': 'Відкат назад',
  },
  uploading: {
    'en-us': 'Uploading',
    'ru-ru': 'Загрузка',
    'es-es': 'Cargando',
    'fr-fr': 'Téléchargement',
    'uk-ua': 'Завантаження',
  },
  validating: {
    'en-us': 'Validating',
    'ru-ru': 'Проверка',
    'es-es': 'Validando',
    'fr-fr': 'Validation',
    'uk-ua': 'Перевірка',
  },
  disambiguate: {
    'en-us': 'Disambiguate',
    'ru-ru': 'Устранить Неоднозначность',
    'es-es': 'desambiguar',
    'fr-fr': 'Désambiguïser',
    'uk-ua': 'Усунути неоднозначність',
  },
  fillDown: {
    'en-us': 'Fill Down',
    'ru-ru': 'Заполнить Вниз',
    'es-es': 'Llenar hacia abajo',
    'fr-fr': 'Remplissez',
    'uk-ua': 'Заповнити вниз',
  },
  fillUp: {
    'en-us': 'Fill Up',
    'ru-ru': 'Заполнить Вверх',
    'es-es': 'Llena',
    'fr-fr': 'Remplir',
    'uk-ua': 'Заповнити',
  },
  revert: {
    'en-us': 'Revert',
    'ru-ru': 'Вернуть',
    'es-es': 'Revertir',
    'fr-fr': 'Revenir',
    'uk-ua': 'Повернути',
  },
  dataCheck: {
    'en-us': 'Data Check',
    'ru-ru': 'Проверка данных',
    'es-es': 'Comprobación de datos',
    'fr-fr': 'Vérification des données',
    'uk-ua': 'Перевірка даних',
  },
  dataCheckOn: {
    'en-us': 'Data Check: On',
    'ru-ru': 'Проверка данных: вкл.',
    'es-es': 'Comprobación de datos: activado',
    'fr-fr': 'Vérification des données : activée',
    'uk-ua': 'Перевірка даних: увімкнено',
  },
  changeOwner: {
    'en-us': 'Change Owner',
    'ru-ru': 'Сменить владельца',
    'es-es': 'Cambio de propietario',
    'fr-fr': 'Changer de propriétaire',
    'uk-ua': 'Змінити власника',
  },
  convertCoordinates: {
    'en-us': 'Convert Coordinates',
    'ru-ru': 'Преобразовать координаты',
    'es-es': 'Convertir coordenadas',
    'fr-fr': 'Convertir les coordonnées',
    'uk-ua': 'Перетворення координат',
  },
  navigation: {
    'en-us': 'Navigation',
    'ru-ru': 'Навигация',
    'es-es': 'Navegación',
    'fr-fr': 'La navigation',
    'uk-ua': 'Навігація',
  },
  replace: {
    'en-us': 'Replace',
    'ru-ru': 'Заменять',
    'es-es': 'Reemplazar',
    'fr-fr': 'Remplacer',
    'uk-ua': 'Замінити',
  },
  replacementValue: {
    'en-us': 'Replacement value',
    'ru-ru': 'Замена',
    'es-es': 'Valor de reposición',
    'fr-fr': 'Valeur de remplacement',
    'uk-ua': 'Відновна вартість',
  },
  searchResults: {
    'en-us': 'Search Results',
    'ru-ru': 'Результаты Поиска',
    'es-es': 'Resultados de la búsqueda',
    'fr-fr': 'Résultats de recherche',
    'uk-ua': 'Результати пошуку',
  },
  clickToToggle: {
    'en-us': 'Click to toggle visibility',
    'ru-ru': 'Нажмите, чтобы переключить видимость',
    'es-es': 'Haga clic para alternar la visibilidad',
    'fr-fr': 'Cliquez pour basculer la visibilité',
    'uk-ua': 'Натисніть, щоб увімкнути видимість',
  },
  configureSearchReplace: {
    'en-us': 'Configure Search & Replace',
    'ru-ru': 'Настроить поиск и замену',
    'es-es': 'Configurar Buscar y reemplazar',
    'fr-fr': 'Configurer la recherche et le remplacement',
    'uk-ua': 'Налаштувати пошук і заміну',
  },
  modifiedCells: {
    'en-us': 'Modified Cells',
    'ru-ru': 'Модифицированные клетки',
    'es-es': 'Celdas modificadas',
    'fr-fr': 'Cellules modifiées',
    'uk-ua': 'Модифіковані клітини',
  },
  newCells: {
    'en-us': 'New Cells',
    'ru-ru': 'Новые клетки',
    'es-es': 'Nuevas celdas',
    'fr-fr': 'Nouvelles cellules',
    'uk-ua': 'Нові клітини',
  },
  errorCells: {
    'en-us': 'Error Cells',
    'ru-ru': 'Ячейки с ошибками',
    'es-es': 'Celdas de error',
    'fr-fr': "Cellules d'erreur",
    'uk-ua': 'Комірки помилок',
  },
  dataEditor: {
    'en-us': 'Data Editor',
    'ru-ru': 'Редактор данных',
    'es-es': 'Editor de datos',
    'fr-fr': 'Éditeur de données',
    'uk-ua': 'Редактор даних',
  },
  noDisambiguationResults: {
    'en-us': 'Unable to disambiguate',
    'ru-ru': 'Невозможно устранить неуверенность',
    'es-es': 'No se puede desambiguar',
    'fr-fr': "Impossible de lever l'ambiguïté",
    'uk-ua': 'Неможливо усунути неоднозначність',
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
      résoudre l'ambiguïté.
    `,
    'uk-ua': `
      Жоден із відповідних записів наразі не існує в базі даних. Це може
      статися, якщо всі відповідні записи було видалено після процесу перевірки
      або якщо всі збіги були неоднозначними щодо інших записів у цьому наборі
      даних. В останньому випадку вам потрібно буде додати поля та значення до
      набору даних, щоб усунути неоднозначність.
    `,
  },
  disambiguateMatches: {
    'en-us': 'Disambiguate Multiple Record Matches',
    'ru-ru': 'Устранение неоднозначности',
    'es-es': 'Eliminar la ambigüedad de coincidencias de registros múltiples',
    'fr-fr': "Désambiguïser plusieurs correspondances d'enregistrements",
    'uk-ua': 'Усуньте неоднозначність збігів кількох записів',
  },
  applyAllUnavailable: {
    'en-us': '"Apply All" is not available while Data Check is in progress.',
    'ru-ru': '«Применить все» недоступно, пока выполняется проверка данных.',
    'es-es': `
      "Aplicar todo" no está disponible mientras la verificación de datos está
      en curso.
    `,
    'fr-fr': `
      "Appliquer tout" n\'est pas disponible lorsque la vérification des données
      est en cours.
    `,
    'uk-ua':
      'Функція «Застосувати все» недоступна, поки триває перевірка даних.',
  },
  beginRollback: {
    'en-us': 'Begin Data Set Roll Back?',
    'ru-ru': 'Начать откат набора данных?',
    'es-es': '¿Comenzar reversión del conjunto de datos?',
    'fr-fr': "Commencer la restauration de l'ensemble de données ?",
    'uk-ua': 'Почати відкат набору даних?',
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
      L'annulation supprimera les nouveaux enregistrements de données que cet
      ensemble de données a ajoutés à la base de données Spécifier. La
      restauration complète sera annulée si l'une des données téléchargées a été
      référencée (réutilisée) par d'autres enregistrements de données depuis
      leur téléchargement.
    `,
    'uk-ua': `
      Відкат видалить нові записи даних, додані цим набором даних до бази даних
      Specify. Повний відкат буде скасовано, якщо на будь-які завантажені дані
      посилалися (повторно використовували) інші записи даних після їх
      завантаження.
    `,
  },
  startUpload: {
    'en-us': 'Begin Data Set Upload?',
    'ru-ru': 'Начать загрузку набора данных?',
    'es-es': '¿Comenzar carga de conjunto de datos?',
    'fr-fr': "Commencer le téléchargement de l'ensemble de données ?",
    'uk-ua': 'Почати завантаження набору даних?',
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
      de données Spécifier.
    `,
    'uk-ua': 'Завантаження набору даних додасть дані до бази даних Specify.',
  },
  deleteDataSet: {
    'en-us': 'Delete this Data Set?',
    'ru-ru': 'Удалить этот набор данных?',
    'es-es': '¿Eliminar este conjunto de datos?',
    'fr-fr': 'Supprimer cet ensemble de données ?',
    'uk-ua': 'Видалити цей набір даних?',
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
  },
  dataSetDeleted: {
    'en-us': 'Data Set successfully deleted',
    'ru-ru': 'Набор данных успешно удален',
    'es-es': 'Conjunto de datos eliminado con éxito',
    'fr-fr': 'Ensemble de données supprimé avec succès',
    'uk-ua': 'Набір даних успішно видалено',
  },
  dataSetDeletedDescription: {
    'en-us': 'Data Set successfully deleted.',
    'ru-ru': 'Набор данных успешно удален.',
    'es-es': 'Conjunto de datos eliminado con éxito.',
    'fr-fr': 'Ensemble de données supprimé avec succès.',
    'uk-ua': 'Набір даних успішно видалено.',
  },
  revertChanges: {
    'en-us': 'Revert Unsaved Changes?',
    'ru-ru': 'Отменить несохраненные изменения?',
    'es-es': '¿Revertir cambios no guardados?',
    'fr-fr': 'Annuler les modifications non enregistrées ?',
    'uk-ua': 'Скасувати незбережені зміни?',
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
  },
  saving: {
    'en-us': 'Saving...',
    'ru-ru': 'Сохранение...',
    'es-es': 'Ahorro...',
    'fr-fr': 'Économie...',
    'uk-ua': 'Збереження...',
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
  },
  noMatchErrorMessage: {
    'en-us': 'No matching record for must-match table.',
    'ru-ru':
      'Нет соответствующей записи для таблицы обязательного соответствия.',
    'es-es': `
      No hay ningún registro coincidente para la tabla de coincidencias
      obligatorias.
    `,
    'fr-fr': `
      Aucun enregistrement correspondant pour la table de correspondance
      obligatoire.
    `,
    'uk-ua':
      'Немає відповідного запису для таблиці обов’язкової відповідності.',
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
      Este valor coincide con dos o más registros de base de datos existentes y
      la coincidencia debe eliminarse antes de cargar.
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
  },
  validationNoErrors: {
    'en-us': 'Validate Completed with No Errors',
    'ru-ru': 'Проверка завершена без ошибок',
    'es-es': 'Validar completado sin errores',
    'fr-fr': 'Valider terminé sans erreur',
    'uk-ua': 'Перевірка завершена без помилок',
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
      Remarque : Si cet ensemble de données est modifié et réenregistré, la
      validation doit être exécutée à nouveau avant le téléchargement pour
      vérifier qu'aucune erreur n'a été introduite.
    `,
    'uk-ua': `
      Примітка. Якщо цей набір даних відредаговано та повторно збережено, перед
      завантаженням слід повторно запустити перевірку, щоб переконатися, що не
      було допущено помилок.
    `,
  },
  validationErrors: {
    'en-us': 'Validate Completed with Errors',
    'ru-ru': 'Проверка завершена с ошибками',
    'es-es': 'Validar completado con errores',
    'fr-fr': 'Valider terminé avec des erreurs',
    'uk-ua': 'Перевірка виконана з помилками',
  },
  validationErrorsDescription: {
    'en-us': 'Validation found errors in the Data Set.',
    'ru-ru': 'Проверка обнаружила ошибки в наборе данных.',
    'es-es': 'La validación encontró errores en el conjunto de datos.',
    'fr-fr': "La validation a détecté des erreurs dans l'ensemble de données.",
    'uk-ua': 'Перевірка виявила помилки в наборі даних.',
  },
  uploadSuccessful: {
    'en-us': 'Upload Completed with No Errors',
    'ru-ru': 'Загрузка завершена без ошибок',
    'es-es': 'Carga completada sin errores',
    'fr-fr': 'Téléchargement terminé sans erreur',
    'uk-ua': 'Завантаження завершено без помилок',
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
      Cliquez sur le bouton "Résultats" pour voir le nombre de nouveaux
      enregistrements ajoutés à chaque table de la base de données.
    `,
    'uk-ua': `
      Натисніть кнопку «Результати», щоб побачити кількість нових записів,
      доданих до кожної таблиці бази даних.
    `,
  },
  uploadErrors: {
    'en-us': 'Upload Failed due to Error Cells',
    'ru-ru': 'Ошибка загрузки из-за ошибок',
    'es-es': 'Carga fallida debido a celdas de error',
    'fr-fr': "Échec du téléchargement en raison de cellules d'erreur",
    'uk-ua': 'Помилка завантаження через клітинки помилок',
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
  },
  uploadErrorsSecondDescription: {
    'en-us': `
      Validate the Data Set and review the mouseover hints for each error cell,
      then make the appropriate corrections. Save and retry the Upload.
    `,
    'ru-ru': `
      Проверте набор данных и наведите указатель мыши на каждую ячейку с
      ошибкой, затем сделайте соответствующие исправления, сохраните и повторите
      попытку.
    `,
    'es-es': `
      Valide el conjunto de datos y revise las sugerencias del mouseover para
      cada celda de error, luego haga las correcciones apropiadas. Guarde y
      vuelva a intentar la carga.
    `,
    'fr-fr': `
      Validez l'ensemble de données et passez en revue les conseils de survol de
      la souris pour chaque cellule d'erreur, puis apportez les corrections
      appropriées. Enregistrez et réessayez le téléchargement.
    `,
    'uk-ua': `
      Перевірте набір даних і перегляньте підказки для кожної клітинки помилки,
      а потім внесіть відповідні виправлення. Збережіть і повторіть спробу
      завантаження.
    `,
  },
  dataSetRollback: {
    'en-us': 'Data Set was rolled back successfully',
    'ru-ru': 'Набор данных был успешно откат',
    'es-es': 'El conjunto de datos se revirtió con éxito',
    'fr-fr': "L'ensemble de données a été annulé avec succès",
    'uk-ua': 'Набір даних успішно повернуто',
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
      Cet ensemble de données restauré est enregistré et peut être modifié ou
      rechargé.
    `,
    'uk-ua': `
      Цей відкочений набір даних зберігається та може бути відредагований або
      повторно завантажений.
    `,
  },
  validationCanceled: {
    'en-us': 'Validation Canceled',
    'ru-ru': 'Проверка отменена',
    'es-es': 'Validación cancelada',
    'fr-fr': 'Validation annulée',
    'uk-ua': 'Перевірку скасовано',
  },
  validationCanceledDescription: {
    'en-us': 'Data Set Validation cancelled.',
    'ru-ru': 'Проверка набора данных отменена.',
    'es-es': 'Se canceló la validación del conjunto de datos.',
    'fr-fr': "Validation de l'ensemble de données annulée.",
    'uk-ua': 'Перевірку набору даних скасовано.',
  },
  rollbackCanceled: {
    'en-us': 'Rollback Canceled',
    'ru-ru': 'Откат отменен',
    'es-es': 'Reversión cancelada',
    'fr-fr': 'Restauration annulée',
    'uk-ua': 'Відкат скасовано',
  },
  rollbackCanceledDescription: {
    'en-us': 'Data Set Rollback cancelled.',
    'ru-ru': 'Откат набора данных отменен.',
    'es-es': 'Reversión del conjunto de datos cancelada.',
    'fr-fr': "Restauration de l'ensemble de données annulée.",
    'uk-ua': 'Відкат набору даних скасовано.',
  },
  uploadCanceled: {
    'en-us': 'Upload Canceled',
    'ru-ru': 'Загрузка отменена',
    'es-es': 'Carga cancelada',
    'fr-fr': 'Téléchargement annulé',
    'uk-ua': 'Завантаження скасовано',
  },
  uploadCanceledDescription: {
    'en-us': 'Data Set Upload cancelled.',
    'ru-ru': 'Загрузка набора данных отменена.',
    'es-es': 'Carga de conjunto de datos cancelada.',
    'fr-fr': "Téléchargement de l'ensemble de données annulé.",
    'uk-ua': 'Завантаження набору даних скасовано.',
  },
  coordinateConverter: {
    'en-us': 'Geocoordinate Format',
    'ru-ru': 'Геокоординатный формат',
    'es-es': 'Formato de geocoordenadas',
    'fr-fr': 'Format de géocoordonnée',
    'uk-ua': 'Формат геокоординат',
  },
  coordinateConverterDescription: {
    'en-us': 'Choose a preferred Geocoordinate format',
    'ru-ru': 'Выберите предпочтительный формат геокоординат',
    'es-es': 'Elija un formato de geocoordenada preferido',
    'fr-fr': 'Choisissez un format de géocoordonnées préféré',
    'uk-ua': 'Виберіть потрібний формат геокоординат',
  },
  emptyStringInline: {
    comment: `
      When empty string is used as a default value for a column, this is shown
      instead
    `,
    'en-us': '(empty string)',
    'ru-ru': '(пуста строка)',
    'es-es': '(cuerda vacía)',
    'fr-fr': '(chaîne vide)',
    'uk-ua': '(порожній рядок)',
  },
  wbUploadedUnavailable: {
    'en-us': 'The data set must be validated or uploaded',
    'ru-ru': 'The data set must be validated or uploaded',
    'es-es': 'El conjunto de datos debe validarse o cargarse',
    'fr-fr': "L'ensemble de données doit être validé ou téléchargé",
    'uk-ua': 'Набір даних має бути перевірений або завантажений',
  },
  wbValidateUnavailable: {
    'en-us':
      'An Upload Plan needs to defined before this Data Set can be Validated',
    'ru-ru': `
      План загрузки должен быть определен до того, как этот набор данных может
      быть проверен
    `,
    'es-es': `
      Se debe definir un plan de carga antes de que se pueda validar este
      conjunto de datos
    `,
    'fr-fr': `
      Un plan de téléchargement doit être défini avant que cet ensemble de
      données puisse être validé
    `,
    'uk-ua': `
      Перед перевіркою цього набору даних необхідно визначити план завантаження
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
  },
  uploadUnavailableWhileHasErrors: {
    'en-us': 'Upload is unavailable while some cells have validation errors',
    'ru-ru': `
      Загрузка недоступна, в то время как в некоторых ячейках есть ошибки
      проверки
    `,
    'es-es': `
      La carga no está disponible porque algunas celdas tienen errores de
      validación
    `,
    'fr-fr': `
      Le téléchargement n'est pas disponible alors que certaines cellules ont
      des erreurs de validation
    `,
    'uk-ua': `
      Завантаження недоступне, оскільки в деяких клітинках є помилки перевірки
    `,
  },
  unavailableWhileViewingResults: {
    'en-us': 'This action is unavailable while viewing the upload results',
    'ru-ru': 'Это действие недоступно при просмотре результатов загрузки',
    'es-es': `
      Esta acción no está disponible mientras se ven los resultados de la carga
    `,
    'fr-fr': `
      Cette action n'est pas disponible lors de l'affichage des résultats de
      téléchargement
    `,
    'uk-ua': 'Ця дія недоступна під час перегляду результатів завантаження',
  },
  unavailableWhileValidating: {
    'en-us': 'This action is unavailable while Data Check is in progress',
    'ru-ru': 'Это действие недоступно, пока выполняется проверка данных',
    'es-es': `
      Esta acción no está disponible mientras la verificación de datos está en
      curso
    `,
    'fr-fr': `
      Cette action n'est pas disponible lorsque la vérification des données est
      en cours
    `,
    'uk-ua': 'Ця дія недоступна, поки триває перевірка даних',
  },
  unavailableWithoutLocality: {
    'en-us': 'This tool requires locality columns to be mapped',
    'ru-ru':
      'Этот инструмент требует, чтобы столбцы координат были сопоставлены',
    'es-es':
      'Esta herramienta requiere que se mapeen las columnas de localidad',
    'fr-fr': 'Cet outil nécessite que les colonnes de localité soient mappées',
    'uk-ua': 'Цей інструмент вимагає відображення стовпців місцевості',
  },
  unavailableWhenUploaded: {
    'en-us': 'This tool does not work with uploaded Data Sets',
    'ru-ru': 'Этот инструмент не работает с загруженными наборами данных',
    'es-es': 'Esta herramienta no funciona con conjuntos de datos cargados',
    'fr-fr':
      'Cet outil ne fonctionne pas avec les ensembles de données téléchargés',
    'uk-ua': 'Цей інструмент не працює із завантаженими наборами даних',
  },
  dataSetDeletedOrNotFound: {
    'en-us': 'Data Set was deleted by another session.',
    'ru-ru': 'Набор данных был удален другим сеансом.',
    'es-es': 'El conjunto de datos fue eliminado por otra sesión.',
    'fr-fr': "L'ensemble de données a été supprimé par une autre session.",
    'uk-ua': 'Набір даних видалено іншим сеансом.',
  },
  includeDmsSymbols: {
    'en-us': 'Include DMS Symbols',
    'ru-ru': 'Включить символы DMS',
    'es-es': 'Incluir símbolos DMS',
    'fr-fr': 'Inclure les symboles DMS',
    'uk-ua': 'Додайте символи DMS',
  },
  uploadResults: {
    'en-us': 'Upload Results',
    'ru-ru': 'Результаты загрузки',
    'es-es': 'Cargar resultados',
    'fr-fr': 'Télécharger les résultats',
    'uk-ua': 'Завантажити результати',
  },
  potentialUploadResults: {
    'en-us': 'Potential Upload Results',
    'ru-ru': 'Возможные результаты загрузки',
    'es-es': 'Posibles resultados de carga',
    'fr-fr': 'Résultats de téléchargement potentiels',
    'uk-ua': 'Потенційні результати завантаження',
  },
  noUploadResultsAvailable: {
    'en-us': 'No upload results are available for this cell',
    'ru-ru': 'Для этой ячейки нет результатов загрузки',
    'es-es': 'No hay resultados de carga disponibles para esta celda',
    'fr-fr':
      "Aucun résultat de téléchargement n'est disponible pour cette cellule",
    'uk-ua': 'Для цієї клітинки немає результатів завантаження',
  },
  wbUploadedDescription: {
    'en-us': 'Number of new records created in each table:',
    'ru-ru': 'Количество новых записей, созданных в каждой таблице:',
    'es-es': 'Número de nuevos registros creados en cada tabla:',
    'fr-fr': 'Nombre de nouveaux enregistrements créés dans chaque table :',
    'uk-ua': 'Кількість нових записів, створених у кожній таблиці:',
  },
  wbUploadedPotentialDescription: {
    'en-us': 'Number of new records that would be created in each table:',
    'ru-ru':
      'Количество новых записей, которые будут созданы в каждой таблице:',
    'es-es': 'Número de nuevos registros que se crearían en cada tabla:',
    'fr-fr': `
      Nombre de nouveaux enregistrements qui seraient créés dans chaque table :
    `,
    'uk-ua': 'Кількість нових записів, які будуть створені в кожній таблиці:',
  },
  navigationOptions: {
    'en-us': 'Navigation Options',
    'ru-ru': 'Опции навигации',
    'es-es': 'Opciones de navegación',
    'fr-fr': 'Options de navigation',
    'uk-ua': 'Параметри навігації',
  },
  cursorPriority: {
    'en-us': 'Cursor Priority',
    'ru-ru': 'Приоритет курсора',
    'es-es': 'Prioridad del cursor',
    'fr-fr': 'Priorité du curseur',
    'uk-ua': 'Пріоритет курсору',
  },
  columnFirst: {
    'en-us': 'Column first',
    'ru-ru': 'Столбец за столбцом',
    'es-es': 'Primera columna',
    'fr-fr': 'Colonne en premier',
    'uk-ua': 'Колонка перша',
  },
  rowFirst: {
    'en-us': 'Row first',
    'ru-ru': 'Ряд за рядом',
    'es-es': 'Fila primero',
    'fr-fr': 'Rangée en premier',
    'uk-ua': 'Перший ряд',
  },
  searchOptions: {
    'en-us': 'Search Options',
    'ru-ru': 'Параметры поиска',
    'es-es': 'Opciones de búsqueda',
    'fr-fr': 'Options de recherche',
    'uk-ua': 'Параметри пошуку',
  },
  findEntireCellsOnly: {
    'en-us': 'Find entire cells only',
    'ru-ru': 'Найти только целые ячейки',
    'es-es': 'Buscar solo celdas enteras',
    'fr-fr': 'Rechercher uniquement des cellules entières',
    'uk-ua': 'Знайти лише цілі клітини',
  },
  matchCase: {
    'en-us': 'Match case',
    'ru-ru': 'Учитывать регистр',
    'es-es': 'Caso de partido',
    'fr-fr': 'Cas de correspondance',
    'uk-ua': 'Відмінок сірника',
  },
  useRegularExpression: {
    'en-us': 'Use regular expression',
    'ru-ru': 'Использовать регулярное выражение',
    'es-es': 'Usar expresión regular',
    'fr-fr': "Utiliser l'expression régulière",
    'uk-ua': 'Використовуйте регулярний вираз',
  },
  liveUpdate: {
    'en-us': 'Live search',
    'ru-ru': 'Живой поиск',
    'es-es': 'Búsqueda en vivo',
    'fr-fr': 'Recherche en direct',
    'uk-ua': 'Живий пошук',
  },
  replaceOptions: {
    'en-us': 'Replace Options',
    'ru-ru': 'Параметры замены',
    'es-es': 'Opciones de reemplazo',
    'fr-fr': 'Options de remplacement',
    'uk-ua': 'Параметри заміни',
  },
  replaceMode: {
    'en-us': 'Replace Mode',
    'ru-ru': 'Режим замены',
    'es-es': 'Modo de reemplazo',
    'fr-fr': 'Remplacer le mode',
    'uk-ua': 'Режим заміни',
  },
  replaceAll: {
    'en-us': 'Replace all matches',
    'ru-ru': 'Заменить все совпадения',
    'es-es': 'Reemplazar todas las coincidencias',
    'fr-fr': 'Remplacer toutes les correspondances',
    'uk-ua': 'Замінити всі збіги',
  },
  replaceNext: {
    'en-us': 'Replace next occurrence',
    'ru-ru': 'Заменить следующее происшествие',
    'es-es': 'Reemplazar siguiente ocurrencia',
    'fr-fr': "Remplacer l'occurrence suivante",
    'uk-ua': 'Замінити наступне входження',
  },
  importDataSet: {
    'en-us': 'Import Data Set',
    'ru-ru': 'Импортировать набор данных',
    'es-es': 'Importar conjunto de datos',
    'fr-fr': 'Importer un ensemble de données',
    'uk-ua': 'Імпорт набору даних',
  },
  wbImportHeader: {
    'en-us': 'Import a File to Create a New Data Set',
    'ru-ru': 'Импортируйте файл для создания нового набора данных',
    'es-es': 'Importar un archivo para crear un nuevo conjunto de datos',
    'fr-fr': 'Importer un fichier pour créer un nouvel ensemble de données',
    'uk-ua': 'Імпортуйте файл, щоб створити новий набір даних',
  },
  previewDataSet: {
    'en-us': 'Preview Dataset',
    'ru-ru': 'Предварительный просмотр набора данных',
    'es-es': 'Vista previa del conjunto de datos',
    'fr-fr': "Aperçu de l'ensemble de données",
    'uk-ua': 'Попередній перегляд набору даних',
  },
  errorImporting: {
    'en-us': 'The following error(s) occurred while importing the file:',
    'ru-ru': 'При импорте файла произошли следующие ошибки:',
    'es-es': 'Se produjeron los siguientes errores al importar el archivo:',
    'fr-fr': `
      Les erreurs suivantes se sont produites lors de l'importation du fichier :
    `,
    'uk-ua': 'Під час імпортування файлу виникли такі помилки:',
  },
  corruptFile: {
    'en-us': 'The file {fileName:string} is corrupt or contains no data!',
    'ru-ru': 'Файл {fileName:string} поврежден или не содержит данных!',
    'es-es': '¡El archivo {fileName:string} está corrupto o no contiene datos!',
    'fr-fr': `
      Le fichier {fileName:string} est corrompu ou ne contient aucune donnée !
    `,
    'uk-ua': 'Файл {fileName:string} пошкоджено або не містить даних!',
  },
  characterEncoding: {
    'en-us': 'Character encoding:',
    'ru-ru': 'Кодировка символов:',
    'es-es': 'Codificación de caracteres:',
    'fr-fr': 'Encodage de caractère:',
    'uk-ua': 'Кодування символів:',
  },
  delimiter: {
    'en-us': 'Delimiter:',
    'ru-ru': 'Разделитель:',
    'es-es': 'Delimitador:',
    'fr-fr': 'Délimiteur :',
    'uk-ua': 'роздільник:',
  },
  comma: {
    'en-us': 'Comma',
    'ru-ru': 'Запятая',
    'es-es': 'Coma',
    'fr-fr': 'Virgule',
    'uk-ua': 'Кома',
  },
  semicolon: {
    'en-us': 'Semicolon',
    'ru-ru': 'Точка с запятой',
    'es-es': 'Punto y coma',
    'fr-fr': 'Point-virgule',
    'uk-ua': 'Крапка з комою',
  },
  tab: {
    'en-us': 'Tab',
    'ru-ru': 'Табуляция',
    'es-es': 'Pestaña',
    'fr-fr': 'Languette',
    'uk-ua': 'вкладка',
  },
  space: {
    'en-us': 'Space',
    'ru-ru': 'Пробел',
    'es-es': 'Espacio',
    'fr-fr': 'Espace',
    'uk-ua': 'космос',
  },
  pipe: {
    'en-us': 'Pipe',
    'ru-ru': 'Вертикальная черта',
    'es-es': 'Tubo',
    'fr-fr': 'Tuyau',
    'uk-ua': 'Труба',
  },
  determineAutomatically: {
    'en-us': 'Determine automatically',
    'ru-ru': 'Определить автоматически',
    'es-es': 'Determinar automáticamente',
    'fr-fr': 'Déterminer automatiquement',
    'uk-ua': 'Визначити автоматично',
  },
  chooseDataSetName: {
    'en-us': 'Name for New Data Set:',
    'ru-ru': 'Имя для нового набора данных:',
    'es-es': 'Nombre para el nuevo conjunto de datos:',
    'fr-fr': 'Nom du nouvel ensemble de données :',
    'uk-ua': 'Назва нового набору даних:',
  },
  firstRowIsHeader: {
    'en-us': 'First Row is Header:',
    'ru-ru': 'Первая строка является заголовок:',
    'es-es': 'La primera fila es el encabezado:',
    'fr-fr': "La première ligne est l'en-tête :",
    'uk-ua': 'Перший рядок – заголовок:',
  },
  importFile: {
    'en-us': 'Import file',
    'ru-ru': 'Импортировать файл',
    'es-es': 'Importar archivo',
    'fr-fr': 'Importer le fichier',
    'uk-ua': 'Імпорт файлу',
  },
  columnName: {
    'en-us': 'Column {columnIndex:number}',
    'ru-ru': 'Столбец {columnIndex:number}',
    'es-es': 'Columna {columnIndex:number}',
    'fr-fr': 'Colonne {columnIndex:number}',
    'uk-ua': 'Колонка {columnIndex:number}',
  },
  newDataSetName: {
    'en-us': 'New Data Set {date}',
    'ru-ru': 'Новый набор данных {date}',
    'es-es': 'Nuevo conjunto de datos {date}',
    'fr-fr': 'Nouvel ensemble de données {date}',
    'uk-ua': 'Новий набір даних {date}',
  },
  dataSets: {
    'en-us': 'WorkBench Data Sets',
    'ru-ru': 'Наборы данных',
    'es-es': 'Conjuntos de datos de WorkBench',
    'fr-fr': 'Ensembles de données WorkBench',
    'uk-ua': 'Набори даних WorkBench',
  },
  wbsDialogEmpty: {
    'en-us': 'Currently no Data Sets exist.',
    'ru-ru': 'В настоящее время наборов данных не существует.',
    'es-es': 'Actualmente no existen conjuntos de datos.',
    'fr-fr': "Actuellement, aucun ensemble de données n'existe.",
    'uk-ua': 'Наразі не існує наборів даних.',
  },
  createDataSetInstructions: {
    'en-us': 'Use "Import a file" or "Create New" to make a new one.',
    'ru-ru': `
      Используйте «Импортировать файл» или «Создать новый», чтобы создать новый.
    `,
    'es-es':
      'Utilice "Importar un archivo" o "Crear nuevo" para crear uno nuevo.',
    'fr-fr': `
      Utilisez "Importer un fichier" ou "Créer un nouveau" pour en créer un
      nouveau.
    `,
    'uk-ua': `
      Використовуйте «Імпортувати файл» або «Створити новий», щоб створити
      новий.
    `,
  },
  createNew: {
    'en-us': 'Create New',
    'ru-ru': 'Создайте новый',
    'es-es': 'Crear nuevo',
    'fr-fr': 'Créer un nouveau',
    'uk-ua': 'Створити новий',
  },
  dataSetMeta: {
    'en-us': 'Data Set Properties',
    'ru-ru': 'Свойства набора данных',
    'es-es': 'Propiedades del conjunto de datos',
    'fr-fr': "Propriétés de l'ensemble de données",
    'uk-ua': 'Властивості набору даних',
  },
  dataSetName: {
    'en-us': 'Data Set Name',
    'ru-ru': 'Название набора данных',
    'es-es': 'Nombre del conjunto de datos',
    'fr-fr': "Nom de l'ensemble de données",
    'uk-ua': 'Назва набору даних',
  },
  numberOfRows: {
    'en-us': 'Number of rows',
    'ru-ru': 'Количество рядов',
    'es-es': 'Número de filas',
    'fr-fr': 'Nombre de rangées',
    'uk-ua': 'Кількість рядів',
  },
  numberOfColumns: {
    'en-us': 'Number of columns',
    'ru-ru': 'Количество столбцов',
    'es-es': 'Número de columnas',
    'fr-fr': 'Le nombre de colonnes',
    'uk-ua': 'Кількість стовпців',
  },
  importedFileName: {
    'en-us': 'Import file name',
    'ru-ru': 'Имя файла импорта',
    'es-es': 'Importar nombre de archivo',
    'fr-fr': 'Importer le nom du fichier',
    'uk-ua': "Імпортувати ім'я файлу",
  },
  noFileName: {
    'en-us': '(no file name)',
    'ru-ru': '(файл без имени)',
    'es-es': '(sin nombre de archivo)',
    'fr-fr': '(pas de nom de fichier)',
    'uk-ua': '(без імені файлу)',
  },
  changeDataSetOwner: {
    'en-us': 'Change Data Set Owner',
    'ru-ru': 'Изменить владельца набора данных',
    'es-es': 'Cambiar propietario del conjunto de datos',
    'fr-fr': "Modifier le propriétaire de l'ensemble de données",
    'uk-ua': 'Змінити власника набору даних',
  },
  changeDataSetOwnerDescription: {
    'en-us': 'Select New Owner:',
    'ru-ru': 'Выберите нового владельца:',
    'es-es': 'Seleccionar nuevo propietario:',
    'fr-fr': 'Sélectionnez Nouveau propriétaire :',
    'uk-ua': 'Виберіть нового власника:',
  },
  dataSetOwnerChanged: {
    'en-us': 'Data Set owner changed',
    'ru-ru': 'Владелец набора данных изменен',
    'es-es': 'El propietario del conjunto de datos cambió',
    'fr-fr': "Le propriétaire de l'ensemble de données a été modifié",
    'uk-ua': 'Змінено власника набору даних',
  },
  dataSet: {
    'en-us': 'Data Set',
    'ru-ru': 'Набор данных',
    'es-es': 'Conjunto de datos',
    'fr-fr': 'Base de données',
    'uk-ua': 'Набір даних',
  },
  dataSetUploadedLabel: {
    'en-us': '(Uploaded, Read-Only)',
    'ru-ru': '(Загружено, только для чтения)',
    'es-es': '(Subido, solo lectura)',
    'fr-fr': '(Téléchargé, en lecture seule)',
    'uk-ua': '(Завантажено, лише для читання)',
  },
  wbStatusUnupload: {
    'en-us': 'Data Set Rollback Status',
    'ru-ru': 'Состояние отката набора данных',
    'es-es': 'Estado de reversión del conjunto de datos',
    'fr-fr': "État de restauration de l'ensemble de données",
    'uk-ua': 'Статус відкату набору даних',
  },
  wbStatusUpload: {
    'en-us': 'Data Set Upload Status',
    'ru-ru': 'Состояние загрузки набора данных',
    'es-es': 'Estado de carga del conjunto de datos',
    'fr-fr': "État du téléchargement de l'ensemble de données",
    'uk-ua': 'Статус завантаження набору даних',
  },
  wbStatusValidation: {
    'en-us': 'Data Set Validation Status',
    'ru-ru': 'Статус проверки набора данных',
    'es-es': 'Estado de validación del conjunto de datos',
    'fr-fr': "État de validation de l'ensemble de données",
    'uk-ua': 'Статус перевірки набору даних',
  },
  aborting: {
    'en-us': 'Aborting...',
    'ru-ru': 'Прерывание...',
    'es-es': 'Abortando...',
    'fr-fr': 'Abandon...',
    'uk-ua': 'Переривання...',
  },
  wbStatusAbortFailed: {
    'en-us': 'Failed aborting {operationName:string}. Please try again later',
    'ru-ru': `
      Не удалось прервать операцию {operationName:string}. Пожалуйста,
      попробуйте позже
    `,
    'es-es': `
      Error al cancelar {operationName:string}. Por favor, inténtelo de nuevo
      más tarde
    `,
    'fr-fr': `
      Échec de l'abandon {operationName:string}. Veuillez réessayer plus tard
    `,
    'uk-ua': `
      Не вдалося перервати {operationName:string}. Будь-ласка спробуйте пізніше
    `,
  },
  wbStatusOperationNoProgress: {
    comment: 'E.x, Validating...',
    'en-us': '{operationName:string}...',
    'ru-ru': '{operationName:string}...',
    'es-es': '{operationName:string}...',
    'fr-fr': '{operationName:string}...',
    'uk-ua': '{operationName:string}...',
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
  },
  wbStatusPendingDescription: {
    'en-us': '{operationName:string} of this Data Set should begin shortly.',
    'ru-ru': `
      {operationName:string} этого набора данных должно начаться в ближайшее
      время.
    `,
    'es-es': `
      {operationName:string} de este conjunto de datos debería comenzar en
      breve.
    `,
    'fr-fr': `
      {operationName:string} de cet ensemble de données devrait commencer sous
      peu.
    `,
    'uk-ua':
      '{operationName:string} цього набору даних має початися незабаром.',
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
      Si este mensaje persiste durante más de 30 segundos, el proceso
      {operationName:string} está ocupado con otro conjunto de datos. Por
      favor, inténtelo de nuevo más tarde.
    `,
    'fr-fr': `
      Si ce message persiste pendant plus de 30 secondes, le processus
      {operationName:string} est occupé avec un autre ensemble de données.
      Veuillez réessayer plus tard.
    `,
    'uk-ua': `
      Якщо це повідомлення зберігається довше 30 секунд, процес
      {operationName:string} зайнятий іншим набором даних. Будь-ласка спробуйте
      пізніше.
    `,
  },
  stop: {
    'en-us': 'Stop',
    'ru-ru': 'Стоп',
    'es-es': 'Deténgase',
    'fr-fr': 'Arrêt',
    'uk-ua': 'СТІЙ',
  },
  wbStatusError: {
    'en-us': 'Error occurred during {operationName:string}',
    'ru-ru': 'Произошла ошибка во время {operationName:string}',
    'es-es': 'Ocurrió un error durante {operationName:string}',
    'fr-fr': "Une erreur s'est produite pendant {operationName:string}",
    'uk-ua': 'Під час {operationName:string} сталася помилка',
  },
  updatingTrees: {
    'en-us': 'Updating trees...',
    'ru-ru': 'Обновление деревьев...',
    'es-es': 'Actualizando árboles...',
    'fr-fr': 'Mise à jour des arbres...',
    'uk-ua': 'Оновлення дерев...',
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
  },
  ambiguousTaxaChild: {
    'en-us': '{node:string} (in {parent:string})',
    'ru-ru': '{node:string} (в {parent:string})',
    'es-es': '{node:string} (en {parent:string})',
    'fr-fr': '{node:string} (dans {parent:string})',
    'uk-ua': '{node:string} (у {parent:string})',
  },
} as const);
