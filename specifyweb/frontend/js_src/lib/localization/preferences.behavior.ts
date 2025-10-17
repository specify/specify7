/**
 * Localization strings for behavioral and advanced preferences.
 *
 * @module
 */
import { createDictionary } from './utils';

export const preferencesBehaviorDict = createDictionary ({
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
  lineWrap: {
    'en-us': 'Line wrap',
    'ru-ru': 'Перенос строки',
    'es-es': 'Ajuste de línea',
    'fr-fr': 'Retour à la ligne',
    'uk-ua': 'Обтікання лініями',
    'de-ch': 'Zeilenumbruch',
    'pt-br': 'Quebra de linha',
  },
  indentSize: {
    'en-us': 'Indent size',
    'ru-ru': 'Размер отступа',
    'es-es': 'Tamaño de sangría',
    'fr-fr': 'Taille du retrait',
    'uk-ua': 'Розмір відступу',
    'de-ch': 'Einzugsgröße',
    'pt-br': 'Tamanho do recuo',
  },
  indentWithTab: {
    'en-us': 'Indent with <key>Tab</key>',
    'ru-ru': 'Отступ с помощью <key>Tab</key>',
    'es-es': 'Sangría con <key>Tab</key>',
    'fr-fr': 'Indenter avec <key>Tabulation</key>',
    'uk-ua': 'Відступ із <key>Tab</key>',
    'de-ch': 'Einrücken mit <key>Tab</key>',
    'pt-br': 'Recuo com <key>Tab</key>',
  },
  formHeaderFormat: {
    'en-us': 'Form header format',
    'ru-ru': 'Формат заголовка формы',
    'es-es': 'Formato del encabezado del formulario',
    'fr-fr': "Format d'en-tête de formulaire",
    'uk-ua': 'Формат заголовка форми',
    'de-ch': 'Formularkopfformat',
    'pt-br': 'Formato do cabeçalho do formulário',
  },
  iconAndTableName: {
    'en-us': 'Icon and table name',
    'ru-ru': 'Значок и название таблицы',
    'es-es': 'Icono y nombre de la tabla',
    'fr-fr': 'Icône et nom de la table',
    'uk-ua': 'Значок і назва таблиці',
    'de-ch': 'Symbol und Tabellenname',
    'pt-br': 'Ícone e nome da tabela',
  },
  tableIcon: {
    'en-us': 'Table icon',
    'ru-ru': 'Значок таблицы',
    'es-es': 'Icono de tabla',
    'fr-fr': 'Icône de tableau',
    'uk-ua': 'Значок таблиці',
    'de-ch': 'Tabellensymbol',
    'pt-br': 'Ícone de tabela',
  },
  maxHeight: {
    'en-us': 'Max height',
    'ru-ru': 'Максимальная высота',
    'es-es': 'Altura máxima',
    'fr-fr': 'hauteur maximum',
    'uk-ua': 'Максимальна висота',
    'de-ch': 'Maximale Höhe',
    'pt-br': 'Altura máxima',
  },
  autoComplete: {
    'en-us': 'Auto complete',
    'ru-ru': 'Автозаполнение',
    'es-es': 'Autocompletar',
    'fr-fr':
      "Détermine les légendes des champs, les notes d'utilisation et les légendes des tableaux",
    'uk-ua':
      'Визначає підписи полів, примітки щодо використання та підписи таблиць',
    'de-ch': 'Autovervollständigung',
    'pt-br': 'Preenchimento automático',
  },
  searchCaseSensitive: {
    'en-us': 'Case-sensitive search',
    'es-es': 'Búsqueda que distingue entre mayúsculas y minúsculas',
    'fr-fr': 'Recherche sensible à la casse',
    'uk-ua': 'Пошук з урахуванням регістру',
    'de-ch': 'Groß- und Kleinschreibung beachten',
    'ru-ru': 'Поиск с учетом регистра',
    'pt-br': 'Pesquisa com diferenciação entre maiúsculas e minúsculas',
  },
  searchField: {
    'en-us': 'Search Field',
    'ru-ru': 'Поле поиска',
    'es-es': 'Campo de búsqueda',
    'fr-fr': 'Champ de recherche',
    'uk-ua': 'Поле пошуку',
    'de-ch': 'Suchfeld',
    'pt-br': 'Campo de pesquisa',
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
  url: {
    'en-us': 'URL',
    'de-ch': 'URL',
    'es-es': 'URL',
    'fr-fr': 'URL',
    'uk-ua': 'URL',
    'ru-ru': 'URL',
    'pt-br': 'URL',
  },
  pickAttachment: {
    'en-us': 'Pick an attachment',
    'es-es': 'Elige un archivo adjunto',
    'fr-fr': 'Choisissez une pièce jointe',
    'ru-ru': 'Выберите вложение',
    'uk-ua': 'Виберіть вкладення',
    'de-ch': 'Wählen Sie einen Anhang',
    'pt-br': 'Escolha um anexo',
  },
  attachmentFailed: {
    'en-us': 'The attachment failed to load.',
    'de-ch': 'Der Anhang konnte nicht geladen werden.',
    'es-es': 'No se pudo cargar el archivo adjunto.',
    'fr-fr': "La pièce jointe n'a pas pu être chargée.",
    'ru-ru': 'Не удалось загрузить вложение.',
    'uk-ua': 'Не вдалося завантажити вкладений файл.',
    'pt-br': 'O anexo não pôde ser carregado.',
  },
  pickImage: {
    'en-us': 'Pick an image',
    'de-ch': 'Wählen Sie ein Bild aus',
    'es-es': 'Elige una imagen',
    'fr-fr': 'Choisissez une image',
    'ru-ru': 'Выберите изображение',
    'uk-ua': 'Виберіть зображення',
    'pt-br': 'Escolha uma imagem',
  },
  customLogo: {
    'en-us': 'Expanded Image URL',
    'de-ch': 'Erweiterte Bild-URL',
    'es-es': 'URL de imagen expandida',
    'fr-fr': "URL de l'image étendue",
    'ru-ru': 'URL-адрес развернутого изображения',
    'uk-ua': 'Розширена URL-адреса зображення',
    'pt-br': 'URL da imagem expandida',
  },
  customLogoCollapsed: {
    'en-us': 'Collapsed Image URL',
    'de-ch': 'URL des minimierten Bildes',
    'es-es': 'URL de imagen contraída',
    'fr-fr': "URL de l'image réduite",
    'ru-ru': 'URL-адрес свернутого изображения',
    'uk-ua': 'URL-адреса згорнутого зображення',
    'pt-br': 'URL da imagem recolhida',
  },
  customLogoDescription: {
    'en-us':
      'A URL to an image that would be displayed next to the Specify logo in the navigation menu.',
    'de-ch':
      'Eine URL zu einem Bild, das neben dem angegebenen Logo im Navigationsmenü angezeigt wird.',
    'es-es':
      'Una URL a una imagen que se mostrará junto al logotipo Especificar en el menú de navegación.',
    'fr-fr':
      'Une URL vers une image qui serait affichée à côté du logo Specify dans le menu de navigation.',
    'ru-ru':
      'URL-адрес изображения, которое будет отображаться рядом с логотипом «Укажите» в меню навигации.',
    'uk-ua':
      'URL-адреса зображення, яке відображатиметься поруч із «Вказати логотип» у меню навігації.',
    'pt-br':
      'Um URL para uma imagem que seria exibida ao lado do logotipo Especificar no menu de navegação.',
  },
  showLineNumber: {
    'en-us': 'Show query result line number',
    'de-ch': 'Zeilennummer des Abfrageergebnisses anzeigen',
    'es-es': 'Mostrar el número de línea del resultado de la consulta',
    'fr-fr': 'Afficher le numéro de ligne du résultat de la requête',
    'ru-ru': 'Показать номер строки результата запроса',
    'uk-ua': 'Показати номер рядка результату запиту',
    'pt-br': 'Mostrar número da linha do resultado da consulta',
  },
  saveButtonColor: {
    'en-us': 'Save button color',
    'de-ch': 'Farbe der Schaltfläche „Speichern“',
    'es-es': 'Guardar color del botón',
    'fr-fr': 'Couleur du bouton Enregistrer',
    'ru-ru': 'Сохранить цвет кнопки',
    'uk-ua': 'Зберегти колір кнопки',
    'pt-br': 'Cor do botão Salvar',
  },
  secondaryButtonColor: {
    'en-us': 'Secondary button color',
    'es-es': 'Color del botón secundario',
    'fr-fr': 'Couleur du bouton secondaire',
    'ru-ru': 'Цвет вторичной кнопки',
    'uk-ua': 'Колір вторинної кнопки',
    'de-ch': 'Sekundäre Schaltflächenfarbe',
    'pt-br': 'Cor do botão secundário',
  },
  secondaryLightButtonColor: {
    'en-us': 'Secondary light button color',
    'de-ch': 'Farbe der sekundären Lichttaste',
    'es-es': 'Color del botón de luz secundaria',
    'fr-fr': 'Couleur du bouton lumineux secondaire',
    'ru-ru': 'Цвет кнопки дополнительного освещения',
    'uk-ua': 'Колір вторинної світлової кнопки',
    'pt-br': 'Cor do botão de luz secundária',
  },
  dangerButtonColor: {
    'en-us': 'Danger button color',
    'de-ch': 'Farbe der Gefahrenschaltfläche',
    'es-es': 'Color del botón de peligro',
    'fr-fr': 'Couleur du bouton de danger',
    'ru-ru': 'Цвет кнопки «Опасность»',
    'uk-ua': 'Колір кнопки небезпеки',
    'pt-br': 'Cor do botão de perigo',
  },
  infoButtonColor: {
    'en-us': 'Info button color',
    'de-ch': 'Farbe der Info-Schaltfläche',
    'es-es': 'Color del botón de información',
    'fr-fr': "Couleur du bouton d'information",
    'ru-ru': 'Цвет кнопки информации',
    'uk-ua': 'Колір інформаційної кнопки',
    'pt-br': 'Cor do botão de informações',
  },
  warningButtonColor: {
    'en-us': 'Warning button color',
    'de-ch': 'Farbe der Warnschaltfläche',
    'es-es': 'Color del botón de advertencia',
    'fr-fr': "Couleur du bouton d'avertissement",
    'ru-ru': 'Цвет кнопки предупреждения',
    'uk-ua': 'Колір кнопки попередження',
    'pt-br': 'Cor do botão de aviso',
  },
  successButtonColor: {
    'en-us': 'Success button color',
    'de-ch': 'Farbe der Schaltfläche „Erfolg“',
    'es-es': 'Color del botón de éxito',
    'fr-fr': 'Couleur du bouton de réussite',
    'ru-ru': 'Цвет кнопки «Успех»',
    'uk-ua': 'Колір кнопки успіху',
    'pt-br': 'Cor do botão de sucesso',
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
  attachmentPreviewMode: {
    'en-us': 'Attachment preview mode',
    'de-ch': 'Anhangsvorschaumodus',
    'es-es': 'Modo de vista previa de archivos adjuntos',
    'fr-fr': "Mode d'aperçu des pièces jointes",
    'ru-ru': 'Режим предварительного просмотра вложений',
    'uk-ua': 'Режим попереднього перегляду вкладених файлів',
    'pt-br': 'Modo de visualização de anexos',
  },
  fullResolution: {
    'en-us': 'Full Resolution',
    'de-ch': 'Volle Auflösung',
    'es-es': 'Resolución completa',
    'fr-fr': 'Pleine résolution',
    'ru-ru': 'Полное разрешение',
    'uk-ua': 'Повна роздільна здатність',
    'pt-br': 'Resolução completa',
  },
  thumbnail: {
    'en-us': 'Thumbnail',
    'de-ch': 'Miniaturansicht',
    'es-es': 'Uña del pulgar',
    'fr-fr': 'Vignette',
    'ru-ru': 'Миниатюра',
    'uk-ua': 'Мініатюра',
    'pt-br': 'Miniatura',
  },
  addSearchBarHomePage: {
    'en-us': 'Add Search Bar on home page',
    'de-ch': 'Suchleiste auf der Startseite hinzufügen',
    'es-es': 'Agregar barra de búsqueda en la página de inicio',
    'fr-fr': "Ajouter une barre de recherche sur la page d'accueil",
    'ru-ru': 'Добавить панель поиска на домашнюю страницу',
    'uk-ua': 'Додайте рядок пошуку на головну сторінку',
    'pt-br': 'Adicionar barra de pesquisa na página inicial',
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
} as const);

export default preferencesBehaviorDict;
