/**
 * Localization strings for behavioral preferences.
 *
 * @module
 */
import { createDictionary } from './utils';
// Refer to "Guidelines for Programmers" in ./README.md before editing this file
export const preferencesBehaviorDictionary = {
  alwaysPrompt: {
    'en-us': 'Always prompt to choose collection',
    'ru-ru': 'Всегда предлагайте выбрать коллекцию',
    'es-es': 'Siempre dispuesto a elegir la colección',
    'fr-fr': 'Toujours invité à choisir la collection',
    'uk-ua': 'Завжди підкажуть вибрати колекцію',
    'de-ch': 'Immer zur Auswahl der Sammlung auffordern',
    'pt-br': 'Sempre pronto para escolher a coleção',
  },
  showNewDataSetWarning: {
    'en-us': 'Show new Data Set warning',
    'ru-ru': 'Показать предупреждение о новом наборе данных',
    'es-es': 'Mostrar nueva advertencia de conjunto de datos',
    'fr-fr': "Afficher un nouvel avertissement sur l'ensemble de données",
    'uk-ua': 'Показати попередження про новий набір даних',
    'de-ch': 'Warnung für neuen Datensatz anzeigen',
    'pt-br': 'Mostrar novo aviso de conjunto de dados',
  },
  showNewDataSetWarningDescription: {
    'en-us': 'Show an informational message when creating a new Data Set.',
    'ru-ru':
      'Показывать информационное сообщение при создании нового набора данных.',
    'es-es':
      'Mostrar un mensaje informativo al crear un nuevo conjunto de datos.',
    'fr-fr':
      "Afficher un message d'information lors de la création d'un nouvel ensemble de données.",
    'uk-ua':
      'Показувати інформаційне повідомлення під час створення нового набору даних.',
    'de-ch': 'Zeige eine Meldung beim erstellen eines neuen Datensatzes an.',
    'pt-br':
      'Exibir uma mensagem informativa ao criar um novo conjunto de dados.',
  },
  allowDismissingErrors: {
    'en-us': 'Allow dismissing error messages',
    'ru-ru': 'Разрешить отклонять сообщения об ошибках',
    'es-es': 'Permitir descartar mensajes de error',
    'fr-fr': "Autoriser le rejet des messages d'erreur",
    'uk-ua': 'Дозволити закривати повідомлення про помилки',
    'de-ch': 'Erlaube das Verwerfen von Fehlermeldungen',
    'pt-br': 'Permitir descartar mensagens de erro',
  },
  updatePageTitle: {
    'en-us': 'Update page title',
    'ru-ru': 'Обновить заголовок страницы',
    'es-es': 'Actualizar el título de la página',
    'fr-fr': 'Mettre à jour le titre de la page',
    'uk-ua': 'Оновити назву сторінки',
    'de-ch': 'Seitentitel aktualisieren',
    'pt-br': 'Atualizar título da página',
  },
  updatePageTitleDescription: {
    'en-us':
      "Whether to update the title of the page to match dialog's header.",
    'ru-ru':
      'Обновлять ли заголовок страницы в соответствии с заголовком диалогового окна.',
    'es-es':
      'Si se debe actualizar el título de la página para que coincida con el encabezado del cuadro de diálogo.',
    'fr-fr':
      "S'il faut mettre à jour le titre de la page pour qu'il corresponde à l'en-tête de la boîte de dialogue.",
    'uk-ua':
      'Чи оновлювати назву сторінки відповідно до заголовка діалогового вікна.',
    'de-ch':
      'Titel der Seite so aktualisieren, dass er mit der Kopfzeile des Dialogs übereinstimmt.',
    'pt-br':
      'Se o título da página deve ser atualizado para corresponder ao cabeçalho da caixa de diálogo.',
  },
  updatePageTitleFormDescription: {
    'en-us': 'Whether to update the title of the page to match current record.',
    'ru-ru':
      'Следует ли обновить заголовок страницы в соответствии с текущей записью.',
    'es-es':
      'Si desea actualizar el título de la página para que coincida con el registro actual.',
    'fr-fr':
      "S'il faut mettre à jour le titre de la page pour qu'il corresponde à l'enregistrement actuel.",
    'uk-ua': 'Чи оновлювати назву сторінки відповідно до поточного запису.',
    'de-ch':
      'Titel der Seite aktualisieren, damit er mit dem aktuellen Datensatz übereinstimmt.',
    'pt-br':
      'Se o título da página deve ser atualizado para corresponder ao registro atual.',
  },
  queryComboBox: {
    'en-us': 'Query Combo Box',
    'ru-ru': 'Поле со списком запросов',
    'es-es': 'Cuadro combinado de consulta',
    'uk-ua': 'Поле зі списком запитів',
    'de-ch': 'Abfrage-Kombinationsfeld',
    'fr-fr': 'Zone de liste déroulante de requête',
    'pt-br': 'Caixa de combinação de consulta',
  },
  searchAlgorithm: {
    'en-us': 'Search Algorithm',
    'ru-ru': 'Алгоритм поиска',
    'es-es': 'Algoritmo de búsqueda',
    'fr-fr': 'Algorithme de recherche',
    'uk-ua': 'Алгоритм пошуку',
    'de-ch': 'Suchalgorithmus',
    'pt-br': 'Algoritmo de Busca',
  },
  treeSearchAlgorithm: {
    'en-us': 'Search Algorithm (for relationships with tree tables)',
    'ru-ru': 'Алгоритм поиска (для связей с древовидными таблицами)',
    'es-es': 'Algoritmo de búsqueda (para relaciones con tablas de árboles)',
    'fr-fr':
      'Algorithme de recherche (pour les relations avec les tables arborescentes)',
    'uk-ua': 'Алгоритм пошуку (для зв’язків із деревоподібними таблицями)',
    'de-ch': 'Suchalgorithmus (für Beziehungen mit Baumtabellen)',
    'pt-br': 'Algoritmo de busca (para relacionamentos com tabelas de árvore)',
  },
  startsWithInsensitive: {
    'en-us': 'Starts With (case-insensitive)',
    'ru-ru': 'Начинается с (без учета регистра)',
    'es-es': 'Comienza con (sin distinguir entre mayúsculas y minúsculas)',
    'fr-fr': 'Commence par (insensible à la casse)',
    'uk-ua': 'Починається з (без урахування регістру)',
    'de-ch': 'Beginnt mit (Groß-/Kleinschreibung wird nicht beachtet)',
    'pt-br': 'Começa com (sem distinção entre maiúsculas e minúsculas)',
  },
  startsWithDescription: {
    'en-us': 'Search for values that begin with a given query string.',
    'ru-ru': 'Поиск значений, начинающихся с заданной строки запроса.',
    'es-es':
      'Busque valores que comiencen con una cadena de consulta determinada.',
    'fr-fr':
      'Rechercher des valeurs commençant par une chaîne de requête donnée.',
    'uk-ua': 'Пошук значень, які починаються з заданого рядка запиту.',
    'de-ch':
      'Suchen Sie nach Werten, die mit einer bestimmten Abfragezeichenfolge beginnen.',
    'pt-br':
      'Pesquise valores que começam com uma determinada sequência de consulta.',
  },
  startsWithCaseSensitive: {
    'en-us': 'Starts With (case-sensitive)',
    'ru-ru': 'Начинается с (с учетом регистра)',
    'es-es': 'Comienza con (sensible a mayúsculas y minúsculas)',
    'fr-fr': 'Commence par (sensible à la casse)',
    'uk-ua': 'Починається з (з урахуванням регістру)',
    'de-ch': 'Beginnt mit (Groß-/Kleinschreibung beachten)',
    'pt-br': 'Começa com (diferencia maiúsculas de minúsculas)',
  },
  startsWithCaseSensitiveDescription: {
    'en-us': 'Search for values that begin with a given query string.',
    'ru-ru': 'Поиск значений, начинающихся с заданной строки запроса.',
    'es-es':
      'Busque valores que comiencen con una cadena de consulta determinada.',
    'fr-fr':
      'Recherchez les valeurs qui commencent par une chaîne de requête donnée.',
    'uk-ua': 'Пошук значень, які починаються з заданого рядка запиту.',
    'de-ch':
      'Suchen Sie nach Werten, die mit einer bestimmten Abfragezeichenfolge beginnen.',
    'pt-br':
      'Pesquise valores que começam com uma determinada sequência de consulta.',
  },
  containsInsensitive: {
    'en-us': 'Contains (case-insensitive)',
    'ru-ru': 'Содержит (без учета регистра)',
    'es-es': 'Contiene (sin distinguir entre mayúsculas y minúsculas)',
    'fr-fr': 'Contient (insensible à la casse)',
    'uk-ua': 'Містить (незалежно від регістру)',
    'de-ch': 'Enthält (Groß-/Kleinschreibung wird nicht beachtet)',
    'pt-br': 'Contém (sem distinção entre maiúsculas e minúsculas)',
  },
  containsCaseSensitive: {
    'en-us': 'Contains (case-sensitive)',
    'ru-ru': 'Содержит (с учетом регистра)',
    'es-es': 'Contiene (sensible a mayúsculas y minúsculas)',
    'fr-fr': 'Contient (sensible à la casse)',
    'uk-ua': 'Містить (з урахуванням регістру)',
    'de-ch': 'Enthält (Groß-/Kleinschreibung beachten)',
    'pt-br': 'Contém (diferencia maiúsculas de minúsculas)',
  },
  containsDescription: {
    'en-us':
      'Search for values that contain a given query string (case-insensitive).',
    'ru-ru':
      'Поиск значений, содержащих заданную строку запроса (без учета регистра).',
    'es-es':
      'Busque valores que contengan una cadena de consulta determinada (sin distinguir entre mayúsculas y minúsculas).',
    'uk-ua':
      'Пошук значень, які містять заданий рядок запиту (незалежно від регістру).',
    'de-ch':
      'Suchen Sie nach Werten, die eine bestimmte Abfragezeichenfolge enthalten (ohne Berücksichtigung der Groß-/Kleinschreibung).',
    'fr-fr':
      'Recherchez les valeurs contenant une chaîne de requête donnée (insensible à la casse).',
    'pt-br':
      'Pesquisar valores que contenham uma determinada sequência de consulta (sem distinção de maiúsculas e minúsculas).',
  },
  containsCaseSensitiveDescription: {
    'en-us':
      'Search for values that contain a given query string (case-sensitive).',
    'ru-ru':
      'Поиск значений, содержащих заданную строку запроса (с учетом регистра).',
    'es-es':
      'Busque valores que contengan una cadena de consulta determinada (distingue entre mayúsculas y minúsculas).',
    'fr-fr':
      'Recherchez les valeurs contenant une chaîne de requête donnée (sensible à la casse).',
    'uk-ua':
      'Пошук значень, які містять заданий рядок запиту (з урахуванням регістру).',
    'de-ch':
      'Suchen Sie nach Werten, die eine bestimmte Abfragezeichenfolge enthalten (Groß-/Kleinschreibung beachten).',
    'pt-br':
      'Pesquisar valores que contenham uma determinada sequência de consulta (diferencia maiúsculas de minúsculas).',
  },
  containsSecondDescription: {
    'en-us':
      'Can use _ to match any single character or % to match any number of characters.',
    'ru-ru':
      'Можно использовать _ для соответствия любому отдельному символу или % для соответствия любому количеству символов.',
    'es-es':
      'Puede utilizar _ para que coincida con cualquier carácter individual o % para que coincida con cualquier número de caracteres.',
    'fr-fr':
      "Peut utiliser _ pour correspondre à n'importe quel caractère ou % pour correspondre à n'importe quel nombre de caractères.",
    'uk-ua':
      'Можна використовувати _ для відповідності будь-якому одному символу або % для відповідності будь-якій кількості символів.',
    'de-ch':
      'Sie können _ verwenden, um ein beliebiges einzelnes Zeichen abzugleichen, oder %, um eine beliebige Anzahl von Zeichen abzugleichen.',
    'pt-br':
      'Pode usar _ para corresponder a qualquer caractere único ou % para corresponder a qualquer número de caracteres.',
  },
  highlightMatch: {
    'en-us': 'Highlight matched substring',
    'ru-ru': 'Выделить совпавшую подстроку',
    'es-es': 'Resaltar la subcadena coincidente',
    'fr-fr': 'Mettre en surbrillance la sous-chaîne correspondante',
    'uk-ua': 'Виділіть збіг підрядка',
    'de-ch': 'Markieren Sie übereinstimmende Teilzeichenfolgen',
    'pt-br': 'Destacar substring correspondente',
  },
  languageDescription: {
    'en-us': 'Determines field captions, usage notes and table captions.',
    'ru-ru':
      'Определяет заголовки полей, примечания по использованию и заголовки таблиц.',
    'es-es': 'Determina títulos de campos, notas de uso y títulos de tablas.',
    'fr-fr':
      "Détermine les légendes des champs, les notes d'utilisation et les légendes des tableaux.",
    'uk-ua':
      'Визначає підписи полів, примітки щодо використання та підписи таблиць.',
    'de-ch':
      'Legt Feldbeschriftungen, Verwendungshinweise und Tabellenbeschriftungen fest.',
    'pt-br': 'Determina legendas de campo, notas de uso e legendas de tabela.',
  },
  behavior: {
    'en-us': 'Behavior',
    'ru-ru': 'Поведение',
    'es-es': 'Comportamiento',
    'fr-fr': 'Comportement',
    'uk-ua': 'Поведінка',
    'de-ch': 'Verhalten',
    'pt-br': 'Comportamento',
  },
  noRestrictionsMode: {
    'en-us': 'No restrictions mode',
    'ru-ru': 'Режим без ограничений',
    'es-es': 'Modo sin restricciones',
    'fr-fr': 'Mode sans restriction',
    'uk-ua': 'Режим без обмежень',
    'de-ch': 'Modus „Keine Einschränkungen“',
    'pt-br': 'Modo sem restrições',
  },
  noRestrictionsModeWbDescription: {
    'en-us': 'Allows uploading data to any field in any table.',
    'ru-ru': 'Позволяет загружать данные в любое поле любой таблицы.',
    'es-es': 'Permite cargar datos a cualquier campo de cualquier tabla.',
    'fr-fr':
      "Permet de télécharger des données dans n'importe quel champ de n'importe quelle table.",
    'uk-ua': 'Дозволяє завантажувати дані в будь-яке поле будь-якої таблиці.',
    'de-ch':
      'Ermöglicht das Hochladen von Daten in jedes Feld einer beliebigen Tabelle.',
    'pt-br': 'Permite carregar dados em qualquer campo de qualquer tabela.',
  },
  noRestrictionsModeQueryDescription: {
    'en-us': 'Allows querying data from any field in any table.',
    'ru-ru': 'Позволяет запрашивать данные из любого поля любой таблицы.',
    'es-es': 'Permite consultar datos de cualquier campo de cualquier tabla.',
    'fr-fr':
      "Permet d'interroger les données de n'importe quel champ de n'importe quelle table.",
    'uk-ua': 'Дозволяє запитувати дані з будь-якого поля будь-якої таблиці.',
    'de-ch':
      'Ermöglicht das Abfragen von Daten aus jedem Feld in jeder Tabelle.',
    'pt-br': 'Permite consultar dados de qualquer campo em qualquer tabela.',
  },
  noRestrictionsModeWarning: {
    'en-us':
      'WARNING: enabling this may lead to data loss or database corruption. Please make sure you know what you are doing.',
    'ru-ru':
      'ВНИМАНИЕ: включение этой функции может привести к потере данных или повреждению базы данных. Убедитесь, что вы понимаете, что делаете.',
    'es-es':
      'ADVERTENCIA: Habilitar esta opción podría provocar la pérdida de datos o la corrupción de la base de datos. Asegúrese de saber lo que está haciendo.',
    'uk-ua':
      'ПОПЕРЕДЖЕННЯ: увімкнення цієї функції може призвести до втрати даних або пошкодження бази даних. Переконайтеся, що ви знаєте, що робите.',
    'de-ch':
      'WARNUNG: Das Aktivieren dieser Option kann zu Datenverlust oder Datenbankbeschädigung führen. Bitte stellen Sie sicher, dass Sie wissen, was Sie tun.',
    'fr-fr':
      "AVERTISSEMENT : l'activation de cette option peut entraîner une perte de données ou une corruption de la base de données. Veuillez vous assurer que vous savez ce que vous faites.",
    'pt-br':
      'AVISO: habilitar esta opção pode levar à perda de dados ou à corrupção do banco de dados. Certifique-se de saber o que está fazendo.',
  },
  adminsOnlyPreference: {
    'en-us': "You don't have permission to change this option",
    'ru-ru': 'У вас нет разрешения на изменение этой опции.',
    'es-es': 'No tienes permiso para cambiar esta opción',
    'fr-fr': "Vous n'êtes pas autorisé à modifier cette option",
    'uk-ua': 'Ви не маєте дозволу змінювати цей параметр',
    'de-ch': 'Sie haben keine Berechtigung, diese Option zu ändern',
    'pt-br': 'Você não tem permissão para alterar esta opção',
  },
  stickyScrolling: {
    'en-us': 'Sticky scroll bar',
    'ru-ru': 'Липкая полоса прокрутки',
    'es-es': 'Barra de desplazamiento fija',
    'fr-fr': 'Barre de défilement collante',
    'uk-ua': 'Липка смуга прокрутки',
    'de-ch': 'Klebrige Bildlaufleiste',
    'pt-br': 'Barra de rolagem fixa',
  },
  spreadsheet: {
    'en-us': 'Spreadsheet',
    'ru-ru': 'Электронная таблица',
    'es-es': 'Hoja de cálculo',
    'fr-fr': 'Tableur',
    'uk-ua': 'Електронна таблиця',
    'de-ch': 'Kalkulationstabelle',
    'pt-br': 'Planilha',
  },
  minSpareRows: {
    'en-us': 'Number of blank rows at the end',
    'ru-ru': 'Количество пустых строк в конце',
    'es-es': 'Número de filas en blanco al final',
    'fr-fr': 'Nombre de lignes vides à la fin',
    'uk-ua': 'Кількість порожніх рядків у кінці',
    'de-ch': 'Anzahl der leeren Zeilen am Ende',
    'pt-br': 'Número de linhas em branco no final',
  },
  autoWrapCols: {
    'en-us': 'Navigate to the other side when reaching the edge column',
    'ru-ru': 'Достигнув крайней колонны, перейдите на другую сторону.',
    'es-es': 'Navegue hacia el otro lado al llegar a la columna del borde.',
    'fr-fr':
      'Naviguez de l’autre côté lorsque vous atteignez la colonne de bord',
    'uk-ua': 'Перейдіть на іншу сторону, коли досягнете краю колонки',
    'de-ch':
      'Navigieren Sie zur anderen Seite, wenn Sie die Randspalte erreichen',
    'pt-br': 'Navegue para o outro lado ao atingir a coluna da borda',
  },
  autoWrapRows: {
    'en-us': 'Navigate to the other side when reaching the edge row',
    'ru-ru': 'Достигнув крайнего ряда, перейдите на другую сторону.',
    'es-es': 'Navegue hacia el otro lado al llegar a la fila del borde.',
    'fr-fr':
      'Naviguez de l’autre côté lorsque vous atteignez la rangée de bord',
    'uk-ua': 'Перейдіть на іншу сторону, коли досягнете крайнього ряду',
    'de-ch':
      'Navigieren Sie zur anderen Seite, wenn Sie die Randreihe erreichen',
    'pt-br': 'Navegue para o outro lado ao atingir a fileira de bordas',
  },
  enterBeginsEditing: {
    'en-us': 'Enter key begins editing cell',
    'ru-ru': 'Клавиша Enter начинает редактирование ячейки.',
    'es-es': 'La tecla Enter inicia la edición de la celda',
    'fr-fr': 'La touche Entrée commence à modifier la cellule',
    'uk-ua': 'Клавіша Enter починає редагування клітинки',
    'de-ch': 'Mit der Eingabetaste beginnt die Bearbeitung der Zelle',
    'pt-br': 'A tecla Enter inicia a edição da célula',
  },
  tabMoveDirection: {
    'en-us': 'Direction of movement when <key>Tab</key> key is pressed',
    'ru-ru': 'Направление движения при нажатии клавиши <key>Tab</key>',
    'es-es':
      'Dirección de movimiento cuando se presiona la tecla <key>Tab</key>',
    'fr-fr':
      'Sens de déplacement lorsque la touche <key>Tabulation</key> est enfoncée',
    'uk-ua': 'Напрямок руху при натисканні клавіші <key>Tab</key>',
    'de-ch': 'Bewegungsrichtung beim Drücken der <key>Tab</key>-Taste',
    'pt-br': 'Direção do movimento quando a tecla <key>Tab</key> é pressionada',
  },
  tabMoveDirectionDescription: {
    'en-us':
      'You can move in the opposite direction by pressing <key>Shift</key>+<key>Tab</key>.',
    'ru-ru':
      'Вы можете двигаться в обратном направлении, нажав <key>Shift</key>+<key>Tab</key>.',
    'es-es':
      'Puedes moverte en la dirección opuesta presionando <key>Shift</key>+<key>Tab</key>.',
    'fr-fr':
      'Vous pouvez vous déplacer dans la direction opposée en appuyant sur <key>Shift</key>+<key>Tab</key>.',
    'uk-ua':
      'Ви можете рухатися в протилежному напрямку, натискаючи <key>Shift</key>+<key>Tab</key>.',
    'de-ch':
      'Sie können sich in die entgegengesetzte Richtung bewegen, indem Sie <key>Umschalt</key>+<key>Tab</key> drücken.',
    'pt-br':
      'Você pode mover na direção oposta pressionando <key>Shift</key>+<key>Tab</key>.',
  },
  column: {
    'en-us': 'Column',
    'ru-ru': 'Столбец',
    'es-es': 'Columna',
    'fr-fr': 'Colonne',
    'uk-ua': 'Колонка',
    'de-ch': 'Spalte',
    'pt-br': 'Coluna',
  },
  row: {
    'en-us': 'Row',
    'ru-ru': 'Ряд',
    'es-es': 'Fila',
    'fr-fr': 'Rangée',
    'uk-ua': 'рядок',
    'de-ch': 'Reihe',
    'pt-br': 'Linha',
  },
  enterMoveDirection: {
    'en-us': 'Direction of movement when <key>Enter</key> key is pressed',
    'ru-ru': 'Направление движения при нажатии клавиши <key>Enter</key>',
    'es-es':
      'Dirección de movimiento cuando se presiona la tecla <key>Enter</key>',
    'uk-ua': 'Напрямок руху, коли натиснуто клавішу <key>Enter</key>',
    'de-ch': 'Bewegungsrichtung beim Drücken der Taste <key>Enter</key>',
    'fr-fr':
      'Direction du mouvement lorsque la touche <key>Entrer</key> est enfoncée',
    'pt-br':
      'Direção do movimento quando a tecla <key>Enter</key> é pressionada',
  },
  enterMoveDirectionDescription: {
    'en-us':
      'You can move in the opposite direction by pressing <key>Shift</key>+<key>Enter</key>.',
    'ru-ru':
      'Вы можете двигаться в противоположном направлении, нажав <key>Shift</key>+<key>Enter</key>.',
    'es-es':
      'Puedes moverte en la dirección opuesta presionando <key>Shift</key>+<key>Enter</key>.',
    'fr-fr': 'Synonyme couleur.',
    'uk-ua':
      'Ви можете рухатися у протилежному напрямку, натискаючи <key>Shift</key>+<key>Enter</key>.',
    'de-ch':
      'Sie können sich in die entgegengesetzte Richtung bewegen, indem Sie <key>Umschalt</key>+<key>Eingabe</key> drücken.',
    'pt-br':
      'Você pode mover na direção oposta pressionando <key>Shift</key>+<key>Enter</key>.',
  },
  filterPickLists: {
    'en-us': 'Filter pick list items',
    'ru-ru': 'Фильтрация элементов списка выбора',
    'es-es': 'Filtrar elementos de la lista de selección',
    'fr-fr': 'Filtrer les éléments de la liste de sélection',
    'uk-ua': 'Фільтр вибору елементів списку',
    'de-ch': 'Auswahllistenelemente filtern',
    'pt-br': 'Filtrar itens da lista de seleção',
  },
  exportFileDelimiter: {
    'en-us': 'Export file delimiter',
    'ru-ru': 'Разделитель файлов экспорта',
    'es-es': 'Delimitador de archivo de exportación',
    'fr-fr': "Délimiteur de fichier d'exportation",
    'uk-ua': 'Роздільник файлу експорту',
    'de-ch': 'Dateitrennzeichen exportieren',
    'pt-br': 'Delimitador de arquivo de exportação',
  },
  exportCsvUtf8Bom: {
    'en-us': 'Add UTF-8 BOM to CSV file exports',
    'ru-ru': 'Добавить UTF-8 BOM в экспорт CSV-файла',
    'es-es': 'Agregar BOM UTF-8 a las exportaciones de archivos CSV',
    'fr-fr': 'Ajouter UTF-8 BOM aux exportations de fichiers CSV',
    'uk-ua': 'Додайте специфікацію UTF-8 до експорту файлу CSVу',
    'de-ch': 'UTF-8 BOM zum CSV-Dateiexport hinzufügen',
    'pt-br': 'Adicionar UTF-8 BOM às exportações de arquivos CSV',
  },
  exportCsvUtf8BomDescription: {
    'en-us':
      'Adds a BOM (Byte Order Mark) to exported CSV files to ensure that the file is correctly recognized and displayed by various programs (Excel, OpenRefine, etc.), preventing issues with special characters and formatting.',
    'ru-ru': 'Корректное отображение экспортированных CSV-файлов в Excel.',
    'es-es':
      'Agrega una BOM (marca de orden de bytes) a los archivos CSV exportados para garantizar que el archivo sea reconocido y mostrado correctamente por varios programas (Excel, OpenRefine, etc.), evitando problemas con caracteres especiales y formato.',
    'fr-fr':
      "Permet aux exportations de fichiers CSV de s'afficher correctement dans Excel.",
    'uk-ua': 'Змушує експорт файлів CSV правильно відображатися в Excel.',
    'de-ch':
      'Sorgt dafür, dass CSV-Dateiexporte in Excel korrekt angezeigt werden.',
    'pt-br':
      'Adiciona uma BOM (Byte Order Mark) aos arquivos CSV exportados para garantir que o arquivo seja reconhecido e exibido corretamente por vários programas (Excel, OpenRefine, etc.), evitando problemas com caracteres especiais e formatação.',
  },
  caseSensitive: {
    'en-us': 'Case-sensitive',
    'ru-ru': 'С учетом регистра',
    'es-es': 'Distingue mayúsculas y minúsculas',
    'fr-fr': 'Sensible aux majuscules et minuscules',
    'uk-ua': 'Чутливий до регістру',
    'de-ch': 'Groß- und Kleinschreibung beachten',
    'pt-br': 'Maiúsculas e minúsculas',
  },
  caseInsensitive: {
    'en-us': 'Case-insensitive',
    'ru-ru': 'Без учета регистра',
    'es-es': 'No distingue entre mayúsculas y minúsculas',
    'fr-fr': 'Insensible à la casse',
    'uk-ua': 'Регістр не враховується',
    'de-ch': 'Groß- und Kleinschreibung wird nicht berücksichtigt',
    'pt-br': 'Não diferencia maiúsculas de minúsculas',
  },
  showNoReadTables: {
    'en-us': 'Show tables without "Read" access',
    'ru-ru': 'Показывать таблицы без доступа «Чтение»',
    'es-es': 'Mostrar tablas sin acceso de "Lectura"',
    'fr-fr': 'Afficher les tableaux sans accès "Lecture"',
    'uk-ua': 'Показувати таблиці без доступу «Читання»',
    'de-ch': 'Tabellen ohne Lesezugriff anzeigen',
    'pt-br': 'Mostrar tabelas sem acesso de "Leitura"',
  },
  showNoAccessTables: {
    'en-us': 'Show tables without "Create" access',
    'ru-ru': 'Показывать таблицы без права «Создать»',
    'es-es': 'Mostrar tablas sin acceso "Crear"',
    'fr-fr': 'Afficher les tableaux sans accès "Créer"',
    'uk-ua': 'Показувати таблиці без доступу «Створити»',
    'de-ch': 'Tabellen ohne „Erstellen“-Zugriff anzeigen',
    'pt-br': 'Mostrar tabelas sem acesso "Criar"',
  },
  textAreaAutoGrow: {
    'en-us': 'Text boxes grow automatically',
    'ru-ru': 'Текстовые поля увеличиваются автоматически',
    'es-es': 'Los cuadros de texto crecen automáticamente',
    'fr-fr': "Les zones de texte s'agrandissent automatiquement",
    'uk-ua': 'Текстові поля збільшуються автоматично',
    'de-ch': 'Textfelder werden automatisch vergrößert',
    'pt-br': 'As caixas de texto crescem automaticamente',
  },
  clearQueryFilters: {
    'en-us': 'Reset query filters',
    'ru-ru': 'Сбросить фильтры запроса',
    'es-es': 'Restablecer filtros de consulta',
    'fr-fr': 'Réinitialiser les filtres de requête',
    'uk-ua': 'Скинути фільтри запитів',
    'de-ch': 'Abfragefilter zurücksetzen',
    'pt-br': 'Redefinir filtros de consulta',
  },
  clearQueryFiltersDescription: {
    'en-us': 'Clears all query filters when running a Report from a Form.',
    'de-ch':
      'Löscht alle Abfragefilter, wenn ein Bericht aus einem Formular ausgeführt wird.',
    'es-es':
      'Borra todos los filtros de consulta al ejecutar un informe desde un formulario.',
    'fr-fr':
      "Efface tous les filtres de requête lors de l'exécution d'un rapport à partir d'un formulaire.",
    'ru-ru': 'Очищает все фильтры запроса при запуске отчета из формы.',
    'uk-ua': 'Очищає всі фільтри запитів під час запуску звіту з форми.',
    'pt-br':
      'Limpa todos os filtros de consulta ao executar um relatório de um formulário.',
  },
  queryParamtersFromForm: {
    'en-us': 'Show query filters when running a Report from a Form',
    'de-ch':
      'Abfragefilter anzeigen, wenn ein Bericht aus einem Formular ausgeführt wird',
    'es-es':
      'Mostrar filtros de consulta al ejecutar un informe desde un formulario',
    'fr-fr':
      "Afficher les filtres de requête lors de l'exécution d'un rapport à partir d'un formulaire",
    'ru-ru': 'Показывать фильтры запроса при запуске отчета из формы',
    'uk-ua': 'Показувати фільтри запитів під час запуску звіту з форми',
    'pt-br':
      'Mostrar filtros de consulta ao executar um relatório de um formulário',
  },
  autoGrowAutoComplete: {
    'en-us': 'Allow autocomplete to grow as wide as need',
    'ru-ru':
      'Разрешить автозаполнению расширяться настолько, насколько это необходимо',
    'es-es': 'Permitir que el autocompletado crezca tanto como sea necesario',
    'fr-fr':
      'Sens de déplacement lorsque la touche [X27X]Tabulation[X35X] est enfoncée',
    'uk-ua':
      'Дозволити автозаповнення розширюватися настільки, наскільки потрібно',
    'de-ch':
      'Erlauben Sie der Autovervollständigung, so weit wie nötig zu wachsen',
    'pt-br':
      'Permitir que o preenchimento automático cresça o quanto for necessário',
  },
  tableNameInTitle: {
    'en-us': 'Include table name in the browser page title',
    'ru-ru': 'Включить имя таблицы в заголовок страницы браузера',
    'es-es':
      'Incluir el nombre de la tabla en el título de la página del navegador',
    'fr-fr':
      'Inclure le nom de la table dans le titre de la page du navigateur',
    'uk-ua': 'Включіть назву таблиці в заголовок сторінки браузера',
    'de-ch': 'Tabellennamen in den Seitentitel des Browsers aufnehmen',
    'pt-br': 'Incluir nome da tabela no título da página do navegador',
  },
  focusFirstField: {
    'en-us': 'Focus first field',
    'de-ch': 'Fokus erstes Feld',
    'es-es': 'Enfoque el primer campo',
    'fr-fr': 'Concentrez-vous sur le premier champ',
    'ru-ru': 'Фокус первого поля',
    'uk-ua': 'Перейти до першого поля',
    'pt-br': 'Foco primeiro campo',
  },
  doubleClickZoom: {
    'en-us': 'Double click to zoom',
    'ru-ru': 'Дважды щелкните, чтобы увеличить',
    'es-es': 'Haga doble clic para ampliar',
    'fr-fr': 'Double-cliquez pour zoomer',
    'uk-ua': 'Двічі клацніть, щоб збільшити',
    'de-ch': 'Zum Vergrößern doppelklicken',
    'pt-br': 'Clique duas vezes para ampliar',
  },
  closePopupOnClick: {
    'en-us': 'Close pop-up on outside click',
    'ru-ru': 'Закрытие всплывающего окна при внешнем щелчке',
    'es-es': 'Cerrar ventana emergente al hacer clic desde fuera',
    'fr-fr': "Fermer la pop-up lors d'un clic extérieur",
    'uk-ua': 'Закрити спливаюче вікно при зовнішньому клацанні',
    'de-ch': 'Popup bei externem Klick schließen',
    'pt-br': 'Fechar pop-up ao clicar fora',
  },
  animateTransitions: {
    'en-us': 'Animate transitions',
    'ru-ru': 'Анимированные переходы',
    'es-es': 'Animar transiciones',
    'fr-fr': 'Animer les transitions',
    'uk-ua': 'Анімація переходів',
    'de-ch': 'Übergänge animieren',
    'pt-br': 'Transições animadas',
  },
  panInertia: {
    'en-us': 'Pan inertia',
    'ru-ru': 'Инерция пан',
    'es-es': 'Inercia de la sartén',
    'fr-fr': 'Inertie du bac',
    'uk-ua': 'Інерція панорами',
    'de-ch': 'Schwenkträgheit',
    'pt-br': 'Inércia da panela',
  },
  mouseDrags: {
    'en-us': 'Mouse drags',
    'ru-ru': 'Перетаскивание мышью',
    'es-es': 'El ratón arrastra',
    'uk-ua': 'Виділіть відповідний підрядок',
    'de-ch': 'Maus zieht',
    'fr-fr': 'Mettre en surbrillance la sous-chaîne correspondante',
    'pt-br': 'Arrastos do mouse',
  },
  scrollWheelZoom: {
    'en-us': 'Scroll wheel zoom',
    'ru-ru': 'Масштабирование с помощью колеса прокрутки',
    'es-es': 'Zoom con rueda de desplazamiento',
    'fr-fr': 'Zoom avec la molette de défilement',
    'uk-ua': 'Масштаб колеса прокрутки',
    'de-ch': 'Scrollrad-Zoom',
    'pt-br': 'Zoom da roda de rolagem',
  },
  flexibleColumnWidth: {
    'en-us': 'Flexible column width',
    'ru-ru': 'Гибкая ширина столбца',
    'es-es': 'Ancho de columna flexible',
    'fr-fr': 'Largeur de colonne flexible',
    'uk-ua': 'Гнучка ширина колонки',
    'de-ch': 'Flexible Spaltenbreite',
    'pt-br': 'Largura de coluna flexível',
  },
  flexibleSubGridColumnWidth: {
    'en-us': 'Flexible subview grid column width',
    'ru-ru': 'Гибкая ширина столбца сетки подпредставлений',
    'es-es': 'Ancho de columna de cuadrícula de subvista flexible',
    'fr-fr': 'Largeur de colonne de grille de sous-vue flexible',
    'uk-ua': 'Гнучка ширина стовпця сітки вкладеного перегляду',
    'de-ch': 'Flexible Rasterspaltenbreite der Unteransicht',
    'pt-br': 'Largura flexível da coluna da grade de subvisualização',
  },
  closeOnEsc: {
    'en-us': 'Close on <key>ESC</key> key press',
    'ru-ru': 'Закрыть нажатием клавиши <key>ESC</key>',
    'es-es': 'Cerrar al presionar la tecla <key>ESC</key>',
    'fr-fr': 'Icône et nom de la table',
    'uk-ua': 'Закриття натисканням клавіші <key>ESC</key>',
    'de-ch': 'Schließen durch Drücken der Taste <key>ESC</key>',
    'pt-br': 'Fechar ao pressionar a tecla <key>ESC</key>',
  },
  closeOnOutsideClick: {
    'en-us': 'Close on outside click',
    'ru-ru': 'Закрытие по внешнему щелчку',
    'es-es': 'Cerrar al hacer clic desde fuera',
    'fr-fr': 'Fermer sur clic extérieur',
    'uk-ua': 'Закрийте зовнішнім клацанням',
    'de-ch': 'Schließen durch Klicken von außen',
    'pt-br': 'Fechar com clique externo',
  },
  scopeEntireTablePicklists: {
    'en-us': 'Scope "Entire Table" picklists',
  },
  scopeEntireTablePicklistsDescription: {
    'en-us':
      'Restrict "Entire Table" picklists to values used by records in this collection.',
  },
  catalogNumberInheritanceDescription: {
    'en-us':
      'Configure whether sibling Collection Objects and their child Collection Objects inherit catalog numbers from the primary or parent record.',
  },
  catalogNumberParentInheritanceDescription: {
    'en-us':
      'Control whether component records inherit catalog numbers from their parent Collection Object.',
  },
  useAccessibleFullDatePicker: {
    'en-us': 'Use accessible full date picker',
    'ru-ru': 'Используйте доступный полный выбор даты',
    'es-es': 'Utilice el selector de fecha completo y accesible',
    'fr-fr': 'Utiliser un sélecteur de date complet accessible',
    'uk-ua': 'Використовуйте доступний повний засіб вибору дати',
    'de-ch': 'Verwenden Sie eine barrierefreie Datumsauswahl',
    'pt-br': 'Use o seletor de data completo acessível',
  },
  useAccessibleMonthPicker: {
    'en-us': 'Use accessible month picker',
    'ru-ru': 'Используйте доступный выбор месяца',
    'es-es': 'Utilice el selector de meses accesible',
    'fr-fr': 'Utiliser le sélecteur de mois accessible',
    'uk-ua': 'Використовуйте доступний засіб вибору місяця',
    'de-ch': 'Verwenden Sie die barrierefreie Monatsauswahl',
    'pt-br': 'Use o seletor de meses acessível',
  },
  collectionSortOrderDescription: {
    'en-us': 'This determines the visual order of collections.',
    'ru-ru': 'Это определяет визуальный порядок коллекций.',
    'es-es': 'Esto determina el orden visual de las colecciones.',
    'fr-fr': "Ceci détermine l'ordre visuel des collections.",
    'uk-ua': 'Це визначає візуальний порядок колекцій.',
    'de-ch': 'Dies bestimmt die visuelle Reihenfolge der Sammlungen.',
    'pt-br': 'Isso determina a ordem visual das coleções.',
  },
  recordSetRecordToOpen: {
    'en-us': 'Record to open by default',
    'ru-ru': 'Запись для открытия по умолчанию',
    'es-es': 'Registro para abrir por defecto',
    'fr-fr': 'Enregistrement à ouvrir par défaut',
    'uk-ua': 'Запис відкривається за умовчанням',
    'de-ch': 'Standardmäßig zu öffnender Datensatz',
    'pt-br': 'Gravar para abrir por padrão',
  },
altClickToSupressNewTab: {
    'en-us':
      '<key>{altKeyName:string}</key>+<key>Click</key> to suppress new tab',
    'ru-ru':
      '<key>{altKeyName:string}</key>+<key>Нажмите </key>, чтобы скрыть новую вкладку',
    'es-es':
      '<key>{altKeyName:string}</key>+<key>Haga clic en </key> para suprimir la nueva pestaña',
    'fr-fr':
      '<key>{altKeyName:string}</key>+<key>Cliquez sur</key> pour supprimer le nouvel onglet',
    'uk-ua':
      '<key>{altKeyName:string}</key>+<key>Натисніть </key>, щоб закрити нову вкладку',
    'de-ch':
      '<key>{altKeyName:string}</key>+<key>Klicken Sie auf</key>, um neue Registerkarten zu unterdrücken',
    'pt-br':
      '<key>{altKeyName:string}</key>+<key>Clique em</key> para suprimir a nova guia',
  },
  altClickToSupressNewTabDescription: {
    'en-us':
      '<key>{altKeyName:string}</key>+<key>Click</key> a link that usually opens in a new tab to open it in the current tab.',
    'ru-ru':
      '<key>{altKeyName:string}</key>+<key>Нажмите</key> на ссылку, которая обычно открывается в новой вкладке, чтобы открыть ее в текущей вкладке.',
    'es-es':
      '<key>{altKeyName:string}</key>+<key>Haga clic</key> en un enlace que normalmente se abre en una nueva pestaña para abrirlo en la pestaña actual.',
    'fr-fr': 'Utiliser le sélecteur de mois accessible.',
    'uk-ua':
      '<key>{altKeyName:string}</key>+<key>Натисніть</key> посилання, яке зазвичай відкривається в новій вкладці, щоб відкрити його в поточній вкладці.',
    'de-ch':
      '<key>{altKeyName:string}</key>+<key>Klicken Sie auf</key> einen Link, der normalerweise in einem neuen Tab geöffnet wird, um ihn im aktuellen Tab zu öffnen.',
    'pt-br':
      '<key>{altKeyName:string}</key>+<key>Clique</key> em um link que geralmente abre em uma nova aba para abri-lo na aba atual.',
  },
  makeFormDialogsModal: {
    'en-us': 'Make form dialogs gray out the background',
    'ru-ru': 'Сделать фон диалоговых окон серым',
    'es-es':
      'Hacer que los cuadros de diálogo del formulario tengan el fondo en gris',
    'fr-fr':
      "Rendre les boîtes de dialogue de formulaire grisées sur l'arrière-plan",
    'uk-ua': 'Зробіть діалогові вікна форми сірими фоном',
    'de-ch': 'Den Hintergrund von Formulardialogen ausgrauen',
    'pt-br':
      'Faça com que as caixas de diálogo do formulário fiquem com o fundo acinzentado',
  },
  autoScrollTree: {
    'en-us': 'Auto scroll tree to focused node',
    'ru-ru': 'Автоматическая прокрутка дерева к выбранному узлу',
    'es-es': 'Desplazamiento automático del árbol al nodo enfocado',
    'fr-fr': 'Arbre de défilement automatique vers le nœud ciblé',
    'uk-ua': 'Автоматичне прокручування дерева до виділеного вузла',
    'de-ch': 'Automatisches Scrollen des Baums zum fokussierten Knoten',
    'pt-br': 'Rolagem automática da árvore para o nó em foco',
  },
  sortByField: {
    'en-us': 'Order By Field',
    'de-ch': 'Nach Feld sortieren',
    'es-es': 'Ordenar por campo',
    'fr-fr': 'Trier par champ',
    'pt-br': 'Ordenar por campo',
    'ru-ru': 'Сортировать по полю',
    'uk-ua': 'Сортувати за полем',
  },
  createInteractions: {
    'en-us': 'Creating an interaction',
    'ru-ru': 'Создание взаимодействия',
    'es-es': 'Creando una interacción',
    'fr-fr': 'Créer une interaction',
    'uk-ua': 'Створення взаємодії',
    'de-ch': 'Erstellen einer Interaktion',
    'pt-br': 'Criando uma interação',
  },
  useSpaceAsDelimiter: {
    'en-us': 'Use space as delimiter',
    'ru-ru': 'Используйте пробел в качестве разделителя',
    'es-es': 'Utilice el espacio como delimitador',
    'fr-fr': "Utiliser l'espace comme délimiteur",
    'uk-ua': 'Використовуйте пробіл як роздільник',
    'de-ch': 'Leerzeichen als Trennzeichen verwenden',
    'pt-br': 'Use espaço como delimitador',
  },
  useCommaAsDelimiter: {
    'en-us': 'Use comma as delimiter',
    'ru-ru': 'Используйте запятую в качестве разделителя',
    'es-es': 'Utilice la coma como delimitador',
    'fr-fr': 'Utiliser la virgule comme délimiteur',
    'uk-ua': 'Використовуйте кому як роздільник',
    'de-ch': 'Verwenden Sie Kommas als Trennzeichen',
    'pt-br': 'Use vírgula como delimitador',
  },
  useNewLineAsDelimiter: {
    'en-us': 'Use new line as delimiter',
    'ru-ru': 'Использовать новую строку в качестве разделителя',
    'es-es': 'Utilice nueva línea como delimitador',
    'fr-fr': 'Utiliser une nouvelle ligne comme délimiteur',
    'uk-ua': 'Використовуйте новий рядок як роздільник',
    'de-ch': 'Neue Zeile als Trennzeichen verwenden',
    'pt-br': 'Use nova linha como delimitador',
  },
  useCustomDelimiters: {
    'en-us': 'Use custom delimiters',
    'ru-ru': 'Используйте пользовательские разделители',
    'es-es': 'Utilice delimitadores personalizados',
    'fr-fr': 'Utiliser des délimiteurs personnalisés',
    'uk-ua': 'Використовуйте спеціальні роздільники',
    'de-ch': 'Benutzerdefinierte Trennzeichen verwenden',
    'pt-br': 'Use delimitadores personalizados',
  },
  useCustomDelimitersDescription: {
    'en-us':
      'A list of delimiters to use, in addition to the ones defined above. Put one delimiter per line.',
    'ru-ru':
      'Список разделителей, которые можно использовать в дополнение к указанным выше. Используйте по одному разделителю на строку.',
    'es-es':
      'Una lista de delimitadores para usar, además de los definidos anteriormente. Coloque un delimitador por línea.',
    'fr-fr':
      'Une liste de délimiteurs à utiliser, en plus de ceux définis ci-dessus. Mettez un délimiteur par ligne.',
    'uk-ua':
      'Список розділювачів для використання на додаток до визначених вище. Поставте один роздільник на рядок.',
    'de-ch':
      'Eine Liste der zu verwendenden Trennzeichen zusätzlich zu den oben definierten. Geben Sie pro Zeile ein Trennzeichen ein.',
    'pt-br':
      'Uma lista de delimitadores a serem usados, além dos definidos acima. Coloque um delimitador por linha.',
  },
  detectAutomaticallyDescription: {
    'en-us': 'Detect automatically based on catalog number format.',
    'ru-ru': 'Автоматическое определение на основе формата каталожного номера.',
    'es-es':
      'Detectar automáticamente según el formato del número de catálogo.',
    'fr-fr':
      'Détecter automatiquement en fonction du format du numéro de catalogue.',
    'uk-ua': 'Визначати автоматично на основі формату номера каталогу.',
    'de-ch': 'Automatische Erkennung basierend auf dem Katalognummernformat.',
    'pt-br':
      'Detectar automaticamente com base no formato do número de catálogo.',
  },
  use: {
    comment: 'Verb',
    'en-us': 'Use',
    'ru-ru': 'Использовать',
    'es-es': 'Usar',
    'fr-fr': 'Utiliser',
    'uk-ua': 'використання',
    'de-ch': 'Verwenden',
    'pt-br': 'Usar',
  },
  dontUse: {
    'en-us': 'Don’t use',
    'ru-ru': 'Не использовать',
    'es-es': 'No utilizar',
    'fr-fr': 'Zoom avec la molette de défilement',
    'uk-ua': 'Масштаб колеса прокрутки',
    'de-ch': 'Nicht verwenden',
    'pt-br': 'Não use',
  },
  position: {
    'en-us': 'Position',
    'es-es': 'Posición',
    'fr-fr': 'Position',
    'ru-ru': 'Позиция',
    'uk-ua': 'Позиція',
    'de-ch': 'Position',
    'pt-br': 'Posição',
  },
  top: {
    'en-us': 'Top',
    'es-es': 'Arriba',
    'fr-fr': 'Haut',
    'ru-ru': 'Вершина',
    'uk-ua': 'Топ',
    'de-ch': 'Spitze',
    'pt-br': 'Principal',
  },
  bottom: {
    'en-us': 'Bottom',
    'es-es': 'Abajo',
    'ru-ru': 'Нижний',
    'uk-ua': 'Дно',
    'de-ch': 'Unten',
    'fr-fr': 'Bas',
    'pt-br': 'Fundo',
  },
  left: {
    'en-us': 'Left',
    'es-es': 'Izquierda',
    'fr-fr': 'Gauche',
    'ru-ru': 'Левый',
    'uk-ua': 'Ліворуч',
    'de-ch': 'Links',
    'pt-br': 'Esquerda',
  },
  right: {
    'en-us': 'Right',
    'es-es': 'Bien',
    'fr-fr': 'Droite',
    'ru-ru': 'Верно',
    'uk-ua': 'правильно',
    'de-ch': 'Rechts',
    'pt-br': 'Certo',
  },
  showUnsavedIndicator: {
    'en-us': 'Show unsaved changes indicator',
    'ru-ru': 'Показать индикатор несохраненных изменений',
    'es-es': 'Mostrar indicador de cambios no guardados',
    'fr-fr': "Afficher l'indicateur de modifications non enregistrées",
    'uk-ua': 'Показати індикатор незбережених змін',
    'de-ch': 'Indikator für nicht gespeicherte Änderungen anzeigen',
    'pt-br': 'Mostrar indicador de alterações não salvas',
  },
  showUnsavedIndicatorDescription: {
    'en-us':
      'Show an "*" in the tab title when there are unsaved changes in the current tab.',
    'es-es':
      'Mostrar un "*" en el título de la pestaña cuando haya cambios sin guardar en la pestaña actual.',
    'fr-fr':
      "Afficher un \"*\" dans le titre de l'onglet lorsqu'il y a des modifications non enregistrées dans l'onglet actuel.",
    'ru-ru':
      'Отображать «*» в заголовке вкладки, если на текущей вкладке есть несохраненные изменения.',
    'uk-ua':
      'Показувати «*» у заголовку вкладки, якщо в поточній вкладці є незбережені зміни.',
    'de-ch':
      'Zeigen Sie im Registerkartentitel ein „*“ an, wenn in der aktuellen Registerkarte nicht gespeicherte Änderungen vorhanden sind.',
    'pt-br':
      'Exibir um "*" no título da aba quando houver alterações não salvas na aba atual.',
  },
  autoPopulateDescription: {
    'en-us':
      'Auto populate the merged record with values from duplicates when opening the merging dialog.',
    'ru-ru':
      'Автоматически заполнять объединенную запись значениями из дубликатов при открытии диалогового окна слияния.',
    'de-ch':
      'Füllen Sie den zusammengeführten Datensatz beim Öffnen des Zusammenführungsdialogs automatisch mit Werten aus Duplikaten.',
    'es-es':
      'Rellene automáticamente el registro fusionado con valores de duplicados al abrir el cuadro de diálogo de fusión.',
    'fr-fr':
      "Remplir automatiquement l'enregistrement fusionné avec les valeurs des doublons lors de l'ouverture de la boîte de dialogue de fusion.",
    'uk-ua':
      'Автоматичне заповнення об’єднаного запису значеннями з дублікатів під час відкриття діалогового вікна об’єднання.',
    'pt-br':
      'Preencha automaticamente o registro mesclado com valores de duplicatas ao abrir a caixa de diálogo de mesclagem.',
  },
  autoCreateVariants: {
    'en-us': 'Automatically create {agentVariantTable:string} records',
    'ru-ru': 'Автоматически создавать записи {agentVariantTable:string}',
    'de-ch': '{agentVariantTable:string}-Datensätze automatisch erstellen',
    'es-es': 'Crear automáticamente registros {agentVariantTable:string}',
    'fr-fr':
      'Créer automatiquement des enregistrements {agentVariantTable:string}',
    'uk-ua': 'Автоматично створювати записи {agentVariantTable:string}',
    'pt-br': 'Criar automaticamente registros {agentVariantTable:string}',
  },
  autoCreateVariantsDescription: {
    'en-us':
      'When merging agents, automatically create {agentVariantTable:string} records based on the variations of first name/last name.',
    'ru-ru':
      'При объединении агентов автоматически создавать записи {agentVariantTable:string} на основе вариаций имени/фамилии.',
    'de-ch':
      'Beim Zusammenführen von Agenten werden automatisch {agentVariantTable:string}-Datensätze basierend auf den Variationen von Vorname/Nachname erstellt.',
    'es-es':
      'Al fusionar agentes, se crean automáticamente registros {agentVariantTable:string} basados en las variaciones de nombre/apellido.',
    'fr-fr':
      "Lors de la fusion d'agents, créez automatiquement des enregistrements {agentVariantTable:string} en fonction des variations du prénom/nom.",
    'uk-ua':
      'Під час об’єднання агентів автоматично створювати записи {agentVariantTable:string} на основі варіацій імені/прізвища.',
    'pt-br':
      'Ao mesclar agentes, crie automaticamente registros {agentVariantTable:string} com base nas variações de nome/sobrenome.',
  },
  collectionPreferences: {
    'en-us': 'Collection Preferences',
    'de-ch': 'Sammlungseinstellungen',
    'es-es': 'Preferencias de colección',
    'fr-fr': 'Personnalisation',
    'ru-ru': 'Настройки коллекции',
    'uk-ua': 'Налаштування',
    'pt-br': 'Preferências de coleção',
  },
  rememberDialogSizes: {
    'en-us': 'Remember dialog window sizes',
    'ru-ru': 'Запомните размеры диалоговых окон',
    'es-es': 'Recordar los tamaños de las ventanas de diálogo',
    'fr-fr': 'Mémoriser les tailles des fenêtres de dialogue',
    'uk-ua': "Запам'ятайте розміри діалогових вікон",
    'de-ch': 'Dialogfenstergrößen merken',
    'pt-br': 'Lembrar tamanhos de janelas de diálogo',
  },
  rememberDialogPositions: {
    'en-us': 'Remember dialog window positions',
    'ru-ru': 'Запомнить позиции диалоговых окон',
    'es-es': 'Recordar las posiciones de las ventanas de diálogo',
    'fr-fr': 'Mémoriser les positions des fenêtres de dialogue',
    'uk-ua': "Запам'ятовуйте положення діалогового вікна",
    'de-ch': 'Dialogfensterpositionen merken',
    'pt-br': 'Lembrar posições da janela de diálogo',
  },
  autoPlayMedia: {
    'en-us': 'Automatically play media',
    'ru-ru': 'Автоматически воспроизводить медиа',
    'es-es': 'Reproducir automáticamente medios',
    'fr-fr': 'Lire automatiquement les médias',
    'uk-ua': 'Автоматичне відтворення медіа',
    'de-ch': 'Medien automatisch abspielen',
    'pt-br': 'Reproduzir mídia automaticamente',
  },
  useCustomTooltips: {
    'en-us': 'Use modern tooltips',
    'ru-ru': 'Используйте современные подсказки',
    'es-es': 'Utilice información sobre herramientas moderna',
    'fr-fr': 'Utiliser des info-bulles modernes',
    'uk-ua': 'Використовуйте сучасні підказки',
    'de-ch': 'Verwenden Sie moderne Tooltips',
    'pt-br': 'Use dicas de ferramentas modernas',
  },
  alwaysUseQueryBuilder: {
    'en-us': 'Always use query builder search inside of search form',
    'de-ch':
      'Verwenden Sie innerhalb des Suchformulars immer die Abfragegeneratorsuche',
    'es-es':
      'Utilice siempre la búsqueda del generador de consultas dentro del formulario de búsqueda',
    'fr-fr':
      'Utilisez toujours la recherche du générateur de requêtes dans le formulaire de recherche',
    'ru-ru': 'Всегда используйте конструктор запросов внутри формы поиска.',
    'uk-ua': 'Завжди використовуйте пошук конструктора запитів у формі пошуку',
    'pt-br':
      'Sempre use a pesquisa do construtor de consultas dentro do formulário de pesquisa',
  },
  localizeResourceNames: {
    'en-us': 'Localize the names of recognized app resources',
    'de-ch': 'Lokalisieren Sie die Namen erkannter App-Ressourcen',
    'es-es':
      'Localizar los nombres de los recursos de aplicaciones reconocidos',
    'fr-fr': "Localiser les noms des ressources d'application reconnues",
    'ru-ru': 'Локализуйте названия распознанных ресурсов приложения',
    'uk-ua': 'Локалізувати назви розпізнаних ресурсів програми',
    'pt-br': 'Localize os nomes dos recursos de aplicativos reconhecidos',
  },
  splitLongXml: {
    'en-us': 'Split long lines of XML into multiple lines',
    'de-ch': 'Teilen Sie lange XML-Zeilen in mehrere Zeilen auf',
    'es-es': 'Dividir líneas largas de XML en varias líneas',
    'fr-fr': 'Diviser les longues lignes de XML en plusieurs lignes',
    'ru-ru': 'Разделить длинные строки XML на несколько строк',
    'uk-ua': 'Розділіть довгі рядки XML на кілька рядків',
    'pt-br': 'Dividir longas linhas de XML em várias linhas',
  },
  openAsReadOnly: {
    'en-us': 'Open all records in read-only mode',
    'de-ch': 'Alle Datensätze im schreibgeschützten Modus öffnen',
    'es-es': 'Abrir todos los registros en modo de solo lectura',
    'fr-fr': 'Ouvrir tous les enregistrements en mode lecture seule',
    'ru-ru': 'Открыть все записи в режиме только для чтения',
    'uk-ua': 'Відкрити всі записи в режимі лише для читання',
    'pt-br': 'Abra todos os registros no modo somente leitura',
  },
  displayBasicView: {
    'en-us': 'Display basic view',
    'de-ch': 'Basisansicht anzeigen',
    'es-es': 'Mostrar vista básica',
    'fr-fr': 'Afficher la vue de base',
    'ru-ru': 'Отобразить базовый вид',
    'uk-ua': 'Відобразити базовий вигляд',
    'pt-br': 'Exibir visualização básica',
  },
  showComparisonOperatorsForString: {
    'en-us': 'Show comparison operators for text-based fields',
    'de-ch': 'Vergleichsoperatoren für textbasierte Felder anzeigen',
    'es-es': 'Mostrar operadores de comparación para campos basados en texto',
    'fr-fr': 'Afficher les opérateurs de comparaison pour les champs textuels',
    'pt-br': 'Mostrar operadores de comparação para campos baseados em texto',
    'ru-ru': 'Показать операторы сравнения для текстовых полей',
    'uk-ua': 'Показати оператори порівняння для текстових полів',
  },
  showComparisonOperatorsDescription: {
    'en-us':
      'Allows the following filters to apply to text fields: Greater Than, Less Than, Greater Than or Equal to, and Less Than or Equal to',
    'de-ch':
      'Ermöglicht die Anwendung der folgenden Filter auf Textfelder: Größer als, Kleiner als, Größer als oder gleich und Kleiner als oder gleich',
    'es-es':
      'Permite aplicar los siguientes filtros a los campos de texto: Mayor que, Menor que, Mayor o igual que y Menor o igual que',
    'fr-fr':
      "Permet d'appliquer les filtres suivants aux champs de texte : Supérieur à, Inférieur à, Supérieur ou égal à et Inférieur ou égal à",
    'pt-br':
      'Permite que os seguintes filtros sejam aplicados aos campos de texto: Maior que, Menor que, Maior ou igual a e Menor ou igual a',
    'ru-ru':
      'Позволяет применять к текстовым полям следующие фильтры: «Больше», «Меньше», «Больше или равно» и «Меньше или равно».',
    'uk-ua':
      'Дозволяє застосовувати до текстових полів такі фільтри: «Більше ніж», «Менше ніж», «Більше або дорівнює» та «Менше або дорівнює»',
  },
  basicView: {
    'en-us': 'Basic view',
    'de-ch': 'Basisansicht',
    'es-es': 'Vista básica',
    'fr-fr': 'Vue de base',
    'ru-ru': 'Базовый вид',
    'uk-ua': 'Основний вигляд',
    'pt-br': 'Visão básica',
  },
  detailedView: {
    'en-us': 'Detailed view',
    'de-ch': 'Detailansicht',
    'es-es': 'Vista detallada',
    'fr-fr': 'Vue détaillée',
    'ru-ru': 'Подробный вид',
    'uk-ua': 'Детальний вигляд',
    'pt-br': 'Visão detalhada',
  },
  inheritanceCatNumberPref: {
    'en-us':
      'Enable the inheritance of the primary catalog number to its empty siblings.',
    'de-ch':
      'Aktivieren Sie die Vererbung der primären Katalognummer an ihre leeren Geschwister.',
    'es-es':
      'Habilitar la herencia del número de catálogo principal a sus hermanos vacíos.',
    'fr-fr':
      "Activer l'héritage du numéro de catalogue principal à ses frères vides.",
    'pt-br':
      'Habilitar a herança do número de catálogo primário para seus irmãos vazios.',
    'ru-ru':
      'Включить наследование основного каталожного номера его пустыми родственными номерами.',
    'uk-ua':
      'Увімкнути успадкування основного каталожного номера його порожнім братам і сестрам.',
  },
  inheritanceCatNumberParentCOPref: {
    'en-us':
      'Enable the inheritance of the parent catalog number to its empty children.',
    'de-ch':
      'Aktivieren Sie die Vererbung der übergeordneten Katalognummer an ihre leeren untergeordneten Elemente.',
    'es-es':
      'Habilitar la herencia del número de catálogo padre a sus hijos vacíos.',
    'fr-fr':
      "Activer l'héritage du numéro de catalogue parent à ses enfants vides.",
    'pt-br':
      'Habilita a herança do número do catálogo pai para seus filhos vazios.',
    'ru-ru':
      'Включить наследование родительского каталожного номера его пустыми дочерними элементами.',
    'uk-ua':
      'Увімкнути успадкування батьківського каталожного номера його порожнім дочірнім елементам.',
  },
  uniqueCatNumberAcrossCompAndCo: {
    'en-us':
      'Catalog Number field need to be unique across Component and CO tables',
    'de-ch':
      'Das Feld „Katalognummer“ muss in allen Komponenten- und CO-Tabellen eindeutig sein',
    'es-es':
      'El campo Número de catálogo debe ser único en las tablas de componentes y CO',
    'fr-fr':
      'Le champ Numéro de catalogue doit être unique dans les tables Composant et CO',
    'pt-br':
      'O campo Número de catálogo precisa ser exclusivo nas tabelas Componente e CO',
    'ru-ru':
      'Поле «Номер каталога» должно быть уникальным в таблицах «Компонент» и «CO».',
    'uk-ua':
      'Поле «Номер у каталозі» має бути унікальним у таблицях «Компонент» та «CO».',
  },
} as const;

export const preferencesBehaviorText = createDictionary(
  preferencesBehaviorDictionary
);
