/**
 * Localization strings used in the Header, UserTools menu, Login page
 * and Choose collection page
 *
 * @module
 */

import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

export const mainText = createDictionary({
  appTitle: {
    comment: 'Formatting for the title in the web page title bar',
    'en-us': '{baseTitle:string} | Specify 7',
    'ru-ru': '{baseTitle:string} | Specify 7',
    'es-es': '{baseTitle:string} | Especificar 7',
    'fr-fr': '{baseTitle:string} | Précisez 7',
    'uk-ua': '{baseTitle:string} | Вкажіть 7',
  },
  baseAppTitle: {
    comment: 'Default page title',
    'en-us': 'Specify 7',
    'ru-ru': 'Specify 7',
    'es-es': 'Especificar 7',
    'fr-fr': 'Précisez 7',
    'uk-ua': 'Вкажіть 7',
  },
  pageNotFound: {
    comment: 'Used in title',
    'en-us': 'Page Not Found',
    'ru-ru': 'Страница не найдена',
    'es-es': 'Página no encontrada',
    'fr-fr': 'Page non trouvée',
    'uk-ua': 'Сторінку не знайдено',
  },
  nothingWasFound: {
    comment: 'Used in the heading on 404 page',
    'en-us': 'Oops! Nothing was found',
    'ru-ru': 'Ой! Ничего не найдено',
    'es-es': '¡Ups! no se encontró nada',
    'fr-fr': "Oops! Rien n'a été trouvé",
    'uk-ua': 'Ой! Нічого не знайдено',
  },
  pageNotFoundDescription: {
    comment: 'Used in the paragraph on 404 page',
    'en-us': `
      The page you are looking for might have been removed, had its name changed
      or is temporarily unavailable.
    `,
    'ru-ru': `
      Возможно, страница, которую вы ищете, была удалена, ее название изменилось
      или она временно недоступна.
    `,
    'es-es': `
      Es posible que la página que está buscando haya sido eliminada, haya
      cambiado de nombre o no esté disponible temporalmente.
    `,
    'fr-fr': `
      La page que vous recherchez a peut-être été supprimée, a changé de nom ou
      est temporairement indisponible.
    `,
    'uk-ua': `
      Можливо, сторінку, яку ви шукаєте, видалили, її назву змінили або вона
      тимчасово недоступна.
    `,
  },
  returnToHomepage: {
    'en-us': 'Return to homepage',
    'ru-ru': 'Вернуться на главную страницу',
    'es-es': 'Regresar a la página principal',
    'fr-fr': "Retour à la page d'accueil",
    'uk-ua': 'Повернутися на головну сторінку',
  },
  errorOccurred: {
    'en-us': "Sorry, something's gone a bit wrong",
    'ru-ru': 'Произошла неожиданная ошибка',
    'es-es': 'Lo siento, algo salió un poco mal',
    'fr-fr': "Désolé, quelque chose s'est un peu mal passé",
    'uk-ua': 'Вибачте, щось пішло не так',
  },
  errorOccurredDescription: {
    'en-us': `
      We're sorry, it seems you have encountered an error in Specify 7 that we
      may not be aware of.
    `,
    'ru-ru': `
      Произошла неисправимая ошибка, которая не позволит нам безопасно вернуться
      к вашему текущему окну.
    `,
    'es-es': `
      Lo sentimos, parece que ha encontrado un error en Especificar 7 del que
      tal vez no tengamos conocimiento.
    `,
    'fr-fr': `
      Nous sommes désolés, il semble que vous ayez rencontré une erreur dans
      Spécifier 7 dont nous n'avons peut-être pas connaissance.
    `,
    'uk-ua': `
      Вибачте, здається, ви зіткнулися з помилкою в Specify 7, про яку ми могли
      не знати.
    `,
  },
  criticalErrorOccurredDescription: {
    'en-us': `
      To avoid corrupting data records, we need to start again from a safe
      spot--the Home page.
    `,
    'ru-ru': `
      Чтобы избежать повреждения записей данных, нам нужно начать заново с
      безопасного места — домашней страницы.
    `,
    'es-es': `
      Para evitar corromper los registros de datos, debemos comenzar de nuevo
      desde un lugar seguro: la página de inicio.
    `,
    'fr-fr': `
      Pour éviter de corrompre les enregistrements de données, nous devons
      recommencer à partir d'un endroit sûr : la page d'accueil.
    `,
    'uk-ua': `
      Щоб уникнути пошкодження записів даних, нам потрібно почати знову з
      безпечного місця – домашньої сторінки.
    `,
  },
  errorResolutionDescription: {
    'en-us': `
      If this issue persists, please contact your IT support. If this is a
      Specify Cloud database, please download the error message and send it to
      <email />.
    `,
    'ru-ru': `
      Если эта проблема не устраняется, обратитесь к вашей службе поддержки.
      Если это база данных Specify Cloud, загрузите сообщение об ошибке и
      отправьте его на <email />.
    `,
    'es-es': `
      Si este problema persiste, comuníquese con su soporte de TI. Si se trata
      de una base de datos de Especificar nube, descargue el mensaje de error y
      envíelo a <email />.
    `,
    'fr-fr': `
      Si ce problème persiste, veuillez contacter votre support informatique.
      S'il s'agit d'une base de données Spécifier le cloud, veuillez télécharger
      le message d'erreur et l'envoyer à <email />.
    `,
    'uk-ua': `
      Якщо проблема не зникне, зверніться до служби підтримки ІТ. Якщо це база
      даних Specify Cloud, завантажте повідомлення про помилку та надішліть його
      на <email />.
    `,
  },
  errorResolutionSecondDescription: {
    comment: 'Careful with the <xml> tags when localizing',
    'en-us': `
      Users from <memberLink>member institutions</memberLink> can search for
      answered questions and ask for help on our <discourseLink>Community
      Forum</discourseLink>.
    `,
    'ru-ru': `
      Пользователи из <memberLink>учреждений Консорциума</memberLink> могут
      искать ответы на вопросы и обращаться за помощью на нашем
      <discourseLink>форуме</discourseLink>.
    `,
    'es-es': `
      Los usuarios de <memberLink>instituciones miembro</memberLink> pueden
      buscar respuestas a preguntas y pedir ayuda en nuestro <discourseLink>Foro
      de la comunidad</discourseLink>.
    `,
    'fr-fr': `
      Les utilisateurs des <memberLink>institutions membres</memberLink> peuvent
      rechercher des réponses aux questions et demander de l'aide sur notre
      <discourseLink>Forum communautaire</discourseLink>.
    `,
    'uk-ua': `
      Користувачі <memberLink>учасниць </memberLink> можуть шукати відповіді на
      запитання та звертатися за допомогою на нашому <discourseLink>Форумі
      спільноти</discourseLink>.
    `,
  },
  errorMessage: {
    'en-us': 'Error Message',
    'ru-ru': 'Описание ошибки',
    'es-es': 'Mensaje de error',
    'fr-fr': "Message d'erreur",
    'uk-ua': 'Повідомлення про помилку',
  },
  leavePageConfirmation: {
    'en-us': 'Are you sure you want to leave this page?',
    'ru-ru': 'Вы уверены, что хотите покинуть эту страницу?',
    'es-es': '¿Seguro que quieres salir de esta página?',
    'fr-fr': 'Voulez-vous vraiment quitter cette page ?',
    'uk-ua': 'Ви впевнені, що бажаєте залишити цю сторінку?',
  },
  leavePageConfirmationDescription: {
    'en-us': 'Unsaved changes would be lost if your leave this page.',
    'ru-ru':
      'Несохраненные изменения будут потеряны, если вы покинете эту страницу.',
    'es-es': 'Los cambios no guardados se perderán si abandona esta página.',
    'fr-fr': `
      Les modifications non enregistrées seront perdues si vous quittez cette
      page.
    `,
    'uk-ua': 'Незбережені зміни буде втрачено, якщо ви залишите цю сторінку.',
  },
  leave: {
    'en-us': 'Leave',
    'ru-ru': 'Покинуть',
    'es-es': 'Salir',
    'fr-fr': 'Laisser',
    'uk-ua': 'Залишати',
  },
  versionMismatch: {
    'en-us': 'Specify version does not match database version',
    'ru-ru': 'Specify версия не соответствует версии базы данных',
    'es-es':
      'La versión especificada no coincide con la versión de la base de datos',
    'fr-fr': `
      La version spécifiée ne correspond pas à la version de la base de données
    `,
    'uk-ua': 'Вказана версія не відповідає версії бази даних',
  },
  versionMismatchDescription: {
    'en-us': `
      The Specify version {specifySixVersion:string} does not match the database
      version {databaseVersion:string}.
    `,
    'ru-ru': `
      Specify версия {specifySixVersion:string} не соответствует версии базы
      данных {databaseVersion:string}.
    `,
    'es-es': `
      La versión especificada {specifySixVersion:string} no coincide con la
      versión de la base de datos {databaseVersion:string}.
    `,
    'fr-fr': `
      La version Spécifier {specifySixVersion:string} ne correspond pas à la
      version de la base de données {databaseVersion:string}.
    `,
    'uk-ua': `
      Укажіть версію {specifySixVersion:string} не відповідає версії бази даних
      {databaseVersion:string}.
    `,
  },
  versionMismatchSecondDescription: {
    'en-us':
      'Some features of Specify 7 may therefore fail to operate correctly.',
    'ru-ru': 'Поэтому некоторые функции Specify 7 могут неработать.',
    'es-es': `
      Por lo tanto, es posible que algunas funciones de Specific 7 no funcionen
      correctamente.
    `,
    'fr-fr': `
      Certaines fonctionnalités de Spécifier 7 peuvent donc ne pas fonctionner
      correctement.
    `,
    'uk-ua': 'Тому деякі функції Specify 7 можуть не працювати належним чином.',
  },
  versionMismatchInstructions: {
    'en-us': 'Instructions for resolving Specify schema mismatch',
    'ru-ru': 'Инструкции по устранению несоответствия схемы Specify',
    'es-es': 'Instrucciones para resolver Especificar discrepancia de esquema',
    'fr-fr': "Instructions pour résoudre l'incompatibilité de schéma Spécifier",
    'uk-ua': 'Інструкції щодо вирішення Specify schema mismatch',
  },
} as const);
