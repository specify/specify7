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
    'ru-ru': 'Предпочтения',
    'es-es': 'Preferencias',
    'fr-fr': 'Préférences',
    'uk-ua': 'Уподобання',
    'de-ch': 'Einstellungen',
  },
  customization: {
    'en-us': 'Customization',
    'ru-ru': 'Кастомизация',
    'es-es': 'Personalización',
    'fr-fr': 'Personnalisation',
    'uk-ua': 'Налаштування',
    'de-ch': 'Anpassung',
  },
  userPreferences: {
    'en-us': 'User Preferences',
    'ru-ru': 'Пользовательские настройки',
    'es-es': 'Preferencias del usuario',
    'fr-fr': "Préférences de l'utilisateur",
    'uk-ua': 'Налаштування користувача',
    'de-ch': 'Benutzereinstellungen',
  },
  defaultUserPreferences: {
    'en-us': 'Default User Preferences',
    'ru-ru': 'Настройки пользователя по умолчанию',
    'es-es': 'Preferencias de usuario predeterminadas',
    'fr-fr': 'Préférences utilisateur par défaut',
    'uk-ua': 'Параметри користувача за умовчанням',
    'de-ch': 'Standardbenutzereinstellungen',
  },
  general: {
    'en-us': 'General',
    'ru-ru': 'Пользовательское изображение',
    'es-es': 'Imagen personalizada',
    'fr-fr': 'Image personnalisée',
    'uk-ua': 'Спеціальне зображення',
    'de-ch': 'Allgemein',
  },
  ui: {
    'en-us': 'User Interface',
    'ru-ru': 'Пользовательский интерфейс',
    'es-es': 'Interfaz de usuario',
    'fr-fr': 'Interface utilisateur',
    'uk-ua': 'Інтерфейс користувача',
    'de-ch': 'Benutzeroberfläche',
  },
  theme: {
    'en-us': 'Theme',
    'ru-ru': 'Тема',
    'es-es': 'Tema',
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
    'ru-ru': 'Копирует значение из настроек вашей операционной системы.',
    'es-es': 'Copia el valor de la configuración de tu sistema operativo',
    'fr-fr': "Copie la valeur des paramètres de votre système d'exploitation",
    'uk-ua': 'Копіює значення з налаштувань вашої операційної системи',
    'de-ch': 'Übernimmt den Wert aus Ihren Betriebssystemeinstellungen',
  },
  light: {
    comment: 'Light mode',
    'en-us': 'Light',
    'ru-ru': 'Свет',
    'es-es': 'Luz',
    'fr-fr': 'Lumière',
    'uk-ua': 'світло',
    'de-ch': 'Hell',
  },
  dark: {
    comment: 'Dark mode',
    'en-us': 'Dark',
    'ru-ru': 'Темный',
    'es-es': 'Oscuro',
    'fr-fr': 'Sombre',
    'uk-ua': 'Темний',
    'de-ch': 'Dunkel',
  },
  reduceMotion: {
    'en-us': 'Reduce motion',
    'ru-ru': 'Уменьшите движение',
    'es-es': 'Reducir el movimiento',
    'fr-fr': 'Réduire les mouvements',
    'uk-ua': 'Зменшити рух',
    'de-ch': 'Bewegung reduzieren',
  },
  reduceMotionDescription: {
    'en-us': 'Disable non-essential animations and transitions.',
    'ru-ru': 'Отключите несущественные анимации и переходы.',
    'es-es': 'Deshabilitar animaciones y transiciones no esenciales.',
    'fr-fr': 'Désactivez les animations et les transitions non essentielles.',
    'uk-ua': "Вимкніть необов'язкову анімацію та переходи.",
    'de-ch': 'Nicht erforderliche Animationen und Übergänge deaktivieren.',
  },
  reduceTransparency: {
    'en-us': 'Reduce transparency',
    'ru-ru': 'Уменьшить прозрачность',
    'es-es': 'Reducir la transparencia',
    'fr-fr': 'Réduire la transparence',
    'uk-ua': 'Зменшити прозорість',
    'de-ch': 'Transparenz reduzieren',
  },
  reduceTransparencyDescription: {
    'en-us': `
      Whether to disable translucent backgrounds for user interface components
      whenever possible (e.g. table headers in tree view).
    `,
    'ru-ru': `
      Следует ли отключать полупрозрачный фон для компонентов пользовательского
      интерфейса, когда это возможно (например, заголовки таблиц в древовидном
      представлении).
    `,
    'es-es': `
      Si se deben deshabilitar los fondos translúcidos para los componentes de
      la interfaz de usuario siempre que sea posible (por ejemplo, encabezados
      de tablas en la vista de árbol).
    `,
    'fr-fr': `
      S'il faut désactiver les arrière-plans translucides pour les composants de
      l'interface utilisateur chaque fois que possible (par exemple, les
      en-têtes de tableau dans l'arborescence).
    `,
    'uk-ua': `
      Чи вимикати напівпрозорий фон для компонентів інтерфейсу користувача, коли
      це можливо (наприклад, заголовки таблиць у перегляді дерева).
    `,
    'de-ch': `
      Durchsichtige Hintergründe für Benutzeroberflächenkomponenten wann immer
      möglich deaktivieren (z. B. Tabellenüberschriften in der Baumansicht).
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
    'ru-ru': 'Увеличивать',
    'es-es': 'Aumentar',
    'fr-fr': 'Augmenter',
    'uk-ua': 'Збільшити',
    'de-ch': 'Erhöhen',
  },
  reduce: {
    'en-us': 'Reduce',
    'ru-ru': 'Уменьшать',
    'es-es': 'Reducir',
    'fr-fr': 'Réduire',
    'uk-ua': 'Зменшити',
    'de-ch': 'Verringern',
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
    'fr-fr': 'Taille de police',
    'uk-ua': 'Розмір шрифту',
    'de-ch': 'Schriftgrösse',
  },
  fontFamily: {
    'en-us': 'Font family',
    'ru-ru': 'Семейство шрифтов',
    'es-es': 'Familia tipográfica',
    'fr-fr': 'Famille de polices',
    'uk-ua': 'Сімейство шрифтів',
    'de-ch': 'Schrift-Familie',
  },
  fontFamilyDescription: {
    'en-us': `
      You can specify any font that is on your computer, even if it is not in
      the list.
      A comma-separated list of fonts is also supported, where each subsequent 
      font will be used if the previous one is not available.
    `,
    'ru-ru': `
      Вы можете указать любой шрифт, который есть на вашем компьютере, даже если
      его нет в списке. Также поддерживается список шрифтов, разделенный
      запятыми, где будет использоваться второй шрифт, если первый недоступен и
      т. д.
    `,
    'es-es': `
      Puede especificar cualquier fuente que esté en su computadora, incluso si
      no está en la lista. También se admite una lista de fuentes separadas por
      comas, donde se usaría la segunda fuente si la primera no está
      disponible, etc.
    `,
    'fr-fr': `
      Vous pouvez spécifier n'importe quelle police présente sur votre
      ordinateur, même si elle ne figure pas dans la liste. Une liste de polices
      séparées par des virgules est également prise en charge, la deuxième
      police étant utilisée si la première n'est pas disponible, etc.
    `,
    'uk-ua': `
      Ви можете вказати будь-який шрифт, який є на вашому комп'ютері, навіть
      якщо його немає в списку. Також підтримується розділений комами список
      шрифтів, у якому використовуватиметься другий шрифт, якщо перший
      недоступний тощо.
    `,
    'de-ch': `
      Sie können jede Schriftart angeben, die sich auf Ihrem Computer befindet,
      auch wenn diese nicht in der Liste enthalten ist. Eine durch Kommas
      getrennte Liste von Schriftarten wird ebenfalls unterstützt, wobei die
      zweite Schriftart verwendet wird, wenn die erste nicht verfügbar ist usw.
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
    'es-es': 'Ancho máximo del formulario',
    'fr-fr': 'Largeur maximale du formulaire',
    'uk-ua': 'Максимальна ширина форми',
    'de-ch': 'Maximale Formularbreite',
  },
  fieldBackgrounds: {
    'en-us': 'Field backgrounds',
    'ru-ru': 'Полевые фоны',
    'es-es': 'Fondos de campo',
    'fr-fr': 'Milieux de terrain',
    'uk-ua': 'Польові фони',
    'de-ch': 'Feldhintergründe',
  },
  fieldBackground: {
    'en-us': 'Field background',
    'ru-ru': 'Фон поля',
    'es-es': 'Fondo de campo',
    'fr-fr': 'Contexte du terrain',
    'uk-ua': 'Поле фону',
    'de-ch': 'Feldhintergrund',
  },
  disabledFieldBackground: {
    'en-us': 'Disabled field background',
    'ru-ru': 'Отключен фон поля',
    'es-es': 'Fondo de campo deshabilitado',
    'fr-fr': 'Fond de champ désactivé',
    'uk-ua': 'Вимкнений фон поля',
    'de-ch': 'Deaktivierter Feldhintergrund',
  },
  invalidFieldBackground: {
    'en-us': 'Invalid field background',
    'ru-ru': 'Неверный фон поля',
    'es-es': 'Fondo de campo no válido',
    'fr-fr': 'Fond de champ invalide',
    'uk-ua': 'Недійсний фон поля',
    'de-ch': 'Ungültiger Feldhintergrund',
  },
  requiredFieldBackground: {
    'en-us': 'Required field background',
    'ru-ru': 'Обязательный фон поля',
    'es-es': 'Antecedentes del campo requerido',
    'fr-fr': 'Contexte du champ obligatoire',
    'uk-ua': "Обов'язковий фон поля",
    'de-ch': 'Feldhintergrund erforderlich',
  },
  darkFieldBackground: {
    'en-us': 'Field background (dark theme)',
    'ru-ru': 'Фон поля (темная тема)',
    'es-es': 'Fondo de campo (tema oscuro)',
    'fr-fr': 'Fond de champ (thème sombre)',
    'uk-ua': 'Фон поля (темна тема)',
    'de-ch': 'Feldhintergrund (Dunkles Thema)',
  },
  darkDisabledFieldBackground: {
    'en-us': 'Disabled field background (dark theme)',
    'ru-ru': 'Отключен фон поля (темная тема)',
    'es-es': 'Fondo de campo deshabilitado (tema oscuro)',
    'fr-fr': 'Fond de champ désactivé (thème sombre)',
    'uk-ua': 'Вимкнений фон поля (темна тема)',
    'de-ch': 'Deaktivierter Feldhintergrund (Dunkles Thema)',
  },
  darkInvalidFieldBackground: {
    'en-us': 'Invalid field background (dark theme)',
    'ru-ru': 'Гибкая ширина столбца сетки подпредставления',
    'es-es': 'Ancho de columna de cuadrícula de subvista flexible',
    'fr-fr': 'Largeur de colonne de grille de sous-vue flexible',
    'uk-ua': 'Гнучка ширина стовпця сітки вкладеного перегляду',
    'de-ch': 'Ungültiger Feldhintergrund (Dunkles Thema)',
  },
  darkRequiredFieldBackground: {
    'en-us': 'Required field background (dark theme)',
    'ru-ru': 'Обязательный фон поля (темная тема)',
    'es-es': 'Fondo de campo obligatorio (tema oscuro)',
    'fr-fr': 'Fond de champ obligatoire (thème sombre)',
    'uk-ua': 'Обов’язковий фон поля (темна тема)',
    'de-ch': 'Feldhintergrund erforderlich (Dunkles Thema)',
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
    'ru-ru': 'Появление',
    'es-es': 'Apariencia',
    'fr-fr': 'Apparence',
    'uk-ua': 'Зовнішній вигляд',
    'de-ch': 'Aussehen',
  },
  buttonsLight: {
    'en-us': 'Buttons (light mode)',
    'de-ch': 'Buttons (Helles Thema)',
    'es-es': 'Botones (modo de luz)',
    'fr-fr': 'Boutons (mode lumière)',
    'ru-ru': 'Кнопки (светлый режим)',
    'uk-ua': 'Кнопки (світлий режим)',
  },
  buttonsDark: {
    'en-us': 'Buttons (dark mode)',
    'de-ch': 'Buttons (Dunkles Thema)',
    'es-es': 'Botones (modo oscuro)',
    'fr-fr': 'Boutons (mode sombre)',
    'ru-ru': 'Кнопки (темный режим)',
    'uk-ua': 'Кнопки (темний режим)',
  },
  translucentDialog: {
    'en-us': 'Translucent dialogs',
    'ru-ru': 'Полупрозрачные диалоги',
    'es-es': 'Diálogos translúcidos',
    'fr-fr': 'Dialogues translucides',
    'uk-ua': 'Напівпрозорі діалоги',
    'de-ch': 'Durchscheinende Dialoge',
  },
  translucentDialogDescription: {
    'en-us': 'Whether dialogs have translucent background.',
    'ru-ru': 'Имеют ли диалоги полупрозрачный фон.',
    'es-es': 'Si los diálogos tienen un fondo translúcido.',
    'fr-fr': 'Si les boîtes de dialogue ont un fond translucide.',
    'uk-ua': 'Чи мають діалоги прозорий фон.',
    'de-ch': 'Dialogfenster mit durchscheinenden Hintergrund.',
  },
  alwaysPrompt: {
    'en-us': 'Always prompt to choose collection',
    'ru-ru': 'Всегда подскажут выбрать коллекцию',
    'es-es': 'Siempre se le pide que elija la colección.',
    'fr-fr': 'Toujours invité à choisir la collection',
    'uk-ua': 'Завжди підкажуть вибрати колекцію',
    'de-ch': 'Immer zur Auswahl der Sammlung auffordern',
  },
  treeEditor: {
    'en-us': 'Tree Editor',
    'ru-ru': 'Редактор дерева',
    'es-es': 'Editor de árbol',
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
    'fr-fr': 'Synonyme couleur',
    'uk-ua': 'Синонім кольору',
    'de-ch': 'Synonymfarbe',
  },
  showNewDataSetWarning: {
    'en-us': 'Show new Data Set warning',
    'ru-ru': 'Показать новое предупреждение набора данных',
    'es-es': 'Mostrar nueva advertencia de conjunto de datos',
    'fr-fr': "Afficher un nouvel avertissement sur l'ensemble de données",
    'uk-ua': 'Показати попередження про новий набір даних',
    'de-ch': 'Warnung für neuen Datensatz anzeigen',
  },
  showNewDataSetWarningDescription: {
    'en-us': 'Show an informational message when creating a new Data Set.',
    'ru-ru':
      'Показывать информационное сообщение при создании нового набора данных.',
    'es-es':
      'Mostrar un mensaje informativo al crear un nuevo conjunto de datos.',
    'fr-fr': `
      Afficher un message d'information lors de la création d'un nouvel ensemble
      de données.
    `,
    'uk-ua': `
      Показувати інформаційне повідомлення під час створення нового набору даних.
    `,
    'de-ch': 'Zeige eine Meldung beim erstellen eines neuen Datensatzes an.',
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
    'ru-ru': 'Приложение',
    'es-es': 'Solicitud',
    'fr-fr': 'Application',
    'uk-ua': 'застосування',
    'de-ch': 'Anwendung',
  },
  allowDismissingErrors: {
    'en-us': 'Allow dismissing error messages',
    'ru-ru': 'Разрешить скрывать сообщения об ошибках',
    'es-es': 'Permitir descartar mensajes de error',
    'fr-fr': "Autoriser le rejet des messages d'erreur",
    'uk-ua': 'Дозволити закривати повідомлення про помилки',
    'de-ch': 'Erlaube das Verwerfen von Fehlermeldungen',
  },
  updatePageTitle: {
    'en-us': 'Update page title',
    'ru-ru': 'Обновить заголовок страницы',
    'es-es': 'Actualizar título de página',
    'fr-fr': 'Mettre à jour le titre de la page',
    'uk-ua': 'Оновити назву сторінки',
    'de-ch': 'Seitentitel aktualisieren',
  },
  updatePageTitleDescription: {
    'en-us':
      "Whether to update the title of the page to match dialog's header.",
    'ru-ru': `
      Следует ли обновлять заголовок страницы, чтобы он соответствовал заголовку
      диалогового окна.
    `,
    'es-es': `
      Si se debe actualizar el título de la página para que coincida con el
      encabezado del diálogo.
    `,
    'fr-fr': `
      S'il faut mettre à jour le titre de la page pour qu'il corresponde à
      l'en-tête de la boîte de dialogue.
    `,
    'uk-ua':
      'Чи оновлювати назву сторінки відповідно до заголовка діалогового вікна.',
    'de-ch': `
      Titel der Seite so aktualisieren, dass er mit der Kopfzeile des Dialogs
      übereinstimmt.
    `,
  },
  updatePageTitleFormDescription: {
    'en-us': 'Whether to update the title of the page to match current record.',
    'ru-ru':
      'Обновлять ли заголовок страницы в соответствии с текущей записью.',
    'es-es': `
      Si se debe actualizar el título de la página para que coincida con el
      registro actual.
    `,
    'fr-fr': `
      S'il faut mettre à jour le titre de la page pour qu'il corresponde à
      l'enregistrement actuel.
    `,
    'uk-ua': 'Чи оновлювати назву сторінки відповідно до поточного запису.',
    'de-ch': `
      Titel der Seite aktualisieren, damit er mit dem aktuellen Datensatz
      übereinstimmt.
    `,
  },
  queryComboBox: {
    'en-us': 'Query Combo Box',
    'ru-ru': 'Поле со списком запроса',
    'es-es': 'Cuadro combinado de consulta',
    'uk-ua': 'Поле зі списком запитів',
    'de-ch': 'Kombinationsfeld für Abfragen',
    'fr-fr': 'Zone de liste déroulante de requête',
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
    'ru-ru': 'Алгоритм поиска (для связей с древовидными таблицами)',
    'es-es': 'Algoritmo de búsqueda (para relaciones con tablas de árbol)',
    'fr-fr': `
      Algorithme de recherche (pour les relations avec les tables arborescentes)
    `,
    'uk-ua': 'Алгоритм пошуку (для зв’язків із деревоподібними таблицями)',
    'de-ch': 'Suchalgorithmus (für Beziehungen mit Baumtabellen)',
  },
  startsWithInsensitive: {
    'en-us': 'Starts With (case-insensitive)',
    'ru-ru': 'Начинается с (регистронезависимо)',
    'es-es': 'Comienza con (no distingue entre mayúsculas y minúsculas)',
    'fr-fr': 'Commence par (insensible à la casse)',
    'uk-ua': 'Починається з (без урахування регістру)',
    'de-ch': 'Beginnt mit (ohne Berücksichtigung der Groß-/Kleinschreibung)',
  },
  startsWithDescription: {
    'en-us': 'Search for values that begin with a given query string.',
    'ru-ru': 'Поиск значений, которые начинаются с заданной строки запроса.',
    'es-es':
      'Buscar valores que comiencen con una cadena de consulta determinada.',
    'fr-fr':
      'Rechercher des valeurs commençant par une chaîne de requête donnée.',
    'uk-ua': 'Пошук значень, які починаються з заданого рядка запиту.',
    'de-ch': `
      Suchen Sie nach Werten, die mit einer bestimmten Abfragezeichenfolge
      beginnen.
    `,
  },
  startsWithCaseSensitive: {
    'en-us': 'Starts With (case-sensitive)',
    'ru-ru': 'Начинается с (с учетом регистра)',
    'es-es': 'Comienza con (distingue entre mayúsculas y minúsculas)',
    'fr-fr': 'Commence par (sensible à la casse)',
    'uk-ua': 'Починається з (з урахуванням регістру)',
    'de-ch': 'Beginnt mit (Groß-/Kleinschreibung beachten)',
  },
  startsWithCaseSensitiveDescription: {
    'en-us': 'Search for values that begin with a given query string.',
    'ru-ru': 'Поиск значений, которые начинаются с заданной строки запроса.',
    'es-es': 'Utilice el selector de meses accesible.',
    'fr-fr': `
      Recherchez les valeurs qui commencent par une chaîne de requête donnée.
    `,
    'uk-ua': 'Пошук значень, які починаються з заданого рядка запиту.',
    'de-ch': `
      Suche nach Werten, die mit einer bestimmten Abfragezeichenfolge beginnen.
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
      Busque valores que contengan una cadena de consulta determinada (no
      distingue entre mayúsculas y minúsculas).
    `,
    'uk-ua': `
      Пошук значень, які містять заданий рядок запиту (незалежно від регістру).
    `,
    'de-ch': `
      Suche nach Werten, die eine bestimmte Abfragezeichenfolge enthalten (ohne
      Berücksichtigung der Groß-/Kleinschreibung).
    `,
    'fr-fr': `
      Recherchez les valeurs contenant une chaîne de requête donnée (insensible
      à la casse).
    `,
  },
  containsCaseSensitiveDescription: {
    'en-us':
      'Search for values that contain a given query string (case-sensitive).',
    'ru-ru': `
      Поиск значений, содержащих заданную строку запроса (с учетом регистра).
    `,
    'es-es': `
      Busque valores que contengan una cadena de consulta determinada (distingue
      entre mayúsculas y minúsculas).
    `,
    'fr-fr': `
      Recherchez les valeurs contenant une chaîne de requête donnée (sensible à
      la casse).
    `,
    'uk-ua': `
      Пошук значень, які містять заданий рядок запиту (з урахуванням регістру).
    `,
    'de-ch': `
      Suche nach Werten, die eine bestimmte Abfragezeichenfolge enthalten
      (Groß-/Kleinschreibung beachten).
    `,
  },
  containsSecondDescription: {
    'en-us': `
      Can use _ to match any single character or % to match any number of
      characters.
    `,
    'ru-ru': `
      Можно использовать _ для соответствия любому отдельному символу или % для
      соответствия любому количеству символов.
    `,
    'es-es': `
      Puede usar _ para hacer coincidir cualquier carácter o % para hacer
      coincidir cualquier número de caracteres.
    `,
    'fr-fr': `
      Peut utiliser _ pour correspondre à n'importe quel caractère ou % pour
      correspondre à n'importe quel nombre de caractères.
    `,
    'uk-ua': `
      Можна використовувати _ для відповідності будь-якому одному символу або %
      для відповідності будь-якій кількості символів.
    `,
    'de-ch': `
      Kann _ für jedes einzelne Zeichen oder % für jede beliebige Anzahl von
      Zeichen verwenden.
    `,
  },
  highlightMatch: {
    'en-us': 'Highlight matched substring',
    'ru-ru': 'Выделить совпавшую подстроку',
    'es-es': 'Resaltar subcadena coincidente',
    'fr-fr': 'Mettre en surbrillance la sous-chaîne correspondante',
    'uk-ua': 'Виділіть відповідний підрядок',
    'de-ch': 'Übereinstimmende Teilzeichenfolge hervorheben',
  },
  languageDescription: {
    'en-us': 'Determines field captions, usage notes and table captions.',
    'ru-ru': `
      Определяет заголовки полей, примечания по использованию и заголовки
      таблиц.
    `,
    'es-es': 'Determina títulos de campos, notas de uso y títulos de tablas.',
    'fr-fr': `
      Détermine les légendes des champs, les notes d'utilisation et les légendes
      des tableaux.
    `,
    'uk-ua':
      'Визначає підписи полів, примітки щодо використання та підписи таблиць.',
    'de-ch': `
      Legt Feldüberschriften, Verwendungshinweise und Tabellenüberschriften fest.
    `,
  },
  showDialogIcon: {
    'en-us': 'Show icon in the header',
    'ru-ru': 'Показывать значок в шапке',
    'es-es': 'Mostrar icono en el encabezado',
    'fr-fr': "Afficher l'icône dans l'en-tête",
    'uk-ua': 'Показати значок у заголовку',
    'de-ch': 'Symbol in der Kopfzeile anzeigen',
  },
  scaleInterface: {
    'en-us': 'Scale Interface',
    'ru-ru': 'Масштабный интерфейс',
    'es-es': 'Interfaz de báscula',
    'fr-fr': 'Interface de balance',
    'uk-ua': 'Інтерфейс масштабу',
    'de-ch': 'Waagenschnittstelle',
  },
  scaleInterfaceDescription: {
    'en-us': 'Scale interface to match font size.',
    'ru-ru': 'Масштабируйте интерфейс в соответствии с размером шрифта.',
    'es-es': 'Escalar la interfaz para que coincida con el tamaño de fuente.',
    'fr-fr': "Adapter l'interface à la taille de la police.",
    'uk-ua': 'Масштабуйте інтерфейс відповідно до розміру шрифту.',
    'de-ch':
      'Skalieren Sie die Benutzeroberfläche entsprechend der Schriftgröße.',
  },
  welcomePage: {
    'en-us': 'Home Page',
    'ru-ru': 'Домашняя страница',
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
    'ru-ru': 'Укажите логотип',
    'es-es': 'Especificar logotipo',
    'fr-fr': 'Spécifier le logo',
    'uk-ua': 'Вкажіть логотип',
    'de-ch': 'Logo angeben',
  },
  customImage: {
    'en-us': 'Custom Image',
    'ru-ru': 'Пользовательское изображение',
    'es-es': 'Imagen personalizada',
    'fr-fr': 'Image personnalisée',
    'uk-ua': 'Спеціальне зображення',
    'de-ch': 'Benutzerdefiniertes Bild',
  },
  embeddedWebpage: {
    'en-us': 'Embedded web page',
    'ru-ru': 'Встроенная веб-страница',
    'es-es': 'Página web integrada',
    'fr-fr': 'Page Web intégrée',
    'uk-ua': 'Вбудована веб-сторінка',
    'de-ch': 'Eingebettete Webseite',
  },
  embeddedWebpageDescription: {
    'en-us': 'A URL to a page that would be embedded on the home page:',
    'ru-ru': 'URL-адрес страницы, которая будет встроена в домашнюю страницу:',
    'es-es':
      'Una URL a una página que estaría incrustada en la página de inicio:',
    'fr-fr': "Une URL vers une page qui serait intégrée à la page d'accueil :",
    'uk-ua': 'URL-адреса сторінки, яка буде вбудована на домашній сторінці:',
    'de-ch': `
      Eine URL zu einer Seite, die auf der Startseite eingebettet werden würde:
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
    'de-ch': 'Modus „Keine Einschränkungen“',
  },
  noRestrictionsModeWbDescription: {
    'en-us': 'Allows uploading data to any field in any table.',
    'ru-ru': 'Позволяет загружать данные в любое поле любой таблицы.',
    'es-es': 'Permite cargar datos en cualquier campo de cualquier tabla.',
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
    'ru-ru': 'Позволяет запрашивать данные из любого поля в любой таблице.',
    'es-es': 'Permite consultar datos de cualquier campo de cualquier tabla.',
    'fr-fr': `
      Permet d'interroger les données de n'importe quel champ de n'importe
      quelle table.
    `,
    'uk-ua': 'Дозволяє запитувати дані з будь-якого поля будь-якої таблиці.',
    'de-ch':
      'Ermöglicht das Abfragen von Daten aus jedem Feld in jeder Tabelle.',
  },
  noRestrictionsModeWarning: {
    'en-us': `
      WARNING: enabling this may lead to data loss or database corruption.
      Please make sure you know what you are doing.
    `,
    'ru-ru': `
      ВНИМАНИЕ: включение этого параметра может привести к потере данных или
      повреждению базы данных. Пожалуйста, убедитесь, что вы знаете, что делаете.
    `,
    'es-es': `
      ADVERTENCIA: habilitar esto puede provocar la pérdida de datos o la
      corrupción de la base de datos. Por favor asegúrese de saber lo que está
      haciendo.
    `,
    'uk-ua': `
      ПОПЕРЕДЖЕННЯ: увімкнення цієї функції може призвести до втрати даних або
      пошкодження бази даних. Переконайтеся, що ви знаєте, що робите.
    `,
    'de-ch': `
      ACHTUNG: Das Aktivieren dieser Option kann zu Datenverlust oder
      Datenbankbeschädigung führen. Bitte stellen Sie sicher, dass Sie wissen,
      was Sie tun.
    `,
    'fr-fr': `
      AVERTISSEMENT : l'activation de cette option peut entraîner une perte de
      données ou une corruption de la base de données. Veuillez vous assurer que
      vous savez ce que vous faites.
    `,
  },
  adminsOnlyPreference: {
    'en-us': "You don't have permission to change this option",
    'ru-ru': 'У вас нет разрешения на изменение этой опции.',
    'es-es': 'No tienes permiso para cambiar esta opción',
    'fr-fr': "Vous n'êtes pas autorisé à modifier cette option",
    'uk-ua': 'Ви не маєте дозволу змінювати цей параметр',
    'de-ch': 'Sie haben keine Berechtigung, diese Option zu ändern',
  },
  stickyScrolling: {
    'en-us': 'Sticky scroll bar',
    'ru-ru': 'Липкая полоса прокрутки',
    'es-es': 'Barra de desplazamiento adhesiva',
    'fr-fr': 'Barre de défilement collante',
    'uk-ua': 'Липка смуга прокрутки',
    'de-ch': 'Klebrige Bildlaufleiste',
  },
  foreground: {
    'en-us': 'Foreground',
    'ru-ru': 'передний план',
    'es-es': 'Primer plano',
    'fr-fr': 'Premier plan',
    'uk-ua': 'Передній план',
    'de-ch': 'Vordergrund',
  },
  background: {
    'en-us': 'Background',
    'ru-ru': 'Фон',
    'es-es': 'Fondo',
    'fr-fr': 'Arrière-plan',
    'uk-ua': 'Фон',
    'de-ch': 'Hintergrund',
  },
  sidebarTheme: {
    'en-us': 'Sidebar theme',
    'de-ch': 'Seitenleistenthema',
    'es-es': 'Tema de la barra lateral',
    'fr-fr': 'Thème de la barre latérale',
    'ru-ru': 'Тема боковой панели',
    'uk-ua': 'Тема бічної панелі',
  },
  darkForeground: {
    'en-us': 'Foreground (dark theme)',
    'ru-ru': 'Передний план (темная тема)',
    'es-es': 'Primer plano (tema oscuro)',
    'fr-fr': 'Premier plan (thème sombre)',
    'uk-ua': 'Передній план (темна тема)',
    'de-ch': 'Vordergrund (dunkles Design)',
  },
  darkBackground: {
    'en-us': 'Background (dark theme)',
    'ru-ru': 'Фон (темная тема)',
    'es-es': 'Fondo (tema oscuro)',
    'fr-fr': 'Arrière-plan (thème sombre)',
    'uk-ua': 'Фон (темна тема)',
    'de-ch': 'Hintergrund (dunkles Design)',
  },
  accentColor1: {
    'en-us': 'Accent color 1',
    'ru-ru': 'Акцентный цвет 1',
    'es-es': 'Color de acento 1',
    'fr-fr': "Couleur d'accent 1",
    'uk-ua': 'Акцентний колір 1',
    'de-ch': 'Akzentfarbe 1',
  },
  accentColor2: {
    'en-us': 'Accent color 2',
    'ru-ru': 'Акцентный цвет 2',
    'es-es':
      'Dirección de movimiento cuando se presiona la tecla [X27X]Tab[X35X]',
    'fr-fr': "Couleur d'accent 2",
    'uk-ua': 'Акцентний колір 2',
    'de-ch': 'Akzentfarbe 2',
  },
  accentColor3: {
    'en-us': 'Accent color 3',
    'ru-ru': 'Акцентный цвет 3',
    'es-es': 'Color de acento 3',
    'fr-fr': "Couleur d'accent 3",
    'uk-ua': 'Акцентний колір 3',
    'de-ch': 'Akzentfarbe 3',
  },
  accentColor4: {
    'en-us': 'Accent color 4',
    'ru-ru': 'Акцентный цвет 4',
    'es-es': 'Color de acento 4',
    'fr-fr': "Couleur d'accent 4",
    'uk-ua': 'Акцентний колір 4',
    'de-ch': 'Akzentfarbe 4',
  },
  accentColor5: {
    'en-us': 'Accent color 5',
    'ru-ru': 'Акцентный цвет 5',
    'es-es': 'Color de acento 5',
    'fr-fr': "Couleur d'accent 5",
    'uk-ua': 'Акцентний колір 5',
    'de-ch': 'Akzentfarbe 5',
  },
  spreadsheet: {
    'en-us': 'Spreadsheet',
    'ru-ru': 'электронная таблица',
    'es-es': 'Hoja de cálculo',
    'fr-fr': 'Tableur',
    'uk-ua': 'Електронна таблиця',
    'de-ch': 'Kalkulationstabelle',
  },
  minSpareRows: {
    'en-us': 'Number of blank rows at the end',
    'ru-ru': 'Количество пустых строк в конце',
    'es-es': 'Número de filas en blanco al final',
    'fr-fr': 'Nombre de lignes vides à la fin',
    'uk-ua': 'Кількість порожніх рядків у кінці',
    'de-ch': 'Anzahl der leeren Zeilen am Ende',
  },
  autoWrapCols: {
    'en-us': 'Navigate to the other side when reaching the edge column',
    'ru-ru': 'Перейдите на другую сторону, достигнув краевого столбца.',
    'es-es': 'Navega hacia el otro lado al llegar a la columna del borde',
    'fr-fr':
      'Naviguez de l’autre côté lorsque vous atteignez la colonne de bord',
    'uk-ua': 'Перейдіть на іншу сторону, коли досягнете краю колонки',
    'de-ch':
      'Navigieren Sie auf die andere Seite, wenn Sie die Randspalte erreichen',
  },
  autoWrapRows: {
    'en-us': 'Navigate to the other side when reaching the edge row',
    'ru-ru': 'Перейдите на другую сторону, достигнув краевого ряда.',
    'es-es': 'Navegue hacia el otro lado cuando llegue a la fila del borde',
    'fr-fr':
      'Naviguez de l’autre côté lorsque vous atteignez la rangée de bord',
    'uk-ua': 'Перейдіть на іншу сторону, коли досягнете крайнього ряду',
    'de-ch':
      'Navigieren Sie auf die andere Seite, wenn Sie die Randreihe erreichen',
  },
  enterBeginsEditing: {
    'en-us': 'Enter key begins editing cell',
    'ru-ru': 'Клавиша Enter начинает редактирование ячейки.',
    'es-es': 'La tecla Intro comienza a editar la celda',
    'fr-fr': 'La touche Entrée commence à modifier la cellule',
    'uk-ua': 'Клавіша Enter починає редагування клітинки',
    'de-ch': 'Mit der Eingabetaste beginnt die Bearbeitung der Zelle',
  },
  tabMoveDirection: {
    'en-us': 'Direction of movement when <key>Tab</key> key is pressed',
    'ru-ru': 'Направление движения при нажатии клавиши <key>Tab</key>',
    'es-es':
      'Dirección de movimiento cuando se presiona la tecla <key>Tab</key>',
    'fr-fr': `
      Sens de déplacement lorsque la touche <key>Tabulation</key> est enfoncée
    `,
    'uk-ua': 'Напрямок руху при натисканні клавіші <key>Tab</key>.',
    'de-ch': 'Bewegungsrichtung, wenn die Taste <key>Tab</key> gedrückt wird',
  },
  tabMoveDirectionDescription: {
    'en-us': `
      You can move in the opposite direction by pressing
      <key>Shift</key>+<key>Tab</key>.
    `,
    'ru-ru': `
      Вы можете двигаться в противоположном направлении, нажав
      <key>Shift</key>+<key>Tab</key>.
    `,
    'es-es': `
      Puedes moverte en la dirección opuesta presionando
      <key>Shift</key>+<key>Tab</key>.
    `,
    'fr-fr': `
      Vous pouvez vous déplacer dans la direction opposée en appuyant sur
      <key>Shift</key>+<key>Tab</key>.
    `,
    'uk-ua': `
      Ви можете рухатися в протилежному напрямку, натискаючи
      <key>Shift</key>+<key>Tab</key>.
    `,
    'de-ch': `
      Sie können sich in die entgegengesetzte Richtung bewegen, indem Sie
      <key>Umschalt</key>+<key>Tab</key> drücken.
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
    'fr-fr': 'Rangée',
    'uk-ua': 'рядок',
    'de-ch': 'Reihe',
  },
  enterMoveDirection: {
    'en-us': 'Direction of movement when <key>Enter</key> key is pressed',
    'ru-ru': 'Направление движения при нажатии клавиши <key>Enter</key>',
    'es-es':
      'Dirección de movimiento cuando se presiona la tecla <key>Enter</key>',
    'uk-ua': 'Напрямок руху, коли натиснуто клавішу <key>Enter</key>.',
    'de-ch': 'Bewegungsrichtung, wenn die Taste <key>Enter</key> gedrückt wird',
    'fr-fr': `
      Direction du mouvement lorsque la touche <key>Entrer</key> est enfoncée
    `,
  },
  enterMoveDirectionDescription: {
    'en-us': `
      You can move in the opposite direction by pressing
      <key>Shift</key>+<key>Enter</key>.
    `,
    'ru-ru': 'Цвет синонима.',
    'es-es': 'color sinónimo.',
    'fr-fr': 'Synonyme couleur.',
    'uk-ua': 'Синонім кольору.',
    'de-ch': `
      Sie können sich in die entgegengesetzte Richtung bewegen, indem Sie
      <key>Umschalt</key>+<key>Eingabe</key> drücken.
    `,
  },
  filterPickLists: {
    'en-us': 'Filter pick list items',
    'ru-ru': 'Фильтровать элементы списка выбора',
    'es-es': 'Zoom con rueda de desplazamiento',
    'fr-fr': 'Filtrer les éléments de la liste de sélection',
    'uk-ua': 'Фільтр вибору елементів списку',
    'de-ch': 'Auswahllistenelemente filtern',
  },
  exportFileDelimiter: {
    'en-us': 'Export file delimiter',
    'ru-ru': 'Разделитель файла экспорта',
    'es-es': 'Exportar delimitador de archivos',
    'fr-fr': "Délimiteur de fichier d'exportation",
    'uk-ua': 'Роздільник файлу експорту',
    'de-ch': 'Trennzeichen für Exportdateien',
  },
  exportCsvUtf8Bom: {
    'en-us': 'Add UTF-8 BOM to CSV file exports',
    'ru-ru': 'Добавить UTF-8 BOM в экспорт CSV-файла',
    'es-es': 'Agregar BOM UTF-8 a las exportaciones de archivos CSV',
    'fr-fr': 'Ajouter UTF-8 BOM aux exportations de fichiers CSV',
    'uk-ua': 'Додайте специфікацію UTF-8 до експорту файлу CSVу',
    'de-ch': 'UTF-8 BOM zum CSV-Dateiexport hinzufügen',
  },
  exportCsvUtf8BomDescription: {
    'en-us': 'Adds a BOM (Byte Order Mark) to exported CSV files to ensure that the file is correctly recognized and displayed by various programs (Excel, OpenRefine, etc.), preventing issues with special characters and formatting.',
    'ru-ru': 'Корректное отображение экспортированных CSV-файлов в Excel.',
    'es-es':
      'Hace que las exportaciones de archivos CSV se muestren correctamente en Excel.',
    'fr-fr':
      "Permet aux exportations de fichiers CSV de s'afficher correctement dans Excel.",
    'uk-ua': 'Змушує експорт файлів CSV правильно відображатися в Excel.',
    'de-ch':
      'Sorgt dafür, dass CSV-Dateiexporte in Excel korrekt angezeigt werden.',
  },
  caseSensitive: {
    'en-us': 'Case-sensitive',
    'ru-ru': 'С учетом регистра',
    'es-es': 'Distingue mayúsculas y minúsculas',
    'fr-fr': 'Sensible aux majuscules et minuscules',
    'uk-ua': 'Чутливий до регістру',
    'de-ch': 'Groß-/Kleinschreibung beachten',
  },
  caseInsensitive: {
    'en-us': 'Case-insensitive',
    'ru-ru': 'Без учета регистра',
    'es-es': 'No distingue entre mayúsculas y minúsculas',
    'fr-fr': 'Insensible à la casse',
    'uk-ua': 'Регістр не враховується',
    'de-ch': 'Groß-/Kleinschreibung wird nicht beachtet',
  },
  showNoReadTables: {
    'en-us': 'Show tables without "Read" access',
    'ru-ru': 'Показать таблицы без доступа «Чтение»',
    'es-es': 'Imagen personalizada',
    'fr-fr': 'Afficher les tableaux sans accès "Lecture"',
    'uk-ua': 'Показувати таблиці без доступу «Читання».',
    'de-ch': 'Benutzerdefiniertes Bild',
  },
  showNoAccessTables: {
    'en-us': 'Show tables without "Create" access',
    'ru-ru': 'Показать таблицы без доступа «Создать»',
    'es-es': 'Mostrar tablas sin acceso "Crear"',
    'fr-fr': 'Afficher les tableaux sans accès "Créer"',
    'uk-ua': 'Показувати таблиці без доступу «Створити».',
    'de-ch': 'Tabellen ohne „Erstellen“-Zugriff anzeigen',
  },
  textAreaAutoGrow: {
    'en-us': 'Text boxes grow automatically',
    'ru-ru': 'Текстовые поля увеличиваются автоматически',
    'es-es': 'Los cuadros de texto crecen automáticamente',
    'fr-fr': "Les zones de texte s'agrandissent automatiquement",
    'uk-ua': 'Текстові поля збільшуються автоматично',
    'de-ch': 'Textfelder werden automatisch vergrößert',
  },
  clearQueryFilters: {
    'en-us': 'Reset query filters',
    'ru-ru': 'Сбросить фильтры запросов',
    'es-es': 'Restablecer filtros de consulta',
    'fr-fr': 'Réinitialiser les filtres de requête',
    'uk-ua': 'Скинути фільтри запитів',
    'de-ch': 'Abfragefilter zurücksetzen',
  },
  clearQueryFiltersDescription: {
    'en-us': 'Clears all query filters when running a Report from a Form.',
    'de-ch': `
      Löscht alle Abfragefilter beim Ausführen eines Berichts aus einem Formular.
    `,
    'es-es': `
      Borra todos los filtros de consulta al ejecutar un informe desde un
      formulario.
    `,
    'fr-fr': `
      Efface tous les filtres de requête lors de l'exécution d'un rapport à
      partir d'un formulaire.
    `,
    'ru-ru': 'Очищает все фильтры запросов при запуске отчета из формы.',
    'uk-ua': 'Очищає всі фільтри запитів під час запуску звіту з форми.',
  },
  queryParamtersFromForm: {
    'en-us': 'Show query filters when running a Report from a Form',
    'de-ch': `
      Anzeigen von Abfragefiltern beim Ausführen eines Berichts aus einem
      Formular
    `,
    'es-es':
      'Mostrar filtros de consulta al ejecutar un informe desde un formulario',
    'fr-fr': `
      Afficher les filtres de requête lors de l'exécution d'un rapport à partir
      d'un formulaire
    `,
    'ru-ru': 'Показывать фильтры запросов при запуске отчета из формы',
    'uk-ua': 'Показувати фільтри запитів під час запуску звіту з форми',
  },
  autoGrowAutoComplete: {
    'en-us': 'Allow autocomplete to grow as wide as need',
    'ru-ru': 'Направление движения при нажатии клавиши [X27X]Tab[X35X]',
    'es-es':
      'Dirección de movimiento cuando se presiona la tecla [X27X]Tab[X35X]',
    'fr-fr': `
      Sens de déplacement lorsque la touche [X27X]Tabulation[X35X] est enfoncée
    `,
    'uk-ua': 'Напрямок руху при натисканні клавіші [X27X]Tab[X35X].',
    'de-ch':
      'Erlauben Sie der Autovervollständigung, so weit wie nötig zu wachsen',
  },
  tableNameInTitle: {
    'en-us': 'Include table name in the browser page title',
    'ru-ru': 'Включить имя таблицы в заголовок страницы браузера',
    'es-es':
      'Incluir el nombre de la tabla en el título de la página del navegador',
    'fr-fr':
      'Inclure le nom de la table dans le titre de la page du navigateur',
    'uk-ua': 'Включіть назву таблиці в заголовок сторінки браузера',
    'de-ch': 'Tabellennamen in den Seitentitel des Browsers einschließen',
  },
  focusFirstField: {
    'en-us': 'Focus first field',
    'de-ch': 'Konzentrieren Sie sich auf das erste Feld',
    'es-es': 'Enfocar el primer campo',
    'fr-fr': 'Concentrez-vous sur le premier champ',
    'ru-ru': 'Фокус первого поля',
    'uk-ua': 'Перейти до першого поля',
  },
  doubleClickZoom: {
    'en-us': 'Double click to zoom',
    'ru-ru': 'Дважды щелкните, чтобы увеличить масштаб',
    'es-es': 'Doble clic para ampliar',
    'fr-fr': 'Double-cliquez pour zoomer',
    'uk-ua': 'Двічі клацніть, щоб збільшити',
    'de-ch': 'Doppelklicken zum Vergrößern',
  },
  closePopupOnClick: {
    'en-us': 'Close pop-up on outside click',
    'ru-ru': 'Закрыть всплывающее окно по внешнему клику',
    'es-es': 'Cerrar ventana emergente al hacer clic desde fuera',
    'fr-fr': "Fermer la pop-up lors d'un clic extérieur",
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
    'es-es': 'Inercia panorámica',
    'fr-fr': 'Inertie du bac',
    'uk-ua': 'Інерція панорами',
    'de-ch': 'Schwenkträgheit',
  },
  mouseDrags: {
    'en-us': 'Mouse drags',
    'ru-ru': 'Выделить совпавшую подстроку',
    'es-es': 'Resaltar subcadena coincidente',
    'uk-ua': 'Виділіть відповідний підрядок',
    'de-ch': 'Übereinstimmende Teilzeichenfolge hervorheben',
    'fr-fr': 'Mettre en surbrillance la sous-chaîne correspondante',
  },
  scrollWheelZoom: {
    'en-us': 'Scroll wheel zoom',
    'ru-ru': 'Масштабирование колеса прокрутки',
    'es-es': 'Zoom con rueda de desplazamiento',
    'fr-fr': 'Zoom avec la molette de défilement',
    'uk-ua': 'Масштаб колеса прокрутки',
    'de-ch': 'Scrollrad-Zoom',
  },
  flexibleColumnWidth: {
    'en-us': 'Flexible column width',
    'ru-ru': 'Гибкая ширина столбца',
    'es-es': 'Ancho de columna flexible',
    'fr-fr': 'Largeur de colonne flexible',
    'uk-ua': 'Гнучка ширина колонки',
    'de-ch': 'Flexible Spaltenbreite',
  },
  flexibleSubGridColumnWidth: {
    'en-us': 'Flexible subview grid column width',
    'ru-ru': 'Гибкая ширина столбца сетки подпредставления',
    'es-es': 'Ancho de columna de cuadrícula de subvista flexible',
    'fr-fr': 'Largeur de colonne de grille de sous-vue flexible',
    'uk-ua': 'Гнучка ширина стовпця сітки вкладеного перегляду',
    'de-ch': 'Flexible Spaltenbreite des Unteransichtsrasters',
  },
  closeOnEsc: {
    'en-us': 'Close on <key>ESC</key> key press',
    'ru-ru': 'Значок и название таблицы',
    'es-es': 'Icono y nombre de la tabla',
    'fr-fr': 'Icône et nom de la table',
    'uk-ua': 'Значок і назва таблиці',
    'de-ch': 'Schließen durch Drücken der Taste <key>ESC</key>',
  },
  closeOnOutsideClick: {
    'en-us': 'Close on outside click',
    'ru-ru': 'Закрыть внешним щелчком',
    'es-es': 'Cerrar con clic externo',
    'fr-fr': 'Fermer sur clic extérieur',
    'uk-ua': 'Закрийте зовнішнім клацанням',
    'de-ch': 'Durch Klicken von außen schließen',
  },
  specifyNetworkBadge: {
    'en-us': 'Specify Network Badge',
    'ru-ru': 'Укажите значок сети',
    'es-es': 'Especificar insignia de red',
    'fr-fr': 'Spécifier le badge réseau',
    'uk-ua': 'Укажіть значок мережі',
    'de-ch': 'Netzwerk-Badge angeben',
  },
  useAccessibleFullDatePicker: {
    'en-us': 'Use accessible full date picker',
    'ru-ru': 'Использовать доступный полный выбор даты',
    'es-es': 'Utilice el selector de fechas completo accesible',
    'fr-fr': 'Utiliser un sélecteur de date complet accessible',
    'uk-ua': 'Використовуйте доступний повний засіб вибору дати',
    'de-ch': 'Verwenden Sie eine barrierefreie Datumsauswahl',
  },
  useAccessibleMonthPicker: {
    'en-us': 'Use accessible month picker',
    'ru-ru': 'Используйте доступный выбор месяца',
    'es-es': 'Utilice el selector de meses accesible',
    'fr-fr': 'Utiliser le sélecteur de mois accessible',
    'uk-ua': 'Використовуйте доступний засіб вибору місяця',
    'de-ch': 'Verwenden Sie die barrierefreie Monatsauswahl',
  },
  rightAlignNumberFields: {
    'en-us': 'Right-Justify numeric fields',
    'ru-ru': 'Выравнивание числовых полей по правому краю',
    'es-es': 'Justificar campos numéricos a la derecha',
    'fr-fr': 'Justifier à droite les champs numériques',
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
    'es-es': 'Limitar el ancho máximo del campo',
    'fr-fr': 'Limiter la largeur maximale du champ',
    'uk-ua': 'Обмеження максимальної ширини поля',
    'de-ch': 'Maximale Feldbreite begrenzen',
  },
  condenseQueryResults: {
    'en-us': 'Condense query results',
    'ru-ru': 'Сжатие результатов запроса',
    'es-es': 'Condensar resultados de consultas',
    'fr-fr': 'Condenser les résultats de la requête',
    'uk-ua': 'Згорнути результати запиту',
    'de-ch': 'Abfrageergebnisse verdichten',
  },
  blurContentBehindDialog: {
    'en-us': 'Blur content behind the dialog',
    'ru-ru': 'Размытие содержимого за диалогом',
    'es-es': 'Desenfocar el contenido detrás del diálogo',
    'fr-fr': 'Flou le contenu derrière la boîte de dialogue',
    'uk-ua': 'Розмити вміст за діалоговим вікном',
    'de-ch': 'Inhalte hinter dem Dialog verwischen',
  },
  collectionSortOrderDescription: {
    'en-us': 'This determines the visual order of collections.',
    'ru-ru': 'Это определяет визуальный порядок коллекций.',
    'es-es': 'Esto determina el orden visual de las colecciones.',
    'fr-fr': "Ceci détermine l'ordre visuel des collections.",
    'uk-ua': 'Це визначає візуальний порядок колекцій.',
    'de-ch': 'Dies bestimmt die visuelle Reihenfolge der Sammlungen.',
  },
  recordSetRecordToOpen: {
    'en-us': 'Record to open by default',
    'ru-ru': 'Запись, открываемая по умолчанию',
    'es-es': 'Registro para abrir de forma predeterminada',
    'fr-fr': 'Enregistrement à ouvrir par défaut',
    'uk-ua': 'Запис відкривається за умовчанням',
    'de-ch': `
      Beim Zusammenführen von Agenten werden automatisch [X42X] Datensätze
      basierend auf den Variationen des Vornamens/Nachnamens erstellt.
    `,
  },
  altClickToSupressNewTab: {
    'en-us':
      '<key>{altKeyName:string}</key>+<key>Click</key> to suppress new tab',
    'ru-ru': `
      <key>{altKeyName:string}</key>+<key>Нажмите </key>, чтобы отключить новую
      вкладку
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
      <key>{altKeyName:string}</key>+<key>Klick</key>, um neue Registerkarten zu
      unterdrücken
    `,
  },
  altClickToSupressNewTabDescription: {
    'en-us': `
      <key>{altKeyName:string}</key>+<key>Click</key> a link that usually
      opens in a new tab to open it in the current tab.
    `,
    'ru-ru': 'Используйте доступный выбор месяца.',
    'es-es': 'Utilice el selector de meses accesible.',
    'fr-fr': 'Utiliser le sélecteur de mois accessible.',
    'uk-ua': 'Використовуйте доступний засіб вибору місяця.',
    'de-ch': `
      <key>{altKeyName:string}</key>+<key>Klicken</key> Sie auf einen Link, der
      normalerweise in einem neuen Tab geöffnet wird, um ihn im aktuellen Tab zu
      öffnen.
    `,
  },
  makeFormDialogsModal: {
    'en-us': 'Make form dialogs gray out the background',
    'ru-ru': 'Сделать диалоговые окна формы серыми на фоне',
    'es-es':
      'Hacer que los cuadros de diálogo del formulario aparezcan en gris',
    'fr-fr':
      "Rendre les boîtes de dialogue de formulaire grisées sur l'arrière-plan",
    'uk-ua': 'Зробіть діалогові вікна форми сірими фоном',
    'de-ch': 'Den Hintergrund von Formulardialogen ausgrauen',
  },
  autoScrollTree: {
    'en-us': 'Auto scroll tree to focused node',
    'ru-ru': 'Автоматическая прокрутка дерева до выбранного узла',
    'es-es': 'Árbol de desplazamiento automático al nodo enfocado',
    'fr-fr': 'Arbre de défilement automatique vers le nœud ciblé',
    'uk-ua': 'Автоматичне прокручування дерева до виділеного вузла',
    'de-ch': `
      Automatisch durch den Baum scrollen, um zum fokussierten Knoten zu
      gelangen
    `,
  },
  lineWrap: {
    'en-us': 'Line wrap',
    'ru-ru': 'Перенос строки',
    'es-es': 'Ajuste de línea',
    'fr-fr': 'Retour à la ligne',
    'uk-ua': 'Обтікання лініями',
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
    'ru-ru': 'Отступ с помощью <key>Tab</key>',
    'es-es': 'Sangrar con <key>Tab</key>',
    'fr-fr': 'Indenter avec <key>Tabulation</key>',
    'uk-ua': 'Відступ із <key>Tab</key>',
    'de-ch': 'Einrücken mit <key>Tabulator</key>',
  },
  formHeaderFormat: {
    'en-us': 'Form header format',
    'ru-ru': 'Формат заголовка формы',
    'es-es': 'Formato del encabezado del formulario',
    'fr-fr': "Format d'en-tête de formulaire",
    'uk-ua': 'Формат заголовка форми',
    'de-ch': 'Formularkopfzeilenformat',
  },
  iconAndTableName: {
    'en-us': 'Icon and table name',
    'ru-ru': 'Значок и название таблицы',
    'es-es': 'Icono y nombre de la tabla',
    'fr-fr': 'Icône et nom de la table',
    'uk-ua': 'Значок і назва таблиці',
    'de-ch': 'Symbol und Tabellenname',
  },
  tableIcon: {
    'en-us': 'Table icon',
    'ru-ru': 'Значок таблицы',
    'es-es': 'Icono de mesa',
    'fr-fr': 'Icône de tableau',
    'uk-ua': 'Значок таблиці',
    'de-ch': 'Tabellensymbol',
  },
  maxHeight: {
    'en-us': 'Max height',
    'ru-ru': 'максимальная высота',
    'es-es': 'Altura máxima',
    'fr-fr': 'hauteur maximum',
    'uk-ua': 'Максимальна висота',
    'de-ch': 'maximale Höhe',
  },
  autoComplete: {
    'en-us': 'Auto complete',
    'ru-ru': `
      Определяет заголовки полей, примечания по использованию и заголовки
      таблиц.
    `,
    'es-es': 'Determina títulos de campos, notas de uso y títulos de tablas.',
    'fr-fr': `
      Détermine les légendes des champs, les notes d'utilisation et les légendes
      des tableaux
    `,
    'uk-ua':
      'Визначає підписи полів, примітки щодо використання та підписи таблиць',
    'de-ch': 'Autovervollständigung',
  },
  searchCaseSensitive: {
    'en-us': 'Case-sensitive search',
    'es-es': 'Búsqueda que distingue entre mayúsculas y minúsculas',
    'fr-fr': 'Recherche sensible à la casse',
    'uk-ua': 'Пошук з урахуванням регістру',
    'de-ch': 'Groß-/Kleinschreibung beachten',
    'ru-ru': 'Поиск с учетом регистра',
  },
  searchField: {
    'en-us': 'Search field',
    'ru-ru': 'Поле поиска',
    'es-es': 'Campo de búsqueda',
    'fr-fr': 'Champ de recherche',
    'uk-ua': 'Поле пошуку',
    'de-ch': 'Textfelder werden automatisch vergrößert',
  },
  createInteractions: {
    'en-us': 'Creating an interaction',
    'ru-ru': 'Создание взаимодействия',
    'es-es': 'Creando una interacción',
    'fr-fr': 'Créer une interaction',
    'uk-ua': 'Створення взаємодії',
    'de-ch': `
      Eine URL zu einer Seite, die auf der Startseite eingebettet werden würde:
    `,
  },
  useSpaceAsDelimiter: {
    'en-us': 'Use space as delimiter',
    'ru-ru': 'Используйте пробел в качестве разделителя',
    'es-es': 'Usar espacio como delimitador',
    'fr-fr': "Utiliser l'espace comme délimiteur",
    'uk-ua': 'Використовуйте пробіл як роздільник',
    'de-ch': 'Leerzeichen als Trennzeichen verwenden',
  },
  useCommaAsDelimiter: {
    'en-us': 'Use comma as delimiter',
    'ru-ru': 'Используйте запятую в качестве разделителя',
    'es-es': 'Usar coma como delimitador',
    'fr-fr': 'Utiliser la virgule comme délimiteur',
    'uk-ua': 'Використовуйте кому як роздільник',
    'de-ch': 'Verwenden Sie Kommas als Trennzeichen.',
  },
  useNewLineAsDelimiter: {
    'en-us': 'Use new line as delimiter',
    'ru-ru': 'Использовать новую строку в качестве разделителя',
    'es-es': 'Usar nueva línea como delimitador',
    'fr-fr': 'Utiliser une nouvelle ligne comme délimiteur',
    'uk-ua': 'Використовуйте новий рядок як роздільник',
    'de-ch': 'Neue Zeile als Trennzeichen verwenden',
  },
  useCustomDelimiters: {
    'en-us': 'Use custom delimiters',
    'ru-ru': 'Используйте пользовательские разделители',
    'es-es': 'Usar delimitadores personalizados',
    'fr-fr': 'Utiliser des délimiteurs personnalisés',
    'uk-ua': 'Використовуйте спеціальні роздільники',
    'de-ch': 'Benutzerdefinierte Trennzeichen verwenden',
  },
  useCustomDelimitersDescription: {
    'en-us': `
      A list of delimiters to use, in addition to the ones defined above. 
      Put one delimiter per line.
    `,
    'ru-ru': `
      Список разделителей, которые можно использовать в дополнение к
      определенным выше. Ставьте по одному разделителю в каждой строке.
    `,
    'es-es': `
      Una lista de delimitadores a utilizar, además de los definidos
      anteriormente. Pon un delimitador por línea.
    `,
    'fr-fr': `
      Une liste de délimiteurs à utiliser, en plus de ceux définis ci-dessus.
      Mettez un délimiteur par ligne.
    `,
    'uk-ua': `
      Список розділювачів для використання на додаток до визначених вище.
      Поставте один роздільник на рядок.
    `,
    'de-ch': `
      Eine Liste der zu verwendenden Trennzeichen zusätzlich zu den oben
      definierten. Setzen Sie ein Trennzeichen pro Zeile.
    `,
  },
  detectAutomaticallyDescription: {
    'en-us': 'Detect automatically based on catalog number format.',
    'ru-ru': 'Автоматическое обнаружение на основе формата каталожного номера.',
    'es-es':
      'Detectar automáticamente según el formato del número de catálogo.',
    'fr-fr':
      'Détecter automatiquement en fonction du format du numéro de catalogue.',
    'uk-ua': 'Визначати автоматично на основі формату номера каталогу.',
    'de-ch': 'Automatische Erkennung anhand des Katalognummernformats.',
  },
  use: {
    comment: 'Verb',
    'en-us': 'Use',
    'ru-ru': 'Использовать',
    'es-es': 'Usar',
    'fr-fr': 'Utiliser',
    'uk-ua': 'використання',
    'de-ch': 'Verwenden',
  },
  dontUse: {
    'en-us': 'Don’t use',
    'ru-ru': 'Масштабирование колеса прокрутки',
    'es-es': 'Zoom con rueda de desplazamiento',
    'fr-fr': 'Zoom avec la molette de défilement',
    'uk-ua': 'Масштаб колеса прокрутки',
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
    'ru-ru': 'Нижний',
    'uk-ua': 'Дно',
    'de-ch': 'Unten',
    'fr-fr': 'Bas',
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
    'es-es': 'Bien',
    'fr-fr': 'Droite',
    'ru-ru': 'Верно',
    'uk-ua': 'правильно',
    'de-ch': 'Rechts',
  },
  showUnsavedIndicator: {
    'en-us': 'Show unsaved changes indicator',
    'ru-ru': 'Показывать индикатор несохраненных изменений',
    'es-es': 'Mostrar indicador de cambios no guardados',
    'fr-fr': "Afficher l'indicateur de modifications non enregistrées",
    'uk-ua': 'Показати індикатор незбережених змін',
    'de-ch': 'Indikator für nicht gespeicherte Änderungen anzeigen',
  },
  showUnsavedIndicatorDescription: {
    'en-us': `
      Show an "*" in the tab title when there are unsaved changes in the current
      tab.
    `,
    'es-es': `
      Mostrar un "*" en el título de la pestaña cuando haya cambios no guardados
      en la pestaña actual.
    `,
    'fr-fr': `
      Afficher un \"*\" dans le titre de l'onglet lorsqu'il y a des
      modifications non enregistrées dans l'onglet actuel.
    `,
    'ru-ru': `
      Показывать «*» в заголовке вкладки, если на текущей вкладке есть
      несохраненные изменения.
    `,
    'uk-ua': `
      Показувати «*» у заголовку вкладки, якщо в поточній вкладці є незбережені
      зміни.
    `,
    'de-ch': `
      Ein „*“ im Tab-Titel anzeigen, wenn es im aktuellen Tab nicht gespeicherte
      Änderungen gibt.
    `,
  },
  autoPopulateDescription: {
    'en-us': `
      Auto populate the merged record with values from duplicates when opening
      the merging dialog.
    `,
    'ru-ru': `
      Автоматическое заполнение объединенной записи значениями из дубликатов при
      открытии диалогового окна слияния.
    `,
    'de-ch': `
      Beim Öffnen des Zusammenführungsdialogs wird der zusammengeführte
      Datensatz automatisch mit Werten aus Duplikaten gefüllt.
    `,
    'es-es': `
      Complete automáticamente el registro combinado con valores de duplicados
      al abrir el cuadro de diálogo de combinación.
    `,
    'fr-fr': `
      Remplir automatiquement l'enregistrement fusionné avec les valeurs des
      doublons lors de l'ouverture de la boîte de dialogue de fusion.
    `,
    'uk-ua': `
      Автоматичне заповнення об’єднаного запису значеннями з дублікатів під час
      відкриття діалогового вікна об’єднання.
    `,
  },
  autoCreateVariants: {
    'en-us': 'Automatically create {agentVariantTable:string} records',
    'ru-ru': 'Автоматически создавать записи {agentVariantTable:string}',
    'de-ch': '{agentVariantTable:string}-Datensätze automatisch erstellen',
    'es-es': 'Crear automáticamente registros {agentVariantTable:string}',
    'fr-fr':
      'Créer automatiquement des enregistrements {agentVariantTable:string}',
    'uk-ua': 'Автоматично створювати записи {agentVariantTable:string}.',
  },
  autoCreateVariantsDescription: {
    'en-us': `
      When merging agents, automatically create {agentVariantTable:string}
      records based on the variations of first name/last name.
    `,
    'ru-ru': `
      При объединении агентов автоматически создаются записи
      {agentVariantTable:string} на основе вариантов имени/фамилии.
    `,
    'de-ch': `
      Beim Zusammenführen von Agenten werden automatisch
      {agentVariantTable:string} Datensätze basierend auf den Variationen des
      Vornamens/Nachnamens erstellt.
    `,
    'es-es': `
      Al fusionar agentes, cree automáticamente registros
      {agentVariantTable:string} basados en las variaciones de nombre/apellido.
    `,
    'fr-fr': `
      Lors de la fusion d'agents, créez automatiquement des enregistrements
      {agentVariantTable:string} en fonction des variations du prénom/nom.
    `,
    'uk-ua': `
      Під час об’єднання агентів автоматично створювати записи
      {agentVariantTable:string} на основі варіацій імені/прізвища.
    `,
  },
  collectionPreferences: {
    'en-us': 'Collection Preferences',
    'de-ch': 'Sammlungseinstellungen',
    'es-es': 'Personalización',
    'fr-fr': 'Personnalisation',
    'ru-ru': 'Кастомизация',
    'uk-ua': 'Налаштування',
  },
  rememberDialogSizes: {
    'en-us': 'Remember dialog window sizes',
    'ru-ru': 'Помните о размерах диалогового окна',
    'es-es': 'Recuerde los tamaños de las ventanas de diálogo',
    'fr-fr': 'Mémoriser les tailles des fenêtres de dialogue',
    'uk-ua': "Запам'ятайте розміри діалогових вікон",
    'de-ch': 'Dialogfenstergrößen merken',
  },
  rememberDialogPositions: {
    'en-us': 'Remember dialog window positions',
    'ru-ru': 'Запомнить позиции диалоговых окон',
    'es-es': 'Recordar las posiciones de las ventanas de diálogo',
    'fr-fr': 'Mémoriser les positions des fenêtres de dialogue',
    'uk-ua': "Запам'ятовуйте положення діалогового вікна",
    'de-ch': 'Dialogfensterpositionen merken',
  },
  autoPlayMedia: {
    'en-us': 'Automatically play media',
    'ru-ru': 'Автоматическое воспроизведение мультимедиа',
    'es-es': 'Reproducir medios automáticamente',
    'fr-fr': 'Lire automatiquement les médias',
    'uk-ua': 'Автоматичне відтворення медіа',
    'de-ch': 'Medien automatisch wiedergeben',
  },
  useCustomTooltips: {
    'en-us': 'Use modern tooltips',
    'ru-ru': 'Используйте современные подсказки',
    'es-es': 'Utilice información sobre herramientas moderna',
    'fr-fr': 'Utiliser des info-bulles modernes',
    'uk-ua': 'Використовуйте сучасні підказки',
    'de-ch': 'Farbe der Infoschaltfläche',
  },
  alwaysUseQueryBuilder: {
    'en-us': 'Always use query builder search inside of search form',
    'de-ch': `
      Verwenden Sie innerhalb des Suchformulars immer die Suche des
      Abfragegenerators
    `,
    'es-es': `
      Utilice siempre la búsqueda del generador de consultas dentro del
      formulario de búsqueda
    `,
    'fr-fr': `
      Utilisez toujours la recherche du générateur de requêtes dans le
      formulaire de recherche
    `,
    'ru-ru':
      'Всегда используйте поиск в конструкторе запросов внутри формы поиска.',
    'uk-ua': 'Завжди використовуйте пошук конструктора запитів у формі пошуку',
  },
  localizeResourceNames: {
    'en-us': 'Localize the names of recognized app resources',
    'de-ch': 'Lokalisieren Sie die Namen erkannter App-Ressourcen',
    'es-es':
      'Localizar los nombres de los recursos de aplicaciones reconocidos',
    'fr-fr': "Localiser les noms des ressources d'application reconnues",
    'ru-ru': 'Локализуйте имена распознанных ресурсов приложения.',
    'uk-ua': 'Локалізувати назви розпізнаних ресурсів програми',
  },
  splitLongXml: {
    'en-us': 'Split long lines of XML into multiple lines',
    'de-ch': 'Teilen Sie lange XML-Zeilen in mehrere Zeilen auf',
    'es-es': 'Divida líneas largas de XML en varias líneas',
    'fr-fr': 'Diviser les longues lignes de XML en plusieurs lignes',
    'ru-ru': 'Разделить длинные строки XML на несколько строк',
    'uk-ua': 'Розділіть довгі рядки XML на кілька рядків',
  },
  url: {
    'en-us': 'URL',
    'de-ch': 'URL',
    'es-es': 'URL',
    'fr-fr': 'URL',
    'uk-ua': 'URL',
    'ru-ru': 'URL-адрес',
  },
  pickAttachment: {
    'en-us': 'Pick an attachment',
    'es-es': 'Elige un archivo adjunto',
    'fr-fr': 'Choisissez une pièce jointe',
    'ru-ru': 'Выберите вложение',
    'uk-ua': 'Виберіть вкладення',
    'de-ch': 'Wählen Sie einen Anhang aus',
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
    'de-ch': 'Abgerundete Ecken',
    'es-es': 'URL de imagen ampliada',
    'fr-fr': "URL de l'image développée",
    'ru-ru': 'URL-адрес расширенного изображения',
    'uk-ua': 'Розширена URL-адреса зображення',
  },
  customLogoCollapsed: {
    'en-us': 'Collapsed Image URL',
    'de-ch': 'URL des minimierten Bilds',
    'es-es': 'URL de imagen contraída',
    'fr-fr': "URL de l'image réduite",
    'ru-ru': 'URL свернутого изображения',
    'uk-ua': 'URL-адреса згорнутого зображення',
  },
  customLogoDescription: {
    'en-us': `
      A URL to an image that would be displayed next to the Specify logo in the
      navigation menu.
    `,
    'de-ch': `
      Eine URL zu einem Bild, das neben dem Logo „Specify“ im Navigationsmenü
      angezeigt wird.
    `,
    'es-es': `
      Una URL a una imagen que se mostraría junto al logotipo Especificar en el
      menú de navegación.
    `,
    'fr-fr': `
      Une URL vers une image qui serait affichée à côté du logo Spécifier dans
      le menu de navigation.
    `,
    'ru-ru': `
      URL-адрес изображения, которое будет отображаться рядом с логотипом
      «Указать» в меню навигации.
    `,
    'uk-ua': `
      URL-адреса зображення, яке відображатиметься поруч із «Вказати логотип» у
      меню навігації.
    `,
  },
  showLineNumber: {
    'en-us': 'Show query result line number',
    'de-ch': 'Farbe der Gefahrenschaltfläche',
    'es-es': 'Mostrar el número de línea del resultado de la consulta',
    'fr-fr': 'Afficher le numéro de ligne du résultat de la requête',
    'ru-ru': 'Показать номер строки результата запроса',
    'uk-ua': 'Показати номер рядка результату запиту',
  },
  saveButtonColor: {
    'en-us': 'Save button color',
    'de-ch': 'Farbe der Schaltfläche „Speichern“',
    'es-es': 'Guardar color del botón',
    'fr-fr': 'Enregistrer la couleur du bouton',
    'ru-ru': 'Сохранить цвет кнопки',
    'uk-ua': 'Зберегти колір кнопки',
  },
  secondaryButtonColor: {
    'en-us': 'Secondary button color',
    'es-es': 'Color del botón secundario',
    'fr-fr': 'Couleur du bouton secondaire',
    'ru-ru': 'Цвет дополнительной кнопки',
    'uk-ua': 'Колір вторинної кнопки',
    'de-ch': 'Sekundäre Schaltflächenfarbe',
  },
  secondaryLightButtonColor: {
    'en-us': 'Secondary light button color',
    'de-ch': 'Farbe der sekundären Lichttaste',
    'es-es': 'Color del botón de luz secundaria',
    'fr-fr': 'Couleur du bouton d’éclairage secondaire',
    'ru-ru': 'Цвет кнопки вторичного освещения',
    'uk-ua': 'Колір вторинної світлової кнопки',
  },
  dangerButtonColor: {
    'en-us': 'Danger button color',
    'de-ch': 'Farbe der Gefahrenschaltfläche',
    'es-es': 'Color del botón de peligro',
    'fr-fr': 'Couleur du bouton Danger',
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
    'de-ch': 'Farbe der Warnschaltfläche',
    'es-es': 'Color del botón de advertencia',
    'fr-fr': "Couleur du bouton d'avertissement",
    'ru-ru': 'Цвет кнопки предупреждения',
    'uk-ua': 'Колір кнопки попередження',
  },
  successButtonColor: {
    'en-us': 'Success button color',
    'de-ch': 'Farbe der Schaltfläche „Erfolg“',
    'es-es': 'Color del botón de éxito',
    'fr-fr': 'Couleur du bouton Succès',
    'ru-ru': 'Цвет кнопки успеха',
    'uk-ua': 'Колір кнопки успіху',
  },
  openAsReadOnly: {
    'en-us': 'Open all records in read-only mode',
    'de-ch': 'Alle Datensätze im schreibgeschützten Modus öffnen',
    'es-es': 'Abrir todos los registros en modo de solo lectura',
    'fr-fr': 'Ouvrir tous les enregistrements en mode lecture seule',
    'ru-ru': 'Открыть все записи в режиме только для чтения',
    'uk-ua': 'Відкрити всі записи в режимі лише для читання',
  },
  displayBasicView: {
    'en-us': 'Display basic view',
    'de-ch': 'Basisansicht anzeigen',
    'es-es': 'Mostrar vista básica',
    'fr-fr': 'Afficher la vue de base',
    'ru-ru': 'Отобразить базовый вид',
    'uk-ua': 'Відобразити базовий вигляд',
  },
  basicView: {
    'en-us': 'Basic view',
    'de-ch': 'Basisansicht',
    'es-es': 'Vista básica',
    'fr-fr': 'Vue de base',
    'ru-ru': 'Базовый вид',
    'uk-ua': 'Основний вигляд',
  },
  detailedView: {
    'en-us': 'Detailed view',
    'de-ch': 'Detaillierte Ansicht',
    'es-es': 'Vista detallada',
    'fr-fr': 'Vue détaillée',
    'ru-ru': 'Детальный вид',
    'uk-ua': 'Детальний вигляд',
  },
  attachmentPreviewMode: {
    'en-us': 'Attachment preview mode',
    'de-ch': 'Anhangsvorschaumodus',
    'es-es': 'Modo de vista previa de archivos adjuntos',
    'fr-fr': 'Mode aperçu des pièces jointes',
    'ru-ru': 'Режим предварительного просмотра вложений',
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
    'de-ch': 'Suchleiste auf der Startseite hinzufügen',
    'es-es': 'Agregar barra de búsqueda en la página de inicio',
    'fr-fr': "Ajouter une barre de recherche sur la page d'accueil",
    'ru-ru': 'Добавить панель поиска на главную страницу',
    'uk-ua': 'Додайте рядок пошуку на головну сторінку',
  },
} as const);
