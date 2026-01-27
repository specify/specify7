/**
 * Localization strings used in Leaflet, GeoLocate and LatLongUI
 *
 * @module
 */

import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

export const localityText = createDictionary({
  openMap: {
    'en-us': 'Open Map',
    'ru-ru': 'Открыть карту',
    'es-es': 'Abrir mapa',
    'fr-fr': 'Ouvrir la carte',
    'uk-ua': 'Відкрийте карту',
    'de-ch': 'Karte öffnen',
    'pt-br': 'Abrir mapa',
  },
  geoMap: {
    'en-us': 'GeoMap',
    'ru-ru': 'Карта',
    'es-es': 'GeoMap',
    'fr-fr': 'GeoMap',
    'uk-ua': 'Геокарта',
    'de-ch': 'Karte',
    'pt-br': 'Mapa geográfico',
  },
  queryMapSubset: {
    comment: 'Used in GeoMap header while records are still being fetched',
    'en-us':
      'GeoMap - Plotted {plotted:number|formatted} of {total:number|formatted} records',
    'ru-ru':
      'Карта - Отображено {plotted:number|formatted} из {total:number|formatted} записей',
    'es-es':
      'GeoMap - Trazado {plotted:number|formatted} de {total:number|formatted} registros',
    'fr-fr':
      'GeoMap - {plotted:number|formatted} sur {total:number|formatted} enregistrements placés',
    'uk-ua':
      'GeoMap - нанесено {plotted:number|formatted} із {total:number|formatted} записів',
    'de-ch':
      'GeoMap hat {plotted:number|formatted} von {total:number|formatted} Datensätzen gezeichnet',
    'pt-br':
      'GeoMapa - Plotado {plotted:number|formatted} de {total:number|formatted} registros',
  },
  queryMapAll: {
    'en-us': 'GeoMap - Plotted {plotted:number|formatted} records',
    'ru-ru': 'Карта - Отображено {plotted:number|formatted} записей',
    'es-es': 'GeoMap - {plotted:number|formatted} registros trazados',
    'fr-fr': 'GéoCarte - {plotted:number|formatted} enregistrements placés',
    'uk-ua': 'GeoMap - Нанесені записи {plotted:number|formatted}.',
    'de-ch': 'GeoMap hat {plotted:number|formatted} Datensätze gezeichnet',
    'pt-br': 'GeoMapa - Registros plotados {plotted:number|formatted}',
  },
  polygonBoundaries: {
    'en-us': 'Polygon Boundaries',
    'ru-ru': 'Границы многоугольника',
    'es-es': 'Límites de polígono',
    'fr-fr': 'Limites du polygone',
    'uk-ua': 'Межі багатокутників',
    'de-ch': 'Polygon-Grenzen',
    'pt-br': 'Limites de Polígonos',
  },
  errorRadius: {
    'en-us': 'Error Radius',
    'ru-ru': 'Радиус ошибки',
    'es-es': 'Radio de error',
    'fr-fr': "Rayon d'erreur",
    'uk-ua': 'Радіус помилки',
    'de-ch': 'Fehlerradius',
    'pt-br': 'Raio de erro',
  },
  showMap: {
    'en-us': 'Show Map',
    'ru-ru': 'Показать карту',
    'es-es': 'Mostrar mapa',
    'fr-fr': 'Afficher la carte',
    'uk-ua': 'Показати карту',
    'de-ch': 'Karte anzeigen',
    'pt-br': 'Mostrar mapa',
  },
  noCoordinates: {
    'en-us': 'No coordinates',
    'ru-ru': 'Нет координат',
    'es-es': 'Sin coordenadas',
    'fr-fr': 'Pas de coordonnées',
    'uk-ua': 'Без координат',
    'de-ch': 'Keine Koordinaten',
    'pt-br': 'Sem coordenadas',
  },
  notEnoughInformationToMap: {
    'en-us': '{localityTable:string} must have coordinates to be mapped.',
    'ru-ru':
      'Чтобы нанести {localityTable:string} на карту, необходимо указать координаты.',
    'es-es': '{localityTable:string} debe tener coordenadas para ser mapeadas.',
    'fr-fr':
      '{localityTable:string} doit avoir des coordonnées pour être cartographié.',
    'uk-ua': '{localityTable:string} має мати координати для відображення.',
    'de-ch':
      '{localityTable:string} muss Koordinaten haben, um kartiert werden zu können.',
    'pt-br': '{localityTable:string} deve ter coordenadas para ser mapeado.',
  },
  occurrencePoints: {
    'en-us': 'Pins',
    'ru-ru': 'Точки',
    'es-es': 'Patas',
    'fr-fr': 'Épingles',
    'uk-ua': 'Шпильки',
    'de-ch': 'Stecknadeln',
    'pt-br': 'Alfinetes',
  },
  occurrencePolygons: {
    'en-us': 'Polygons',
    'ru-ru': 'Полигоны',
    'es-es': 'Polígonos',
    'fr-fr': 'Polygones',
    'uk-ua': 'Багатокутники',
    'de-ch': 'Polygone',
    'pt-br': 'Polígonos',
  },
  geoLocate: {
    'en-us': 'GEOLocate',
    'ru-ru': 'GEOLocate',
    'es-es': 'GEOlocalizar',
    'fr-fr': 'GEOLocate',
    'uk-ua': 'GEOLocate',
    'de-ch': 'GEO Lokalisierung',
    'pt-br': 'GEOLocate',
  },
  geographyRequired: {
    'en-us': '{geographyTable:string} must be mapped',
    'ru-ru': '{geographyTable:string} должна быть связана',
    'es-es': '{geographyTable:string} debe ser mapeado',
    'fr-fr': '{geographyTable:string} doit être cartographié',
    'uk-ua': '{geographyTable:string} має бути зіставлено',
    'de-ch': '{geographyTable:string} muss kartiert werden',
    'pt-br': '{geographyTable:string} deve ser mapeado.',
  },
  geographyRequiredDescription: {
    'en-us':
      'The GeoLocate plugin requires the geography field to be populated.',
    'ru-ru': 'Плагин GeoLocate требует, чтобы поле географии было заполнено.',
    'es-es':
      'El complemento GeoLocate requiere que se complete el campo de geografía.',
    'fr-fr':
      'Le plug-in GeoLocate nécessite que le champ géographie soit rempli.',
    'uk-ua': 'Плагін GeoLocate вимагає заповнення поля географії.',
    'de-ch':
      'Das GeoLocate-Plugin erfordert, dass das Koordinaten-Feld eingegeben wird.',
    'pt-br':
      'O plugin GeoLocate requer que o campo de geografia esteja preenchido.',
  },
  coordinates: {
    'en-us': 'Coordinates',
    'ru-ru': 'Координаты',
    'es-es': 'Coordenadas',
    'fr-fr': 'Coordonnées',
    'uk-ua': 'Координати',
    'de-ch': 'Koordinaten',
    'pt-br': 'Coordenadas',
  },
  northWestCorner: {
    comment: 'Represents coordinates. Careful with translation',
    'en-us': 'NW Corner',
    'ru-ru': 'СЗ Угол',
    'es-es': 'Esquina noroeste',
    'fr-fr': 'Coin NO',
    'uk-ua': 'NW Кут',
    'de-ch': 'NW-Ecke',
    'pt-br': 'Canto noroeste',
  },
  southEastCorner: {
    comment: 'Represents coordinates. Careful with translation',
    'en-us': 'SE Corner',
    'ru-ru': 'ЮВ Угол',
    'es-es': 'Esquina SE',
    'fr-fr': 'Coin SE',
    'uk-ua': 'SE Кут',
    'de-ch': 'SO-Ecke',
    'pt-br': 'Canto sudeste',
  },
  coordinateType: {
    'en-us': 'Coordinate Type',
    'ru-ru': 'Тип координат',
    'es-es': 'Tipo de coordenada',
    'fr-fr': 'Type de coordonnées',
    'uk-ua': 'Тип координат',
    'de-ch': 'Koordinatentyp',
    'pt-br': 'Tipo de coordenada',
  },
  point: {
    'en-us': 'Point',
    'ru-ru': 'Точка',
    'es-es': 'Punto',
    'fr-fr': 'Point',
    'uk-ua': 'точка',
    'de-ch': 'Punkt',
    'pt-br': 'Apontar',
  },
  line: {
    'en-us': 'Line',
    'ru-ru': 'Линия',
    'es-es': 'Línea',
    'fr-fr': 'Ligne',
    'uk-ua': 'лінія',
    'de-ch': 'Linie',
    'pt-br': 'Linha',
  },
  rectangle: {
    'en-us': 'Rectangle',
    'ru-ru': 'Прямоугольник',
    'es-es': 'Rectángulo',
    'fr-fr': 'Rectangle',
    'uk-ua': 'Прямокутник',
    'de-ch': 'Rechteck',
    'pt-br': 'Retângulo',
  },
  parsed: {
    'en-us': 'Parsed',
    'ru-ru': 'Проверено',
    'es-es': 'Analizado',
    'fr-fr': 'analysé',
    'uk-ua': 'Проаналізовано',
    'de-ch': 'Geparst',
    'pt-br': 'Analisado',
  },
  latitude: {
    'en-us': 'Latitude',
    'ru-ru': 'Широта',
    'es-es': 'Latitud',
    'fr-fr': 'Latitude',
    'uk-ua': 'Широта',
    'de-ch': 'Breitengrad',
    'pt-br': 'Latitude',
  },
  longitude: {
    'en-us': 'Longitude',
    'ru-ru': 'Долгота',
    'es-es': 'Longitud',
    'fr-fr': 'Longitude',
    'uk-ua': 'Довгота',
    'de-ch': 'Längengrad',
    'pt-br': 'Longitude',
  },
  toggleFullScreen: {
    'en-us': 'Toggle Full Screen',
    'ru-ru': 'Включить полноэкранный режим',
    'es-es': 'Cambiar a pantalla completa',
    'fr-fr': 'Basculer en plein écran',
    'uk-ua': 'Перемкнути повний екран',
    'de-ch': 'Vollbildmodus',
    'pt-br': 'Alternar tela cheia',
  },
  degrees: {
    'en-us': 'DD.DDDD (32.7619)',
    'ru-ru': 'DD.DDDD (32.7619)',
    'es-es': 'DD.DDDD (32.7619)',
    'fr-fr': 'DD.dddd (32.7619)',
    'uk-ua': 'DD.DDDD (32,7619)',
    'de-ch': 'DD.DDDD (32.7619)',
    'pt-br': 'DD.DDDD (32.7619)',
  },
  degreesMinutes: {
    'en-us': 'DD MMMM (32. 45.714)',
    'ru-ru': 'DD MMMM (32. 45.714)',
    'es-es': 'DD MMMM (32. 45.714)',
    'fr-fr': 'DD MMMM (32. 45.714)',
    'uk-ua': 'ДД ММММ (32. 45.714)',
    'de-ch': 'DD MMMM (32. 45.714)',
    'pt-br': 'DD MMMM (32. 45.714)',
  },
  degreesMinutesSeconds: {
    'en-us': 'DD MM SS.SS (32 45 42.84)',
    'ru-ru': 'DD MM SS.SS (32 45 42.84)',
    'es-es': 'DD MM SS.SS (32 45 42.84)',
    'fr-fr': 'DD MM SS.ss (32 45 42.84)',
    'uk-ua': 'ДД ММ СС.СС (32 45 42,84)',
    'de-ch': 'DD MM SS.SS (32 45 42.84)',
    'pt-br': 'DD MM SS.SS (32 45 42,84)',
  },
  degreesWithDirection: {
    'en-us': 'DD.DDDD N/S/E/W (32.7619 N)',
    'ru-ru': 'DD.DDDD N/S/E/W (32.7619 N)',
    'es-es': 'DD.DDDD N/S/E/O (32.7619 N)',
    'fr-fr': 'DD.dddd N/S/E/O (32,7619 N)',
    'uk-ua': 'DD.DDDD Пн/Пд/З/З (32,7619 Пн)',
    'de-ch': 'DD.DDDD N/S/O/W (32.7619 N)',
    'pt-br': 'DD.DDDD N/S/E/O (32,7619 N)',
  },
  degreesMinutesWithDirection: {
    'en-us': 'DD MM.MM N/S/E/W (32 45.714 N)',
    'ru-ru': 'DD MM.MM N/S/E/W (32 45.714 N)',
    'es-es': 'DD MM.MM N/S/E/O (32 45.714 N)',
    'fr-fr': 'DD MM.mm N/S/E/O (32 45.714 N)',
    'uk-ua': 'ДД ММ.ХМ Пн/Пд/В/З (32 45,714 Пн)',
    'de-ch': 'DD MM.MM N/S/O/W (32 45.714 N)',
    'pt-br': 'DD MM.MM N/S/E/O (32 45.714 N)',
  },
  degreesMinutesSecondsWithDirection: {
    'en-us': 'DD MM SS.SS N/S/E/W (32 45 42.84 N)',
    'ru-ru': 'DD MM SS.SS N/S/E/W (32 45 42.84 N)',
    'es-es': 'DD MM SS.SS N/S/E/O (32 45 42.84 N)',
    'fr-fr': 'DD MM SS.ss N/S/E/O (32 45 42.84 N)',
    'uk-ua': 'DD MM SS.SS N/S/E/W (32 45 42.84 N)',
    'de-ch': 'DD MM SS.SS N/S/O/W (32 45 42.84 N)',
    'pt-br': 'DD MM SS.SS N/S/E/W (32 45 42.84 N)',
  },
  localityUpdateHeaderError: {
    'en-us': 'Errors Found in Column Headers',
    'de-ch': 'Fehler in den Spaltenüberschriften gefunden',
    'es-es': 'Errores encontrados en los encabezados de columna',
    'fr-fr': 'Erreurs détectées dans les en-têtes de colonnes',
    'ru-ru': 'Обнаружены ошибки в заголовках столбцов.',
    'uk-ua': 'Знайдено помилки в заголовках стовпців',
    'pt-br': 'Erros encontrados nos cabeçalhos das colunas',
  },
  localityUpdateMissingHeader: {
    'en-us': 'The following columns are required but missing in the data set',
    'de-ch':
      'Die folgenden Spalten sind erforderlich, fehlen aber im Datensatz.',
    'es-es':
      'Las siguientes columnas son obligatorias pero faltan en el conjunto de datos',
    'fr-fr':
      "Les colonnes suivantes sont obligatoires mais absentes de l'ensemble de données.",
    'ru-ru': 'Следующие столбцы необходимы, но отсутствуют в наборе данных.',
    'uk-ua': 'Наступні стовпці є обов’язковими, але відсутні в наборі даних',
    'pt-br':
      'As colunas a seguir são obrigatórias, mas estão ausentes no conjunto de dados.',
  },
  localityUpdateUnrecognizedHeaders: {
    'en-us':
      'The following columns in the dataset are not recognized and will be ignored on import',
    'de-ch':
      'Die folgenden Spalten im Datensatz werden nicht erkannt und beim Import ignoriert.',
    'es-es':
      'Las siguientes columnas del conjunto de datos no se reconocen y se ignorarán durante la importación',
    'fr-fr':
      "Les colonnes suivantes du jeu de données ne sont pas reconnues et seront ignorées lors de l'importation.",
    'ru-ru':
      'Следующие столбцы в наборе данных не распознаются и будут проигнорированы при импорте.',
    'uk-ua':
      'Наступні стовпці в наборі даних не розпізнаються та ігноруватимуться під час імпорту',
    'pt-br':
      'As seguintes colunas no conjunto de dados não são reconhecidas e serão ignoradas na importação.',
  },
  localityUpdateAcceptedHeaders: {
    'en-us': 'Only the following headers are accepted',
    'de-ch': 'Es werden nur die folgenden Header akzeptiert.',
    'es-es': 'Sólo se aceptan los siguientes encabezados',
    'fr-fr': 'Seuls les en-têtes suivants sont acceptés',
    'ru-ru': 'Принимаются только следующие заголовки.',
    'uk-ua': 'Приймаються лише такі заголовки',
    'pt-br': 'Somente os seguintes cabeçalhos são aceitos.',
  },
  localityUpdateStarting: {
    'en-us': 'Starting Locality Update',
    'de-ch': 'Aktualisierung des Startstandorts',
    'es-es': 'Actualización de localidad inicial',
    'fr-fr': 'Mise à jour de la localisation de départ',
    'ru-ru': 'Начальное обновление местоположения',
    'uk-ua': 'Початок оновлення місцевості',
    'pt-br': 'Iniciando a atualização de localidade',
  },
  localityUpdateParsing: {
    'en-us': 'Parsing Locality Data Set',
    'de-ch': 'Parsing Locality Data Set',
    'es-es': 'Análisis del conjunto de datos de localidad',
    'fr-fr': "Ensemble de données d'analyse de localité",
    'ru-ru': 'Анализ набора данных о местоположении',
    'uk-ua': 'Розбір набору даних місцевості',
    'pt-br': 'Conjunto de dados de localidade de análise sintática',
  },
  localityUpdateProgressing: {
    'en-us': 'Importing Locality Data Set',
    'de-ch': 'Importieren des Ortsdatensatzes',
    'es-es': 'Importación del conjunto de datos de localidad',
    'fr-fr': "Importation de l'ensemble de données de localité",
    'ru-ru': 'Импорт набора данных о населенных пунктах',
    'uk-ua': 'Імпорт набору даних місцевості',
    'pt-br': 'Importando o conjunto de dados de localidade',
  },
  localityUpdateParsed: {
    'en-us': 'Locality Update Data Set Parsed',
    'de-ch': 'Lokales Aktualisierungs-Datenset analysiert',
    'es-es': 'Conjunto de datos de actualización de localidad analizados',
    'fr-fr': 'Ensemble de données de mise à jour de la localité analysé',
    'ru-ru': 'Набор данных обновления местоположения проанализирован.',
    'uk-ua': 'Проаналізовано набір даних оновлення місцевості',
    'pt-br': 'Conjunto de dados de atualização de localidade analisado',
  },
  localityUpdateFailed: {
    'en-us': 'Locality Update Failed',
    'de-ch': 'Lokalisierungsaktualisierung fehlgeschlagen',
    'es-es': 'Error en la actualización de localidad',
    'fr-fr': 'Échec de la mise à jour de la localisation',
    'ru-ru': 'Обновление местоположения не удалось.',
    'uk-ua': 'Помилка оновлення місцевості',
    'pt-br': 'Falha na atualização de localidade',
  },
  localityUpdateParseFailure: {
    'en-us': 'Locality Update Parsing Failed',
    'de-ch': 'Lokalisierungsaktualisierung fehlgeschlagen',
    'es-es': 'Error en el análisis de actualización de localidad',
    'fr-fr': "Échec de l'analyse de la mise à jour de la localité",
    'ru-ru': 'Ошибка при анализе обновления локальности.',
    'uk-ua': 'Помилка аналізу оновлення місцевості',
    'pt-br': 'Falha na análise da atualização de localidade',
  },
  localityUpdateCancelled: {
    'en-us': 'Locality Update Cancelled',
    'de-ch': 'Ortsaktualisierung abgebrochen',
    'es-es': 'Actualización de localidad cancelada',
    'fr-fr': 'Mise à jour locale annulée',
    'ru-ru': 'Обновление информации о местности отменено.',
    'uk-ua': 'Оновлення місцевості скасовано',
    'pt-br': 'Atualização de localidade cancelada',
  },
  localityUpdateSucceeded: {
    'en-us': 'Locality Update Succeeded',
    'de-ch': 'Standortaktualisierung erfolgreich',
    'es-es': 'Actualización de localidad exitosa',
    'fr-fr': 'Mise à jour de la localisation réussie',
    'ru-ru': 'Обновление информации о местоположении прошло успешно.',
    'uk-ua': 'Місцезнаходження оновлено',
    'pt-br': 'Atualização de localidade concluída com sucesso',
  },
  localityUpdateWentWrong: {
    'en-us': 'Something went wrong during the Locality Update process',
    'de-ch': 'Bei der Aktualisierung der Ortsdaten ist ein Fehler aufgetreten.',
    'es-es': 'Algo salió mal durante el proceso de actualización de localidad',
    'fr-fr':
      "Une erreur s'est produite lors du processus de mise à jour de la localisation.",
    'ru-ru': 'В процессе обновления данных о местности произошла ошибка.',
    'uk-ua': 'Щось пішло не так під час процесу оновлення місцевості',
    'pt-br': 'Algo deu errado durante o processo de atualização de localidade.',
  },
  localityUpdateParseErrorFileName: {
    comment: `
      The file name which is used when Parse Errors are exported. The .csv file
      extension is appended to the end of this string
    `,
    'en-us': 'Locality Update Errors - {date:string}',
    'de-ch': 'Lokalisierungsaktualisierungsfehler - {date:string}',
    'es-es': 'Errores de actualización de localidad - {date:string}',
    'fr-fr': 'Erreurs de mise à jour de la localisation - {date:string}',
    'ru-ru': 'Ошибки обновления местоположения - {date:string}',
    'uk-ua': 'Помилки оновлення місцевості - {date:string}',
    'pt-br': 'Erros de atualização de localidade - {date:string}',
  },
  localityUpdateCrashFileName: {
    comment: `
      The file name which is used when any Generic non-parsing errors are
      exported. The .txt file extension is appended to the end of this string
    `,
    'en-us': 'Locality Update {taskId: string} Crash Report - {date: string}',
    'de-ch':
      'Lokale Aktualisierung {taskId: string} Absturzbericht - {date: string}',
    'es-es':
      'Informe de fallos de actualización de localidad {taskId: string} - {date: string}',
    'fr-fr':
      "Mise à jour de la localisation {taskId : chaîne} Rapport d'incident - {date : chaîne}",
    'ru-ru':
      'Обновление локальной среды {taskId: string} Отчет о сбое - {date: string}',
    'uk-ua':
      'Оновлення місцевості {taskId: string} Звіт про збій - {date: string}',
    'pt-br':
      'Atualização de localidade {taskId: string} Relatório de falha - {date: string}',
  },
  guidHeaderNotProvided: {
    'en-us': "The Dataset must contain a 'guid' header",
    'de-ch': 'Das Dataset muss einen „guid“-Header enthalten.',
    'es-es': "El conjunto de datos debe contener un encabezado 'guid'",
    'fr-fr': "L'ensemble de données doit contenir un en-tête « guid ».",
    'ru-ru': "Набор данных должен содержать заголовок 'guid'.",
    'uk-ua': 'Набір даних має містити заголовок «guid».',
    'pt-br': "O conjunto de dados deve conter um cabeçalho 'guid'.",
  },
  noLocalityMatchingGuid: {
    'en-us': "No Locality with guid: '{guid:string}'",
    'de-ch': "Keine Lokalisierung mit GUID: '{guid:string}'",
    'es-es': "Sin localidad con guid: '{guid:string}'",
    'fr-fr': "Aucune localité avec guid : '{guid:string}'",
    'ru-ru': "Нет локальной сети с guid: '{guid:string}'",
    'uk-ua': "Немає місцевості з guid: '{guid:string}'",
    'pt-br': "Nenhuma localidade com guid: '{guid:string}'",
  },
  multipleLocalitiesWithGuid: {
    'en-us':
      'More than one Locality found with guid: {guid:string}. Locality IDs: {localityIds: string}',
    'de-ch':
      'Mehrere Orte mit der GUID {guid:string} gefunden. Orts-IDs: {localityIds: string}',
    'es-es':
      'Se encontró más de una localidad con guid: {guid:string}. ID de localidad: {localityIds: string}.',
    'fr-fr':
      "Plusieurs localités ont été trouvées avec l'identifiant GUID : {guid:string}. Identifiants des localités : {localityIds: string}",
    'ru-ru':
      'Найдено более одного населенного пункта с guid: {guid:string}. Идентификаторы населенных пунктов: {localityIds: string}',
    'uk-ua':
      'За допомогою guid: {guid:string} знайдено більше одного населеного пункту. Ідентифікатори населених пунктів: {localityIds: рядок}',
    'pt-br':
      'Mais de uma localidade encontrada com o GUID: {guid:string}. IDs das localidades: {localityIds: string}',
  },
  localityUpdateEffectCounts: {
    'en-us':
      'The following number of {localityTabelLabel: string} records will be affected by the update and {geoCoordDetailTableLabel: string} records will be created:',
    'de-ch':
      'Die folgende Anzahl von {localityTabelLabel: string} Datensätzen wird von der Aktualisierung betroffen sein und es werden {geoCoordDetailTableLabel: string} Datensätze erstellt:',
    'es-es':
      'La siguiente cantidad de registros {localityTabelLabel: string} se verá afectada por la actualización y se crearán registros {geoCoordDetailTableLabel: string}:',
    'fr-fr':
      "La mise à jour affectera le nombre suivant d'enregistrements {localityTabelLabel: string} et des enregistrements {geoCoordDetailTableLabel: string} seront créés :",
    'ru-ru':
      'Обновление затронет следующее количество записей типа {localityTabelLabel: string}, и будут созданы записи типа {geoCoordDetailTableLabel: string}:',
    'uk-ua':
      'Оновлення вплине на таку кількість записів {localityTabelLabel: string} і буде створено записи {geoCoordDetailTableLabel: string}:',
    'pt-br':
      'O seguinte número de registros {localityTabelLabel: string} será afetado pela atualização e registros {geoCoordDetailTableLabel: string} serão criados:',
  },
  localityUploadedDescription: {
    'en-us':
      'The following number of {localityTabelLabel: string} records were updated and {geoCoordDetailTableLabel: string} records were created:',
    'de-ch':
      'Die folgende Anzahl von {localityTabelLabel: string} Datensätzen wurde aktualisiert und {geoCoordDetailTableLabel: string} Datensätzen wurden erstellt:',
    'es-es':
      'Se actualizó la siguiente cantidad de registros {localityTabelLabel: string} y se crearon registros {geoCoordDetailTableLabel: string}:',
    'fr-fr':
      "Le nombre suivant d'enregistrements {localityTableLabel: string} a été mis à jour et d'enregistrements {geoCoordDetailTableLabel: string} a été créé :",
    'ru-ru':
      'Было обновлено следующее количество записей в формате {localityTabelLabel: string} и создано следующее количество записей в формате {geoCoordDetailTableLabel: string}:',
    'uk-ua':
      'Оновлено таку кількість записів {localityTabelLabel: string} і створено записи {geoCoordDetailTableLabel: string}:',
    'pt-br':
      'O seguinte número de registros {localityTabelLabel: string} foram atualizados e o seguinte número de registros {geoCoordDetailTableLabel: string} foram criados:',
  },
  localityUpdateStarted: {
    'en-us': 'The Locality Update process has started',
    'de-ch': 'Der Aktualisierungsprozess der Ortsdaten wurde gestartet.',
    'es-es': 'El proceso de actualización de localidad ha comenzado',
    'fr-fr':
      'Le processus de mise à jour des données de localisation a commencé.',
    'ru-ru': 'Начался процесс обновления информации о местности.',
    'uk-ua': 'Розпочато процес оновлення місцевості',
    'pt-br': 'O processo de atualização de localidades foi iniciado.',
  },
  localityUpdateResults: {
    'en-us': 'Locality Update Results',
    'de-ch': 'Ergebnisse der Lokalisierungsaktualisierung',
    'es-es': 'Resultados de la actualización de localidad',
    'fr-fr': 'Résultats de la mise à jour locale',
    'ru-ru': 'Результаты обновления информации о местности',
    'uk-ua': 'Результати оновлення місцевості',
    'pt-br': 'Resultados da atualização de localidade',
  },
  localityUpdateFailureResults: {
    'en-us': 'Locality Update Failure Results',
    'de-ch': 'Ergebnisse des Lokalisierungsfehlers',
    'es-es': 'Resultados de fallas en la actualización de localidad',
    'fr-fr': "Résultats de l'échec de la mise à jour de la localisation",
    'ru-ru': 'Результаты ошибки обновления местоположения',
    'uk-ua': 'Результати помилки оновлення місцевості',
    'pt-br': 'Resultados da falha na atualização de localidade',
  },
  taskId: {
    'en-us': 'Task ID',
    'de-ch': 'Aufgaben-ID',
    'es-es': 'ID de tarea',
    'fr-fr': 'ID de tâche',
    'ru-ru': 'Идентификатор задачи',
    'uk-ua': 'ID завдання',
    'pt-br': 'ID da tarefa',
  },
  validLatitude: {
    'en-us': 'Latitude needs to have a value between -90° and 90°',
    'de-ch': 'Der Breitengrad muss einen Wert zwischen -90° und 90° haben.',
    'es-es': 'La latitud debe tener un valor entre -90° y 90°',
    'fr-fr': 'La latitude doit avoir une valeur comprise entre -90° et 90°.',
    'ru-ru': 'Широта должна иметь значение от -90° до 90°.',
    'uk-ua': 'Значення широти має бути від -90° до 90°',
    'pt-br': 'A latitude deve ter um valor entre -90° e 90°.',
  },
  validLongitude: {
    'en-us': 'Longitude needs to have a value between -180° and 180°',
    'de-ch': 'Der Längengrad muss einen Wert zwischen -180° und 180° haben.',
    'es-es':
      'La siguiente cantidad de registros {localityTabelLabel: string} se verán afectados por la actualización y se crearán registros {geoCoordDetailTableLabel: string}:',
    'fr-fr': 'La longitude doit avoir une valeur comprise entre -180° et 180°.',
    'ru-ru': 'Долгота должна иметь значение от -180° до 180°.',
    'uk-ua':
      'Оновлення вплине на таку кількість записів {localityTabelLabel: string} і буде створено записи {geoCoordDetailTableLabel: string}:',
    'pt-br': 'A longitude deve ter um valor entre -180° e 180°.',
  },
} as const);
