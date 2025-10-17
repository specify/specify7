/**
 * Localization strings for the preferences menu (split into manageable sections).
 *
 * @module
 */
import { createDictionary } from './utils';
import { preferencesContentDict } from './preferences.content';
import { preferencesBehaviorDict } from './preferences.behavior';
// Refer to "Guidelines for Programmers" in ./README.md before editing this file
export const preferencesGeneralDict= createDictionary({
  preferences: {
    'en-us': 'Preferences',
    'ru-ru': 'Настройки',
    'es-es': 'Preferencias',
    'fr-fr': 'Préférences',
    'uk-ua': 'Уподобання',
    'de-ch': 'Einstellungen',
    'pt-br': 'Preferências',
  },
  customization: {
    'en-us': 'Customization',
    'ru-ru': 'Настройка',
    'es-es': 'Personalización',
    'fr-fr': 'Personnalisation',
    'uk-ua': 'Спеціальнізація',
    'de-ch': 'Anpassung',
    'pt-br': 'Personalização',
  },
  userPreferences: {
    'en-us': 'User Preferences',
    'ru-ru': 'Настройки пользователя',
    'es-es': 'Preferencias del usuario',
    'fr-fr': "Préférences de l'utilisateur",
    'uk-ua': 'Налаштування користувача',
    'de-ch': 'Benutzereinstellungen',
    'pt-br': 'Preferências do usuário',
  },
  defaultUserPreferences: {
    'en-us': 'Default User Preferences',
    'ru-ru': 'Настройки пользователя по умолчанию',
    'es-es': 'Preferencias de usuario predeterminadas',
    'fr-fr': 'Préférences utilisateur par défaut',
    'uk-ua': 'Параметри користувача за умовчанням',
    'de-ch': 'Standardbenutzereinstellungen',
    'pt-br': 'Preferências de usuário padrão',
  },
  general: {
    'en-us': 'General',
    'ru-ru': 'Общий',
    'es-es': 'General',
    'fr-fr': 'Image personnalisée',
    'uk-ua': 'Спеціальне зображення',
    'de-ch': 'Allgemein',
    'pt-br': 'Em geral',
  },
  ui: {
    'en-us': 'User Interface',
    'ru-ru': 'Пользовательский интерфейс',
    'es-es': 'Interfaz de usuario',
    'fr-fr': 'Interface utilisateur',
    'uk-ua': 'Інтерфейс користувача',
    'de-ch': 'Benutzeroberfläche',
    'pt-br': 'Interface do usuário',
  },
  theme: {
    'en-us': 'Theme',
    'ru-ru': 'Тема',
    'es-es': 'Tema',
    'fr-fr': 'Thème',
    'uk-ua': 'Тема',
    'de-ch': 'Thema',
    'pt-br': 'Tema',
  },
  useSystemSetting: {
    'en-us': 'Use system setting',
    'ru-ru': 'Использовать системные настройки',
    'es-es': 'Utilizar la configuración del sistema',
    'fr-fr': 'Utiliser les paramètres du système',
    'uk-ua': 'Використовуйте налаштування системи',
    'de-ch': 'Systemeinstellung verwenden',
    'pt-br': 'Usar configuração do sistema',
  },
  inheritOsSettings: {
    'en-us': 'Copies value from your Operating System settings',
    'ru-ru': 'Копирует значение из настроек вашей операционной системы',
    'es-es': 'Copia el valor de la configuración de su sistema operativo',
    'fr-fr': "Copie la valeur des paramètres de votre système d'exploitation",
    'uk-ua': 'Копіює значення з налаштувань вашої операційної системи',
    'de-ch': 'Übernimmt den Wert aus Ihren Betriebssystemeinstellungen',
    'pt-br': 'Copia o valor das configurações do seu sistema operacional',
  },
  light: {
    comment: 'Light mode',
    'en-us': 'Light',
    'ru-ru': 'Свет',
    'es-es': 'Claro',
    'fr-fr': 'Lumière',
    'uk-ua': 'світло',
    'de-ch': 'Hell',
    'pt-br': 'Luz',
  },
  dark: {
    comment: 'Dark mode',
    'en-us': 'Dark',
    'ru-ru': 'Темный',
    'es-es': 'Oscuro',
    'fr-fr': 'Sombre',
    'uk-ua': 'Темний',
    'de-ch': 'Dunkel',
    'pt-br': 'Escuro',
  },
  reduceMotion: {
    'en-us': 'Reduce motion',
    'ru-ru': 'Уменьшите движение',
    'es-es': 'Reducir el movimiento',
    'fr-fr': 'Réduire les mouvements',
    'uk-ua': 'Зменшити рух',
    'de-ch': 'Bewegung reduzieren',
    'pt-br': 'Reduzir movimento',
  },
  reduceMotionDescription: {
    'en-us': 'Disable non-essential animations and transitions.',
    'ru-ru': 'Отключите ненужные анимации и переходы.',
    'es-es': 'Desactivar animaciones y transiciones no esenciales.',
    'fr-fr': 'Désactivez les animations et les transitions non essentielles.',
    'uk-ua': "Вимкніть необов'язкову анімацію та переходи.",
    'de-ch': 'Nicht erforderliche Animationen und Übergänge deaktivieren.',
    'pt-br': 'Desabilite animações e transições não essenciais.',
  },
  reduceTransparency: {
    'en-us': 'Reduce transparency',
    'ru-ru': 'Уменьшить прозрачность',
    'es-es': 'Reducir la transparencia',
    'fr-fr': 'Réduire la transparence',
    'uk-ua': 'Зменшити прозорість',
    'de-ch': 'Transparenz reduzieren',
    'pt-br': 'Reduzir a transparência',
  },
  reduceTransparencyDescription: {
    'en-us':
      'Whether to disable translucent backgrounds for user interface components whenever possible (e.g. table headers in tree view).',
    'ru-ru':
      'Следует ли отключать полупрозрачный фон для компонентов пользовательского интерфейса, когда это возможно (например, заголовки таблиц в древовидной структуре).',
    'es-es':
      'Si se deben deshabilitar los fondos translúcidos para los componentes de la interfaz de usuario siempre que sea posible (por ejemplo, encabezados de tabla en la vista de árbol).',
    'fr-fr':
      "S'il faut désactiver les arrière-plans translucides pour les composants de l'interface utilisateur chaque fois que possible (par exemple, les en-têtes de tableau dans l'arborescence).",
    'uk-ua':
      'Чи вимикати напівпрозорий фон для компонентів інтерфейсу користувача, коли це можливо (наприклад, заголовки таблиць у перегляді дерева).',
    'de-ch':
      'Durchsichtige Hintergründe für Benutzeroberflächenkomponenten wann immer möglich deaktivieren (z. B. Tabellenüberschriften in der Baumansicht).',
    'pt-br':
      'Se deve desabilitar fundos translúcidos para componentes da interface do usuário sempre que possível (por exemplo, cabeçalhos de tabela na visualização em árvore).',
  },
  contrast: {
    'en-us': 'Contrast',
    'ru-ru': 'Контраст',
    'es-es': 'Contraste',
    'fr-fr': 'Contraste',
    'uk-ua': 'Контраст',
    'de-ch': 'Kontrast',
    'pt-br': 'Contraste',
  },
  increase: {
    'en-us': 'Increase',
    'ru-ru': 'Увеличивать',
    'es-es': 'Aumentar',
    'fr-fr': 'Augmenter',
    'uk-ua': 'Збільшити',
    'de-ch': 'Erhöhen',
    'pt-br': 'Aumentar',
  },
  reduce: {
    'en-us': 'Reduce',
    'ru-ru': 'Уменьшать',
    'es-es': 'Reducir',
    'fr-fr': 'Réduire',
    'uk-ua': 'Зменшити',
    'de-ch': 'Verringern',
    'pt-br': 'Reduzir',
  },
  noPreference: {
    'en-us': 'No preference',
    'ru-ru': 'Нет предпочтений',
    'es-es': 'Sin preferencia',
    'fr-fr': 'Pas de préférence',
    'uk-ua': 'Без переваг',
    'de-ch': 'Keine Präferenz',
    'pt-br': 'Sem preferência',
  },
  fontSize: {
    'en-us': 'Font size',
    'ru-ru': 'Размер шрифта',
    'es-es': 'Tamaño de fuente',
    'fr-fr': 'Taille de police',
    'uk-ua': 'Розмір шрифту',
    'de-ch': 'Schriftgrösse',
    'pt-br': 'Tamanho da fonte',
  },
  fontFamily: {
    'en-us': 'Font family',
    'ru-ru': 'Семейство шрифтов',
    'es-es': 'Familia de fuentes',
    'fr-fr': 'Famille de polices',
    'uk-ua': 'Сімейство шрифтів',
    'de-ch': 'Schrift-Familie',
    'pt-br': 'Família de fontes',
  },
  fontFamilyDescription: {
    'en-us':
      'You can specify any font that is on your computer, even if it is not in the list. A comma-separated list of fonts is also supported, where each subsequent font will be used if the previous one is not available.',
    'ru-ru':
      'Вы можете указать любой шрифт, установленный на вашем компьютере, даже если его нет в списке. Также поддерживается список шрифтов, разделённый запятыми, где каждый последующий шрифт будет использоваться, если предыдущий недоступен.',
    'es-es':
      'Puede especificar cualquier fuente de su ordenador, incluso si no está en la lista. También se admite una lista de fuentes separadas por comas, donde se usará cada fuente subsiguiente si la anterior no está disponible.',
    'fr-fr':
      "Vous pouvez spécifier n'importe quelle police présente sur votre ordinateur, même si elle ne figure pas dans la liste. Une liste de polices séparées par des virgules est également prise en charge ; chaque police suivante sera utilisée si la précédente n'est pas disponible.",
    'uk-ua':
      "Ви можете вказати будь-який шрифт, який є на вашому комп'ютері, навіть якщо його немає в списку. Також підтримується розділений комами список шрифтів, у якому використовуватиметься другий шрифт, якщо перший недоступний тощо.",
    'de-ch':
      'Sie können jede Schriftart angeben, die sich auf Ihrem Computer befindet, auch wenn diese nicht in der Liste enthalten ist. Eine durch Kommas getrennte Liste von Schriftarten wird ebenfalls unterstützt, wobei die zweite Schriftart verwendet wird, wenn die erste nicht verfügbar ist usw.',
    'pt-br':
      'Você pode especificar qualquer fonte que esteja no seu computador, mesmo que ela não esteja na lista. Uma lista de fontes separadas por vírgulas também é suportada, onde cada fonte subsequente será usada se a anterior não estiver disponível.',
  },
  defaultFont: {
    'en-us': '(default font)',
    'ru-ru': '(шрифт по умолчанию)',
    'es-es': '(fuente predeterminada)',
    'fr-fr': '(police par défaut)',
    'uk-ua': '(типовий шрифт)',
    'de-ch': '(Standardschriftart)',
    'pt-br': '(fonte padrão)',
  },
  maxFormWidth: {
    'en-us': 'Max form width',
    'ru-ru': 'Максимальная ширина формы',
    'es-es': 'Ancho máximo del formulario',
    'fr-fr': 'Largeur maximale du formulaire',
    'uk-ua': 'Максимальна ширина форми',
    'de-ch': 'Maximale Formularbreite',
    'pt-br': 'Largura máxima do formulário',
  },
  fieldBackgrounds: {
    'en-us': 'Field backgrounds',
    'ru-ru': 'Фоны полей',
    'es-es': 'Fondos de campo',
    'fr-fr': 'Milieux de terrain',
    'uk-ua': 'Польові фони',
    'de-ch': 'Feldhintergründe',
    'pt-br': 'Fundos de campo',
  },
  fieldBackground: {
    'en-us': 'Field background',
    'ru-ru': 'Фон поля',
    'es-es': 'Fondo de campo',
    'fr-fr': 'Contexte du terrain',
    'uk-ua': 'Поле фону',
    'de-ch': 'Feldhintergrund',
    'pt-br': 'Contexto de campo',
  },
  disabledFieldBackground: {
    'en-us': 'Disabled field background',
    'ru-ru': 'Отключенный фон поля',
    'es-es': 'Fondo de campo deshabilitado',
    'fr-fr': 'Fond de champ désactivé',
    'uk-ua': 'Вимкнений фон поля',
    'de-ch': 'Deaktivierter Feldhintergrund',
    'pt-br': 'Fundo de campo desativado',
  },
  invalidFieldBackground: {
    'en-us': 'Invalid field background',
    'ru-ru': 'Неверный фон поля',
    'es-es': 'Fondo de campo no válido',
    'fr-fr': 'Fond de champ invalide',
    'uk-ua': 'Недійсний фон поля',
    'de-ch': 'Ungültiger Feldhintergrund',
    'pt-br': 'Fundo de campo inválido',
  },
  requiredFieldBackground: {
    'en-us': 'Required field background',
    'ru-ru': 'Обязательное поле фон',
    'es-es': 'Fondo del campo obligatorio',
    'fr-fr': 'Contexte du champ obligatoire',
    'uk-ua': "Обов'язковий фон поля",
    'de-ch': 'Feldhintergrund erforderlich',
    'pt-br': 'Histórico de campo obrigatório',
  },
  darkFieldBackground: {
    'en-us': 'Field background (dark theme)',
    'ru-ru': 'Фон поля (тёмная тема)',
    'es-es': 'Fondo de campo (tema oscuro)',
    'fr-fr': 'Fond de champ (thème sombre)',
    'uk-ua': 'Фон поля (темна тема)',
    'de-ch': 'Feldhintergrund (Dunkles Thema)',
    'pt-br': 'Fundo de campo (tema escuro)',
  },
  darkDisabledFieldBackground: {
    'en-us': 'Disabled field background (dark theme)',
    'ru-ru': 'Отключенный фон поля (тёмная тема)',
    'es-es': 'Fondo de campo deshabilitado (tema oscuro)',
    'fr-fr': 'Fond de champ désactivé (thème sombre)',
    'uk-ua': 'Вимкнений фон поля (темна тема)',
    'de-ch': 'Deaktivierter Feldhintergrund (Dunkles Thema)',
    'pt-br': 'Fundo de campo desativado (tema escuro)',
  },
  darkInvalidFieldBackground: {
    'en-us': 'Invalid field background (dark theme)',
    'ru-ru': 'Недопустимый фон поля (тёмная тема)',
    'es-es': 'Fondo de campo no válido (tema oscuro)',
    'fr-fr': 'Largeur de colonne de grille de sous-vue flexible',
    'uk-ua': 'Гнучка ширина стовпця сітки вкладеного перегляду',
    'de-ch': 'Ungültiger Feldhintergrund (Dunkles Thema)',
    'pt-br': 'Fundo de campo inválido (tema escuro)',
  },
  darkRequiredFieldBackground: {
    'en-us': 'Required field background (dark theme)',
    'ru-ru': 'Обязательное поле фон (тёмная тема)',
    'es-es': 'Fondo del campo obligatorio (tema oscuro)',
    'fr-fr': 'Fond de champ obligatoire (thème sombre)',
    'uk-ua': 'Обов’язковий фон поля (темна тема)',
    'de-ch': 'Feldhintergrund erforderlich (Dunkles Thema)',
    'pt-br': 'Fundo de campo obrigatório (tema escuro)',
  },
  dialogs: {
    'en-us': 'Dialogs',
    'ru-ru': 'Диалоги',
    'es-es': 'Diálogos',
    'fr-fr': 'Boîtes de dialogue',
    'uk-ua': 'Діалоги',
    'de-ch': 'Dialoge',
    'pt-br': 'Diálogos',
  },
  appearance: {
    'en-us': 'Appearance',
    'ru-ru': 'Появление',
    'es-es': 'Apariencia',
    'fr-fr': 'Apparence',
    'uk-ua': 'Зовнішній вигляд',
    'de-ch': 'Aussehen',
    'pt-br': 'Aparência',
  },
  buttonsLight: {
    'en-us': 'Buttons (light mode)',
    'de-ch': 'Buttons (Helles Thema)',
    'es-es': 'Botones (modo luz)',
    'fr-fr': 'Boutons (mode lumière)',
    'ru-ru': 'Кнопки (световой режим)',
    'uk-ua': 'Кнопки (світлий режим)',
    'pt-br': 'Botões (modo claro)',
  },
  buttonsDark: {
    'en-us': 'Buttons (dark mode)',
    'de-ch': 'Buttons (Dunkles Thema)',
    'es-es': 'Botones (modo oscuro)',
    'fr-fr': 'Boutons (mode sombre)',
    'ru-ru': 'Кнопки (темный режим)',
    'uk-ua': 'Кнопки (темний режим)',
    'pt-br': 'Botões (modo escuro)',
  },
  translucentDialog: {
    'en-us': 'Translucent dialogs',
    'ru-ru': 'Прозрачные диалоги',
    'es-es': 'Diálogos translúcidos',
    'fr-fr': 'Dialogues translucides',
    'uk-ua': 'Напівпрозорі діалоги',
    'de-ch': 'Durchscheinende Dialoge',
    'pt-br': 'Diálogos translúcidos',
  },
  translucentDialogDescription: {
    'en-us': 'Whether dialogs have translucent background.',
    'ru-ru': 'Имеют ли диалоговые окна полупрозрачный фон.',
    'es-es': 'Si los diálogos tienen fondo translúcido.',
    'fr-fr': 'Si les boîtes de dialogue ont un fond translucide.',
    'uk-ua': 'Чи мають діалоги прозорий фон.',
    'de-ch': 'Dialogfenster mit durchscheinenden Hintergrund.',
    'pt-br': 'Se os diálogos têm fundo translúcido.',
  },
  alwaysPrompt: {
    'en-us': 'Always prompt to choose collection',
    'ru-ru': 'Всегда предлагайте выбрать коллекцию',
    'es-es': 'Siempre dispuesto a elegir la colección',
    'fr-fr': 'Toujours invité à choisir la collection',
    'uk-ua': 'Завжди підкажуть вибрати колекцію',
    'de-ch': 'Immer zur Auswahl der Sammlung auffordern',
    'pt-br': 'Sempre pronto para escolher a coleção',
  },
  treeEditor: {
    'en-us': 'Tree Editor',
    'ru-ru': 'Редактор деревьев',
    'es-es': 'Editor de árboles',
    'fr-fr': "Éditeur d'arborescence",
    'uk-ua': 'Редактор дерева',
    'de-ch': 'Baumeditor',
    'pt-br': 'Editor de Árvore',
  },
  treeAccentColor: {
    'en-us': 'Tree accent color',
    'ru-ru': 'Акцентный цвет дерева',
    'es-es': 'Color de acento del árbol',
    'fr-fr': "Couleur d'accent d'arbre",
    'uk-ua': 'Колір акценту дерева',
    'de-ch': 'Baumakzentfarbe',
    'pt-br': 'Cor de destaque da árvore',
  },
  synonymColor: {
    'en-us': 'Synonym color',
    'ru-ru': 'Синоним цвет',
    'es-es': 'Color sinónimo',
    'fr-fr': 'Synonyme couleur',
    'uk-ua': 'Синонім кольору',
    'de-ch': 'Synonymfarbe',
    'pt-br': 'Cor sinônimo',
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
  header: {
    'en-us': 'Navigation Menu',
    'ru-ru': 'Меню навигации',
    'es-es': 'Menú de navegación',
    'fr-fr': 'le menu de navigation',
    'uk-ua': 'Навігаційне меню',
    'de-ch': 'Navigationsmenü',
    'pt-br': 'Menu de navegação',
  },
  application: {
    'en-us': 'Application',
    'ru-ru': 'Приложение',
    'es-es': 'Solicitud',
    'fr-fr': 'Application',
    'uk-ua': 'застосування',
    'de-ch': 'Anwendung',
    'pt-br': 'Aplicativo',
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
  showDialogIcon: {
    'en-us': 'Show icon in the header',
    'ru-ru': 'Показывать значок в заголовке',
    'es-es': 'Mostrar icono en el encabezado',
    'fr-fr': "Afficher l'icône dans l'en-tête",
    'uk-ua': 'Показати значок у заголовку',
    'de-ch': 'Symbol in der Kopfzeile anzeigen',
    'pt-br': 'Mostrar ícone no cabeçalho',
  },
  scaleInterface: {
    'en-us': 'Scale Interface',
    'ru-ru': 'Интерфейс масштабирования',
    'es-es': 'Interfaz de escala',
    'fr-fr': 'Interface de balance',
    'uk-ua': 'Інтерфейс масштабу',
    'de-ch': 'Waagenschnittstelle',
    'pt-br': 'Interface de escala',
  },
  scaleInterfaceDescription: {
    'en-us': 'Scale interface to match font size.',
    'ru-ru': 'Масштабируйте интерфейс в соответствии с размером шрифта.',
    'es-es': 'Escala la interfaz para que coincida con el tamaño de la fuente.',
    'fr-fr': "Adapter l'interface à la taille de la police.",
    'uk-ua': 'Масштабуйте інтерфейс відповідно до розміру шрифту.',
    'de-ch':
      'Skalieren Sie die Benutzeroberfläche, um sie an die Schriftgröße anzupassen.',
    'pt-br': 'Dimensione a interface para corresponder ao tamanho da fonte.',
  },
  displayAuthor: {
    'en-us': 'Show author in the tree',
    'ru-ru': 'Показать автора в дереве',
    'es-es': 'Mostrar autor en el árbol',
    'fr-fr': "Afficher l'auteur dans l'arbre",
    'uk-ua': 'Показати автора в дереві',
    'de-ch': 'Autor im Baum anzeigen',
    'pt-br': 'Mostrar autor',
  },
  welcomePage: {
    'en-us': 'Home Page',
    'ru-ru': 'Домашняя страница',
    'es-es': 'Página de inicio',
    'fr-fr': "Page d'accueil",
    'uk-ua': 'Домашня сторінка',
    'de-ch': 'Startseite',
    'pt-br': 'Página inicial',
  }, 

} as const);

const aggregatedPreferences = {
  ...preferencesGeneralDict,
  ...preferencesContentDict,
  ...preferencesBehaviorDict,
} as const;

export const preferencesText = (aggregatedPreferences);
