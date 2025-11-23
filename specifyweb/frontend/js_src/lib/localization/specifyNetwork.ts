/**
 * Localization strings for the Specify Network integration
 */

import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

export const specifyNetworkText = createDictionary({
  specifyNetwork: {
    'en-us': 'Specify Network',
    'ru-ru': 'Укажите сеть',
    'es-es': 'Specify red',
    'fr-fr': 'Réseau Specify',
    'uk-ua': 'Specify Network',
    'de-ch': 'Specify Network',
    'pt-br': 'Especificar rede',
  },
  occurrenceOrGuidRequired: {
    'en-us': 'Species Name or GUID must be provided to display this page',
    'de-ch':
      'Um diese Seite anzuzeigen, muss der Artname oder die GUID angegeben werden.',
    'es-es':
      'Se debe proporcionar el nombre de especie o el GUID para mostrar esta página',
    'fr-fr':
      "Le nom de l'espèce ou le GUID doit être fourni pour afficher cette page.",
    'ru-ru':
      'Для отображения этой страницы необходимо указать название вида или GUID.',
    'uk-ua':
      'Щоб відобразити цю сторінку, потрібно вказати назву виду або GUID',
    'pt-br':
      'É necessário fornecer o nome da espécie ou o GUID para exibir esta página.',
  },
  noDataError: {
    'en-us': 'Unable to find any data for this request',
    'de-ch': 'Für diese Anfrage konnten keine Daten gefunden werden.',
    'es-es': 'No se encuentran datos para esta solicitud',
    'fr-fr': "Aucune donnée n'a pu être trouvée pour cette requête.",
    'ru-ru': 'Не удалось найти данные по этому запросу.',
    'uk-ua': 'Неможливо знайти дані для цього запиту',
    'pt-br':
      'Não foi possível encontrar quaisquer dados para esta solicitação.',
  },
  noDataErrorDescription: {
    'en-us': 'Please try searching for a different record',
    'de-ch': 'Bitte versuchen Sie, nach einem anderen Datensatz zu suchen.',
    'es-es': 'Intente buscar un registro diferente',
    'fr-fr': 'Veuillez essayer de rechercher un autre enregistrement',
    'ru-ru': 'Попробуйте поискать другую запись.',
    'uk-ua': 'Будь ласка, спробуйте знайти інший запис',
    'pt-br': 'Por favor, tente pesquisar um registro diferente.',
  },
  dataQuality: {
    'en-us': 'Data Quality',
    'de-ch': 'Datenqualität',
    'es-es': 'Calidad de datos',
    'fr-fr': 'Qualité des données',
    'ru-ru': 'Качество данных',
    'uk-ua': 'Якість даних',
    'pt-br': 'Qualidade dos dados',
  },
  reportedBy: {
    'en-us': 'Reported by {provider:string}',
    'de-ch': 'Gemeldet von {provider:string}',
    'es-es': 'Reportado por {provider:string}',
    'fr-fr': 'Signalé par {provider:string}',
    'ru-ru': 'Сообщил {provider:string}',
    'uk-ua': 'Повідомив {provider:string}',
    'pt-br': 'Relatado por {provider:string}',
  },
  collectionDate: {
    'en-us': 'Collection Date',
    'de-ch': 'Abholdatum',
    'es-es': 'Fecha de colecta',
    'fr-fr': 'Date de collecte',
    'ru-ru': 'Дата сбора',
    'uk-ua': 'Дата збору',
    'pt-br': 'Data de coleta',
  },
  mapDescription: {
    'en-us':
      'This map shows occurrences of this taxon from the iDigBio and GBIF aggregators.',
    'de-ch':
      'Diese Karte zeigt Vorkommen dieses Taxons aus den Datenaggregatoren iDigBio und GBIF.',
    'es-es':
      'Este mapa muestra los registros de este taxón en los agregadores iDigBio y GBIF.',
    'fr-fr':
      'Cette carte montre les occurrences de ce taxon provenant des agrégateurs iDigBio et GBIF.',
    'ru-ru':
      'На этой карте показаны случаи встречаемости этого таксона по данным агрегаторов iDigBio и GBIF.',
    'uk-ua':
      'Ця карта показує випадки появи цього таксону з агрегаторів iDigBio та GBIF.',
    'pt-br':
      'Este mapa mostra a ocorrência deste táxon a partir dos agregadores iDigBio e GBIF.',
  },
  iDigBioDescription: {
    'en-us':
      'Occurrences recorded in iDigBio are shown as round green points, except for those from the current collection recorded in iDigBio that are round red points. Zooming in on the red points brings up a blue teardrop pin, clicking on the pin executes a locality query in Specify that shows all of the species in the current Specify database collected from that location.',
    'de-ch':
      'In iDigBio erfasste Vorkommen werden als grüne Punkte dargestellt, mit Ausnahme derjenigen aus der aktuellen Sammlung, die als rote Punkte angezeigt werden. Durch Vergrößern der roten Punkte erscheint eine blaue, tropfenförmige Markierung. Ein Klick darauf führt eine Standortabfrage in Specify aus, die alle Arten der aktuellen Specify-Datenbank anzeigt, die an diesem Standort erfasst wurden.',
    'es-es':
      'Los registros recogidos en iDigBio se muestran como puntos verdes redondos, excepto los de esta colección, registrados en iDigBio, que son puntos rojos redondos. Al acercarse a los puntos rojos, aparece una chincheta en forma de lágrima azul; al hacer clic en la chincheta, se ejecuta una consulta de localidad en Specify que muestra todas las especies en la base de datos actual de Specify colectadas en esa localización.',
    'fr-fr':
      "Les occurrences enregistrées dans iDigBio sont représentées par des points verts ronds, à l'exception de celles de la collection actuelle, qui sont représentées par des points rouges ronds. Un zoom sur les points rouges fait apparaître une épingle bleue en forme de larme ; cliquer dessus lance une requête de localisation dans Specify, affichant toutes les espèces de la base de données Specify actuelle collectées à cet endroit.",
    'ru-ru':
      'Встречи, зарегистрированные в iDigBio, отображаются круглыми зелёными точками, за исключением случаев из текущей коллекции, зарегистрированной в iDigBio, которые обозначены круглыми красными точками. При увеличении красных точек появляется синяя каплевидная метка; нажатие на метку выполняет запрос по местоположению в Specify, который отображает все виды из текущей базы данных Specify, собранные в этом месте.',
    'uk-ua':
      'Випадки, записані в iDigBio, відображаються круглими зеленими точками, за винятком випадків із поточної колекції, записаної в iDigBio, які мають круглі червоні точки. Збільшення масштабу червоних крапок відкриває блакитну шпильку-сльозинку, клацання шпильки виконує запит місцевості в Specify, який показує всі види в поточній базі даних Specify, зібрані з цього місця.',
    'pt-br':
      'As ocorrências registradas no iDigBio são mostradas como pontos verdes redondos, exceto aquelas da coleção atual registradas no iDigBio, que são pontos vermelhos redondos. Ao ampliar os pontos vermelhos, um marcador azul em forma de lágrima aparece; clicar no marcador executa uma consulta de localidade no Specify, que mostra todas as espécies no banco de dados atual do Specify coletadas naquele local.',
  },
  gbifDescription: {
    'en-us':
      'For GBIF data, individual points and clusters of points are shown as hexagons of different colors ranging from yellow to orange to red. Dark red hexagons corresponding to densest distributions of collected specimens of that species.',
    'de-ch':
      'Bei GBIF-Daten werden einzelne Punkte und Punktgruppen als Sechsecke in verschiedenen Farben dargestellt, von Gelb über Orange bis Rot. Dunkelrote Sechsecke entsprechen den dichtesten Verteilungen gesammelter Exemplare der jeweiligen Art.',
    'es-es':
      'Para los datos de GBIF, los puntos individuales y los grupos de puntos se muestran como hexágonos de diferentes colores que van del amarillo al naranja y al rojo. Hexágonos de color rojo oscuro que corresponden a las distribuciones más densas de especímenes colectados de esa especie.',
    'fr-fr':
      "Pour les données GBIF, les points individuels et les groupes de points sont représentés par des hexagones de différentes couleurs allant du jaune à l'orange en passant par le rouge. Les hexagones rouge foncé correspondent aux zones de plus forte densité de spécimens collectés de cette espèce.",
    'ru-ru':
      'В данных GBIF отдельные точки и скопления точек показаны шестиугольниками разных цветов: от жёлтого до оранжевого и красного. Тёмно-красные шестиугольники соответствуют наиболее плотному распределению собранных особей данного вида.',
    'uk-ua':
      'Для даних GBIF окремі точки та кластери точок відображаються у вигляді шестикутників різних кольорів від жовтого до оранжевого та червоного. Темно-червоні шестикутники відповідають найщільнішому розподілу зібраних зразків цього виду.',
    'pt-br':
      'Nos dados do GBIF, pontos individuais e agrupamentos de pontos são representados por hexágonos de cores diferentes, variando do amarelo ao laranja e ao vermelho. Hexágonos em vermelho escuro correspondem às distribuições mais densas de espécimes coletados daquela espécie.',
  },
  connectToGbif: {
    'en-us': 'Connect to GBIF',
    'de-ch': 'Verbindung zu GBIF herstellen',
    'es-es': 'Conectarse a GBIF',
    'fr-fr': 'Se connecter au GBIF',
    'ru-ru': 'Подключиться к ГБИФ',
    'uk-ua': 'Підключіться до GBIF',
    'pt-br': 'Conecte-se ao GBIF',
  },
  searchForInstitution: {
    'en-us': 'Search for your institution:',
    'de-ch': 'Suchen Sie nach Ihrer Institution:',
    'es-es': 'Busque su institución:',
    'fr-fr': 'Recherchez votre établissement :',
    'ru-ru': 'Поиск вашего учреждения:',
    'uk-ua': 'Підключіться до GBIF',
    'pt-br': 'Procure sua instituição:',
  },
  institutionDistributionMap: {
    'en-us':
      'Distribution map of all of the digitized specimens curated in your Institution',
    'de-ch':
      'Verteilungskarte aller in Ihrer Institution aufbewahrten digitalisierten Exemplare',
    'es-es':
      'Mapa de distribución de todos los ejemplares digitalizados conservados en su Institución',
    'fr-fr':
      'Carte de répartition de tous les spécimens numérisés conservés dans votre institution',
    'ru-ru':
      'Карта распределения всех оцифрованных образцов, хранящихся в вашем учреждении',
    'uk-ua':
      'Карта розповсюдження всіх оцифрованих зразків, збережених у вашій установі',
    'pt-br':
      'Mapa de distribuição de todos os espécimes digitalizados sob a guarda da sua instituição.',
  },
  collectionDistributionMap: {
    'en-us':
      'Distribution map of all of the digitized specimens curated in your Collection',
    'de-ch': 'Verteilungskarte aller digitalisierten Exemplare Ihrer Sammlung',
    'es-es':
      'Mapa de distribución de todos los ejemplares digitalizados conservados en su Colección',
    'fr-fr':
      'Carte de répartition de tous les spécimens numérisés conservés dans votre collection',
    'ru-ru':
      'Карта распределения всех оцифрованных образцов, хранящихся в вашей коллекции',
    'uk-ua':
      'Карта розповсюдження всіх оцифрованих зразків, збережених у вашій колекції',
    'pt-br':
      'Mapa de distribuição de todos os espécimes digitalizados e catalogados em sua coleção.',
  },
  startYear: {
    'en-us': 'Start Year',
    'de-ch': 'Startjahr',
    'es-es': 'Año de inicio',
    'fr-fr': 'Année de début',
    'ru-ru': 'Год начала',
    'uk-ua': 'Рік початку',
    'pt-br': 'Ano de início',
  },
  endYear: {
    'en-us': 'End Year',
    'de-ch': 'Jahresende',
    'es-es': 'Año final',
    'fr-fr': "Fin d'année",
    'ru-ru': 'Конец года',
    'uk-ua': 'Кінцевий рік',
    'pt-br': 'Fim do ano',
  },
} as const);
