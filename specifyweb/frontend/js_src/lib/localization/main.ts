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
    'es-es': '{baseTitle:string} | Specify 7',
    'fr-fr': '{baseTitle:string} | Specify 7',
    'uk-ua': '{baseTitle:string} | Specify 7',
    'de-ch': '{baseTitle:string} | Specify 7',
    'pt-br': '{baseTitle:string} | Especifique 7',
  },
  baseAppTitle: {
    comment: 'Default page title',
    'en-us': 'Specify 7',
    'ru-ru': 'Specify 7',
    'es-es': 'Specify 7',
    'fr-fr': 'Specify 7',
    'uk-ua': 'Specify 7',
    'de-ch': 'Specify 7',
    'pt-br': 'Especifique 7',
  },
  pageNotFound: {
    comment: 'Used in title',
    'en-us': 'Page Not Found',
    'ru-ru': 'Страница не найдена',
    'es-es': 'Página no encontrada',
    'fr-fr': 'Page non trouvée',
    'uk-ua': 'Сторінку не знайдено',
    'de-ch': 'Seite wurde nicht gefunden',
    'pt-br': 'Página não encontrada',
  },
  nothingWasFound: {
    comment: 'Used in the heading on 404 page',
    'en-us': 'Oops! Nothing was found',
    'ru-ru': 'Ой! Ничего не найдено',
    'es-es': '¡Uy! No se encontró nada',
    'fr-fr': "Oups ! Rien n'a été trouvé",
    'uk-ua': 'Ой! Нічого не знайдено',
    'de-ch': 'Hoppla! Es wurde nichts gefunden :-(',
    'pt-br': 'Ops! Nada foi encontrado',
  },
  pageNotFoundDescription: {
    comment: 'Used in the paragraph on 404 page',
    'en-us':
      'The page you are looking for might have been removed, had its name changed or is temporarily unavailable.',
    'ru-ru':
      'Возможно, страница, которую вы ищете, была удалена, ее название изменилось или она временно недоступна.',
    'es-es':
      'Es posible que la página que busca haya sido eliminada, haya cambiado de nombre o no esté disponible temporalmente.',
    'fr-fr':
      'La page que vous recherchez a peut-être été supprimée, a changé de nom ou est temporairement indisponible.',
    'uk-ua':
      'Можливо, сторінку, яку ви шукаєте, видалили, її назву змінили або вона тимчасово недоступна.',
    'de-ch':
      'Die Seite, die Sie suchen, wurde möglicherweise entfernt, ihr Name wurde geändert oder sie ist vorübergehend nicht verfügbar.',
    'pt-br':
      'A página que você está procurando pode ter sido removida, teve seu nome alterado ou está temporariamente indisponível.',
  },
  returnToHomepage: {
    'en-us': 'Return to homepage',
    'ru-ru': 'Вернуться на главную страницу',
    'es-es': 'Regresar a la página de inicio',
    'fr-fr': "Retour à la page d'accueil",
    'uk-ua': 'Повернутися на домашню сторінку',
    'de-ch': 'Zurück zur Startseite',
    'pt-br': 'Voltar para a página inicial',
  },
  errorOccurred: {
    'en-us': 'We are sorry, something has gone wrong',
    'ru-ru': 'Извините, что-то пошло не так.',
    'es-es': 'Lo sentimos, algo ha ido mal',
    'fr-fr': "Nous sommes désolés, quelque chose s'est mal passé",
    'uk-ua': 'Вибачте, щось пішло не так',
    'de-ch': 'Es tut uns leid, etwas ist schiefgelaufen',
    'pt-br': 'Lamentamos, algo deu errado',
  },
  clickToSeeDetails: {
    'en-us': 'Click to see details',
    'es-es': 'Haz clic para ver los detalles',
    'uk-ua': 'Натисніть, щоб переглянути деталі',
    'de-ch': 'Klicken Sie hier, um Details anzuzeigen',
    'fr-fr': 'Cliquez pour voir les détails',
    'ru-ru': 'Нажмите, чтобы увидеть подробности',
    'pt-br': 'Clique para ver detalhes',
  },
  errorOccurredDescription: {
    'en-us':
      "We're sorry, it seems you have encountered an error in Specify 7 that we may not be aware of.",
    'ru-ru':
      'Произошла неисправимая ошибка, которая не позволит нам безопасно вернуться к вашему текущему окну.',
    'es-es':
      'Lo sentimos, parece que ha encontrado un error en Specify 7 del que no somos conscientes.',
    'fr-fr':
      "Nous sommes désolés, il semble que vous ayez rencontré une erreur dans Specify 7 dont nous n'avons peut-être pas connaissance.",
    'uk-ua':
      'Вибачте, здається, ви зіткнулися з помилкою в Specify 7, про яку ми могливо не знаємо.',
    'de-ch':
      'Es tut uns leid, aber es scheint, dass Sie auf einen Fehler in Specify 7 gestossen sind, der uns möglicherweise nicht bekannt ist.',
    'pt-br':
      'Lamentamos, parece que você encontrou um erro no Specify 7 do qual talvez não estejamos cientes.',
  },
  criticalErrorOccurredDescription: {
    'en-us':
      'To avoid corrupting data records, you need to start again from a safe spot--the Home page.',
    'ru-ru':
      'Чтобы избежать повреждения записей данных, вам необходимо начать заново с безопасного места — с домашней страницы.',
    'es-es':
      'Para evitar corromper los registros de datos, debe comenzar de nuevo desde un lugar seguro: la página de inicio.',
    'fr-fr':
      "Pour éviter de corrompre les enregistrements de données, vous devez recommencer à partir d'un endroit sûr : la page d'accueil.",
    'uk-ua':
      'Щоб уникнути пошкодження записів даних, вам потрібно почати знову з безпечного місця – головної сторінки.',
    'de-ch':
      'Um eine Beschädigung der Datensätze zu vermeiden, müssen Sie an einer sicheren Stelle neu beginnen – der Startseite.',
    'pt-br':
      'Para evitar corromper registros de dados, você precisa começar novamente em um local seguro: a página inicial.',
  },
  errorResolutionDescription: {
    'en-us':
      'If this issue persists, please contact your IT support. If this is a Specify Cloud database, please download the error message and send it to <email />.',
    'ru-ru':
      'Если эта проблема не устраняется, обратитесь к вашей службе поддержки. Если это база данных Specify Cloud, загрузите сообщение об ошибке и отправьте его на <email />.',
    'es-es':
      'Si el problema persiste, póngase en contacto con el servicio de asistencia informática. Si se trata de una base de datos de Specify Cloud, descargue el mensaje de error y envíelo a <email />.',
    'fr-fr':
      "Si ce problème persiste, veuillez contacter votre support informatique. S'il s'agit d'une base de données Specify Cloud, veuillez télécharger le message d'erreur et l'envoyer à <email />.",
    'uk-ua':
      'Якщо проблема не зникне, зверніться до служби підтримки ІТ. Якщо це база даних Specify Cloud, завантажте повідомлення про помилку та надішліть його на <email />.',
    'de-ch':
      'Wenn dieses Problem weiterhin besteht, wenden Sie sich bitte an Ihren IT-Support. Wenn es sich um eine Specify Cloud-Datenbank handelt, laden Sie bitte die Fehlermeldung herunter und senden Sie sie an <email />.',
    'pt-br':
      'Se o problema persistir, entre em contato com o suporte de TI. Se for um banco de dados do Specify Cloud, baixe a mensagem de erro e envie para <email />.',
  },
  errorResolutionSecondDescription: {
    comment: 'Careful with the <xml> tags when localizing',
    'en-us':
      'Users from <memberLink>member institutions</memberLink> can search for answered questions and ask for help on our <discourseLink>Community Forum</discourseLink>.',
    'ru-ru':
      'Пользователи из <memberLink>учреждений Консорциума</memberLink> могут искать ответы на вопросы и обращаться за помощью на нашем <discourseLink>форуме</discourseLink>.',
    'es-es':
      'Los usuarios de <memberLink>miembros de las instituciones</memberLink> pueden buscar preguntas respondidas y pedir ayuda en nuestro <discourseLink>Foro</discourseLink>.',
    'fr-fr':
      "Les utilisateurs des <memberLink>institutions membres</memberLink> peuvent rechercher des réponses aux questions et demander de l'aide sur notre <discourseLink>Forum communautaire</discourseLink>.",
    'uk-ua':
      'Користувачі <memberLink>установ-членів</memberLink> можуть шукати відповіді на запитання та звертатися за допомогою на нашому <discourseLink>форумі</discourseLink>.',
    'de-ch':
      'Benutzer von <memberLink>Mitgliedsinstitutionen</memberLink> können in unserem <discourseLink>Community Forum</discourseLink> nach Antworten suchen und um Hilfe bitten.',
    'pt-br':
      'Usuários de <memberLink>instituições membros</memberLink> podem pesquisar perguntas respondidas e pedir ajuda em nosso <discourseLink>Fórum da Comunidade</discourseLink>.',
  },
  errorMessage: {
    'en-us': 'Error Message',
    'ru-ru': 'Описание ошибки',
    'es-es': 'Mensaje de error',
    'fr-fr': "Message d'erreur",
    'uk-ua': 'Повідомлення про помилку',
    'de-ch': 'Fehlermeldung',
    'pt-br': 'Mensagem de erro',
  },
  leavePageConfirmation: {
    'en-us': 'Are you sure you want to leave this page?',
    'ru-ru': 'Вы уверены, что хотите покинуть эту страницу?',
    'es-es': '¿Está seguro de que quiere abandonar esta página?',
    'fr-fr': 'Voulez-vous vraiment quitter cette page ?',
    'uk-ua': 'Ви впевнені, що бажаєте покинути цю сторінку?',
    'de-ch': 'Sind Sie sicher, dass Sie diese Seite verlassen wollen?',
    'pt-br': 'Tem certeza de que deseja sair desta página?',
  },
  leavePageConfirmationDescription: {
    'en-us': 'Unsaved changes will be lost if you leave this page.',
    'ru-ru':
      'Несохраненные изменения будут потеряны, если вы покинете эту страницу.',
    'es-es': 'Los cambios no guardados se perderán si abandona esta página.',
    'fr-fr':
      'Les modifications non enregistrées seront perdues si vous quittez cette page.',
    'uk-ua': 'Незбережені зміни будуть втрачені, якщо ви залишите цю сторінку.',
    'de-ch':
      'Nicht gespeicherte Änderungen gehen verloren, wenn Sie diese Seite verlassen.',
    'pt-br':
      'As alterações não salvas serão perdidas se você sair desta página.',
  },
  leave: {
    'en-us': 'Leave',
    'ru-ru': 'Покинуть',
    'es-es': 'Abandonar',
    'fr-fr': 'Quitter',
    'uk-ua': 'Покинути',
    'de-ch': 'Verlassen',
    'pt-br': 'Deixar',
  },
  versionMismatch: {
    'en-us': 'Specify version does not match database version',
    'ru-ru': 'Specify версия не соответствует версии базы данных',
    'es-es':
      'La versión de Specify no coincide con la versión de la base de datos',
    'fr-fr':
      'La version de Specify ne correspond pas à la version de la base de données',
    'uk-ua': 'Версія Specify не відповідає версії бази даних',
    'de-ch':
      'Die Specify Version stimmt nicht mit der Datenbankversion überein',
    'pt-br': 'A versão especificada não corresponde à versão do banco de dados',
  },
  versionMismatchDescription: {
    'en-us':
      'The Specify version {specifySixVersion:string} does not match the database version {databaseVersion:string}.',
    'ru-ru':
      'Specify версия {specifySixVersion:string} не соответствует версии базы данных {databaseVersion:string}.',
    'es-es':
      'La versión de Specify {specifySixVersion:string} no coincide con la versión {databaseVersion:string} de la base de datos.',
    'fr-fr':
      'La version {specifySixVersion:string} de Specify ne correspond pas à la version {databaseVersion:string} de la base de données.',
    'uk-ua':
      'Версія Specify {specifySixVersion:string} не відповідає версії бази даних {databaseVersion:string}.',
    'de-ch':
      'Die Specify Version {specifySixVersion:string} stimmt nicht mit der Datenbankversion {databaseVersion:string} überein.',
    'pt-br':
      'A versão Especificar {specifySixVersion:string} não corresponde à versão do banco de dados {databaseVersion:string}.',
  },
  versionMismatchSecondDescription: {
    'en-us':
      'Some features of Specify 7 may therefore fail to operate correctly.',
    'ru-ru': 'Поэтому некоторые функции Specify 7 могут неработать.',
    'es-es':
      'Por lo tanto, es posible que algunas funciones de Specific 7 no funcionen correctamente.',
    'fr-fr':
      'Certaines fonctionnalités de Specify 7 peuvent donc ne pas fonctionner correctement.',
    'uk-ua': 'Тому деякі функції Specify 7 можуть не працювати належним чином.',
    'de-ch':
      'Einige Funktionen von Specify 7 funktionieren daher möglicherweise nicht richtig.',
    'pt-br':
      'Alguns recursos do Specify 7 podem, portanto, não funcionar corretamente.',
  },
  versionMismatchInstructions: {
    'en-us': 'Instructions for resolving Specify schema mismatch',
    'ru-ru': 'Инструкции по устранению несоответствия схемы Specify',
    'es-es':
      'Instrucciones para resolver la discrepancia de los esquema de Specify',
    'fr-fr':
      "Instructions pour résoudre l'incompatibilité de schéma de Specify",
    'uk-ua': 'Інструкції щодо вирішення невідповідності версій',
    'de-ch': 'Anweisungen zur Behebung der Abweichung des Specify Schemas',
    'pt-br':
      'Instruções para resolver a incompatibilidade do esquema de especificação',
  },
  online: {
    'en-us': 'online',
    'es-es': 'conectado',
    'fr-fr': 'en ligne',
    'ru-ru': 'онлайн',
    'uk-ua': 'онлайн',
    'de-ch': 'online',
    'pt-br': 'on-line',
  },
  offline: {
    'en-us': 'offline',
    'es-es': 'desconectado',
    'fr-fr': 'hors ligne',
    'ru-ru': 'не в сети',
    'uk-ua': 'офлайн',
    'de-ch': 'offline',
    'pt-br': 'desconectado',
  },
} as const);
