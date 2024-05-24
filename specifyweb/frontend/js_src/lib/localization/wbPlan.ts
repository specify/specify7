/**
 * Localization strings used by the WbPlanView (workbench upload plan mapper)
 *
 * @module
 */

import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

export const wbPlanText = createDictionary({
  dataMapper: {
    'en-us': 'Data Mapper',
    'ru-ru': 'Сопоставления',
    'es-es': 'Mapeador de Datos',
    'fr-fr': 'Mappeur de données',
    'uk-ua': 'Картограф даних',
    'de-ch': 'Datenzuordnung',
  },
  noUploadPlan: {
    'en-us': 'No Upload Plan is Defined',
    'ru-ru': 'План загрузки не определен',
    'es-es': 'No hay definido ningún plan de carga',
    'fr-fr': "Aucun plan de téléchargement n'est défini",
    'uk-ua': 'План завантаження не визначено',
    'de-ch': 'Es wurde kein Uploadplan definiert',
  },
  noUploadPlanDescription: {
    'en-us':
      'No Upload Plan has been defined for this Data Set. Create one now?',
    'ru-ru': `
      Для этого набора данных не определен план загрузки. Создать эго сейчас?
    `,
    'es-es': `
      No se ha definido ningún plan de carga para este conjunto de datos. ¿Crear
      uno ahora?
    `,
    'fr-fr': `
      Aucun plan de téléchargement n'a été défini pour cet ensemble de données.
      En créer un maintenant ?
    `,
    'uk-ua':
      'Для цього набору даних не визначено план завантаження. Створити зараз?',
    'de-ch': `
      Für diesen Datensatz wurde noch kein Upload-Plan definiert. Jetzt einen
      erstellen?
    `,
  },
  unmappedColumn: {
    'en-us': 'Unmapped Column',
    'ru-ru': 'Несопоставленный столбец',
    'es-es': 'Columna no asignada',
    'fr-fr': 'Colonne non mappée',
    'uk-ua': 'Невідповідний стовпець',
    'de-ch': 'Nicht gemappte Spalte',
  },
  notSelected: {
    comment: 'Show in pick list in Data Mapper when column is not mapped',
    'en-us': 'NONE SELECTED',
    'ru-ru': 'НЕ ВЫБРАНО',
    'es-es': 'NO ASIGNADO/MAPEADO',
    'fr-fr': 'AUCUNE SÉLECTION',
    'uk-ua': 'НЕ ВИБРАНО',
    'de-ch': 'Nicht kartiert',
  },
  unmapped: {
    'en-us': 'Unmapped',
    'ru-ru': 'Не сопоставлений',
    'es-es': 'sin mapear',
    'fr-fr': 'Non mappé',
    'uk-ua': 'Не зіставлений',
    'de-ch': 'Zuordnung ist erforderlich',
  },
  mapped: {
    'en-us': 'Mapped',
    'ru-ru': 'Сопоставлений',
    'es-es': 'Mapeado',
    'fr-fr': 'Cartographié',
    'uk-ua': 'Нанесено на карту',
    'de-ch': 'Kartiert',
  },
  matchBehavior: {
    'en-us': 'Match Behavior:',
    'ru-ru': 'Поведение при совпадении:',
    'es-es': 'Coincidir en comportamiento:',
    'fr-fr': 'Comportement de correspondance :',
    'uk-ua': 'Поведінка відповідності:',
    'de-ch': 'Übereinstimmungsverhalten:',
  },
  columnMapping: {
    'en-us': 'Column Mapping',
    'ru-ru': 'Сопоставление столбцов',
    'es-es': 'Asignación/Mapeo de columnas',
    'fr-fr': 'Mappage de colonnes',
    'uk-ua': 'Відображення стовпців',
    'de-ch': 'Spaltenzuordnung',
  },
  suggestedMappings: {
    'en-us': 'Suggested Mappings:',
    'ru-ru': 'Предлагаемые сопоставления:',
    'es-es': 'Sugerencia de asignaciones/mapeos:',
    'fr-fr': 'Mappages suggérés :',
    'uk-ua': 'Пропоновані зіставлення:',
    'de-ch': 'Vorgeschlagene Zuordnungen:',
  },
  requiredFields: {
    'en-us': 'Required Fields',
    'ru-ru': 'Обязательные поля',
    'es-es': 'Campos requeridos',
    'fr-fr': 'Champs obligatoires',
    'uk-ua': "обов'язкові поля",
    'de-ch': 'Erforderliche Felder',
  },
  optionalFields: {
    'en-us': 'Optional Fields',
    'ru-ru': 'Необязательные поля',
    'es-es': 'Campos Opcionales',
    'fr-fr': 'Champs facultatifs',
    'uk-ua': "Необов'язкові поля",
    'de-ch': 'Optionale Felder',
  },
  hiddenFields: {
    'en-us': 'Hidden Fields',
    'ru-ru': 'Скрытые поля',
    'es-es': 'Campos Ocultos',
    'fr-fr': 'Champs cachés',
    'uk-ua': 'Приховані поля',
    'de-ch': 'Versteckte Felder',
  },
  revealHiddenFormFields: {
    'en-us': 'Reveal Hidden Form Fields',
    'ru-ru': 'Показать скрытые поля формы',
    'es-es': 'Revelar Campos Ocultos del Formulario',
    'de-ch': 'Versteckte Formularfelder anzeigen',
    'fr-fr': 'Ensemble de données vide',
    'uk-ua': 'Порожній набір даних',
  },
  mappingOptions: {
    'en-us': 'Mapping Options',
    'ru-ru': 'Параметры сопоставления',
    'es-es': 'Opciones de asignaciones/mapeo',
    'fr-fr': 'Options de mappage',
    'uk-ua': 'Параметри відображення',
    'de-ch': 'Zuordnungsoptionen',
  },
  ignoreWhenBlank: {
    'en-us': 'Ignore when Blank',
    'ru-ru': 'Игнорировать, когда пусто',
    'es-es': 'Ignorar cuando en blanco',
    'fr-fr': 'Ignorer lorsque vide',
    'uk-ua': 'Ігнорувати, коли пусто',
    'de-ch': 'Bei leer ignorieren',
  },
  ignoreWhenBlankDescription: {
    'en-us': `
      When set to "Ignore when Blank" blank values in this column will not be
      considered for matching purposes. Blank values are ignored when matching
      even if a default value is provided
    `,
    'ru-ru': `
      Если задано значение «Игнорировать, когда пусто», пустые значения в этом
      столбце не будет рассматривается для целей сопоставления. Пустые значения
      игнорируются при сопоставлении даже если указано значение по умолчанию
    `,
    'es-es': `
      Cuando se establece en "Ignorar si está en blanco", los valores en blanco
      de esta columna no se tendrán en cuenta a efectos de comparación. Los
      valores en blanco se ignoran a la hora de establecer correspondencias,
      incluso si se proporciona un valor por defecto
    `,
    'fr-fr': `
      Lorsqu'elle est définie sur « Ignorer si vide », les valeurs vides dans
      cette colonne ne seront pas prises en compte à des fins de
      correspondance. Les valeurs vides sont ignorées lors de la correspondance
      même si une valeur par défaut est fournie
    `,
    'uk-ua': `
      Якщо встановлено значення «Ignore when Blank», порожні значення в цьому
      стовпці не розглядатимуться для цілей зіставлення. Порожні значення
      ігноруються під час збігу, навіть якщо вказано значення за умовчанням
    `,
    'de-ch': `
      Bei der Einstellung "Bei leer ignorieren" werden leere Werte in dieser
      Spalte beim Abgleich nicht berücksichtigt. Leere Werte werden beim
      Abgleich ignoriert, auch wenn ein Standardwert angegeben ist
    `,
  },
  ignoreAlways: {
    'en-us': 'Always Ignore',
    'ru-ru': 'Всегда игнорировать',
    'es-es': 'Ignorar siempre',
    'fr-fr': 'Ignorer toujours',
    'uk-ua': 'Завжди ігнорувати',
    'de-ch': 'Immer ignorieren',
  },
  ignoreAlwaysDescription: {
    'en-us': `
      When set to "Ignore Always" the value in this column will never be
      considered for matching purposes, only for uploading.
    `,
    'ru-ru': `
      Если задано значение «Всегда игнорировать», значение в этом столбце
      никогда не будет рассматривается для целей сопоставления, только для
      загрузки
    `,
    'es-es': `
      Cuando se establece "Ignorar siempre", el valor de esta columna nunca se
      tomará en cuenta a efectos de comparación; solo al cargar datos.
    `,
    'fr-fr': `
      Lorsqu'elle est définie sur « Ignorer toujours », la valeur de cette
      colonne ne sera jamais prise en compte à des fins de correspondance,
      uniquement pour le téléchargement.
    `,
    'uk-ua': `
      Якщо встановлено значення «Ігнорувати завжди», значення в цьому стовпці
      ніколи не розглядатиметься для цілей зіставлення, лише для завантаження.
    `,
    'de-ch': `
      Bei der Einstellung "Immer ignorieren" wird der Wert in dieser Spalte
      niemals für den Abgleich, sondern nur für das Hochladen berücksichtigt.
    `,
  },
  ignoreNever: {
    'en-us': 'Never Ignore',
    'ru-ru': 'Никогда не игнорировать',
    'es-es': 'Nunca Ignorar',
    'de-ch': 'Nie ignorieren',
    'fr-fr': 'AUCUNE SÉLECTION',
    'uk-ua': 'НЕ ВИБРАНО',
  },
  ignoreNeverDescription: {
    'en-us': `
      This column would always be considered for matching purposes, regardless
      of it's value
    `,
    'ru-ru': `
      Этот столбец всегда будет учитываться для целей сопоставления, независимо
      от содержимое столбца
    `,
    'es-es': `
      Siempre se considerará esta columna a efectos de comparación,
      independientemente de sus valores
    `,
    'fr-fr': `
      Cette colonne sera toujours prise en compte à des fins de correspondance,
      quelle que soit sa valeur.
    `,
    'uk-ua': `
      Цей стовпець завжди розглядатиметься для цілей зіставлення, незалежно від
      його значення
    `,
    'de-ch': `
      Diese Spalte wird immer für den Abgleich berücksichtigt, unabhängig von
      ihrem Wert
    `,
  },
  allowNullValues: {
    'en-us': 'Allow Null Values',
    'ru-ru': 'Разрешить нулевые значения',
    'es-es': 'Permitir valores nulos',
    'fr-fr': 'Autoriser les valeurs nulles',
    'uk-ua': 'Дозволити нульові значення',
    'de-ch': 'Nullwerte erlauben',
  },
  useDefaultValue: {
    'en-us': 'Use Default Value',
    'ru-ru': 'Использовать значение по умолчанию',
    'es-es': 'Usar valor predeterminado',
    'fr-fr': 'Utiliser la valeur par défaut',
    'uk-ua': 'Використовувати значення за умовчанням',
    'de-ch': 'Verwende den Standardwert',
  },
  defaultValue: {
    'en-us': 'Default Value',
    'ru-ru': 'Значение по умолчанию',
    'es-es': 'Valor predeterminado',
    'fr-fr': 'Valeur par défaut',
    'uk-ua': 'Значення за замовчуванням',
    'de-ch': 'Standardwert',
  },
  defaultValueDescription: {
    'en-us': 'This value would be used in place of empty cells',
    'ru-ru': 'Это значение будет использоваться вместо пустых ячеек',
    'es-es': 'Este valor se usaría en lugar de celdas vacías',
    'fr-fr': 'Cette valeur serait utilisée à la place des cellules vides',
    'uk-ua': 'Це значення використовуватиметься замість порожніх клітинок',
    'de-ch': 'Dieser Wert wird anstelle von leeren Zellen verwendet',
  },
  addNewColumn: {
    'en-us': 'Add New Column',
    'ru-ru': 'Добавить новую колонку',
    'es-es': 'Agregar una columna nueva',
    'fr-fr': 'Ajouter une nouvelle colonne',
    'uk-ua': 'Додати новий стовпець',
    'de-ch': 'Neue Spalte hinzufügen',
  },
  validationFailed: {
    'en-us': 'Validation found missing mappings:',
    'ru-ru': 'Проверка обнаружила недостающие сопоставления:',
    'es-es': 'La validación encontró asignaciones faltantes:',
    'fr-fr': 'La validation a détecté des mappages manquants :',
    'uk-ua': 'Перевірка виявила відсутні зіставлення:',
    'de-ch': 'Die Validierung hat fehlende Zuordnungen gefunden:',
  },
  validationFailedDescription: {
    'en-us': `
      This data mapping is missing one or more data fields required for
      uploading by your Specify configuration. Add the missing mappings shown or
      save this Upload Plan as unfinished.
    `,
    'ru-ru': `
      В этом сопоставлении данные отсутствует в одном или нескольких полей
      данных, необходимых для загрузки по вашей Specify конфигурацию. Добавьте
      недостающие сопоставления или сохраните этот план загрузки как
      незавершенный.
    `,
    'es-es': `
      A este mapeo de datos le faltan uno o más campos de datos requeridos para
      cargar por su configuración de Especificar. Agregue las asignaciones
      faltantes que se muestran o guarde este plan de carga como inacabado.
    `,
    'fr-fr': `
      Il manque dans ce mappage de données un ou plusieurs champs de données
      requis pour le téléchargement par votre configuration Specify. Ajoutez les
      mappages manquants affichés ou enregistrez ce plan de téléchargement
      comme inachevé.
    `,
    'uk-ua': `
      У цьому відображенні даних відсутнє одне або кілька полів даних, необхідні
      для завантаження вашою конфігурацією Specify. Додайте відсутні
      відображення або збережіть цей план завантаження як незавершений.
    `,
    'de-ch': `
      In dieser Datenzuordnung fehlen ein oder mehrere Datenfelder, die für das
      Hochladen gemäss Ihrer Specify-Konfiguration erforderlich sind. Fügen Sie
      die fehlenden Mappings hinzu oder speichern Sie diesen Upload-Plan als
      unvollendet.
    `,
  },
  mappingIsRequired: {
    comment: 'I.e, this field must be mapped before you can continue',
    'en-us': 'Mapping is required',
    'ru-ru': 'Необходимо сопоставление',
    'es-es': 'Se requiere asignación',
    'fr-fr': 'Une cartographie est requise',
    'uk-ua': 'Потрібне відображення',
    'de-ch': 'Zuordnung ist erforderlich',
  },
  continueEditing: {
    'en-us': 'Continue Editing',
    'ru-ru': 'Продолжить редактирование',
    'es-es': 'Continuar con Edición',
    'fr-fr': 'Continuer la modification',
    'uk-ua': 'Продовжити редагування',
    'de-ch': 'Bearbeitung fortsetzen',
  },
  saveUnfinished: {
    'en-us': 'Save Unfinished',
    'ru-ru': 'Сохранить незаконченное',
    'es-es': 'Guardar sin terminar',
    'fr-fr': 'Enregistrer inachevé',
    'uk-ua': 'Зберегти незавершене',
    'de-ch': 'Unvollendet speichern',
  },
  map: {
    'en-us': 'Map',
    'ru-ru': 'Сопоставить',
    'es-es': 'Mapear',
    'de-ch': 'Datenzuordnung erstellen',
    'fr-fr': 'Mappeur automatique',
    'uk-ua': 'AutoMapper',
  },
  unmap: {
    'en-us': 'Unmap',
    'ru-ru': 'Отменить сопоставления',
    'es-es': 'Deshacer mapeo',
    'fr-fr': 'Démapper',
    'uk-ua': 'Відмінити карту',
    'de-ch': 'Datenzuordnung auflösen',
  },
  mapButtonDescription: {
    'en-us': 'Map selected field to selected header',
    'ru-ru': 'Сопоставить выбранное поле с выбранным столбцом',
    'es-es': 'Asignar campo seleccionado al encabezamiento seleccionado',
    'de-ch': 'Ausgewähltes Feld der ausgewählten Feldüberschrift zuordnen',
    'fr-fr': `
      Il manque dans ce mappage de données un ou plusieurs champs de données
      requis pour le téléchargement par votre configuration Specify. Ajoutez les
      mappages manquants affichés ou enregistrez ce plan de téléchargement
      comme inachevé.
    `,
    'uk-ua': `
      У цьому відображенні даних відсутнє одне або кілька полів даних, необхідні
      для завантаження вашою конфігурацією Specify. Додайте відсутні
      відображення або збережіть цей план завантаження як незавершений.
    `,
  },
  relationshipWithTable: {
    'en-us': 'Relationship to the {tableName:string} table',
    'ru-ru': 'Связь с таблицей {tableName:string}',
    'es-es': 'Relación con la tabla {tableName:string}',
    'fr-fr': 'Relation avec la table {tableName:string}',
    'uk-ua': 'Відношення до таблиці {tableName:string}.',
    'de-ch': 'Beziehung zur Tabelle {tableName:string}',
  },
  selectBaseTable: {
    'en-us': 'Select a Base Table',
    'ru-ru': 'Выберите базовую таблицу',
    'es-es': 'Seleccione una tabla base',
    'fr-fr': 'Sélectionnez une table de base',
    'uk-ua': 'Виберіть базову таблицю',
    'de-ch': 'Basistabelle auswählen',
  },
  chooseExistingPlan: {
    'en-us': 'Choose Existing Plan',
    'ru-ru': 'Выберите существующий план',
    'es-es': 'Elegir un Plan ya Existente',
    'fr-fr': 'Choisir un forfait existant',
    'uk-ua': 'Виберіть існуючий план',
    'de-ch': 'Bestehenden Plan auswählen',
  },
  showAllTables: {
    'en-us': 'Show All Tables',
    'ru-ru': 'Показать дополнительные таблицы',
    'es-es': 'Mostrar Tablas Avanzadas',
    'fr-fr': 'Afficher tous les tableaux',
    'uk-ua': 'Показати всі таблиці',
    'de-ch': 'Erweiterte Tabellen anzeigen',
  },
  dataSetUploaded: {
    'en-us': 'Data Set uploaded. This Upload Plan cannot be changed',
    'ru-ru': 'Набор данных загружен. Этот план загрузки нельзя изменить',
    'es-es':
      'Conjunto de Datos cargado. El Plan de Carga ya no puede modificarse',
    'fr-fr': `
      Ensemble de données téléchargé. Ce plan de téléchargement ne peut pas être
      modifié
    `,
    'uk-ua': 'Набір даних завантажено. Цей план завантаження не можна змінити',
    'de-ch':
      'Datensatz hochgeladen. Dieser Upload-Plan kann nicht geändert werden',
  },
  dataSetUploadedDescription: {
    'en-us': `
      You are viewing the mappings for an uploaded dataset.

      To edit the mappings, rollback the uploaded data or create a new dataset
    `,
    'ru-ru': `
      Вы просматриваете сопоставления для загруженного набора данных.

      Чтобы изменить сопоставления, откатите загруженные данные или создайте
      новый набор данных
    `,
    'es-es': `
      Está viendo las asignaciones de campos/mapeo para un conjunto de datos ya
      cargado.

      Para editar los mapeos, d´s marcha-atrás para los datos cargados o cree un
      nuevo conjunto de datos
    `,
    'fr-fr': `
      Vous affichez les mappages pour un ensemble de données téléchargé.

      Pour modifier les mappages, annulez les données téléchargées ou créez un
      nouvel ensemble de données
    `,
    'uk-ua': `
      Ви переглядаєте зіставлення для завантаженого набору даних.

      Щоб редагувати зіставлення, відкотіть завантажені дані або створіть новий
      набір даних
    `,
    'de-ch': `
      Sie betrachten gerade die Datenzuordnungen für einen hochgeladenen
      Datensatz.

      Um die Zuordnungen zu bearbeiten, die hochgeladenen Daten zurückzusetzen
      oder einen neuen Datensatz erstellen
    `,
  },
  baseTable: {
    'en-us': 'Base Table',
    'ru-ru': 'Базовая таблица',
    'es-es': 'Tabla Base',
    'fr-fr': 'Tableau de base',
    'uk-ua': 'Базовий стіл',
    'de-ch': 'Basistabelle',
  },
  goToBaseTable: {
    'en-us': 'Change the Base Table for Mapping Data Set Columns?',
    'ru-ru':
      'Изменить базовую таблицу для сопоставления столбцов набора данных?',
    'es-es':
      '¿Cambiar la tabla base para mapear columnas de conjuntos de datos?',
    'fr-fr': `
      Modifier la table de base pour le mappage des colonnes de l'ensemble de
      données ?
    `,
    'uk-ua': 'Змінити базову таблицю для зіставлення стовпців набору даних?',
    'de-ch': 'Die Basistabelle für die Zuordnung von Datensatzspalten ändern?',
  },
  goToBaseTableDescription: {
    'en-us': `
      Choosing a different Base Table for a Data Set Upload will make that table
      the new starting point for column-to-data field mappings and will erase
      existing mappings. The AutoMapper will attempt to map columns to the new
      Base Table fields.
    `,
    'ru-ru': `
      Выбор другой базовой таблице для загрузки набора данных сделает ту таблицу
      новой отправной точкой для сопоставлений полей столбцов и данных и сотрет
      существующие сопоставления. AutoMapper попытается сопоставить столбцы в
      новые поля базовой таблицы.
    `,
    'es-es': `
      Si elige una tabla base diferente para la carga de un conjunto de datos,
      esa tabla se convertirá en el nuevo punto de partida para las asignaciones
      de campo de columna a datos y borrará las asignaciones existentes. El
      AutoMapper intentará asignar columnas a los nuevos campos de la tabla
      base.
    `,
    'fr-fr': `
      Le choix d'une table de base différente pour un téléchargement d'ensemble
      de données fera de cette table le nouveau point de départ pour les
      mappages de champs de colonnes à données et effacera les mappages
      existants. L'AutoMapper tentera de mapper les colonnes aux nouveaux champs
      de la table de base.
    `,
    'uk-ua': `
      Вибір іншої базової таблиці для завантаження набору даних зробить цю
      таблицю новою відправною точкою для зіставлення стовпців і полів даних і
      видалить існуючі зіставлення. AutoMapper спробує зіставити стовпці з
      новими полями базової таблиці.
    `,
    'de-ch': `
      Durch Auswahl einer anderen Basistabelle für einen Datensatz-Upload wird
      diese Tabelle zum neuen Ausgangspunkt für die Zuordnung von Spalten zu
      Datenfeldern und die bestehenden Zuordnungen werden gelöscht. Der
      AutoMapper wird versuchen, die Spalten den neuen Basistabellenfeldern
      zuzuordnen.
    `,
  },
  clearMapping: {
    'en-us': 'Clear Mapping',
    'ru-ru': 'Очистить сопоставление',
    'es-es': 'Borrar Asignacione',
    'fr-fr': 'Effacer le mappage',
    'uk-ua': 'Очистити відображення',
    'de-ch': 'Datenzuordnung zurücksetzen',
  },
  reRunAutoMapper: {
    'en-us': 'Rerun AutoMapper',
    'ru-ru': 'Перезапустить AutoMapper',
    'es-es': 'Volver a ejecutar AutoMapper',
    'fr-fr': 'Réexécuter AutoMapper',
    'uk-ua': 'Перезапустіть AutoMapper',
    'de-ch': 'AutoMapper erneut ausführen',
  },
  autoMapper: {
    'en-us': 'AutoMapper',
    'ru-ru': 'AutoMapper',
    'es-es': 'Mapeador automático',
    'fr-fr': 'Mappeur automatique',
    'uk-ua': 'AutoMapper',
    'de-ch': 'AutoMapper',
  },
  mappingEditor: {
    'en-us': 'Map Explorer',
    'ru-ru': 'Обзор сопоставлений',
    'es-es': 'Explorador de Asignaciones/Mapeos',
    'fr-fr': 'Explorateur de cartes',
    'uk-ua': 'Map Explorer',
    'de-ch': 'Karten-Explorer',
  },
  hideFieldMapper: {
    'en-us': 'Hide Field Mapper',
    'ru-ru': 'Спрятать обзор сопоставлений',
    'es-es': 'Ocultar asignador de campos',
    'fr-fr': 'Masquer le mappeur de champs',
    'uk-ua': 'Приховати Field Mapper',
    'de-ch': 'Field Mapper ausblenden',
  },
  showFieldMapper: {
    'en-us': 'Show Field Mapper',
    'ru-ru': 'Показать обзор сопоставлений',
    'es-es': 'Mostrar asignador de campos',
    'fr-fr': 'Afficher le mappeur de champs',
    'uk-ua': 'Показати Field Mapper',
    'de-ch': 'Field Mapper einblenden',
  },
  mappings: {
    'en-us': 'Mappings',
    'ru-ru': 'Сопоставления',
    'es-es': 'Asignaciones/Mapeos',
    'fr-fr': 'Mappages',
    'uk-ua': 'Відображення',
    'de-ch': 'Zuordnungen',
  },
  clearMappings: {
    'en-us': 'Clear Mappings',
    'ru-ru': 'Очистить сопоставления',
    'es-es': 'Borrar asignaciones',
    'fr-fr': 'Effacer les mappages',
    'uk-ua': 'Очистити зіставлення',
    'de-ch': 'Zuordnungen zurückstellen',
  },
  emptyDataSet: {
    'en-us': 'Empty Data Set',
    'ru-ru': 'Пустой набор данных',
    'es-es': 'Conjunto de datos vacío',
    'fr-fr': 'Ensemble de données vide',
    'uk-ua': 'Порожній набір даних',
    'de-ch': 'Datenset leeren',
  },
  emptyDataSetDescription: {
    'en-us': "This Data Set doesn't have any columns.",
    'ru-ru': 'В этом наборе данных нет столбцов.',
    'es-es': 'Este Conjunto de Datos carece de columnas.',
    'fr-fr': 'Cet ensemble de données ne comporte aucune colonne.',
    'uk-ua': 'Цей набір даних не має стовпців.',
    'de-ch': 'Dieser Datensatz hat keine Spalten.',
  },
  emptyDataSetSecondDescription: {
    'en-us': `
      Press the "Add New Column" button below the mapping lines to add new
      columns.
    `,
    'ru-ru': `
      Нажмите кнопку "Добавить новый столбец" под строками сопоставления, чтобы
      добавить новые столбцы.
    `,
    'es-es': `
      Presione el botón "Agregar nueva columna" debajo de las líneas de mapeo
      para agregar nuevas columnas.
    `,
    'fr-fr': `
      Appuyez sur le bouton "Ajouter une nouvelle colonne" sous les lignes de
      mappage pour ajouter de nouvelles colonnes.
    `,
    'uk-ua': `
      Натисніть кнопку «Додати новий стовпець» під лініями відображення, щоб
      додати нові стовпці.
    `,
    'de-ch': `
      Klicken Sie auf die Schaltfläche "Neue Spalte hinzufügen" unterhalb der
      Zuordnungszeilen, um neue Spalten hinzuzufügen.
    `,
  },
  reRunAutoMapperConfirmation: {
    'en-us': 'Automap to start a new Upload Plan?',
    'ru-ru': 'Автоматически сопоставить?',
    'es-es': '¿Automap para iniciar un nuevo plan de carga?',
    'de-ch': 'Automap, um einen neuen Upload-Plan zu starten?',
    'fr-fr':
      'Mappage automatique pour démarrer un nouveau plan de téléchargement ?',
    'uk-ua': 'Автоматична карта, щоб почати новий план завантаження?',
  },
  reRunAutoMapperConfirmationDescription: {
    'en-us': 'This will erase existing data field mappings.',
    'ru-ru': 'Это сотрет существующие сопоставления.',
    'es-es': 'Esto borrará las asignaciones de campos de datos existentes.',
    'fr-fr': 'Cela effacera les mappages de champs de données existants.',
    'uk-ua': 'Це призведе до видалення наявних зіставлень полів даних.',
    'de-ch': 'Damit werden bestehende Zuordnungen von Datenfeldern gelöscht.',
  },
  changeMatchingLogic: {
    'en-us': 'Change Matching Logic',
    'ru-ru': 'Изменить логику соответствия',
    'es-es': 'Cambiar la lógica de coincidencia',
    'fr-fr': 'Modifier la logique de correspondance',
    'uk-ua': 'Змінити логіку відповідності',
    'de-ch': 'Abgleichslogik ändern',
  },
  matchingLogicDescription: {
    'en-us': 'Require Data to Match Existing Records',
    'ru-ru': 'Требовать сопоставления данных с существующими записями',
    'es-es': 'Requerir datos para que coincidan con los registros existentes',
    'fr-fr':
      'Exiger que les données correspondent aux enregistrements existants',
    'uk-ua': 'Вимагати відповідності даних існуючим записам',
    'de-ch': 'Benötigt Daten um vorhandene Datensätze vergleichen zu können',
  },
  matchingLogicUnavailable: {
    'en-us': 'Matching logic is unavailable for current mappings',
    'ru-ru': 'Логика соответствия недоступна для текущих сопоставлений',
    'es-es': `
      La lógica de coincidencia no está disponible para las asignaciones
      actuales
    `,
    'fr-fr': `
      La logique de correspondance n'est pas disponible pour les mappages
      actuels
    `,
    'uk-ua': 'Логіка зіставлення недоступна для поточних зіставлень',
    'de-ch': 'Die Vergleichslogik ist für aktuelle Mappings nicht verfügbar',
  },
  mustMatch: {
    'en-us': 'Must Match',
    'ru-ru': 'Логика соответствия',
    'es-es': 'Debe coincidir',
    'fr-fr': 'Doit correspondre',
    'uk-ua': 'Повинні відповідати',
    'de-ch': 'Muss übereinstimmen',
  },
  unloadProtectMessage: {
    'en-us': 'This mapping has not been saved.',
    'ru-ru': 'Это сопоставление не было сохранено.',
    'es-es': 'No se hna guardado estas asignaciones/mapeo.',
    'fr-fr': "Ce mappage n'a pas été enregistré.",
    'uk-ua': 'Це відображення не збережено.',
    'de-ch': 'Dieses Mapping wurde nicht gespeichert.',
  },
  newHeaderName: {
    'en-us': 'New Column {index:number}',
    'ru-ru': 'Новый столбец {index:number}',
    'es-es': 'Nueva Columna {index:number}',
    'fr-fr': 'Nouvelle colonne {index:number}',
    'uk-ua': 'Нова колонка {index:number}',
    'de-ch': 'Neue Spalte {index:number}',
  },
  noHeader: {
    'en-us': '(no header)',
    'ru-ru': '(нет заголовка)',
    'es-es': '(sin encabezado)',
    'fr-fr': '(aucun en-tête)',
    'uk-ua': '(без заголовка)',
    'de-ch': '(keine Kopfzeile)',
  },
  copyPlan: {
    'en-us': 'Copy plan from existing Data Set',
    'ru-ru': 'Копировать план из существующего набора данных',
    'es-es': 'Copie el plan del conjunto de datos existente',
    'fr-fr': "Copier le plan à partir d'un ensemble de données existant",
    'uk-ua': 'Скопіюйте план із наявного набору даних',
    'de-ch': 'Plan aus vorhandenem Datenset kopieren',
  },
  noPlansToCopyFrom: {
    'en-us': `
      There are no plans available, please continue to create an upload plan.
    `,
    'ru-ru': 'Нет доступных планов, продолжайте создавать план загрузки.',
    'es-es': 'No hay planes disponibles, continúe creando un plan de carga.',
    'fr-fr': `
      Aucun plan n'est disponible, veuillez continuer à créer un plan de
      téléchargement.
    `,
    'uk-ua':
      'Немає доступних планів, продовжуйте створювати план завантаження.',
    'de-ch':
      'Es sind keine Pläne verfügbar, bitte erstellen Sie einen Upload-Plan.',
  },
  invalidTemplatePlan: {
    'en-us':
      'Selected Data Set has no upload plan. Please select a different one.',
    'ru-ru': `
      Выбранный набор данных не имеет плана загрузки. Выберите другой набор
      данных.
    `,
    'es-es': `
      El conjunto de datos seleccionado no tiene un plan de carga. Seleccione
      uno diferente.
    `,
    'fr-fr': `
      L'ensemble de données sélectionné n'a pas de plan de téléchargement.
      Veuillez en sélectionner un autre.
    `,
    'uk-ua': 'Вибраний набір даних не має плану завантаження. Виберіть інший.',
    'de-ch': `
      Das ausgewählte Datenset hat keinen Upload-Plan. Bitte wählen Sie einen
      anderen Plan.
    `,
  },
} as const);
