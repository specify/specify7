/**
 * Localization strings used for displaying Attachments
 *
 * @module
 */

import { createDictionary } from './utils';

export const batchEditText = createDictionary({
  batchEdit: {
    'en-us': 'Batch Edit',
    'de-ch': 'Stapelbearbeitung',
    'es-es': 'Edición por lotes',
    'fr-fr': 'Modification par lots',
    'pt-br': 'Edição em lote',
    'ru-ru': 'Пакетное редактирование',
    'uk-ua': 'Пакетне редагування',
  },
  batchEditPrefs: {
    'en-us': 'Batch Edit Preferences',
    'de-ch': 'Stapelbearbeitungseinstellungen',
    'es-es': 'Preferencias de edición por lotes',
    'fr-fr': 'Préférences de modification par lots',
    'pt-br': 'Preferências de edição em lote',
    'ru-ru': 'Пакетное редактирование настроек',
    'uk-ua': 'Налаштування пакетного редагування',
  },
  numberOfRecords: {
    'en-us': 'Number of records selected from the query',
    'de-ch': 'Anzahl der aus der Abfrage ausgewählten Datensätze',
    'es-es': 'Número de registros seleccionados de la consulta',
    'fr-fr': "Nombre d'enregistrements sélectionnés dans la requête",
    'pt-br': 'Número de registros selecionados na consulta',
    'ru-ru': 'Количество записей, выбранных из запроса',
    'uk-ua': 'Кількість записів, вибраних із запиту',
  },
  removeField: {
    'en-us':
      'Field not supported for batch edit. Either remove the field, or make it hidden.',
    'de-ch':
      'Dieses Feld wird für die Stapelbearbeitung nicht unterstützt. Entfernen Sie das Feld oder blenden Sie es aus.',
    'es-es':
      'Campo no compatible con la edición por lotes. Elimínelo u ocúltelo.',
    'fr-fr':
      "Ce champ n'est pas compatible avec la modification par lots. Veuillez le supprimer ou le masquer.",
    'pt-br':
      'Este campo não é compatível com edição em lote. Remova-o ou oculte-o.',
    'ru-ru':
      'Поле не поддерживается для пакетного редактирования. Удалите поле или сделайте его скрытым.',
    'uk-ua':
      'Поле не підтримується для пакетного редагування. Видаліть поле або приховайте його.',
  },
  addTreeRank: {
    'en-us':
      'The following ranks will be added to the query to enable batch editing',
    'de-ch':
      'Die folgenden Ränge werden der Abfrage hinzugefügt, um die Stapelbearbeitung zu ermöglichen.',
    'es-es':
      'Los siguientes rangos se agregarán a la consulta para permitir la edición por lotes',
    'fr-fr':
      "Les rangs suivants seront ajoutés à la requête pour permettre l'édition par lots",
    'pt-br':
      'As seguintes classificações serão adicionadas à consulta para permitir a edição em lote.',
    'ru-ru':
      'Следующие ранги будут добавлены в запрос для обеспечения пакетного редактирования',
    'uk-ua':
      'Наступні ранги будуть додані до запиту, щоб увімкнути пакетне редагування',
  },
  pickTreesToFilter: {
    'en-us':
      'The selected rank(s) are found in multiple trees. Pick tree(s) to batch edit with',
    'de-ch':
      'Die ausgewählten Ränge befinden sich in mehreren Bäumen. Wählen Sie die Bäume aus, die Sie stapelweise bearbeiten möchten.',
    'es-es':
      'Los rangos seleccionados se encuentran en varios árboles. Seleccione los árboles para editarlos por lotes.',
    'fr-fr':
      'Le ou les rangs sélectionnés se trouvent dans plusieurs arbres. Sélectionnez le ou les arbres à modifier par lots.',
    'pt-br':
      'Os rankings selecionados são encontrados em várias árvores. Selecione a(s) árvore(s) para editar em lote.',
    'ru-ru':
      'Выбранные ранги найдены в нескольких деревьях. Выберите деревья для пакетного редактирования.',
    'uk-ua':
      'Вибрані ранги знаходяться в кількох деревах. Виберіть дерево(а) для пакетного редагування',
  },
  datasetName: {
    'en-us': '{queryName:string} {datePart:string}',
    'de-ch': '{queryName:string} {datePart:string}',
    'es-es': '{queryName:string} {datePart:string}',
    'fr-fr': '{queryName:string} {datePart:string}',
    'pt-br': '{queryName:string} {datePart:string}',
    'ru-ru': '{queryName:string} {datePart:string}',
    'uk-ua': "{queryName:string} {datePart:string}'",
  },
  errorInQuery: {
    'en-us': 'Following errors were found in the query',
    'de-ch': 'Bei der Abfrage wurden folgende Fehler gefunden.',
    'es-es': 'Se encontraron los siguientes errores en la consulta',
    'fr-fr': 'Les erreurs suivantes ont été détectées dans la requête.',
    'pt-br': 'Os seguintes erros foram encontrados na consulta.',
    'ru-ru': 'В запросе обнаружены следующие ошибки:',
    'uk-ua': 'У запиті виявлено такі помилки',
  },
  missingRanksInQuery: {
    'en-us': 'Query requires additional ranks for batch editing',
    'de-ch': 'Für die Stapelbearbeitung sind zusätzliche Ränge erforderlich.',
    'es-es':
      'La consulta requiere rangos adicionales para la edición por lotes',
    'fr-fr':
      "La requête nécessite des niveaux hiérarchiques supplémentaires pour l'édition par lots.",
    'pt-br': 'A consulta requer níveis adicionais para edição em lote.',
    'ru-ru':
      'Запрос требует дополнительных рангов для пакетного редактирования',
    'uk-ua': 'Запит потребує додаткових рангів для пакетного редагування',
  },
  createUpdateDataSetInstructions: {
    'en-us': 'Use the query builder to make a new batch edit dataset',
    'de-ch':
      'Verwenden Sie den Abfrage-Generator, um ein neues Batch-Bearbeitungs-Dataset zu erstellen.',
    'es-es':
      'Utilice el generador de consultas para crear un nuevo conjunto de datos de edición por lotes',
    'fr-fr':
      "Utilisez le générateur de requêtes pour créer un nouvel ensemble de données d'édition par lots.",
    'pt-br':
      'Use o construtor de consultas para criar um novo conjunto de dados para edição em lote.',
    'ru-ru':
      'Используйте конструктор запросов для создания нового набора данных для пакетного редактирования.',
    'uk-ua':
      'Використовуйте конструктор запитів для створення нового набору даних для пакетного редагування',
  },
  showRollback: {
    'en-us': 'Show rollback button',
    'de-ch': 'Schaltfläche „Zurück“ anzeigen',
    'es-es': 'Mostrar botón para revertir',
    'fr-fr': 'Afficher le bouton de restauration',
    'pt-br': 'Mostrar botão de reversão',
    'ru-ru': 'Показать кнопку отката',
    'uk-ua': 'Показати кнопку відкату',
  },
  showRollbackDescription: {
    'en-us':
      'Rollback in Batch Edit is an experimental feature. This preference will hide the button',
    'de-ch':
      'Die Funktion „Rollback“ in der Stapelbearbeitung ist experimentell. Diese Einstellung blendet die Schaltfläche aus.',
    'es-es':
      'Revertir en la edición por lotes es una función experimental. Esta preferencia ocultará el botón.',
    'fr-fr':
      'La fonction « Annuler » dans l’édition par lots est expérimentale. Cette préférence masquera le bouton.',
    'pt-br':
      'A reversão na edição em lote é um recurso experimental. Esta preferência ocultará o botão.',
    'ru-ru':
      'Откат в пакетном редактировании — экспериментальная функция. Эта настройка скроет кнопку.',
    'uk-ua':
      'Відкат у пакетному редагуванні – це експериментальна функція. Цей параметр приховає кнопку',
  },
  commit: {
    'en-us': 'Commit',
    'de-ch': 'Begehen',
    'es-es': 'Comprometerse',
    'fr-fr': 'Commettre',
    'pt-br': 'Comprometer-se',
    'ru-ru': 'Совершить',
    'uk-ua': 'Здійснити',
  },
  startCommitDescription: {
    'en-us':
      'Commiting the Data Set will update, add, and delete the data from the spreadsheet to the  Specify database.',
    'de-ch':
      'Durch das Übertragen des Datensatzes werden die Daten aus der Tabellenkalkulation in die Specify-Datenbank aktualisiert, hinzugefügt und gelöscht.',
    'es-es':
      'Al confirmar el conjunto de datos, se actualizarán, agregarán y eliminarán los datos de la hoja de cálculo a la base de datos especificada.',
    'fr-fr':
      "L'enregistrement de l'ensemble de données mettra à jour, ajoutera et supprimera les données de la feuille de calcul dans la base de données Specification.",
    'pt-br':
      'Ao confirmar o conjunto de dados, os dados da planilha serão atualizados, adicionados e excluídos do banco de dados especificado.',
    'ru-ru':
      'При фиксации набора данных данные будут обновляться, добавляться и удаляться из электронной таблицы в базе данных Specify.',
    'uk-ua':
      'Запис набору даних призведе до оновлення, додавання та видалення даних з електронної таблиці до бази даних Specify.',
  },
  startRevertDescription: {
    'en-us':
      'Rolling back the dataset will re-update the values, delete created records, and create new records',
    'de-ch':
      'Durch das Zurücksetzen des Datensatzes werden die Werte aktualisiert, erstellte Datensätze gelöscht und neue Datensätze erstellt.',
    'es-es':
      'Al revertir el conjunto de datos se volverán a actualizar los valores, se eliminarán los registros creados y se crearán nuevos registros.',
    'fr-fr':
      "La restauration des données permettra de mettre à jour les valeurs, de supprimer les enregistrements créés et d'en créer de nouveaux.",
    'pt-br':
      'Reverter o conjunto de dados atualizará os valores, excluirá os registros criados e criará novos registros.',
    'ru-ru':
      'Откат набора данных приведет к повторному обновлению значений, удалению созданных записей и созданию новых записей.',
    'uk-ua':
      'Відкат набору даних призведе до повторного оновлення значень, видалення створених записів та створення нових записів',
  },
  commitSuccessfulDescription: {
    'en-us':
      'Click on the "Results" button to see the number of records affected in each database table',
    'de-ch':
      'Klicken Sie auf die Schaltfläche „Ergebnisse“, um die Anzahl der betroffenen Datensätze in jeder Datenbanktabelle anzuzeigen.',
    'es-es':
      'Haga clic en el botón "Resultados" para ver el número de registros afectados en cada tabla de la base de datos',
    'fr-fr':
      "Cliquez sur le bouton « Résultats » pour voir le nombre d'enregistrements affectés dans chaque table de la base de données.",
    'pt-br':
      'Clique no botão "Resultados" para ver o número de registros afetados em cada tabela do banco de dados.',
    'ru-ru':
      'Нажмите кнопку «Результаты», чтобы увидеть количество затронутых записей в каждой таблице базы данных.',
    'uk-ua':
      'Натисніть кнопку «Результати», щоб побачити кількість записів, на які вплинула зміна, у кожній таблиці бази даних',
  },
  dateSetRevertDescription: {
    'en-us':
      'This rolled-back Data Set is saved, however, it cannot be edited. Please re-run the query',
    'de-ch':
      'Der zurückgesetzte Datensatz wurde gespeichert, kann aber nicht bearbeitet werden. Bitte führen Sie die Abfrage erneut aus.',
    'es-es':
      'Este conjunto de datos revertido se ha guardado, pero no se puede editar. Vuelva a ejecutar la consulta.',
    'fr-fr':
      'Ce jeu de données restauré est enregistré, mais ne peut pas être modifié. Veuillez exécuter à nouveau la requête.',
    'pt-br':
      'Este conjunto de dados revertido foi salvo, porém não pode ser editado. Por favor, execute a consulta novamente.',
    'ru-ru':
      'Этот откатенный набор данных сохранён, однако его нельзя редактировать. Пожалуйста, выполните запрос повторно.',
    'uk-ua':
      'Цей відкочений набір даних збережено, проте його не можна редагувати. Будь ласка, повторіть запит',
  },
  committing: {
    'en-us': 'Committing',
    'de-ch': 'Verpflichtung',
    'es-es': 'Compromiso',
    'fr-fr': "S'engager",
    'pt-br': 'Comprometer-se',
    'ru-ru': 'Совершение',
    'uk-ua': 'Здійснення',
  },
  beStatusCommit: {
    'en-us': 'Data Set Commit Status',
    'de-ch': 'Commit-Status des Datensatzes',
    'es-es': 'Estado de confirmación del conjunto de datos',
    'fr-fr': "État de validation de l'ensemble de données",
    'pt-br': 'Status de confirmação do conjunto de dados',
    'ru-ru': 'Статус фиксации набора данных',
    'uk-ua': 'Стан фіксації набору даних',
  },
  startCommit: {
    'en-us': 'Begin Data Set Commit?',
    'de-ch': 'Datensatz-Commit starten?',
    'es-es': '¿Comprobar el conjunto de datos?',
    'fr-fr': "Début de la validation de l'ensemble de données ?",
    'pt-br': 'Iniciar confirmação do conjunto de dados?',
    'ru-ru': 'Начать фиксацию набора данных?',
    'uk-ua': 'Почати фіксацію набору даних?',
  },
  commitErrors: {
    'en-us': 'Commit Failed due to Error Cells',
    'de-ch': 'Commit fehlgeschlagen aufgrund von Fehlerzellen',
    'es-es': 'Error al confirmar debido a celdas de error',
    'fr-fr': "Échec de la validation en raison de cellules d'erreur",
    'pt-br': 'Falha na confirmação devido a células com erro.',
    'ru-ru': 'Фиксация не удалась из-за ошибок в ячейках',
    'uk-ua': 'Не вдалося виконати фіксацію через комірки з помилками',
  },
  commitErrorsDescription: {
    'en-us': 'The Commit failed due to one or more cell value errors.',
    'de-ch':
      'Der Commit ist aufgrund eines oder mehrerer Zellwertfehler fehlgeschlagen.',
    'es-es':
      'La confirmación falló debido a uno o más errores en los valores de las celdas.',
    'fr-fr':
      "La validation a échoué en raison d'une ou plusieurs erreurs de valeur de cellule.",
    'pt-br':
      'A operação de confirmação (Commit) falhou devido a um ou mais erros nos valores das células.',
    'ru-ru':
      'Фиксация не удалась из-за одной или нескольких ошибок значений ячеек.',
    'uk-ua':
      'Фіксацію не вдалося виконати через одну або декілька помилок у значенні клітинки.',
  },
  commitCancelled: {
    'en-us': 'Commit Cancelled',
    'de-ch': 'Commit abgebrochen',
    'es-es': 'Compromiso cancelado',
    'fr-fr': 'Validation annulée',
    'pt-br': 'Compromisso cancelado',
    'ru-ru': 'Фиксация отменена',
    'uk-ua': 'Зміна фіксації',
  },
  commitCancelledDescription: {
    'en-us': 'Commit Cancelled Description',
    'de-ch': 'Commit abgebrochen Beschreibung',
    'es-es': 'Descripción de la cancelación del compromiso',
    'fr-fr': "Description de l'annulation de l'engagement",
    'pt-br': 'Descrição do Compromisso Cancelado',
    'ru-ru': 'Описание отмены фиксации',
    'uk-ua': 'Опис скасованого підтвердження',
  },
  commitSuccessful: {
    'en-us': 'Commit Completed with No Errors',
    'de-ch': 'Commit erfolgreich abgeschlossen (keine Fehler)',
    'es-es': 'Confirmación completada sin errores',
    'fr-fr': 'Commit terminé sans erreur',
    'pt-br': 'Commit concluído sem erros.',
    'ru-ru': 'Фиксация завершена без ошибок',
    'uk-ua': 'Коміт завершено без помилок',
  },
  batchEditRecordSetName: {
    'en-us': 'BE commit of "{dataSet:string}"',
    'de-ch': 'BE-Commit von "{dataSet:string}"',
    'es-es': 'Confirmación BE de "{dataSet:string}"',
    'fr-fr': 'COMMISSION BE de "{dataSet:string}"',
    'pt-br': 'Confirmação BE de "{dataSet:string}"',
    'ru-ru': 'BE-коммит "{dataSet:string}"',
    'uk-ua': 'BE коміт "{dataSet:string}"',
  },
  deferForMatch: {
    'en-us': 'Use only visible fields for match',
    'de-ch': 'Verwenden Sie für den Abgleich nur sichtbare Felder.',
    'es-es': 'Utilice únicamente los campos visibles para la coincidencia.',
    'fr-fr': 'Utilisez uniquement les champs visibles pour la correspondance',
    'pt-br': 'Use apenas os campos visíveis para correspondência.',
    'ru-ru': 'Использовать только видимые поля для сопоставления',
    'uk-ua': 'Використовувати лише видимі поля для збігу',
  },
  deferForMatchDescription: {
    'en-us':
      'If true, invisible database fields will not be used for matching. Default value is {default:boolean}',
    'de-ch':
      'Wenn diese Option aktiviert ist, werden unsichtbare Datenbankfelder nicht für den Abgleich verwendet. Der Standardwert ist {default:boolean}.',
    'es-es':
      'Si es verdadero, los campos invisibles de la base de datos no se utilizarán para la coincidencia. El valor predeterminado es {default:boolean}.',
    'fr-fr':
      'Si cette option est activée, les champs invisibles de la base de données ne seront pas utilisés pour la correspondance. La valeur par défaut est {default:boolean}.',
    'pt-br':
      'Se verdadeiro, os campos invisíveis do banco de dados não serão usados para correspondência. O valor padrão é {default:boolean}.',
    'ru-ru':
      'Если задано значение true, невидимые поля базы данных не будут использоваться для сопоставления. Значение по умолчанию: {default:boolean}.',
    'uk-ua':
      'Якщо значення true, невидимі поля бази даних не використовуватимуться для зіставлення. Значення за замовчуванням — {default:boolean}',
  },
  deferForNullCheck: {
    'en-us': 'Use only visible fields for empty record check',
    'de-ch':
      'Verwenden Sie für die Prüfung auf leere Datensätze nur sichtbare Felder.',
    'es-es':
      'Utilice únicamente los campos visibles para la comprobación de registros vacíos.',
    'fr-fr':
      'Utiliser uniquement les champs visibles pour la vérification des enregistrements vides',
    'pt-br':
      'Usar apenas os campos visíveis para verificação de registro vazio.',
    'ru-ru': 'Использовать только видимые поля для проверки пустых записей',
    'uk-ua': 'Використовуйте лише видимі поля для перевірки порожніх записів',
  },
  deferForNullCheckDescription: {
    'en-us':
      'If true, invisible database fields will not be used for determining whether the record is empty or not. Default value is {default: boolean}',
    'de-ch':
      'Wenn diese Option aktiviert ist, werden unsichtbare Datenbankfelder nicht zur Bestimmung herangezogen, ob ein Datensatz leer ist oder nicht. Der Standardwert ist {default: boolean}.',
    'es-es':
      'Si es verdadero, los campos invisibles de la base de datos no se utilizarán para determinar si el registro está vacío o no. El valor predeterminado es {default: boolean}.',
    'fr-fr':
      "Si cette option est activée, les champs invisibles de la base de données ne seront pas utilisés pour déterminer si l'enregistrement est vide ou non. La valeur par défaut est {default: boolean}.",
    'pt-br':
      'Se verdadeiro, os campos invisíveis do banco de dados não serão usados para determinar se o registro está vazio ou não. O valor padrão é {default: boolean}.',
    'ru-ru':
      'Если задано значение true, невидимые поля базы данных не будут использоваться для определения того, пуста ли запись. Значение по умолчанию: {default: boolean}',
    'uk-ua':
      'Якщо значення true, невидимі поля бази даних не використовуватимуться для визначення того, чи є запис порожнім. Значення за замовчуванням: {default: boolean}',
  },
  batchEditDisabled: {
    'en-us':
      'Batch Edit is disabled for system tables and scoping hierarchy tables',
    'de-ch':
      'Die Stapelbearbeitung ist für Systemtabellen und Bereichshierarchietabellen deaktiviert.',
    'es-es':
      'La edición por lotes está deshabilitada para las tablas del sistema y las tablas de jerarquía de ámbito.',
    'fr-fr':
      "L'édition par lots est désactivée pour les tables système et les tables de hiérarchie de portée.",
    'pt-br':
      'A edição em lote está desativada para tabelas do sistema e tabelas de hierarquia de escopo.',
    'ru-ru':
      'Пакетное редактирование отключено для системных таблиц и таблиц иерархии области действия.',
    'uk-ua':
      'Пакетне редагування вимкнено для системних таблиць та таблиць ієрархії області видимості',
  },
  cannotEditAfterRollback: {
    'en-us':
      '(Batch Edit datasets cannot be edited after rollback - Read Only)',
    'de-ch':
      '(Stapelbearbeitungsdatensätze können nach einem Rollback nicht mehr bearbeitet werden – schreibgeschützt)',
    'es-es':
      '(Los conjuntos de datos editados por lotes no se pueden editar después de la reversión; solo lectura).',
    'fr-fr':
      '(Les ensembles de données modifiés par lots ne peuvent pas être modifiés après une restauration - Lecture seule)',
    'pt-br':
      '(Os conjuntos de dados editados em lote não podem ser editados após o rollback - Somente leitura)',
    'ru-ru':
      '(Пакетное редактирование наборов данных невозможно после отката — только для чтения)',
    'uk-ua':
      '(Набори даних пакетного редагування не можна редагувати після відкату – лише для читання)',
  },
  enableRelationships: {
    'en-us': 'Enable relationships',
    'de-ch': 'Beziehungen ermöglichen',
    'es-es': 'Facilitar las relaciones',
    'fr-fr': 'Favoriser les relations',
    'pt-br': 'Promover relacionamentos',
    'ru-ru': 'Включить отношения',
    'uk-ua': "Увімкнути зв'язки",
  },
  enableRelationshipsDescription: {
    'en-us':
      'Allows batch editing relationships of the base table. Rollback is disabled when relationships are enabled',
    'de-ch':
      'Ermöglicht die Stapelbearbeitung von Beziehungen in der Basistabelle. Die Rücksetzung ist deaktiviert, wenn Beziehungen aktiviert sind.',
    'es-es':
      'Permite editar por lotes las relaciones de la tabla base. La reversión está deshabilitada cuando las relaciones están habilitadas.',
    'fr-fr':
      'Permet la modification par lots des relations de la table de base. La restauration est désactivée lorsque les relations sont activées.',
    'pt-br':
      'Permite a edição em lote de relacionamentos da tabela base. O rollback é desativado quando os relacionamentos estão ativados.',
    'ru-ru':
      'Позволяет пакетно редактировать связи базовой таблицы. Откат отключается при включении связей.',
    'uk-ua':
      "Дозволяє пакетне редагування зв'язків базової таблиці. Відкат вимкнено, якщо зв'язки ввімкнено",
  },
  commitDataSet: {
    'en-us': 'Commit Data Set',
    'de-ch': 'Datensatz übertragen',
    'es-es': 'Conjunto de datos de confirmación',
    'fr-fr': 'Ensemble de données de validation',
    'pt-br': 'Conjunto de dados de confirmação',
    'ru-ru': 'Зафиксировать набор данных',
    'uk-ua': 'Набір даних для фіксації',
  },
  warningBatchEditText: {
    'en-us':
      'Before proceeding, please note that the following action may interrupt other users. This action may cause delays or temporary unavailability of certain features for Specify users. Please consider the impact on their experience. This action cannot be undone',
    'de-ch':
      'Bevor Sie fortfahren, beachten Sie bitte, dass die folgende Aktion andere Nutzer beeinträchtigen kann. Dies kann zu Verzögerungen oder vorübergehender Nichtverfügbarkeit bestimmter Funktionen für bestimmte Nutzer führen. Bitte berücksichtigen Sie die Auswirkungen auf deren Nutzungserfahrung. Diese Aktion kann nicht rückgängig gemacht werden.',
    'es-es':
      'Antes de continuar, tenga en cuenta que la siguiente acción puede interrumpir a otros usuarios. Esta acción puede causar retrasos o la indisponibilidad temporal de ciertas funciones para los usuarios de Specify. Considere el impacto en su experiencia. Esta acción es irreversible.',
    'fr-fr':
      "Avant de continuer, veuillez noter que l'action suivante peut perturber d'autres utilisateurs. Cette action peut entraîner des retards ou l'indisponibilité temporaire de certaines fonctionnalités pour les utilisateurs de Specific. Veuillez tenir compte de l'impact sur leur expérience. Cette action est irréversible.",
    'pt-br':
      'Antes de prosseguir, observe que a ação a seguir pode interromper outros usuários. Esta ação pode causar atrasos ou indisponibilidade temporária de certos recursos para os usuários especificados. Considere o impacto na experiência deles. Esta ação não pode ser desfeita.',
    'ru-ru':
      'Прежде чем продолжить, обратите внимание, что следующее действие может помешать другим пользователям. Это действие может привести к задержкам или временной недоступности некоторых функций для пользователей Specify. Пожалуйста, учтите это влияние на их работу. Это действие не может быть отменено.',
    'uk-ua':
      'Перш ніж продовжити, зверніть увагу, що наступна дія може перешкодити іншим користувачам. Ця дія може спричинити затримки або тимчасову недоступність певних функцій для певних користувачів. Будь ласка, врахуйте вплив на їхній досвід. Цю дію не можна скасувати',
  },
} as const);
