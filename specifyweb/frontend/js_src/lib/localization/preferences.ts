/**
 * Localization strings for the preferences menu
 *
 * @module
 */

import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

export const preferencesText = createDictionary({
  preferences: {
    'en-us': 'Preferences',
    'ru-ru': 'Настройки',
    'es-es': 'preferencias',
    'fr-fr': 'Préférences',
    'uk-ua': 'Уподобання',
    'de-ch': 'Einstellungen',
  },
  customization: {
    'en-us': 'Customization',
    'ru-ru': 'Настройка',
    'es-es': 'personalización',
    'fr-fr': 'Personnalisation',
    'uk-ua': 'Налаштування',
    'de-ch': 'Anpassung',
  },
  userPreferences: {
    'en-us': 'User Preferences',
    'ru-ru': 'Пользовательские настройки',
    'es-es': 'Preferencias del usuario',
    'fr-fr': 'Préférences utilisateur',
    'uk-ua': 'Налаштування користувача',
    'de-ch': 'Benutzereinstellungen',
  },
  defaultUserPreferences: {
    'en-us': 'Default User Preferences',
    'ru-ru': 'Пользовательские настройки по умолчанию',
    'es-es': 'Preferencias de usuario predeterminadas',
    'fr-fr': 'Préférences utilisateur par défaut',
    'uk-ua': 'Параметри користувача за умовчанням',
    'de-ch': 'Standardbenutzereinstellungen',
  },
  general: {
    'en-us': 'General',
    'ru-ru': 'Основные',
    'es-es': 'General',
    'fr-fr': 'Général',
    'uk-ua': 'Загальний',
    'de-ch': 'Allgemein',
  },
  ui: {
    'en-us': 'User Interface',
    'ru-ru': 'Пользовательский интерфейс',
    'es-es': 'Interfaz de usuario',
    'fr-fr': 'Interface utilisateur',
    'uk-ua': 'Користувацький інтерфейс',
    'de-ch': 'Benutzeroberfläche',
  },
  theme: {
    'en-us': 'Theme',
    'ru-ru': 'Тема',
    'es-es': 'Temática',
    'fr-fr': 'Thème',
    'uk-ua': 'Тема',
    'de-ch': 'Thema',
  },
  useSystemSetting: {
    'en-us': 'Use system setting',
    'ru-ru': 'Использовать системные настройки',
    'es-es': 'Usar la configuración del sistema',
    'fr-fr': 'Utiliser les paramètres du système',
    'uk-ua': 'Використовуйте налаштування системи',
    'de-ch': 'Systemeinstellung verwenden',
  },
  inheritOsSettings: {
    'en-us': 'Copies value from your Operating System settings',
    'ru-ru': 'Копирует значение из настроек вашей операционной системы',
    'es-es': 'Copia el valor de la configuración de su sistema operativo',
    'fr-fr': "Copie la valeur des paramètres de votre système d'exploitation",
    'uk-ua': 'Копіює значення з налаштувань вашої операційної системи',
    'de-ch': 'Kopiert den Wert aus Ihren Betriebssystemeinstellungen',
  },
  light: {
    comment: 'Light mode',
    'en-us': 'Light',
    'ru-ru': 'Белая',
    'es-es': 'Luz',
    'fr-fr': 'Clair',
    'uk-ua': 'світло',
    'de-ch': 'Licht',
  },
  dark: {
    comment: 'Dark mode',
    'en-us': 'Dark',
    'ru-ru': 'Темная',
    'es-es': 'Oscuro',
    'fr-fr': 'Sombre',
    'uk-ua': 'Темний',
    'de-ch': 'Dunkel',
  },
  reduceMotion: {
    'en-us': 'Reduce motion',
    'ru-ru': 'Уменьшить движение',
    'es-es': 'Reducir el movimiento',
    'fr-fr': 'Réduire le mouvement',
    'uk-ua': 'Зменшити рух',
    'de-ch': 'Bewegung reduzieren',
  },
  reduceMotionDescription: {
    'en-us': 'Disable non-essential animations and transitions',
    'ru-ru': 'Отключить ненужные анимации и переходы',
    'es-es': 'Deshabilitar animaciones y transiciones no esenciales',
    'fr-fr': 'Désactiver les animations et transitions non essentielles',
    'uk-ua': "Вимкніть необов'язкову анімацію та переходи",
    'de-ch': `
      Deaktivieren Sie nicht unbedingt erforderliche Animationen und Übergänge
    `,
  },
  reduceTransparency: {
    'en-us': 'Reduce transparency',
    'ru-ru': 'Уменьшить прозрачность',
    'es-es': 'Reducir la transparencia',
    'fr-fr': 'Réduire la transparence',
    'uk-ua': 'Зменшити прозорість',
    'de-ch': 'Reduzieren Sie die Transparenz',
  },
  reduceTransparencyDescription: {
    'en-us': `
      Whether to disable translucent backgrounds for user interface components
      whenever possible (e.g. table headers in tree view)
    `,
    'ru-ru': `
      Отключить ли полупрозрачный фон для пользовательского интерфейса, когда
      это возможно (например, заголовки таблиц в просмотрщике деревьев)
    `,
    'es-es': `
      Si deshabilitar fondos translúcidos para los componentes de la interfaz de
      usuario siempre que sea posible (por ejemplo, encabezados de tabla en la
      vista de árbol)
    `,
    'fr-fr': `
      S'il faut désactiver les arrière-plans translucides pour les composants de
      l'interface utilisateur dans la mesure du possible (par exemple, les
      en-têtes de tableau dans l'arborescence)
    `,
    'uk-ua': `
      Чи вимикати напівпрозорий фон для компонентів інтерфейсу користувача, коли
      це можливо (наприклад, заголовки таблиць у перегляді дерева)
    `,
    'de-ch': `
      Ob durchsichtige Hintergründe für Benutzeroberflächenkomponenten wann
      immer möglich deaktiviert werden sollen (z. B. Tabellenüberschriften in
      der Baumansicht)
    `,
  },
  contrast: {
    'en-us': 'Contrast',
    'ru-ru': 'Контраст',
    'es-es': 'Contraste',
    'fr-fr': 'Contraste',
    'uk-ua': 'Контраст',
    'de-ch': 'Kontrast',
  },
  increase: {
    'en-us': 'Increase',
    'ru-ru': 'Увеличить',
    'es-es': 'Incrementar',
    'fr-fr': 'Augmenter',
    'uk-ua': 'Збільшити',
    'de-ch': 'Zunahme',
  },
  reduce: {
    'en-us': 'Reduce',
    'ru-ru': 'Уменьшать',
    'es-es': 'Reducir',
    'fr-fr': 'Réduire',
    'uk-ua': 'Зменшити',
    'de-ch': 'Reduzieren',
  },
  noPreference: {
    'en-us': 'No preference',
    'ru-ru': 'Нет предпочтений',
    'es-es': 'Sin preferencias',
    'fr-fr': 'Pas de préférence',
    'uk-ua': 'Без переваг',
    'de-ch': 'Keine Präferenz',
  },
  fontSize: {
    'en-us': 'Font size',
    'ru-ru': 'Размер шрифта',
    'es-es': 'Tamaño de fuente',
    'fr-fr': 'Taille de la police',
    'uk-ua': 'Розмір шрифту',
    'de-ch': 'Schriftgröße',
  },
  fontFamily: {
    'en-us': 'Font family',
    'ru-ru': 'Шрифт',
    'es-es': 'Familia tipográfica',
    'fr-fr': 'Police',
    'uk-ua': 'Сімейство шрифтів',
    'de-ch': 'Schriftfamilie',
  },
  fontFamilyDescription: {
    'en-us': `
      You can specify any font that is on your computer, even if it is not in
      the list. A comma separated list of fonts is also supported, where second
      font would be used if first one is not available and so on
    `,
    'ru-ru': `
      Вы можете указать любой шрифт, который есть на вашем компьютере, даже если
      он нет в списке. Поддерживается список шрифтов, разделенных запятыми, где
      второй шрифт будет использоваться, если первый не доступен и т.д
    `,
    'es-es': `
      Puede especificar cualquier fuente que tenga en su ordenador, aunque no
      esté en la lista. También se admite una lista de fuentes separadas por
      comas, en la que se utilizará la segunda fuente si la primera no está
      disponible, etc
    `,
    'fr-fr': `
      Vous pouvez spécifier n'importe quelle police qui se trouve sur votre
      ordinateur, même si elle ne figure pas dans la liste. Une liste de polices
      séparées par des virgules est également prise en charge, où la deuxième
      police serait utilisée si la première n'est pas disponible, etc.
    `,
    'uk-ua': `
      Ви можете вказати будь-який шрифт, який є на вашому комп'ютері, навіть
      якщо його немає в списку. Також підтримується список шрифтів розділений
      комами, у якому використовуватиметься другий шрифт, якщо перший
      недоступний тощо
    `,
    'de-ch': `
      Sie können jede Schriftart angeben, die sich auf Ihrem Computer befindet,
      auch wenn diese nicht in der Liste enthalten ist. Eine durch Kommas
      getrennte Liste von Schriftarten wird ebenfalls unterstützt, wobei die
      zweite Schriftart verwendet wird, wenn die erste nicht verfügbar ist usw
    `,
  },
  defaultFont: {
    'en-us': '(default font)',
    'ru-ru': '(шрифт по умолчанию)',
    'es-es': '(fuente predeterminada)',
    'fr-fr': '(police par défaut)',
    'uk-ua': '(типовий шрифт)',
    'de-ch': '(Standardschriftart)',
  },
  maxFormWidth: {
    'en-us': 'Max form width',
    'ru-ru': 'Максимальная ширина формы',
    'es-es': 'Ancho máximo de formulario',
    'fr-fr': 'Largeur maximale du formulaire',
    'uk-ua': 'Максимальна ширина форми',
    'de-ch': 'Maximale Formularbreite',
  },
  fieldBackgrounds: {
    'en-us': 'Field backgrounds',
    'ru-ru': 'Фон полей',
    'es-es': 'Fondos de campo',
    'fr-fr': 'Arrière-plans de terrain',
    'uk-ua': 'Польові фони',
    'de-ch': 'Feldhintergründe',
  },
  fieldBackground: {
    'en-us': 'Field background',
    'ru-ru': 'Фон поля',
    'es-es': 'Fondo de campo',
    'fr-fr': 'Fond de champ',
    'uk-ua': 'Поле фону',
    'de-ch': 'Feldhintergrund',
  },
  disabledFieldBackground: {
    'en-us': 'Disabled field background',
    'ru-ru': 'Фон полей только для чтения',
    'es-es': 'Fondo de campo deshabilitado',
    'fr-fr': 'Arrière-plan de champ désactivé',
    'uk-ua': 'Вимкнений фон поля',
    'de-ch': 'Deaktivierter Feldhintergrund',
  },
  invalidFieldBackground: {
    'en-us': 'Invalid field background',
    'ru-ru': 'Фон недействительных полей',
    'es-es': 'Fondo de campo no válido',
    'fr-fr': 'Arrière-plan de champ invalide',
    'uk-ua': 'Недійсний фон поля',
    'de-ch': 'Ungültiger Feldhintergrund',
  },
  requiredFieldBackground: {
    'en-us': 'Required field background',
    'ru-ru': 'Фон обязательных полей',
    'es-es': 'Fondo de campo obligatorio',
    'fr-fr': 'Arrière-plan de champ requis',
    'uk-ua': "Обов'язковий фон поля",
    'de-ch': 'Erforderlicher Feldhintergrund',
  },
  darkFieldBackground: {
    'en-us': 'Field background (dark theme)',
    'ru-ru': 'Фон полей (темная тема)',
    'es-es': 'Fondo de campo (tema oscuro)',
    'fr-fr': 'Arrière-plan de champ (thème sombre)',
    'uk-ua': 'Фон поля (темна тема)',
    'de-ch': 'Feldhintergrund (dunkles Thema)',
  },
  darkDisabledFieldBackground: {
    'en-us': 'Disabled field background (dark theme)',
    'ru-ru': 'Фон полей только для чтения (темная тема)',
    'es-es': 'Fondo de campo deshabilitado (tema oscuro)',
    'fr-fr': 'Arrière-plan de champ désactivé (thème sombre)',
    'uk-ua': 'Вимкнений фон поля (темна тема)',
    'de-ch': 'Deaktivierter Feldhintergrund (dunkles Design)',
  },
  darkInvalidFieldBackground: {
    'en-us': 'Invalid field background (dark theme)',
    'ru-ru': 'Фон недействительных полей (темная тема)',
    'es-es': 'Fondo de campo no válido (tema oscuro)',
    'fr-fr': 'Arrière-plan de champ invalide (thème sombre)',
    'uk-ua': 'Недійсний фон поля (темна тема)',
    'de-ch': 'Ungültiger Feldhintergrund (dunkles Design)',
  },
  darkRequiredFieldBackground: {
    'en-us': 'Required field background (dark theme)',
    'ru-ru': 'Фон обязательных полей (темная тема)',
    'es-es': 'Fondo de campo obligatorio (tema oscuro)',
    'fr-fr': 'Arrière-plan de champ requis (thème sombre)',
    'uk-ua': 'Обов’язковий фон поля (темна тема)',
    'de-ch': 'Erforderlicher Feldhintergrund (dunkles Design)',
  },
  dialogs: {
    'en-us': 'Dialogs',
    'ru-ru': 'Диалоги',
    'es-es': 'Diálogos',
    'fr-fr': 'Boîtes de dialogue',
    'uk-ua': 'Діалоги',
    'de-ch': 'Dialoge',
  },
  appearance: {
    'en-us': 'Appearance',
    'ru-ru': 'Внешний вид',
    'es-es': 'Apariencia',
    'fr-fr': 'Apparence',
    'uk-ua': 'Зовнішній вигляд',
    'de-ch': 'Aussehen',
  },
  buttonsLight: {
    'en-us': 'Buttons (light mode)',
    'de-ch': 'Tasten (Lichtmodus)',
    'es-es': 'Botones (modo de luz)',
    'fr-fr': 'Boutons (mode lumière)',
    'ru-ru': 'Кнопки (светлый режим)',
    'uk-ua': 'Кнопки (світлий режим)',
  },
  buttonsDark: {
    'en-us': 'Buttons (dark mode)',
    'de-ch': 'Tasten (dunkler Modus)',
    'es-es': 'Botones (modo oscuro)',
    'fr-fr': 'Boutons (mode sombre)',
    'ru-ru': 'Кнопки (темный режим)',
    'uk-ua': 'Кнопки (темний режим)',
  },
  translucentDialog: {
    'en-us': 'Translucent dialogs',
    'ru-ru': 'Полупрозрачные диалоги',
    'es-es': 'Diálogos translúcidos',
    'fr-fr': 'Boîtes de dialogue translucides',
    'uk-ua': 'Напівпрозорі діалоги',
    'de-ch': 'Durchsichtige Dialoge',
  },
  translucentDialogDescription: {
    'en-us': 'Whether dialogs have translucent background',
    'ru-ru': 'Диалоги имеют полупрозрачный фон',
    'es-es': 'Si los diálogos tienen un fondo translúcido',
    'fr-fr': 'Si les boîtes de dialogue ont un fond translucide',
    'uk-ua': 'Чи мають діалоги прозорий фон',
    'de-ch': 'Ob Dialoge einen durchscheinenden Hintergrund haben',
  },
  alwaysPrompt: {
    'en-us': 'Always prompt to choose collection',
    'ru-ru': 'Всегда просить выбрать коллекцию',
    'es-es': 'Siempre pregunte para elegir la colección',
    'fr-fr': 'Toujours invité à choisir la collection',
    'uk-ua': 'Завжди підкажуть вибрати колекцію',
    'de-ch': 'Immer Aufforderung zur Auswahl der Kollektion',
  },
  treeEditor: {
    'en-us': 'Tree Editor',
    'ru-ru': 'Редактор дерева',
    'es-es': 'Editor de árboles',
    'fr-fr': "Éditeur d'arborescence",
    'uk-ua': 'Редактор дерева',
    'de-ch': 'Baumeditor',
  },
  treeAccentColor: {
    'en-us': 'Tree accent color',
    'ru-ru': 'Акцентный цвет дерева',
    'es-es': 'Color de acento del árbol',
    'fr-fr': "Couleur d'accent d'arbre",
    'uk-ua': 'Колір акценту дерева',
    'de-ch': 'Baumakzentfarbe',
  },
  synonymColor: {
    'en-us': 'Synonym color',
    'ru-ru': 'Цвет синонима',
    'es-es': 'color sinónimo',
    'fr-fr': 'Couleur synonyme',
    'uk-ua': 'Синонім кольору',
    'de-ch': 'Synonymfarbe',
  },
  showNewDataSetWarning: {
    'en-us': 'Show new Data Set warning',
    'ru-ru': 'Показать предупреждение в новых наборах данных',
    'es-es': 'Mostrar nueva advertencia de conjunto de datos',
    'fr-fr': "Afficher l'avertissement relatif au nouvel ensemble de données",
    'uk-ua': 'Показати попередження про новий набір даних',
    'de-ch': 'Warnung zu neuem Datensatz anzeigen',
  },
  showNewDataSetWarningDescription: {
    'en-us': 'Show an informational message when creating a new Data Set',
    'ru-ru':
      'Показывать информационное сообщение при создании нового набора данных',
    'es-es':
      'Mostrar un mensaje informativo al crear un nuevo conjunto de datos',
    'fr-fr': `
      Afficher un message d'information lors de la création d'un nouvel ensemble
      de données
    `,
    'uk-ua': `
      Показувати інформаційне повідомлення під час створення нового набору даних
    `,
    'de-ch': `
      Beim Erstellen eines neuen Datensatzes eine Informationsmeldung anzeigen
    `,
  },
  header: {
    'en-us': 'Navigation Menu',
    'ru-ru': 'Меню навигации',
    'es-es': 'Menú de Navegación',
    'fr-fr': 'le menu de navigation',
    'uk-ua': 'Навігаційне меню',
    'de-ch': 'Navigationsmenü',
  },
  application: {
    'en-us': 'Application',
    'ru-ru': 'Программа',
    'es-es': 'Solicitud',
    'fr-fr': 'Application',
    'uk-ua': 'застосування',
    'de-ch': 'Anwendung',
  },
  allowDismissingErrors: {
    'en-us': 'Allow dismissing error messages',
    'ru-ru': 'Разрешить отклонять сообщения об ошибках',
    'es-es': 'Permitir descartar mensajes de error',
    'fr-fr': "Autoriser la fermeture des messages d'erreur",
    'uk-ua': 'Дозволити закривати повідомлення про помилки',
    'de-ch': 'Erlauben Sie das Verwerfen von Fehlermeldungen',
  },
  updatePageTitle: {
    'en-us': 'Update page title',
    'ru-ru': 'Обновить заголовок страницы',
    'es-es': 'Actualizar título de la página',
    'fr-fr': 'Mettre à jour le titre de la page',
    'uk-ua': 'Оновити назву сторінки',
    'de-ch': 'Seitentitel aktualisieren',
  },
  updatePageTitleDescription: {
    'en-us': "Whether to update the title of the page to match dialog's header",
    'ru-ru': `
      Обновлять ли заголовок страницы в соответствии с заголовком диалогового
      окна
    `,
    'es-es': `
      Si actualizar el título de la página para que coincida con el encabezado
      del cuadro de diálogo
    `,
    'fr-fr': `
      S'il faut mettre à jour le titre de la page pour qu'il corresponde à
      l'en-tête de la boîte de dialogue
    `,
    'uk-ua':
      'Чи оновлювати назву сторінки відповідно до заголовка діалогового вікна',
    'de-ch': `
      Ob der Titel der Seite so aktualisiert werden soll, dass er mit der
      Kopfzeile des Dialogs übereinstimmt
    `,
  },
  updatePageTitleFormDescription: {
    'en-us': 'Whether to update the title of the page to match current record',
    'ru-ru':
      'Обновлять ли заголовок страницы в соответствии с текущим объектом',
    'es-es': `
      Si actualizar el título de la página para que coincida con el registro
      actual
    `,
    'fr-fr': `
      S'il faut mettre à jour le titre de la page pour qu'il corresponde à
      l'enregistrement actuel
    `,
    'uk-ua': 'Чи оновлювати назву сторінки відповідно до поточного запису',
    'de-ch': `
      Ob der Titel der Seite aktualisiert werden soll, damit er mit dem
      aktuellen Datensatz übereinstimmt
    `,
  },
  queryComboBox: {
    'en-us': 'Query Combo Box',
    'ru-ru': 'Поле автозаполнения',
    'es-es': 'Cuadro combinado de consulta',
    'fr-fr': 'Boîte combinée de requête',
    'uk-ua': 'Поле зі списком запитів',
    'de-ch': 'Kombinationsfeld „Abfrage“.',
  },
  searchAlgorithm: {
    'en-us': 'Search Algorithm',
    'ru-ru': 'Алгоритм поиска',
    'es-es': 'Algoritmo de búsqueda',
    'fr-fr': 'Algorithme de recherche',
    'uk-ua': 'Алгоритм пошуку',
    'de-ch': 'Suchalgorithmus',
  },
  treeSearchAlgorithm: {
    'en-us': 'Search Algorithm (for relationships with tree tables)',
    'ru-ru': 'Алгоритм поиска (для деревьев)',
    'es-es': 'Algoritmo de búsqueda (para relaciones con tablas de árbol)',
    'fr-fr': `
      Algorithme de recherche (pour les relations avec les tables arborescentes)
    `,
    'uk-ua': 'Алгоритм пошуку (для зв’язків із деревоподібними таблицями)',
    'de-ch': 'Suchalgorithmus (für Beziehungen mit Baumtabellen)',
  },
  startsWithInsensitive: {
    'en-us': 'Starts With (case-insensitive)',
    'ru-ru': 'Начинается с (без учета регистра)',
    'es-es': 'Empieza por (no distingue entre mayúsculas y minúsculas)',
    'fr-fr': 'Commence par (insensible à la casse)',
    'uk-ua': 'Починається з (без урахування регістру)',
    'de-ch': 'Beginnt mit (Groß- und Kleinschreibung wird nicht beachtet)',
  },
  startsWithDescription: {
    'en-us': 'Search for values that begin with a given query string',
    'ru-ru': 'Поиск значений, начинающихся с заданной строки запроса',
    'es-es':
      'Buscar valores que comiencen con una cadena de consulta determinada',
    'fr-fr':
      'Rechercher des valeurs commençant par une chaîne de requête donnée',
    'uk-ua': 'Пошук значень, які починаються з заданого рядка запиту',
    'de-ch': `
      Suchen Sie nach Werten, die mit einer bestimmten Abfragezeichenfolge
      beginnen
    `,
  },
  startsWithCaseSensitive: {
    'en-us': 'Starts With (case-sensitive)',
    'ru-ru': 'Начинается с (с учетом регистра)',
    'es-es': 'Empieza por (se distingue entre mayúsculas y minúsculas)',
    'fr-fr': 'Commence par (sensible à la casse)',
    'uk-ua': 'Починається з (з урахуванням регістру)',
    'de-ch': 'Beginnt mit (Groß-/Kleinschreibung beachten)',
  },
  startsWithCaseSensitiveDescription: {
    'en-us': 'Search for values that begin with a given query string.',
    'ru-ru': 'Поиск значений, начинающихся с заданной строки запроса.',
    'es-es':
      'Busque valores que comiencen con una cadena de consulta determinada.',
    'fr-fr': `
      Rechercher des valeurs qui commencent par une chaîne de requête donnée.
    `,
    'uk-ua': 'Пошук значень, які починаються з заданого рядка запиту.',
    'de-ch': `
      Suchen Sie nach Werten, die mit einer bestimmten Abfragezeichenfolge
      beginnen.
    `,
  },
  containsInsensitive: {
    'en-us': 'Contains (case-insensitive)',
    'ru-ru': 'Содержит (без учета регистра)',
    'es-es': 'Contiene (no distingue entre mayúsculas y minúsculas)',
    'fr-fr': 'Contient (insensible à la casse)',
    'uk-ua': 'Містить (незалежно від регістру)',
    'de-ch': 'Enthält (ohne Berücksichtigung der Groß-/Kleinschreibung)',
  },
  containsCaseSensitive: {
    'en-us': 'Contains (case-sensitive)',
    'ru-ru': 'Содержит (с учетом регистра)',
    'es-es': 'Contiene (distingue entre mayúsculas y minúsculas)',
    'fr-fr': 'Contient (sensible à la casse)',
    'uk-ua': 'Містить (з урахуванням регістру)',
    'de-ch': 'Enthält (Groß-/Kleinschreibung beachten)',
  },
  containsDescription: {
    'en-us': `
      Search for values that contain a given query string (case-insensitive).
    `,
    'ru-ru': `
      Поиск значений, содержащих заданную строку запроса (без учета регистра).
    `,
    'es-es': `
      Busque valores que contengan una cadena de consulta dada (sin distinción
      entre mayúsculas y minúsculas).
    `,
    'fr-fr': `
      Recherche les valeurs contenant une chaîne de requête donnée (insensible à
      la casse).
    `,
    'uk-ua': `
      Пошук значень, які містять заданий рядок запиту (незалежно від регістру).
    `,
    'de-ch': `
      Suchen Sie nach Werten, die eine bestimmte Abfragezeichenfolge enthalten
      (ohne Berücksichtigung der Groß- und Kleinschreibung).
    `,
  },
  containsCaseSensitiveDescription: {
    'en-us':
      'Search for values that contain a given query string (case-sensitive).',
    'ru-ru': `
      Поиск значений, содержащих заданную строку запроса (с учетом регистра).
    `,
    'es-es': `
      Busque valores que contengan una cadena de consulta determinada (sensible
      a mayúsculas y minúsculas).
    `,
    'fr-fr': `
      Recherche des valeurs contenant une chaîne de requête donnée (sensible à
      la casse).
    `,
    'uk-ua': `
      Пошук значень, які містять заданий рядок запиту (з урахуванням регістру).
    `,
    'de-ch': `
      Suchen Sie nach Werten, die eine bestimmte Abfragezeichenfolge enthalten
      (Groß-/Kleinschreibung beachten).
    `,
  },
  containsSecondDescription: {
    'en-us': `
      Can use _ to match any single character or % to match any number of
      characters
    `,
    'ru-ru': `
      Можно использовать _ для соответствия любому символу или % для
      соответствия любому количеству символов
    `,
    'es-es': `
      Puede usar _ para hacer coincidir cualquier carácter único o % para hacer
      coincidir cualquier número de caracteres
    `,
    'fr-fr': `
      Peut utiliser _ pour correspondre à n'importe quel caractère ou % pour
      correspondre à n'importe quel nombre de caractères
    `,
    'uk-ua': `
      Можна використовувати _ для відповідності будь-якому одному символу або %
      для відповідності будь-якій кількості символів
    `,
    'de-ch': `
      Kann _ verwenden, um ein beliebiges einzelnes Zeichen zu finden, oder %,
      um eine beliebige Anzahl von Zeichen zu finden
    `,
  },
  highlightMatch: {
    'en-us': 'Highlight matched substring',
    'ru-ru': 'Выделить совпадающую подстроку',
    'es-es': 'Resaltar subcadena coincidente',
    'fr-fr': 'Mettre en surbrillance la sous-chaîne correspondante',
    'uk-ua': 'Виділіть відповідний підрядок',
    'de-ch': 'Markieren Sie die übereinstimmende Teilzeichenfolge',
  },
  languageDescription: {
    'en-us': 'Determines field captions, usage notes and table captions',
    'ru-ru': `
      Определяет заголовки полей, примечания по использованию и заголовки таблиц
    `,
    'es-es': `
      Determina los títulos de los campos, las notas de uso y los títulos de las
      tablas
    `,
    'fr-fr': `
      Détermine les légendes des champs, les notes d'utilisation et les légendes
      des tableaux
    `,
    'uk-ua':
      'Визначає підписи полів, примітки щодо використання та підписи таблиць',
    'de-ch': `
      Bestimmt Feldbeschriftungen, Nutzungshinweise und Tabellenbeschriftungen
    `,
  },
  showDialogIcon: {
    'en-us': 'Show icon in the header',
    'ru-ru': 'Показать значок в шапке',
    'es-es': 'Mostrar icono en el encabezado',
    'fr-fr': "Afficher l'icône dans l'en-tête",
    'uk-ua': 'Показати значок у заголовку',
    'de-ch': 'Symbol in der Kopfzeile anzeigen',
  },
  scaleInterface: {
    'en-us': 'Scale Interface',
    'ru-ru': 'Масштаб интерфейса',
    'es-es': 'Interfaz de escala',
    'fr-fr': "Interface d'échelle",
    'uk-ua': 'Інтерфейс масштабування',
    'de-ch': 'Waagenschnittstelle',
  },
  scaleInterfaceDescription: {
    'en-us': 'Scale interface to match font size',
    'ru-ru': 'Масштабировать интерфейс, чтобы он соответствовал размеру шрифта',
    'es-es': 'Escale la interfaz para que coincida con el tamaño de fuente',
    'fr-fr': `
      Mettre l'interface à l'échelle pour correspondre à la taille de la police
    `,
    'uk-ua': 'Масштабувати інтерфейс відповідно до розміру шрифту',
    'de-ch':
      'Skalieren Sie die Benutzeroberfläche entsprechend der Schriftgröße',
  },
  welcomePage: {
    'en-us': 'Home Page',
    'ru-ru': 'Страница Приветствия',
    'es-es': 'Página de inicio',
    'fr-fr': "Page d'accueil",
    'uk-ua': 'Домашня сторінка',
    'de-ch': 'Startseite',
  },
  content: {
    'en-us': 'Content',
    'ru-ru': 'Содержание',
    'es-es': 'Contenido',
    'fr-fr': 'Contenu',
    'uk-ua': 'Зміст',
    'de-ch': 'Inhalt',
  },
  defaultImage: {
    'en-us': 'Specify Logo',
    'ru-ru': 'Логотип Specify',
    'es-es': 'Especificar logotipo',
    'fr-fr': 'Logo de Specify',
    'uk-ua': 'Вкажіть логотип',
    'de-ch': 'Logo angeben',
  },
  customImage: {
    'en-us': 'Custom Image',
    'ru-ru': 'Произвольное Изображение',
    'es-es': 'Imagen personalizada',
    'fr-fr': 'Image personnalisée',
    'uk-ua': 'Спеціальне зображення',
    'de-ch': 'Benutzerdefiniertes Bild',
  },
  embeddedWebpage: {
    'en-us': 'Embedded web page',
    'ru-ru': 'Обернутая веб-страница',
    'es-es': 'página web integrada',
    'fr-fr': 'Page Web intégrée',
    'uk-ua': 'Вбудована веб-сторінка',
    'de-ch': 'Eingebettete Webseite',
  },
  embeddedWebpageDescription: {
    'en-us': 'A URL to a page that would be embedded on the home page:',
    'ru-ru': 'URL-адрес страницы, которая будет встроена в домашнюю страницу:',
    'es-es':
      'Una URL a una página que estaría incrustada en la página de inicio:',
    'fr-fr': "Une URL vers une page qui serait intégrée à la page d'accueil :",
    'uk-ua': 'URL-адреса сторінки, яка буде вбудована на домашній сторінці:',
    'de-ch': `
      Eine URL zu einer Seite, die in die Startseite eingebettet werden würde:
    `,
  },
  behavior: {
    'en-us': 'Behavior',
    'ru-ru': 'Поведение',
    'es-es': 'Comportamiento',
    'fr-fr': 'Comportement',
    'uk-ua': 'Поведінка',
    'de-ch': 'Verhalten',
  },
  noRestrictionsMode: {
    'en-us': 'No restrictions mode',
    'ru-ru': 'Режим без ограничений',
    'es-es': 'Modo sin restricciones',
    'fr-fr': 'Mode sans restriction',
    'uk-ua': 'Режим без обмежень',
    'de-ch': 'Kein Einschränkungsmodus',
  },
  noRestrictionsModeWbDescription: {
    'en-us': 'Allows uploading data to any field in any table.',
    'ru-ru': 'Позволяет загружать данные в любое поле любой таблицы.',
    'es-es': 'Permite subir datos a cualquier campo de cualquier tabla.',
    'fr-fr': `
      Permet de télécharger des données dans n'importe quel champ de n'importe
      quelle table.
    `,
    'uk-ua': 'Дозволяє завантажувати дані в будь-яке поле будь-якої таблиці.',
    'de-ch':
      'Ermöglicht das Hochladen von Daten in jedes Feld in jeder Tabelle.',
  },
  noRestrictionsModeQueryDescription: {
    'en-us': 'Allows querying data from any field in any table.',
    'ru-ru': 'Позволяет видеть данные из любого поля в любой таблице.',
    'es-es': 'Permite consultar datos de cualquier campo de cualquier tabla.',
    'fr-fr': `
      Permet d'interroger les données de n'importe quel champ dans n'importe
      quelle table.
    `,
    'uk-ua': 'Дозволяє запитувати дані з будь-якого поля будь-якої таблиці.',
    'de-ch':
      'Ermöglicht die Abfrage von Daten aus jedem Feld in jeder Tabelle.',
  },
  noRestrictionsModeWarning: {
    'en-us': `
      WARNING: enabling this may lead to data loss or database corruption.
      Please make sure you know what you are doing
    `,
    'ru-ru': `
      ВНИМАНИЕ: включение этого параметра может привести к потере данных или
      повреждению базы данных. Пожалуйста, убедитесь, что вы знаете, что делаете
    `,
    'es-es': `
      ADVERTENCIA: habilitar esto puede provocar la pérdida de datos o la
      corrupción de la base de datos. Por favor, asegúrese de saber lo que está
      haciendo
    `,
    'fr-fr': `
      AVERTISSEMENT : l'activation de cette option peut entraîner une perte de
      données ou une corruption de la base de données. Veuillez vous assurer que
      vous savez ce que vous faites
    `,
    'uk-ua': `
      ПОПЕРЕДЖЕННЯ: увімкнення цієї функції може призвести до втрати даних або
      пошкодження бази даних. Переконайтеся, що ви знаєте, що робите
    `,
    'de-ch': `
      ACHTUNG: Die Aktivierung kann zu Datenverlust oder Datenbankbeschädigung
      führen. Bitte stellen Sie sicher, dass Sie wissen, was Sie tun
    `,
  },
  adminsOnlyPreference: {
    'en-us': "You don't have permission to change this option",
    'ru-ru': 'У вас недостаточно прав для изменения этого параметра.',
    'es-es': 'No tiene permiso para cambiar esta opción',
    'fr-fr': "Vous n'avez pas l'autorisation de modifier cette option",
    'uk-ua': 'Ви не маєте дозволу змінювати цей параметр',
    'de-ch': 'Sie sind nicht berechtigt, diese Option zu ändern',
  },
  stickyScrolling: {
    'en-us': 'Sticky scroll bar',
    'ru-ru': 'Липкая полоса прокрутки',
    'es-es': 'Barra de desplazamiento pegajosa',
    'fr-fr': 'Barre de défilement collante',
    'uk-ua': 'Липка смуга прокрутки',
    'de-ch': 'Klebrige Bildlaufleiste',
  },
  foreground: {
    'en-us': 'Foreground',
    'ru-ru': 'Передний план',
    'es-es': 'Primer plano',
    'fr-fr': 'Premier plan',
    'uk-ua': 'Передній план',
    'de-ch': 'Vordergrund',
  },
  background: {
    'en-us': 'Background',
    'ru-ru': 'Задний план',
    'es-es': 'Antecedentes',
    'fr-fr': 'Arrière-plan',
    'uk-ua': 'Фон',
    'de-ch': 'Hintergrund',
  },
  darkForeground: {
    'en-us': 'Foreground (dark theme)',
    'ru-ru': 'Передний план (темная тема)',
    'es-es': 'Primer plano (tema oscuro)',
    'fr-fr': 'Premier plan (thème sombre)',
    'uk-ua': 'Передній план (темна тема)',
    'de-ch': 'Vordergrund (dunkles Thema)',
  },
  darkBackground: {
    'en-us': 'Background (dark theme)',
    'ru-ru': 'Задний план (темная тема)',
    'es-es': 'Fondo (tema oscuro)',
    'fr-fr': 'Arrière-plan (thème sombre)',
    'uk-ua': 'Фон (темна тема)',
    'de-ch': 'Hintergrund (dunkles Thema)',
  },
  accentColor1: {
    'en-us': 'Accent color 1',
    'ru-ru': 'Акцентный цвет 1',
    'es-es': 'color de acento 1',
    'fr-fr': "Couleur d'accentuation 1",
    'uk-ua': 'Акцентний колір 1',
    'de-ch': 'Akzentfarbe 1',
  },
  accentColor2: {
    'en-us': 'Accent color 2',
    'ru-ru': 'Акцентный цвет 2',
    'es-es': 'Color de acento 2',
    'fr-fr': "Couleur d'accentuation 2",
    'uk-ua': 'Акцентний колір 2',
    'de-ch': 'Akzentfarbe 2',
  },
  accentColor3: {
    'en-us': 'Accent color 3',
    'ru-ru': 'Акцентный цвет 3',
    'es-es': 'Color de acento 3',
    'fr-fr': "Couleur d'accentuation 3",
    'uk-ua': 'Акцентний колір 3',
    'de-ch': 'Akzentfarbe 3',
  },
  accentColor4: {
    'en-us': 'Accent color 4',
    'ru-ru': 'Акцентный цвет 4',
    'es-es': 'color de acento 4',
    'fr-fr': "Couleur d'accentuation 4",
    'uk-ua': 'Акцентний колір 4',
    'de-ch': 'Akzentfarbe 4',
  },
  accentColor5: {
    'en-us': 'Accent color 5',
    'ru-ru': 'Акцентный цвет 5',
    'es-es': 'color de acento 5',
    'fr-fr': "Couleur d'accentuation 5",
    'uk-ua': 'Акцентний колір 5',
    'de-ch': 'Akzentfarbe 5',
  },
  spreadsheet: {
    'en-us': 'Spreadsheet',
    'ru-ru': 'Таблица',
    'es-es': 'Hoja de cálculo',
    'fr-fr': 'Feuille de calcul',
    'uk-ua': 'Електронна таблиця',
    'de-ch': 'Kalkulationstabelle',
  },
  minSpareRows: {
    'en-us': 'Number of blank rows at the end',
    'ru-ru': 'Количество пустых строк внизу',
    'es-es': 'Número de filas en blanco al final',
    'fr-fr': 'Nombre de lignes vides à la fin',
    'uk-ua': 'Кількість порожніх рядків у кінці',
    'de-ch': 'Anzahl der leeren Zeilen am Ende',
  },
  autoWrapCols: {
    'en-us': 'Navigate to the other side when reaching the edge column',
    'ru-ru': 'Перейты на другую сторону, когда достигнете краевого столбца.',
    'es-es': 'Navegue hacia el otro lado al llegar a la columna de borde',
    'fr-fr':
      "Naviguez de l'autre côté lorsque vous atteignez la colonne de bord",
    'uk-ua': 'Перейдіть на іншу сторону, коли досягнете краю колонки',
    'de-ch':
      'Navigieren Sie auf die andere Seite, wenn Sie die Randsäule erreichen',
  },
  autoWrapRows: {
    'en-us': 'Navigate to the other side when reaching the edge row',
    'ru-ru': 'Перейты на другую сторону, когда достигнете краевого ряда',
    'es-es': 'Navegar al otro lado al llegar a la fila del borde',
    'fr-fr':
      "Naviguez de l'autre côté lorsque vous atteignez la rangée de bord",
    'uk-ua': 'Перейдіть на іншу сторону, коли досягнете крайнього ряду',
    'de-ch':
      'Navigieren Sie auf die andere Seite, wenn Sie die Randreihe erreichen',
  },
  enterBeginsEditing: {
    'en-us': 'Enter key begins editing cell',
    'ru-ru': 'Клавиша Enter начинает редактирование ячейки',
    'es-es': 'La tecla Intro comienza a editar la celda',
    'fr-fr': 'La touche Entrée commence à modifier la cellule',
    'uk-ua': 'Клавіша Enter починає редагування клітинки',
    'de-ch': 'Die Eingabetaste beginnt mit der Bearbeitung der Zelle',
  },
  tabMoveDirection: {
    'en-us': 'Direction of movement when <key>Tab</key> key is pressed',
    'ru-ru': 'Направление движения при нажатии клавиши <key>Tab</key>',
    'es-es':
      'Dirección de movimiento cuando se presiona la tecla <key>Tab</key>',
    'fr-fr': 'Sens du mouvement lorsque la touche <key>Tab</key> est enfoncée',
    'uk-ua': 'Напрямок руху при натисканні клавіші <key>Tab</key>',
    'de-ch': 'Bewegungsrichtung, wenn die Taste <key>Tab</key> gedrückt wird',
  },
  tabMoveDirectionDescription: {
    'en-us': `
      You can move in the opposite direction by pressing
      <key>Shift</key>+<key>Tab</key>
    `,
    'ru-ru': `
      Вы можете двигаться в противоположном направлении, нажав
      <key>Shift</key>+<key>Tab</key>
    `,
    'es-es': `
      Puedes moverte en la dirección opuesta presionando
      <key>Shift</key>+<key>Tab</key>
    `,
    'fr-fr': `
      Vous pouvez vous déplacer dans la direction opposée en appuyant sur
      <key>Shift</key>+<key>Tab</key>
    `,
    'uk-ua': `
      Ви можете рухатися в протилежному напрямку, натискаючи
      <key>Shift</key>+<key>Tab</key>
    `,
    'de-ch': `
      Sie können sich in die entgegengesetzte Richtung bewegen, indem Sie
      <key>Umschalttaste</key>+<key>Tabulatortaste</key> drücken.
    `,
  },
  column: {
    'en-us': 'Column',
    'ru-ru': 'Столбец',
    'es-es': 'Columna',
    'fr-fr': 'Colonne',
    'uk-ua': 'Колонка',
    'de-ch': 'Spalte',
  },
  row: {
    'en-us': 'Row',
    'ru-ru': 'Ряд',
    'es-es': 'Fila',
    'fr-fr': 'Ligne',
    'uk-ua': 'рядок',
    'de-ch': 'Reihe',
  },
  enterMoveDirection: {
    'en-us': 'Direction of movement when <key>Enter</key> key is pressed',
    'ru-ru': 'Направление движения при нажатии клавиши <key>Enter</key>',
    'es-es':
      'Dirección de movimiento cuando se presiona la tecla <key>Enter</key>',
    'fr-fr':
      'Sens du mouvement lorsque la touche <key>Enter</key> est enfoncée',
    'uk-ua': 'Напрямок руху, коли натиснуто клавішу <key>Enter</key>',
    'de-ch': 'Bewegungsrichtung, wenn die Taste <key>Enter</key> gedrückt wird',
  },
  enterMoveDirectionDescription: {
    'en-us': `
      You can move in the opposite direction by pressing
      <key>Shift</key>+<key>Enter</key>
    `,
    'ru-ru': `
      Вы можете двигаться в противоположном направлении, нажав
      <key>Shift</key>+<key>Enter</key>
    `,
    'es-es': `
      Puedes moverte en la dirección opuesta presionando
      <key>Shift</key>+<key>Enter</key>
    `,
    'fr-fr': `
      Vous pouvez vous déplacer dans la direction opposée en appuyant sur
      <key>Maj</key>+<key>Entrée</key>
    `,
    'uk-ua': `
      Ви можете рухатися в протилежному напрямку, натиснувши
      <key>Shift</key>+<key>Enter</key>
    `,
    'de-ch': `
      Sie können sich in die entgegengesetzte Richtung bewegen, indem Sie
      <key>Umschalt</key>+<key>Eingabetaste</key> drücken.
    `,
  },
  filterPickLists: {
    'en-us': 'Filter pick list items',
    'ru-ru': 'Отфильтровать элементы списка выбора',
    'es-es': 'Filtrar elementos de la lista de selección',
    'fr-fr': 'Filtrer les éléments de la liste de sélection',
    'uk-ua': 'Фільтр вибору елементів списку',
    'de-ch': 'Auswahllistenelemente filtern',
  },
  exportFileDelimiter: {
    'en-us': 'Export file delimiter',
    'ru-ru': 'Разделитель полей в файле экспорта',
    'es-es': 'Delimitador de archivo de exportación',
    'fr-fr': "Délimiteur du fichier d'exportation",
    'uk-ua': 'Роздільник файлу експорту',
    'de-ch': 'Trennzeichen für Exportdateien',
  },
  caseSensitive: {
    'en-us': 'Case-sensitive',
    'ru-ru': 'С учетом регистра',
    'es-es': 'Distingue mayúsculas y minúsculas',
    'fr-fr': 'Sensible à la casse',
    'uk-ua': 'Чутливий до регістру',
    'de-ch': 'Groß- und Kleinschreibung beachten',
  },
  caseInsensitive: {
    'en-us': 'Case-insensitive',
    'ru-ru': 'Без учета регистра',
    'es-es': 'no distingue entre mayúsculas y minúsculas',
    'fr-fr': 'Insensible à la casse',
    'uk-ua': 'Регістр не враховується',
    'de-ch': 'Groß- und Kleinschreibung wird nicht beachtet',
  },
  showNoReadTables: {
    'en-us': 'Show tables without "Read" access',
    'ru-ru': 'Показать таблицы без доступа «Чтение»',
    'es-es': 'Mostrar tablas sin acceso de "Lectura"',
    'fr-fr': 'Afficher les tableaux sans accès "Lecture"',
    'uk-ua': 'Показувати таблиці до яких ви не маєте «Читання» доступу',
    'de-ch': 'Tabellen ohne Lesezugriff anzeigen',
  },
  showNoAccessTables: {
    'en-us': 'Show tables without "Create" access',
    'ru-ru': 'Показать таблицы без доступа «Создать»',
    'es-es': 'Mostrar tablas sin acceso "Crear"',
    'fr-fr': 'Afficher les tableaux sans accès "Créer"',
    'uk-ua': 'Показувати таблиці до яких ви не маєте «Створити» достопу',
    'de-ch': 'Tabellen ohne „Erstellen“-Zugriff anzeigen',
  },
  textAreaAutoGrow: {
    'en-us': 'Text boxes grow automatically',
    'ru-ru': 'Текстовое поле увеличивается автоматически',
    'es-es': 'Los cuadros de texto crecen automáticamente',
    'fr-fr': 'Les zones de texte grandissent automatiquement',
    'uk-ua': 'Текстові поля збільшуються автоматично',
    'de-ch': 'Textfelder wachsen automatisch',
  },
  clearQueryFilters: {
    'en-us': 'Reset query filters',
    'ru-ru': 'Очистить фильтры запросов',
    'es-es': 'Restablecer filtros de consulta',
    'fr-fr': 'Réinitialiser les filtres de requête',
    'uk-ua': 'Скинути фільтри запитів',
    'de-ch': 'Abfragefilter zurücksetzen',
  },
  autoGrowAutoComplete: {
    'en-us': 'Allow autocomplete to grow as wide as need',
    'ru-ru': `
      Разрешить автозаполнение расширяться настолько, насколько это необходимо
    `,
    'es-es': 'Permita que el autocompletado crezca tanto como sea necesario',
    'fr-fr':
      "Autoriser la saisie semi-automatique à s'étendre autant que nécessaire",
    'uk-ua': `
      Дозвольте автозаповненню розширюватися настільки, наскільки це потрібно
    `,
    'de-ch':
      'Erlauben Sie der Autovervollständigung, so weit wie nötig zu wachsen',
  },
  tableNameInTitle: {
    'en-us': 'Include table name in the browser page title',
    'ru-ru': 'Включить название таблицы в заголовок страницы браузера',
    'es-es':
      'Incluir el nombre de la tabla en el título de la página del navegador',
    'fr-fr':
      'Inclure le nom de la table dans le titre de la page du navigateur',
    'uk-ua': 'Включіть назву таблиці в заголовок сторінки браузера',
    'de-ch': 'Fügen Sie den Tabellennamen in den Seitentitel des Browsers ein',
  },
  focusFirstField: {
    'en-us': 'Focus first field',
    'de-ch': 'Fokussieren Sie das erste Feld',
    'es-es': 'Centrar primer campo',
    'fr-fr': 'Concentrez-vous sur le premier champ',
    'ru-ru': 'Сфокусировать первое поле',
    'uk-ua': 'Сфокусувати перше поле',
  },
  doubleClickZoom: {
    'en-us': 'Double click to zoom',
    'ru-ru': 'Дважды щелкните, чтобы увеличить',
    'es-es': 'Doble clic para hacer zoom',
    'fr-fr': 'Double clic pour effectuer un zoom avant',
    'uk-ua': 'Двічі клацніть, щоб збільшити',
    'de-ch': 'Zum Zoomen doppelklicken',
  },
  closePopupOnClick: {
    'en-us': 'Close pop-up on outside click',
    'ru-ru': 'Закрыть всплывающее окно по внешнему клику',
    'es-es': 'Cerrar ventana emergente al hacer clic fuera',
    'fr-fr': 'Fermer la pop-up en cas de clic extérieur',
    'uk-ua': 'Закрити спливаюче вікно при зовнішньому клацанні',
    'de-ch': 'Popup bei externem Klick schließen',
  },
  animateTransitions: {
    'en-us': 'Animate transitions',
    'ru-ru': 'Анимация переходов',
    'es-es': 'Animar transiciones',
    'fr-fr': 'Animer les transitions',
    'uk-ua': 'Анімація переходів',
    'de-ch': 'Übergänge animieren',
  },
  panInertia: {
    'en-us': 'Pan inertia',
    'ru-ru': 'Инерция панорамирования',
    'es-es': 'Pan inercia',
    'fr-fr': 'Pan inertie',
    'uk-ua': 'Інерція панорами',
    'de-ch': 'Pan-Trägheit',
  },
  mouseDrags: {
    'en-us': 'Mouse drags',
    'ru-ru': 'Мышь может двигать карту',
    'es-es': 'Ratón arrastra',
    'fr-fr': 'La souris traîne',
    'uk-ua': 'Мишка тягне',
    'de-ch': 'Maus zieht',
  },
  scrollWheelZoom: {
    'en-us': 'Scroll wheel zoom',
    'ru-ru': 'Колесо прокрутки может масштабировать',
    'es-es': 'Zoom de la rueda de desplazamiento',
    'fr-fr': 'Zoom de la molette de défilement',
    'uk-ua': 'Масштаб колеса прокрутки',
    'de-ch': 'Scrollrad-Zoom',
  },
  flexibleColumnWidth: {
    'en-us': 'Flexible column width',
    'ru-ru': 'Гибкая ширина столбцов',
    'es-es': 'Ancho de columna flexible',
    'fr-fr': 'Largeur de colonne flexible',
    'uk-ua': 'Гнучка ширина колонки',
    'de-ch': 'Flexible Spaltenbreite',
  },
  flexibleSubGridColumnWidth: {
    'en-us': 'Flexible subview grid column width',
    'ru-ru': 'Гибкая ширина столбцов в сетке подвидa',
    'es-es': 'Ancho de columna de cuadrícula de subvista flexible',
    'fr-fr': 'Largeur de colonne de grille de sous-vue flexible',
    'uk-ua': 'Гнучка ширина стовпця сітки вкладеного перегляду',
    'de-ch': 'Flexible Spaltenbreite im Unteransichtsraster',
  },
  closeOnEsc: {
    'en-us': 'Close on <key>ESC</key> key press',
    'ru-ru': 'Закрыть при нажатии клавиши <key>ESC</key>',
    'es-es': 'Cerrar al pulsar la tecla <key>ESC</key>',
    'fr-fr': 'Fermer en appuyant sur la touche <key>ESC</key>',
    'uk-ua': 'Закривати після натискання клавіші <key>ESC</key>',
    'de-ch': 'Schließen Sie beim Drücken der Taste <key>ESC</key>.',
  },
  closeOnOutsideClick: {
    'en-us': 'Close on outside click',
    'ru-ru': 'Закрыть по внешнему клику',
    'es-es': 'Cerrar al hacer clic fuera',
    'fr-fr': 'Fermer sur clic extérieur',
    'uk-ua': 'Закрийте зовнішнім клацанням',
    'de-ch': 'Mit Außenklick schließen',
  },
  specifyNetworkBadge: {
    'en-us': 'Specify Network Badge',
    'ru-ru': 'Значок «Specify Network»',
    'es-es': 'Especificar credencial de red',
    'fr-fr': 'Spécifiez le badge réseau',
    'uk-ua': 'Укажіть позначку мережі',
    'de-ch': 'Geben Sie das Netzwerk-Badge an',
  },
  useAccessibleFullDatePicker: {
    'en-us': 'Use accessible full date picker',
    'ru-ru': 'Включить умный полный выбор даты',
    'es-es': 'Usar selector de fecha completa accesible',
    'fr-fr': 'Utiliser un sélecteur de date complète accessible',
    'uk-ua': 'Використовуйте доступний повний засіб вибору дати',
    'de-ch': 'Verwenden Sie die zugängliche vollständige Datumsauswahl',
  },
  useAccessibleMonthPicker: {
    'en-us': 'Use accessible month picker',
    'ru-ru': 'Включить умный выбор месяца',
    'es-es': 'Usar selector de mes accesible',
    'fr-fr': 'Utiliser un sélecteur de mois accessible',
    'uk-ua': 'Використовуйте доступний засіб вибору місяця',
    'de-ch': 'Verwenden Sie die barrierefreie Monatsauswahl',
  },
  rightAlignNumberFields: {
    'en-us': 'Right-Justify numeric fields',
    'ru-ru': 'Выровнять числовые поля по правому краю',
    'es-es': 'Campos numéricos justificados a la derecha',
    'fr-fr': 'Champs numériques justifiés à droite',
    'uk-ua': 'Вирівнювання по правому краю числових полів',
    'de-ch': 'Numerische Felder rechtsbündig ausrichten',
  },
  roundedCorners: {
    'en-us': 'Rounded corners',
    'ru-ru': 'Закругленные углы',
    'es-es': 'Esquinas redondeadas',
    'fr-fr': 'Coins arrondis',
    'uk-ua': 'Заокруглені кути',
    'de-ch': 'Abgerundete Ecken',
  },
  limitMaxFieldWidth: {
    'en-us': 'Limit max field width',
    'ru-ru': 'Ограничить максимальную ширину поля',
    'es-es': 'Limitar ancho de campo máximo',
    'fr-fr': 'Limiter la largeur de champ maximale',
    'uk-ua': 'Обмеження максимальної ширини поля',
    'de-ch': 'Begrenzen Sie die maximale Feldbreite',
  },
  condenseQueryResults: {
    'en-us': 'Condense query results',
    'ru-ru': 'Сжатые результаты',
    'es-es': 'Condensar los resultados de la consulta',
    'fr-fr': 'Condenser les résultats de la requête',
    'uk-ua': 'Згорнути результати запиту',
    'de-ch': 'Komprimieren Sie die Abfrageergebnisse',
  },
  blurContentBehindDialog: {
    'en-us': 'Blur content behind the dialog',
    'ru-ru': 'Размыть содержимое за диалогом',
    'es-es': 'Desenfoque de contenido detrás del diálogo',
    'fr-fr': 'Flou du contenu derrière la boîte de dialogue',
    'uk-ua': 'Розмити вміст за діалоговим вікном',
    'de-ch': 'Verwischen Sie den Inhalt hinter dem Dialog',
  },
  collectionSortOrderDescription: {
    'en-us': 'This determines the visual order of collections',
    'ru-ru': 'Это определяет порядок коллекций',
    'es-es': 'Determina el orden visual de las colecciones',
    'fr-fr': "Ceci détermine l'ordre visuel des collections",
    'uk-ua': 'Це визначає візуальний порядок колекцій',
    'de-ch': 'Dies bestimmt die visuelle Reihenfolge der Sammlungen',
  },
  recordSetRecordToOpen: {
    'en-us': 'Record to open by default',
    'ru-ru': 'Запись для открытия по умолчанию',
    'es-es': 'Registro para abrir por defecto',
    'fr-fr': 'Enregistrement à ouvrir par défaut',
    'uk-ua': 'Запис відкривається за умовчанням',
    'de-ch': 'Datensatz wird standardmäßig geöffnet',
  },
  altClickToSupressNewTab: {
    'en-us':
      '<key>{altKeyName:string}</key>+<key>Click</key> to suppress new tab',
    'ru-ru': `
      <key>{altKeyName:string}</key>+<key>Клик</key>, чтобы скрыть новую вкладку
    `,
    'es-es': `
      <key>{altKeyName:string}</key>+<key>Haga clic en </key> para suprimir la
      nueva pestaña
    `,
    'fr-fr': `
      <key>{altKeyName:string}</key>+<key>Cliquez sur</key> pour supprimer le
      nouvel onglet
    `,
    'uk-ua': `
      <key>{altKeyName:string}</key>+<key>Натисніть </key>, щоб закрити нову
      вкладку
    `,
    'de-ch': `
      <key>{altKeyName:string}</key>+<key>Klicken Sie auf </key>, um die neue
      Registerkarte zu unterdrücken
    `,
  },
  altClickToSupressNewTabDescription: {
    'en-us': `
      <key>{altKeyName:string}</key>+<key>Click</key> on a link that normally
      opens in a new tab to open it in the current tab
    `,
    'ru-ru': `
      <key>{altKeyName:string}</key>+<key>Клик</key> на ссылку, которая обычно
      открывается в новой вкладке, чтобы открыть ее в текущей вкладке
    `,
    'es-es': `
      <key>{altKeyName:string}</key>+<key>Haga clic en </key> en un enlace que
      normalmente se abre en una pestaña nueva para abrirlo en la pestaña actual
    `,
    'fr-fr': `
      <key>{altKeyName:string}</key>+<key>Cliquez</key> sur un lien qui s'ouvre
      normalement dans un nouvel onglet pour l'ouvrir dans l'onglet actuel
    `,
    'uk-ua': `
      <key>{altKeyName:string}</key>+<key>Натисніть</key> на посилання, яке
      зазвичай відкривається в новій вкладці, щоб відкрити його в поточній
      вкладці
    `,
    'de-ch': `
      <key>{altKeyName:string}</key>+<key>Klicken Sie auf</key> auf einen Link,
      der normalerweise in einem neuen Tab geöffnet wird, um ihn im aktuellen
      Tab zu öffnen
    `,
  },
  makeFormDialogsModal: {
    'en-us': 'Make form dialogs gray out the background',
    'ru-ru': 'Сделать диалоги формы серым фоном',
    'es-es': 'Hacer que los diálogos de formulario atenúen el fondo',
    'fr-fr': "Griser l'arrière-plan des boîtes de dialogue de formulaire",
    'uk-ua': 'Зробити фон діалогових вікон сірими',
    'de-ch': 'Lassen Sie Formulardialoge den Hintergrund ausgrauen',
  },
  autoScrollTree: {
    'en-us': 'Auto scroll tree to focused node',
    'ru-ru':
      'Автоматически прокручивать страницу до сфокусированного узла дерева',
    'es-es': 'Árbol de desplazamiento automático al nodo enfocado',
    'fr-fr': "Défilement automatique de l'arborescence vers le nœud ciblé",
    'uk-ua':
      'Автоматично перемістити зображену частину дерева до виділеного вузла',
    'de-ch': 'Automatischer Bildlauf im Baum zum fokussierten Knoten',
  },
  lineWrap: {
    'en-us': 'Line wrap',
    'ru-ru': 'Перенос строк',
    'es-es': 'Envoltura de línea',
    'fr-fr': 'Retour à la ligne',
    'uk-ua': 'Переносити лінії',
    'de-ch': 'Zeilenumbruch',
  },
  indentSize: {
    'en-us': 'Indent size',
    'ru-ru': 'Размер отступа',
    'es-es': 'Tamaño de sangría',
    'fr-fr': 'Taille du retrait',
    'uk-ua': 'Розмір відступу',
    'de-ch': 'Einzugsgröße',
  },
  indentWithTab: {
    'en-us': 'Indent with <key>Tab</key>',
    'ru-ru': 'Используйте <key>Tab</key> для отступа',
    'es-es': 'Aplicar sangría con <key>Tab</key>',
    'fr-fr': 'Retrait avec <key>Tab</key>',
    'uk-ua': '<key>Tab</key> добавляє відступ',
    'de-ch': 'Mit <key>Tab</key> einrücken',
  },
  formHeaderFormat: {
    'en-us': 'Form header format',
    'ru-ru': 'Формат заголовка формы',
    'es-es': 'Formato de encabezado de formulario',
    'fr-fr': "Format d'en-tête de formulaire",
    'uk-ua': 'Формат заголовка форми',
    'de-ch': 'Formularkopfformat',
  },
  iconAndTableName: {
    'en-us': 'Icon and table name',
    'ru-ru': 'Иконка и название таблицы',
    'es-es': 'Icono y nombre de la tabla',
    'fr-fr': 'Icône et nom du tableau',
    'uk-ua': 'Значок і назва таблиці',
    'de-ch': 'Symbol und Tabellenname',
  },
  tableIcon: {
    'en-us': 'Table icon',
    'ru-ru': 'Иконка таблицы',
    'es-es': 'icono de mesa',
    'fr-fr': 'Icône du tableau',
    'uk-ua': 'Значок таблиці',
    'de-ch': 'Tabellensymbol',
  },
  maxHeight: {
    'en-us': 'Max height',
    'ru-ru': 'Максимальная высота',
    'es-es': 'Altura máxima',
    'fr-fr': 'Hauteur maximale',
    'uk-ua': 'Максимальна висота',
    'de-ch': 'maximale Höhe',
  },
  autoComplete: {
    'en-us': 'Auto complete',
    'ru-ru': 'Автозаполнение',
    'es-es': 'Autocompletar',
    'fr-fr': 'Saisie automatique',
    'uk-ua': 'Автоматичне завершення',
    'de-ch': 'Automatische Vervollständigung',
  },
  searchCaseSensitive: {
    'en-us': 'Case-sensitive search',
    'ru-ru': 'С учетом регистра',
    'es-es': 'Búsqueda sensible a mayúsculas y minúsculas',
    'fr-fr': 'Recherche sensible à la casse',
    'uk-ua': 'Пошук з урахуванням регістру',
    'de-ch': 'Groß- und Kleinschreibung beachtende Suche',
  },
  searchField: {
    'en-us': 'Search field',
    'ru-ru': 'Поле поиска',
    'es-es': 'Campo de búsqueda',
    'fr-fr': 'Champ de recherche',
    'uk-ua': 'Поле пошуку',
    'de-ch': 'Suchfeld',
  },
  createInteractions: {
    'en-us': 'Creating an interaction',
    'ru-ru': 'Создать взаимодействия',
    'es-es': 'Crear interacciones',
    'fr-fr': 'Créer des interactions',
    'uk-ua': 'Створення взаємодії',
    'de-ch': 'Eine Interaktion erstellen',
  },
  useSpaceAsDelimiter: {
    'en-us': 'Use space as delimiter',
    'ru-ru': 'Использовать пробел как разделитель',
    'es-es': 'Usar espacio como delimitador',
    'fr-fr': "Utiliser l'espace comme délimiteur",
    'uk-ua': 'Використовувати пробіл як роздільник',
    'de-ch': 'Verwenden Sie Leerzeichen als Trennzeichen',
  },
  useCommaAsDelimiter: {
    'en-us': 'Use comma as delimiter',
    'ru-ru': 'Использовать запятую как разделитель',
    'es-es': 'Usar coma como delimitador',
    'fr-fr': 'Utiliser la virgule comme délimiteur',
    'uk-ua': 'Використовувати кому як роздільник',
    'de-ch': 'Verwenden Sie Komma als Trennzeichen',
  },
  useNewLineAsDelimiter: {
    'en-us': 'Use new line as delimiter',
    'ru-ru': 'Использовать новую строку как разделитель',
    'es-es': 'Usar nueva línea como delimitador',
    'fr-fr': 'Utiliser une nouvelle ligne comme délimiteur',
    'uk-ua': 'Використовувати новий рядок як роздільник',
    'de-ch': 'Verwenden Sie eine neue Zeile als Trennzeichen',
  },
  useCustomDelimiters: {
    'en-us': 'Use custom delimiters',
    'ru-ru': 'Использовать пользовательские разделители',
    'es-es': 'Usar delimitadores personalizados',
    'fr-fr': 'Utiliser des délimiteurs personnalisés',
    'uk-ua': 'Використовувати спеціальні роздільники',
    'de-ch': 'Verwenden Sie benutzerdefinierte Trennzeichen',
  },
  useCustomDelimitersDescription: {
    'en-us': `
      A list of delimiters to use, in addition to the ones defined above. Put
      one delimiter per line
    `,
    'ru-ru': `
      Список разделителей, которые будут использоваться в дополнение к тем,
      которые определены выше. Поместите один разделитель на строку
    `,
    'es-es': `
      Una lista de delimitadores a utilizar, además de los definidos
      anteriormente. Pon un delimitador por línea
    `,
    'fr-fr': `
      Une liste de délimiteurs à utiliser, en plus de ceux définis ci-dessus.
      Mettre un délimiteur par ligne
    `,
    'uk-ua': `
      Список роздільників, які слід використовувати додатково до тих що є
      визначеними вище. Вкажіть один роздільник на рядок
    `,
    'de-ch': `
      Eine Liste von Trennzeichen, die zusätzlich zu den oben definierten
      verwendet werden sollen. Geben Sie ein Trennzeichen pro Zeile ein
    `,
  },
  detectAutomaticallyDescription: {
    'en-us': 'Detect automatically based on catalog number format',
    'ru-ru': 'Определить автоматически на основе формата номера каталога',
    'es-es': 'Detectar automáticamente según el formato del número de catálogo',
    'fr-fr':
      'Détecter automatiquement en fonction du format du numéro de catalogue',
    'uk-ua': "Визначати автоматично на основі формату номеру об'єкта",
    'de-ch': 'Automatische Erkennung basierend auf dem Katalognummernformat',
  },
  use: {
    comment: 'Verb',
    'en-us': 'Use',
    'ru-ru': 'Использовать',
    'es-es': 'Usar',
    'fr-fr': 'Utiliser',
    'uk-ua': 'Використовувати',
    'de-ch': 'Verwenden',
  },
  dontUse: {
    'en-us': 'Don’t use',
    'ru-ru': 'Не использовать',
    'es-es': 'no usar',
    'fr-fr': 'Ne pas utiliser',
    'uk-ua': 'Не використовувати',
    'de-ch': 'Nicht verwenden',
  },
  position: {
    'en-us': 'Position',
    'es-es': 'Posición',
    'fr-fr': 'Position',
    'ru-ru': 'Позиция',
    'uk-ua': 'Позиція',
    'de-ch': 'Position',
  },
  top: {
    'en-us': 'Top',
    'es-es': 'Arriba',
    'fr-fr': 'Haut',
    'ru-ru': 'Вершина',
    'uk-ua': 'Топ',
    'de-ch': 'Spitze',
  },
  bottom: {
    'en-us': 'Bottom',
    'es-es': 'Abajo',
    'fr-fr': 'Bas',
    'ru-ru': 'Нижний',
    'uk-ua': 'Дно',
    'de-ch': 'Unterseite',
  },
  left: {
    'en-us': 'Left',
    'es-es': 'Izquierda',
    'fr-fr': 'Gauche',
    'ru-ru': 'Левый',
    'uk-ua': 'Ліворуч',
    'de-ch': 'Links',
  },
  right: {
    'en-us': 'Right',
    'es-es': 'Derecha',
    'fr-fr': 'Droite',
    'ru-ru': 'Верно',
    'uk-ua': 'правильно',
    'de-ch': 'Rechts',
  },
  showUnsavedIndicator: {
    'en-us': 'Show unsaved changes indicator',
    'ru-ru': 'Показывать индикатор несохраненных изменений',
    'es-es': 'Mostrar el indicador de cambios no guardados',
    'fr-fr': "Afficher l'indicateur de modifications non enregistrées",
    'uk-ua': 'Показати індикатор незбережених змін',
    'de-ch': 'Anzeige für nicht gespeicherte Änderungen anzeigen',
  },
  showUnsavedIndicatorDescription: {
    'en-us': `
      Show an "*" in the tab title when there are unsaved changes in the current
      tab
    `,
    'es-es': `
      Mostrar un "*" en el título de la pestaña cuando hay cambios sin guardar
      en la pestaña actual
    `,
    'fr-fr': `
      Afficher un \"*\" dans le titre de l'onglet lorsqu'il y a des
      modifications non enregistrées dans l'onglet actuel
    `,
    'ru-ru': `
      Показывать «*» в заголовке вкладки, если на текущей вкладке есть
      несохраненные изменения
    `,
    'uk-ua': `
      Показувати «*» у заголовку вкладки, якщо в поточній вкладці є незбережені
      зміни
    `,
    'de-ch': `
      Zeigt im Tab-Titel ein „*“ an, wenn im aktuellen Tab nicht gespeicherte
      Änderungen vorhanden sind
    `,
  },
  autoPopulateDescription: {
    'en-us':
      'Auto populate the merged record with values from duplicates when opening the merging dialog',
    'ru-ru':
      'Автоматически заполнять объединенную запись значениями из дубликатов при открытии диалога объединения',
  },
  autoCreateVariants: {
    'en-us': 'Automatically create {agentVariantTable:string} records',
    'ru-ru': 'Автоматически создавать {agentVariantTable:string} записи',
  },
  autoCreateVariantsDescription: {
    'en-us': `
      When merging agents, automatically create {agentVariantTable:string}
      records based on on the variations of first name/last name.
    `,
    'ru-ru': `
      При слиянии агентов, автоматически создавать {agentVariantTable:string}
      записи на основе вариаций имени/фамилии.
    `,
  },
  collectionPreferences: {
    'en-us': 'Collection Preferences',
    'de-ch': 'Sammlungseinstellungen',
    'es-es': 'Preferencias de colección',
    'fr-fr': 'Préférences de collecte',
    'ru-ru': 'Настройки коллекции',
    'uk-ua': 'Налаштування колекції',
  },
  rememberDialogSizes: {
    'en-us': 'Remember dialog window sizes',
    'ru-ru': 'Запоминать размеры диалоговых окон',
    'es-es': 'Recuerde los tamaños de las ventanas de diálogo',
    'fr-fr': 'Se souvenir des tailles des fenêtres de dialogue',
    'uk-ua': 'Запам’ятовувати розміри діалогових вікон',
    'de-ch': 'Denken Sie an die Größe der Dialogfenster',
  },
  rememberDialogPositions: {
    'en-us': 'Remember dialog window positions',
    'ru-ru': 'Запоминать позиции диалоговых окон',
    'es-es': 'Recuerde las posiciones de las ventanas de diálogo',
    'fr-fr': 'Se souvenir des positions des fenêtres de dialogue',
    'uk-ua': 'Запам’ятовувати позиції діалогових вікон',
    'de-ch': 'Merken Sie sich die Positionen der Dialogfenster',
  },
  autoPlayMedia: {
    'en-us': 'Automatically play media',
    'ru-ru': 'Автоматически воспроизводить медиа',
    'es-es': 'Reproducir automáticamente medios',
    'fr-fr': 'Lecture automatique des médias',
    'uk-ua': 'Автоматично відтворювати медіа',
    'de-ch': 'Medien automatisch abspielen',
  },
  useCustomTooltips: {
    'en-us': 'Use modern tooltips',
    'ru-ru': 'Использовать современные подсказки',
    'es-es': 'Usar modernos tooltips',
    'fr-fr': 'Utiliser des infobulles modernes',
    'uk-ua': 'Використовувати сучасні підказки',
    'de-ch': 'Nutzen Sie moderne Tooltips',
  },
  url: {
    'en-us': 'URL',
    'de-ch': 'URL',
    'es-es': 'URL',
    'fr-fr': 'URL',
    'ru-ru': 'URL-адрес',
    'uk-ua': 'URL',
  },
  pickAttachment: {
    'en-us': 'Pick an attachment',
    'de-ch': 'Wählen Sie einen Anhang',
    'es-es': 'Elige un archivo adjunto',
    'fr-fr': 'Choisissez une pièce jointe',
    'ru-ru': 'Выберите вложение',
    'uk-ua': 'Виберіть вкладення',
  },
  attachmentFailed: {
    'en-us': 'The attachment failed to load.',
    'de-ch': 'Der Anhang konnte nicht geladen werden.',
    'es-es': 'El archivo adjunto no se pudo cargar.',
    'fr-fr': "La pièce jointe n'a pas pu être chargée.",
    'ru-ru': 'Не удалось загрузить вложение.',
    'uk-ua': 'Не вдалося завантажити вкладений файл.',
  },
  pickImage: {
    'en-us': 'Pick an image',
    'de-ch': 'Wählen Sie ein Bild aus',
    'es-es': 'Elige una imagen',
    'fr-fr': 'Choisissez une image',
    'ru-ru': 'Выберите изображение',
    'uk-ua': 'Виберіть зображення',
  },
  customLogo: {
    'en-us': 'Expanded Image URL',
    'de-ch': 'Erweiterte Bild-URL',
    'es-es': 'URL de imagen expandida',
    'fr-fr': "URL de l'image développée",
    'ru-ru': 'URL-адрес расширенного изображения',
    'uk-ua': 'Розширена URL-адреса зображення',
  },
  customLogoCollapsed: {
    'en-us': 'Collapsed Image URL',
    'de-ch': 'URL des minimierten Bildes',
    'es-es': 'URL de la imagen contraída',
    'fr-fr': "URL de l'image réduite",
    'ru-ru': 'URL свернутого изображения',
    'uk-ua': 'URL-адреса згорнутого зображення',
  },
  customLogoDescription: {
    'en-us': `
      A URL to an image that would be displayed next to the Specify logo in the
      navigation menu
    `,
    'de-ch': `
      Eine URL zu einem Bild, das neben dem Specify-Logo im Navigationsmenü
      angezeigt wird
    `,
    'es-es': `
      Una URL a una imagen que se mostraría junto al logotipo de Especificar en
      el menú de navegación
    `,
    'fr-fr': `
      Une URL vers une image qui serait affichée à côté du logo Spécifier dans
      le menu de navigation
    `,
    'ru-ru': `
      URL-адрес изображения, которое будет отображаться рядом с логотипом
      Specify в меню навигации.
    `,
    'uk-ua': `
      URL-адреса зображення, яке відображатиметься поруч із «Вказати логотип» у
      меню навігації
    `,
  },
  saveButtonColor: {
    'en-us': 'Save button color',
    'de-ch': 'Schaltflächenfarbe speichern',
    'es-es': 'Guardar color del botón',
    'fr-fr': 'Enregistrer la couleur du bouton',
    'ru-ru': 'Сохранить цвет кнопки',
    'uk-ua': 'Зберегти колір кнопки',
  },
  secondaryButtonColor: {
    'en-us': 'Secondary button color',
    'de-ch': 'Farbe der sekundären Schaltfläche',
    'es-es': 'Color del botón secundario',
    'fr-fr': 'Couleur du bouton secondaire',
    'ru-ru': 'Вторичный цвет кнопки',
    'uk-ua': 'Колір вторинної кнопки',
  },
  secondaryLightButtonColor: {
    'en-us': 'Secondary light button color',
    'de-ch': 'Farbe der Sekundärlichttaste',
    'es-es': 'Color del botón de luz secundaria',
    'fr-fr': "Couleur du bouton d'éclairage secondaire",
    'ru-ru': 'Цвет кнопки вторичного света',
    'uk-ua': 'Колір вторинної світлової кнопки',
  },
  dangerButtonColor: {
    'en-us': 'Danger button color',
    'de-ch': 'Farbe der Gefahrentaste',
    'es-es': 'Color del botón de peligro',
    'fr-fr': 'Couleur du bouton de danger',
    'ru-ru': 'Цвет кнопки опасности',
    'uk-ua': 'Колір кнопки небезпеки',
  },
  infoButtonColor: {
    'en-us': 'Info button color',
    'de-ch': 'Farbe der Infoschaltfläche',
    'es-es': 'Color del botón de información',
    'fr-fr': "Couleur du bouton d'information",
    'ru-ru': 'Цвет кнопки информации',
    'uk-ua': 'Колір інформаційної кнопки',
  },
  warningButtonColor: {
    'en-us': 'Warning button color',
    'de-ch': 'Farbe der Warntaste',
    'es-es': 'Color del botón de advertencia',
    'fr-fr': "Couleur du bouton d'avertissement",
    'ru-ru': 'Цвет кнопки предупреждения',
    'uk-ua': 'Колір кнопки попередження',
  },
  successButtonColor: {
    'en-us': 'Success button color',
    'de-ch': 'Farbe der Erfolgsschaltfläche',
    'es-es': 'Color del botón de éxito',
    'fr-fr': 'Couleur du bouton de réussite',
    'ru-ru': 'Цвет кнопки успеха',
    'uk-ua': 'Колір кнопки успіху',
  },
  displayBasicView: {
    'en-us': 'Display basic view',
  },
  basicView: {
    'en-us': 'Basic view',
  },
  detailedView: {
    'en-us': 'Detailed view',
  },
  attachmentPreviewMode: {
    'en-us': 'Attachment preview mode',
    'de-ch': 'Anhang-Vorschaumodus',
    'es-es': 'Modo de vista previa de archivos adjuntos',
    'fr-fr': "Mode d'aperçu des pièces jointes",
    'ru-ru': 'Режим предварительного просмотра вложения',
    'uk-ua': 'Режим попереднього перегляду вкладених файлів',
  },
  fullResolution: {
    'en-us': 'Full Resolution',
    'de-ch': 'Komplettlösung',
    'es-es': 'Resolución completa',
    'fr-fr': 'Pleine résolution',
    'ru-ru': 'Полное разрешение',
    'uk-ua': 'Повна роздільна здатність',
  },
  thumbnail: {
    'en-us': 'Thumbnail',
    'de-ch': 'Miniaturansicht',
    'es-es': 'Miniatura',
    'fr-fr': 'Vignette',
    'ru-ru': 'Миниатюра',
    'uk-ua': 'Мініатюра',
  },
  addSearchBarHomePage: {
    'en-us': 'Add Search Bar on home page',
  },
} as const);
