/**
 * Localization strings for content and asset preferences.
 *
 * @module
 */
import { createDictionary } from './utils';

export const preferencesContentStrings = {
  content: {
    'en-us': 'Content',
    'ru-ru': 'Содержание',
    'es-es': 'Contenido',
    'fr-fr': 'Contenu',
    'uk-ua': 'Зміст',
    'de-ch': 'Inhalt',
    'pt-br': 'Contente',
  },
  defaultImage: {
    'en-us': 'Specify Logo',
    'ru-ru': 'Укажите логотип',
    'es-es': 'Especificar logotipo',
    'fr-fr': 'Spécifier le logo',
    'uk-ua': 'Вкажіть логотип',
    'de-ch': 'Logo angeben',
    'pt-br': 'Especificar logotipo',
  },
  customImage: {
    'en-us': 'Custom Image',
    'ru-ru': 'Пользовательское изображение',
    'es-es': 'Imagen personalizada',
    'fr-fr': 'Image personnalisée',
    'uk-ua': 'Спеціальне зображення',
    'de-ch': 'Benutzerdefiniertes Bild',
    'pt-br': 'Imagem personalizada',
  },
  embeddedWebpage: {
    'en-us': 'Embedded web page',
    'ru-ru': 'Встроенная веб-страница',
    'es-es': 'Página web incrustada',
    'fr-fr': 'Page Web intégrée',
    'uk-ua': 'Вбудована веб-сторінка',
    'de-ch': 'Eingebettete Webseite',
    'pt-br': 'Página da web incorporada',
  },
  embeddedWebpageDescription: {
    'en-us': 'A URL to a page that would be embedded on the home page:',
    'ru-ru': 'URL-адрес страницы, которая будет встроена в домашнюю страницу:',
    'es-es': 'Una URL a una página que se integrará en la página de inicio:',
    'fr-fr': "Une URL vers une page qui serait intégrée à la page d'accueil :",
    'uk-ua': 'URL-адреса сторінки, яка буде вбудована на домашній сторінці:',
    'de-ch':
      'Eine URL zu einer Seite, die auf der Startseite eingebettet werden soll:',
    'pt-br': 'Um URL para uma página que seria incorporada na página inicial:',
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
  foreground: {
    'en-us': 'Foreground',
    'ru-ru': 'Передний план',
    'es-es': 'Primer plano',
    'fr-fr': 'Premier plan',
    'uk-ua': 'Передній план',
    'de-ch': 'Vordergrund',
    'pt-br': 'Primeiro plano',
  },
  background: {
    'en-us': 'Background',
    'ru-ru': 'Фон',
    'es-es': 'Fondo',
    'fr-fr': 'Arrière-plan',
    'uk-ua': 'Фон',
    'de-ch': 'Hintergrund',
    'pt-br': 'Fundo',
  },
  sidebarTheme: {
    'en-us': 'Sidebar theme',
    'de-ch': 'Seitenleistenthema',
    'es-es': 'Tema de la barra lateral',
    'fr-fr': 'Thème de la barre latérale',
    'ru-ru': 'Тема боковой панели',
    'uk-ua': 'Тема бічної панелі',
    'pt-br': 'Tema da barra lateral',
  },
  darkForeground: {
    'en-us': 'Foreground (dark theme)',
    'ru-ru': 'Передний план (тёмная тема)',
    'es-es': 'Primer plano (tema oscuro)',
    'fr-fr': 'Premier plan (thème sombre)',
    'uk-ua': 'Передній план (темна тема)',
    'de-ch': 'Vordergrund (dunkles Design)',
    'pt-br': 'Primeiro plano (tema escuro)',
  },
  darkBackground: {
    'en-us': 'Background (dark theme)',
    'ru-ru': 'Фон (тёмная тема)',
    'es-es': 'Fondo (tema oscuro)',
    'fr-fr': 'Arrière-plan (thème sombre)',
    'uk-ua': 'Фон (темна тема)',
    'de-ch': 'Hintergrund (dunkles Design)',
    'pt-br': 'Plano de fundo (tema escuro)',
  },
  accentColor1: {
    'en-us': 'Accent color 1',
    'ru-ru': 'Акцентный цвет 1',
    'es-es': 'Color de acento 1',
    'fr-fr': "Couleur d'accent 1",
    'uk-ua': 'Акцентний колір 1',
    'de-ch': 'Akzentfarbe 1',
    'pt-br': 'Cor de destaque 1',
  },
  accentColor2: {
    'en-us': 'Accent color 2',
    'ru-ru': 'Акцентный цвет 2',
    'es-es': 'Color de acento 2',
    'fr-fr': "Couleur d'accent 2",
    'uk-ua': 'Акцентний колір 2',
    'de-ch': 'Akzentfarbe 2',
    'pt-br': 'Cor de destaque 2',
  },
  accentColor3: {
    'en-us': 'Accent color 3',
    'ru-ru': 'Акцентный цвет 3',
    'es-es': 'Color de acento 3',
    'fr-fr': "Couleur d'accent 3",
    'uk-ua': 'Акцентний колір 3',
    'de-ch': 'Akzentfarbe 3',
    'pt-br': 'Cor de destaque 3',
  },
  accentColor4: {
    'en-us': 'Accent color 4',
    'ru-ru': 'Акцентный цвет 4',
    'es-es': 'Color de acento 4',
    'fr-fr': "Couleur d'accent 4",
    'uk-ua': 'Акцентний колір 4',
    'de-ch': 'Akzentfarbe 4',
    'pt-br': 'Cor de destaque 4',
  },
  accentColor5: {
    'en-us': 'Accent color 5',
    'ru-ru': 'Акцентный цвет 5',
    'es-es': 'Color de acento 5',
    'fr-fr': "Couleur d'accent 5",
    'uk-ua': 'Акцентний колір 5',
    'de-ch': 'Akzentfarbe 5',
    'pt-br': 'Cor de destaque 5',
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
  specifyNetworkBadge: {
    'en-us': 'Specify Network Badge',
    'ru-ru': 'Укажите сетевой значок',
    'es-es': 'Especificar la insignia de red',
    'fr-fr': 'Spécifier le badge réseau',
    'uk-ua': 'Укажіть значок мережі',
    'de-ch': 'Netzwerk-Badge angeben',
    'pt-br': 'Especificar emblema de rede',
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
  rightAlignNumberFields: {
    'en-us': 'Right-Justify numeric fields',
    'ru-ru': 'Выравнивание числовых полей по правому краю',
    'es-es': 'Justificar a la derecha los campos numéricos',
    'fr-fr': 'Justifier à droite les champs numériques',
    'uk-ua': 'Вирівнювання по правому краю числових полів',
    'de-ch': 'Rechtsbündige Ausrichtung numerischer Felder',
    'pt-br': 'Justificar à direita campos numéricos',
  },
  roundedCorners: {
    'en-us': 'Rounded corners',
    'ru-ru': 'Закругленные углы',
    'es-es': 'esquinas redondeadas',
    'fr-fr': 'Coins arrondis',
    'uk-ua': 'Заокруглені кути',
    'de-ch': 'Abgerundete Ecken',
    'pt-br': 'Cantos arredondados',
  },
  showSubviewBorders: {
    'en-us': 'Show borders around subviews',
    'de-ch': 'Rahmen um Unteransichten anzeigen',
    'es-es': 'Mostrar bordes alrededor de las subvistas',
    'fr-fr': 'Afficher les bordures autour des sous-vues',
    'pt-br': 'Mostrar bordas ao redor das subvisualizações',
    'ru-ru': 'Показывать границы вокруг подпредставлений',
    'uk-ua': 'Показати межі навколо підвидів',
  },
  limitMaxFieldWidth: {
    'en-us': 'Limit max field width',
    'ru-ru': 'Ограничить максимальную ширину поля',
    'es-es': 'Limitar el ancho máximo del campo',
    'fr-fr': 'Limiter la largeur maximale du champ',
    'uk-ua': 'Обмеження максимальної ширини поля',
    'de-ch': 'Maximale Feldbreite begrenzen',
    'pt-br': 'Limite a largura máxima do campo',
  },
  condenseQueryResults: {
    'en-us': 'Condense query results',
    'ru-ru': 'Сжать результаты запроса',
    'es-es': 'Condensar los resultados de la consulta',
    'fr-fr': 'Condenser les résultats de la requête',
    'uk-ua': 'Згорнути результати запиту',
    'de-ch': 'Abfrageergebnisse verdichten',
    'pt-br': 'Condensar resultados da consulta',
  },
  blurContentBehindDialog: {
    'en-us': 'Blur content behind the dialog',
    'ru-ru': 'Размытие содержимого за диалогом',
    'es-es': 'Desenfocar el contenido detrás del diálogo',
    'fr-fr': 'Flou le contenu derrière la boîte de dialogue',
    'uk-ua': 'Розмити вміст за діалоговим вікном',
    'de-ch': 'Inhalte hinter dem Dialog verwischen',
    'pt-br': 'Desfocar o conteúdo atrás do diálogo',
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
} as const;

export const preferencesContentText = createDictionary(
  preferencesContentStrings
);

export default preferencesContentText;
