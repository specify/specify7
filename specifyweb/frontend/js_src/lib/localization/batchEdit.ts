/**
 * Localization strings used for displaying Attachments
 *
 * @module
 */

import { createDictionary } from "./utils";

export const batchEditText = createDictionary({
  batchEdit: {
    "en-us": "Batch Edit",
    "de-ch": "Stapelbearbeitung",
    "es-es": "Edición por lotes",
    "fr-fr": "Édition par lots",
    "pt-br": "Edição em lote",
    "ru-ru": "Пакетное редактирование",
    "uk-ua": "Пакетне редагування",
  },
  batchEditPrefs: {
    "en-us": "Batch Edit Preferences",
    "de-ch": "Stapelbearbeitungseinstellungen",
    "es-es": "Preferencias de edición por lotes",
    "fr-fr": "Préférences d'édition par lots",
    "pt-br": "Preferências de edição em lote",
    "ru-ru": "Пакетное редактирование настроек",
    "uk-ua": "Налаштування пакетного редагування",
  },
  numberOfRecords: {
    "en-us": "Number of records selected from the query",
    "de-ch": "Anzahl der aus der Abfrage ausgewählten Datensätze",
    "es-es": "Número de registros seleccionados de la consulta",
    "fr-fr": "Nombre d'enregistrements sélectionnés à partir de la requête",
    "pt-br": "Número de registros selecionados da consulta",
    "ru-ru": "Количество записей, выбранных из запроса",
    "uk-ua": "Кількість записів, вибраних із запиту",
  },
  removeField: {
    "en-us":
      "Field not supported for batch edit. Either remove the field, or make it hidden.",
    "de-ch":
      "Das Feld wird für die Stapelbearbeitung nicht unterstützt. Entfernen Sie das Feld oder blenden Sie es aus.",
    "es-es":
      "Campo no compatible con la edición por lotes. Elimínelo u ocúltelo.",
    "fr-fr":
      "Champ non pris en charge pour la modification par lots. Supprimez le champ ou masquez-le.",
    "pt-br":
      "Campo não suportado para edição em lote. Remova o campo ou oculte-o.",
    "ru-ru":
      "Поле не поддерживается для пакетного редактирования. Либо удалите поле, либо сделайте его скрытым.",
    "uk-ua":
      "Поле не підтримується для пакетного редагування. Видаліть поле або приховайте його.",
  },
  addTreeRank: {
    "en-us":
      "The following ranks will be added to the query to enable batch editing",
    "de-ch":
      "Die folgenden Ränge werden der Abfrage hinzugefügt, um die Stapelbearbeitung zu ermöglichen",
    "es-es":
      "Los siguientes rangos se agregarán a la consulta para permitir la edición por lotes",
    "fr-fr":
      "Les rangs suivants seront ajoutés à la requête pour permettre l'édition par lots",
    "pt-br":
      "As seguintes classificações serão adicionadas à consulta para permitir a edição em lote",
    "ru-ru":
      "Следующие ранги будут добавлены в запрос для включения пакетного редактирования",
    "uk-ua":
      "Наступні ранги будуть додані до запиту, щоб увімкнути пакетне редагування",
  },
  pickTreesToFilter: {
    "en-us":
      "The selected rank(s) are found in multiple trees. Pick tree(s) to batch edit with",
    "de-ch":
      "Die ausgewählten Ränge sind in mehreren Bäumen vorhanden. Wählen Sie Bäume für die Stapelbearbeitung aus.",
    "es-es":
      "Los rangos seleccionados se encuentran en varios árboles. Seleccione los árboles para editarlos por lotes.",
    "fr-fr":
      "Les rangs sélectionnés se trouvent dans plusieurs arbres. Sélectionnez les arbres à modifier par lots.",
    "pt-br":
      "A(s) classificação(ões) selecionada(s) são encontradas em várias árvores. Selecione a(s) árvore(s) para edição em lote",
    "ru-ru":
      "Выбранные ранги найдены в нескольких деревьях. Выберите дерево(а) для пакетного редактирования с",
    "uk-ua":
      "Вибрані ранги знаходяться в кількох деревах. Виберіть дерево(а) для пакетного редагування",
  },
  datasetName: {
    "en-us": "{queryName:string} {datePart:string}",
    "de-ch": "{queryName:string} {datePart:string}",
    "es-es": "{queryName:string} {datePart:string}",
    "fr-fr": "{queryName:string} {datePart:string}",
    "pt-br": "{queryName:string} {datePart:string}",
    "ru-ru": "{queryName:string} {datePart:string}",
    "uk-ua": "{queryName:string} {datePart:string}'",
  },
  errorInQuery: {
    "en-us": "Following errors were found in the query",
    "de-ch": "Folgende Fehler wurden in der Abfrage gefunden",
    "es-es": "Se encontraron los siguientes errores en la consulta",
    "fr-fr": "Les erreurs suivantes ont été trouvées dans la requête",
    "pt-br": "Os seguintes erros foram encontrados na consulta",
    "ru-ru": "В запросе обнаружены следующие ошибки",
    "uk-ua": "У запиті виявлено такі помилки",
  },
  missingRanksInQuery: {
    "en-us": "Query requires additional ranks for batch editing",
    "de-ch": "Abfrage erfordert zusätzliche Ränge für die Stapelbearbeitung",
    "es-es":
      "La consulta requiere rangos adicionales para la edición por lotes",
    "fr-fr":
      "La requête nécessite des rangs supplémentaires pour l'édition par lots",
    "pt-br": "A consulta requer classificações adicionais para edição em lote",
    "ru-ru":
      "Запрос требует дополнительных рангов для пакетного редактирования",
    "uk-ua": "Запит потребує додаткових рангів для пакетного редагування",
  },
  createUpdateDataSetInstructions: {
    "en-us": "Use the query builder to make a new batch edit dataset",
    "de-ch":
      "Verwenden Sie den Abfrage-Generator, um einen neuen Datensatz für die Stapelbearbeitung zu erstellen",
    "es-es":
      "Utilice el generador de consultas para crear un nuevo conjunto de datos de edición por lotes",
    "fr-fr":
      "Utilisez le générateur de requêtes pour créer un nouvel ensemble de données d'édition par lots",
    "pt-br":
      "Use o construtor de consultas para criar um novo conjunto de dados de edição em lote",
    "ru-ru":
      "Используйте конструктор запросов для создания нового набора данных пакетного редактирования.",
    "uk-ua":
      "Використовуйте конструктор запитів для створення нового набору даних для пакетного редагування",
  },
  showRollback: {
    "en-us": "Show rollback button",
    "de-ch": "Rollback-Schaltfläche anzeigen",
    "es-es": "Mostrar el botón de reversión",
    "fr-fr": "Afficher le bouton de restauration",
    "pt-br": "Mostrar botão de reversão",
    "ru-ru": "Показать кнопку отката",
    "uk-ua": "Показати кнопку відкату",
  },
  showRollbackDescription: {
    "en-us":
      "Rollback in Batch Edit is an experimental feature. This preference will hide the button",
    "de-ch":
      "Rollback in der Stapelbearbeitung ist eine experimentelle Funktion. Diese Einstellung blendet die Schaltfläche",
    "es-es":
      "Revertir en la edición por lotes es una función experimental. Esta preferencia ocultará el botón.",
    "fr-fr":
      "La restauration dans l'édition par lots est une fonctionnalité expérimentale. Cette préférence masquera le bouton.",
    "pt-br":
      "Reverter na Edição em Lote é um recurso experimental. Esta preferência ocultará o botão",
    "ru-ru":
      "Откат в пакетном редактировании — экспериментальная функция. Эта настройка скроет кнопку",
    "uk-ua":
      "Відкат у пакетному редагуванні – це експериментальна функція. Цей параметр приховає кнопку",
  },
  commit: {
    "en-us": "Commit",
    "de-ch": "Begehen",
    "es-es": "Comprometerse",
    "fr-fr": "Commettre",
    "pt-br": "Comprometer-se",
    "ru-ru": "Совершить",
    "uk-ua": "Здійснити",
  },
  startCommitDescription: {
    "en-us":
      "Commiting the Data Set will update, add, and delete the data from the spreadsheet to the  Specify database.",
    "de-ch":
      "Durch das Übernehmen des Datensatzes werden die Daten aus der Tabelle in der angegebenen Datenbank aktualisiert, hinzugefügt und gelöscht.",
    "es-es":
      "Al confirmar el conjunto de datos, se actualizarán, agregarán y eliminarán los datos de la hoja de cálculo en la base de datos Especificar.",
    "fr-fr":
      "La validation de l'ensemble de données mettra à jour, ajoutera et supprimera les données de la feuille de calcul dans la base de données Spécifier.",
    "pt-br":
      "A confirmação do conjunto de dados atualizará, adicionará e excluirá os dados da planilha para o banco de dados Specify.",
    "ru-ru":
      "При фиксации набора данных данные будут обновлены, добавлены и удалены из электронной таблицы в базу данных Specify.",
    "uk-ua":
      "Запис набору даних призведе до оновлення, додавання та видалення даних з електронної таблиці до бази даних Specify.",
  },
  startRevertDescription: {
    "en-us":
      "Rolling back the dataset will re-update the values, delete created records, and create new records",
    "de-ch":
      "Durch das Zurücksetzen des Datensatzes werden die Werte erneut aktualisiert, erstellte Datensätze gelöscht und neue Datensätze erstellt",
    "es-es":
      "Al revertir el conjunto de datos se volverán a actualizar los valores, se eliminarán los registros creados y se crearán nuevos registros.",
    "fr-fr":
      "La restauration de l'ensemble de données mettra à jour les valeurs, supprimera les enregistrements créés et créera de nouveaux enregistrements.",
    "pt-br":
      "Reverter o conjunto de dados atualizará novamente os valores, excluirá os registros criados e criará novos registros",
    "ru-ru":
      "Откат набора данных приведет к повторному обновлению значений, удалению созданных записей и созданию новых записей.",
    "uk-ua":
      "Відкат набору даних призведе до повторного оновлення значень, видалення створених записів та створення нових записів",
  },
  commitSuccessfulDescription: {
    "en-us":
      'Click on the "Results" button to see the number of records affected in each database table',
    "de-ch":
      "Klicken Sie auf die Schaltfläche „Ergebnisse“, um die Anzahl der betroffenen Datensätze in jeder Datenbanktabelle anzuzeigen",
    "es-es":
      'Haga clic en el botón "Resultados" para ver el número de registros afectados en cada tabla de la base de datos',
    "fr-fr":
      "Cliquez sur le bouton « Résultats » pour voir le nombre d'enregistrements affectés dans chaque table de base de données",
    "pt-br":
      'Clique no botão "Resultados" para ver o número de registros afetados em cada tabela do banco de dados',
    "ru-ru":
      "Нажмите кнопку «Результаты», чтобы увидеть количество затронутых записей в каждой таблице базы данных.",
    "uk-ua":
      "Натисніть кнопку «Результати», щоб побачити кількість записів, на які вплинула зміна, у кожній таблиці бази даних",
  },
  dateSetRevertDescription: {
    "en-us":
      "This rolled-back Data Set is saved, however, it cannot be edited. Please re-run the query",
    "de-ch":
      "Dieser zurückgesetzte Datensatz ist gespeichert, kann jedoch nicht bearbeitet werden. Bitte führen Sie die Abfrage erneut aus.",
    "es-es":
      "Este conjunto de datos revertido se ha guardado, pero no se puede editar. Vuelva a ejecutar la consulta.",
    "fr-fr":
      "Cet ensemble de données restauré est enregistré, mais non modifiable. Veuillez relancer la requête.",
    "pt-br":
      "Este conjunto de dados revertido foi salvo, mas não pode ser editado. Execute a consulta novamente.",
    "ru-ru":
      "Этот откатный набор данных сохранен, однако его нельзя редактировать. Пожалуйста, повторите запрос",
    "uk-ua":
      "Цей відкочений набір даних збережено, проте його не можна редагувати. Будь ласка, повторіть запит",
  },
  committing: {
    "en-us": "Committing",
    "de-ch": "Festschreiben",
    "es-es": "Comprometerse",
    "fr-fr": "S'engager",
    "pt-br": "Comprometendo-se",
    "ru-ru": "Совершение",
    "uk-ua": "Здійснення",
  },
  beStatusCommit: {
    "en-us": "Data Set Commit Status",
    "de-ch": "Datensatz-Commit-Status",
    "es-es": "Estado de confirmación del conjunto de datos",
    "fr-fr": "Statut de validation de l'ensemble de données",
    "pt-br": "Status de confirmação do conjunto de dados",
    "ru-ru": "Статус фиксации набора данных",
    "uk-ua": "Стан фіксації набору даних",
  },
  startCommit: {
    "en-us": "Begin Data Set Commit?",
    "de-ch": "Mit der Datensatzfestschreibung beginnen?",
    "es-es": "¿Comenzar conjunto de datos? ¿Confirmar?",
    "fr-fr": "Commencer la validation de l'ensemble de données ?",
    "pt-br": "Iniciar confirmação do conjunto de dados?",
    "ru-ru": "Начать фиксацию набора данных?",
    "uk-ua": "Почати фіксацію набору даних?",
  },
  commitErrors: {
    "en-us": "Commit Failed due to Error Cells",
    "de-ch": "Commit aufgrund von Fehlerzellen fehlgeschlagen",
    "es-es": "Error de confirmación debido a celdas de error",
    "fr-fr": "Échec de la validation en raison de cellules d'erreur",
    "pt-br": "Falha na confirmação devido a células de erro",
    "ru-ru": "Фиксация не удалась из-за ошибок ячеек",
    "uk-ua": "Не вдалося виконати фіксацію через комірки з помилками",
  },
  commitErrorsDescription: {
    "en-us": "The Commit failed due to one or more cell value errors.",
    "de-ch":
      "Das Commit ist aufgrund eines oder mehrerer Zellenwertfehler fehlgeschlagen.",
    "es-es":
      "La confirmación falló debido a uno o más errores en el valor de la celda.",
    "fr-fr":
      "La validation a échoué en raison d'une ou plusieurs erreurs de valeur de cellule.",
    "pt-br":
      "A confirmação falhou devido a um ou mais erros de valor de célula.",
    "ru-ru":
      "Фиксация не удалась из-за одной или нескольких ошибок в значениях ячеек.",
    "uk-ua":
      "Фіксацію не вдалося виконати через одну або декілька помилок у значенні клітинки.",
  },
  commitCancelled: {
    "en-us": "Commit Cancelled",
    "de-ch": "Commit abgebrochen",
    "es-es": "Confirmación cancelada",
    "fr-fr": "Engagement annulé",
    "pt-br": "Commit cancelado",
    "ru-ru": "Фиксация отменена",
    "uk-ua": "Зміна фіксації",
  },
  commitCancelledDescription: {
    "en-us": "Commit Cancelled Description",
    "de-ch": "Commit abgebrochen Beschreibung",
    "es-es": "Descripción de confirmación cancelada",
    "fr-fr": "Description de l'engagement annulé",
    "pt-br": "Descrição de confirmação cancelada",
    "ru-ru": "Описание отмены фиксации",
    "uk-ua": "Опис скасованого підтвердження",
  },
  commitSuccessful: {
    "en-us": "Commit Completed with No Errors",
    "de-ch": "Commit ohne Fehler abgeschlossen",
    "es-es": "Confirmación completada sin errores",
    "fr-fr": "Validation terminée sans erreur",
    "pt-br": "Commit concluído sem erros",
    "ru-ru": "Фиксация завершена без ошибок",
    "uk-ua": "Коміт завершено без помилок",
  },
  batchEditRecordSetName: {
    "en-us": 'BE commit of "{dataSet:string}"',
    "de-ch": "BE-Commit von „{dataSet:string}“",
    "es-es": 'Confirmación BE de "{dataSet:string}"',
    "fr-fr": "Validation BE de « {dataSet:string} »",
    "pt-br": 'Confirmação BE de "{dataSet:string}"',
    "ru-ru": 'BE-коммит "{dataSet:string}"',
    "uk-ua": 'BE коміт "{dataSet:string}"',
  },
  deferForMatch: {
    "en-us": "Use only visible fields for match",
    "de-ch": "Nur sichtbare Felder für die Übereinstimmung verwenden",
    "es-es": "Utilice únicamente campos visibles para la coincidencia",
    "fr-fr": "Utiliser uniquement les champs visibles pour la correspondance",
    "pt-br": "Use apenas campos visíveis para correspondência",
    "ru-ru": "Использовать только видимые поля для сопоставления",
    "uk-ua": "Використовувати лише видимі поля для збігу",
  },
  deferForMatchDescription: {
    "en-us":
      "If true, invisible database fields will not be used for matching. Default value is {default:boolean}",
    "de-ch":
      "Wenn diese Option aktiviert ist, werden unsichtbare Datenbankfelder nicht für den Abgleich verwendet. Der Standardwert ist {default:boolean}.",
    "es-es":
      "Si es verdadero, los campos invisibles de la base de datos no se usarán para la coincidencia. El valor predeterminado es {default:boolean}.",
    "fr-fr":
      "Si cette option est définie sur « true », les champs invisibles de la base de données ne seront pas utilisés pour la correspondance. La valeur par défaut est {default:boolean}.",
    "pt-br":
      "Se verdadeiro, os campos invisíveis do banco de dados não serão usados para correspondência. O valor padrão é {default:boolean}",
    "ru-ru":
      "Если true, невидимые поля базы данных не будут использоваться для сопоставления. Значение по умолчанию {default:boolean}",
    "uk-ua":
      "Якщо значення true, невидимі поля бази даних не використовуватимуться для зіставлення. Значення за замовчуванням — {default:boolean}",
  },
  deferForNullCheck: {
    "en-us": "Use only visible fields for empty record check",
    "de-ch": "Nur sichtbare Felder zur Prüfung leerer Datensätze verwenden",
    "es-es":
      "Utilice únicamente campos visibles para la verificación de registros vacíos",
    "fr-fr":
      "Utiliser uniquement les champs visibles pour la vérification des enregistrements vides",
    "pt-br": "Use apenas campos visíveis para verificação de registros vazios",
    "ru-ru": "Использовать только видимые поля для проверки пустых записей",
    "uk-ua": "Використовуйте лише видимі поля для перевірки порожніх записів",
  },
  deferForNullCheckDescription: {
    "en-us":
      "If true, invisible database fields will not be used for determining whether the record is empty or not. Default value is {default: boolean}",
    "de-ch":
      "Wenn „true“, werden unsichtbare Datenbankfelder nicht zur Bestimmung verwendet, ob der Datensatz leer ist oder nicht. Der Standardwert ist {default: boolean}",
    "es-es":
      "Si es verdadero, los campos invisibles de la base de datos no se usarán para determinar si el registro está vacío. El valor predeterminado es {default: boolean}.",
    "fr-fr":
      "Si cette option est définie sur « true », les champs invisibles de la base de données ne seront pas utilisés pour déterminer si l'enregistrement est vide. La valeur par défaut est {default: boolean}.",
    "pt-br":
      "Se verdadeiro, os campos invisíveis do banco de dados não serão usados para determinar se o registro está vazio ou não. O valor padrão é {default: boolean}",
    "ru-ru":
      "Если true, невидимые поля базы данных не будут использоваться для определения того, пуста ли запись или нет. Значение по умолчанию — {default: boolean}",
    "uk-ua":
      "Якщо значення true, невидимі поля бази даних не використовуватимуться для визначення того, чи є запис порожнім. Значення за замовчуванням: {default: boolean}",
  },
  batchEditDisabled: {
    "en-us":
      "Batch Edit is disabled for system tables and scoping hierarchy tables",
    "de-ch":
      "Die Stapelbearbeitung ist für Systemtabellen und Bereichshierarchietabellen deaktiviert",
    "es-es":
      "La edición por lotes está deshabilitada para las tablas del sistema y las tablas de jerarquía de alcance",
    "fr-fr":
      "L'édition par lots est désactivée pour les tables système et les tables de hiérarchie de portée",
    "pt-br":
      "A edição em lote está desabilitada para tabelas de sistema e tabelas de hierarquia de escopo",
    "ru-ru":
      "Пакетное редактирование отключено для системных таблиц и таблиц иерархии области действия.",
    "uk-ua":
      "Пакетне редагування вимкнено для системних таблиць та таблиць ієрархії області видимості",
  },
  cannotEditAfterRollback: {
    "en-us":
      "(Batch Edit datasets cannot be edited after rollback - Read Only)",
    "de-ch":
      "(Datensätze mit Stapelbearbeitung können nach dem Rollback nicht bearbeitet werden – schreibgeschützt)",
    "es-es":
      "(Los conjuntos de datos de edición por lotes no se pueden editar después de la reversión: solo lectura)",
    "fr-fr":
      "(Les ensembles de données d'édition par lots ne peuvent pas être modifiés après la restauration - Lecture seule)",
    "pt-br":
      "(Os conjuntos de dados de edição em lote não podem ser editados após a reversão - Somente leitura)",
    "ru-ru":
      "(Пакетное редактирование наборов данных невозможно после отката — только чтение)",
    "uk-ua":
      "(Набори даних пакетного редагування не можна редагувати після відкату – лише для читання)",
  },
  enableRelationships: {
    "en-us": "Enable relationships",
    "de-ch": "Beziehungen aktivieren",
    "es-es": "Habilitar relaciones",
    "fr-fr": "Activer les relations",
    "pt-br": "Habilitar relacionamentos",
    "ru-ru": "Включить отношения",
    "uk-ua": "Увімкнути зв'язки",
  },
  enableRelationshipsDescription: {
    "en-us":
      "Allows batch editing relationships of the base table. Rollback is disabled when relationships are enabled",
    "de-ch":
      "Ermöglicht die Stapelbearbeitung von Beziehungen der Basistabelle. Rollback ist deaktiviert, wenn Beziehungen aktiviert sind.",
    "es-es":
      "Permite la edición por lotes de relaciones de la tabla base. La reversión está deshabilitada cuando las relaciones están habilitadas.",
    "fr-fr":
      "Permet la modification par lots des relations de la table de base. La restauration est désactivée lorsque les relations sont activées.",
    "pt-br":
      "Permite a edição em lote de relacionamentos da tabela base. O rollback é desabilitado quando os relacionamentos são habilitados.",
    "ru-ru":
      "Позволяет пакетное редактирование связей базовой таблицы. Откат отключен, если связи включены",
    "uk-ua":
      "Дозволяє пакетне редагування зв'язків базової таблиці. Відкат вимкнено, якщо зв'язки ввімкнено",
  },
  commitDataSet: {
    "en-us": "Commit Data Set",
    "de-ch": "",
    "es-es": "",
    "fr-fr": "",
    "pt-br": "",
    "ru-ru": "",
    "uk-ua": "",
  },
  warningBatchEditText: {
    "en-us":
      "Before proceeding, please note that the following action may interrupt other users. This action may cause delays or temporary unavailability of certain features for Specify users. Please consider the impact on their experience. This action cannot be undone",
    "de-ch": "",
    "es-es": "",
    "fr-fr": "",
    "pt-br": "",
    "ru-ru": "",
    "uk-ua": "",
  },
} as const);
