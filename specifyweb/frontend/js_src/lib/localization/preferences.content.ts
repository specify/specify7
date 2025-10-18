/**
 * Localization strings for content-related preferences.
 *
 * @module
 */
import { createDictionary } from './utils';
// Refer to "Guidelines for Programmers" in ./README.md before editing this file
export const preferencesContentDictionary = {
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
  specifyNetworkBadge: {
    'en-us': 'Specify Network Badge',
    'ru-ru': 'Укажите сетевой значок',
    'es-es': 'Especificar la insignia de red',
    'fr-fr': 'Spécifier le badge réseau',
    'uk-ua': 'Укажіть значок мережі',
    'de-ch': 'Netzwerk-Badge angeben',
    'pt-br': 'Especificar emblema de rede',
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
} as const;

export const preferencesContentText = createDictionary(
  preferencesContentDictionary
);
