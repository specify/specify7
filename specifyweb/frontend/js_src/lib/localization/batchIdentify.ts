/**
 * Localization strings used in Batch Identify tool
 *
 * @module
 */

import { createDictionary } from './utils';

export const batchIdentifyText = createDictionary({
  batchIdentify: {
    'en-us': 'Batch Identify',
    'de-ch': 'Chargenidentifizierung',
    'es-es': 'Identificador de lote',
    'fr-fr': 'Identification du lot',
    'hr-hr': 'Identifikacija serije',
    nb: 'Batch-identifikasjon',
    'pt-br': 'Identificação de lote',
    'ru-ru': 'Идентификация пакета',
    'uk-ua': 'Пакетна ідентифікація',
  },
  instructions: {
    'en-us':
      'Enter catalog numbers using any non-numeric delimiters (commas, spaces, text prefixes, etc.). Use a dash to declare numeric ranges like 0001 - 0150.',
    'de-ch':
      'Geben Sie Katalognummern mit beliebigen nicht-numerischen Trennzeichen (Kommas, Leerzeichen, Textpräfixe usw.) ein. Verwenden Sie einen Bindestrich, um numerische Bereiche wie 0001–0150 anzugeben.',
    'es-es':
      'Introduzca los números de catálogo utilizando cualquier delimitador no numérico (comas, espacios, prefijos de texto, etc.). Utilice un guion para indicar rangos numéricos como 0001 - 0150.',
    'fr-fr':
      "Saisissez les numéros de catalogue en utilisant n'importe quel délimiteur non numérique (virgules, espaces, préfixes textuels, etc.). Utilisez un tiret pour indiquer les plages numériques, par exemple 0001 - 0150.",
    'hr-hr':
      'Unesite kataloške brojeve koristeći nenumeričke razdjelnike (zareze, razmake, tekstualne prefikse itd.). Koristite crticu za označavanje numeričkih raspona poput 0001 - 0150.',
    nb: 'Skriv inn katalognumre ved hjelp av ikke-numeriske skilletegn (komma, mellomrom, tekstprefikser osv.). Bruk en bindestrek for å definere numeriske områder som 0001 - 0150.',
    'pt-br':
      'Insira os números de catálogo usando quaisquer delimitadores não numéricos (vírgulas, espaços, prefixos de texto, etc.). Use um hífen para declarar intervalos numéricos, como 0001 - 0150.',
    'ru-ru':
      'Вводите каталожные номера, используя любые нечисловые разделители (запятые, пробелы, текстовые префиксы и т. д.). Используйте дефис для обозначения числовых диапазонов, например, 0001 - 0150.',
    'uk-ua':
      'Вводьте каталожні номери, використовуючи будь-які нечислові роздільники (коми, пробіли, текстові префікси тощо). Використовуйте тире для позначення числових діапазонів, наприклад, 0001–0150.',
  },
  catalogNumbersNotFound: {
    'en-us': 'Catalog Numbers Not Found',
    'de-ch': 'Katalognummern nicht gefunden',
    'es-es': 'No se encontraron números de catálogo.',
    'fr-fr': 'Numéros de catalogue introuvables',
    'hr-hr': 'Brojevi kataloga nisu pronađeni',
    nb: 'Katalognumre ikke funnet',
    'pt-br': 'Números de catálogo não encontrados',
    'ru-ru': 'Каталожные номера не найдены',
    'uk-ua': 'Номери в каталозі не знайдено',
  },
  identify: {
    'en-us': 'Identify',
    'de-ch': 'Identifizieren',
    'es-es': 'Identificar',
    'fr-fr': 'Identifier',
    'hr-hr': 'Identificirati',
    nb: 'Identifiser',
    'pt-br': 'Identificar',
    'ru-ru': 'Идентифицировать',
    'uk-ua': 'Ідентифікувати',
  },
  successMessage: {
    'en-us': 'All records were identified to the specified taxon.',
    'de-ch': 'Alle Datensätze wurden dem jeweiligen Taxon zugeordnet.',
    'es-es':
      'Todos los registros fueron identificados con el taxón especificado.',
    'fr-fr': 'Tous les enregistrements ont été identifiés au taxon spécifié.',
    'hr-hr': 'Svi zapisi su identificirani s navedenim taksonom.',
    nb: 'Alle poster ble identifisert til det angitte taksonet.',
    'pt-br': 'Todos os registros foram identificados até o táxon especificado.',
    'ru-ru': 'Все записи были идентифицированы до указанного таксона.',
    'uk-ua': 'Усі записи були ідентифіковані до зазначеного таксону.',
  },
  updatedRecordSet: {
    'en-us': 'Batch Identify Updated Records',
    'de-ch': 'Stapelidentifizierung aktualisierter Datensätze',
    'es-es': 'Identificación por lotes de registros actualizados',
    'fr-fr': 'Lot Identifier les enregistrements mis à jour',
    'hr-hr': 'Grupna identifikacija ažuriranih zapisa',
    nb: 'Batch-identifiser oppdaterte poster',
    'pt-br': 'Identificar em lote os registros atualizados',
    'ru-ru': 'Пакетная идентификация обновленных записей',
    'uk-ua': 'Пакетна ідентифікація оновлених записів',
  },
  noCatalogNumbersParsed: {
    'en-us': 'Enter at least one numeric catalog number.',
    'de-ch': 'Geben Sie mindestens eine numerische Katalognummer ein.',
    'es-es': 'Introduzca al menos un número de catálogo numérico.',
    'fr-fr': 'Veuillez saisir au moins un numéro de catalogue numérique.',
    'hr-hr': 'Unesite barem jedan numerički kataloški broj.',
    nb: 'Skriv inn minst ett numerisk katalognummer.',
    'pt-br': 'Insira pelo menos um número de catálogo.',
    'ru-ru': 'Введите как минимум один числовой каталожный номер.',
    'uk-ua': 'Введіть принаймні один числовий каталожний номер.',
  },
  validatingCatalogNumbers: {
    'en-us': 'Validating catalog numbers...',
    'de-ch': 'Katalognummern werden geprüft...',
    'es-es': 'Validando números de catálogo...',
    'fr-fr': 'Validation des numéros de catalogue...',
    'hr-hr': 'Provjera kataloških brojeva...',
    nb: 'Validerer katalognumre...',
    'pt-br': 'Validando números de catálogo...',
    'ru-ru': 'Проверка каталожных номеров...',
    'uk-ua': 'Перевірка каталожних номерів...',
  },
  placeholder: {
    'en-us': '0001 0002 0003 - 0150',
    'de-ch': '0001 0002 0003 - 0150',
    'es-es': '0001 0002 0003 - 0150',
    'fr-fr': '0001 0002 0003 - 0150',
    'hr-hr': '0001 0002 0003 - 0150',
    nb: '0001 0002 0003 - 0150',
    'pt-br': '0001 0002 0003 - 0150',
    'ru-ru': '0001 0002 0003 - 0150',
    'uk-ua': '0001 0002 0003 - 0150',
  },
  previewQueryName: {
    'en-us': 'Batch Identify Preview',
    'de-ch': 'Vorschau der Stapelidentifizierung',
    'es-es': 'Vista previa de identificación por lotes',
    'fr-fr': "Aperçu de l'identification par lot",
    'hr-hr': 'Pregled skupne identifikacije',
    nb: 'Forhåndsvisning av batch-identifikasjon',
    'pt-br': 'Visualização de identificação em lote',
    'ru-ru': 'Предварительный просмотр идентификации пакета',
    'uk-ua': 'Попередній перегляд пакетної ідентифікації',
  },
  unknownTaxonTree: {
    'en-us': 'Unknown Taxon Tree',
    'de-ch': 'Unbekannter Taxonbaum',
    'es-es': 'Árbol taxonómico desconocido',
    'fr-fr': 'Arbre taxon inconnu',
    'hr-hr': 'Nepoznato stablo taksona',
    nb: 'Ukjent taksontre',
    'pt-br': 'Árvore taxonômica desconhecida',
    'ru-ru': 'Неизвестное таксономическое дерево',
    'uk-ua': 'Невідоме таксонове дерево',
  },
  collectionObjectTypes: {
    'en-us': 'Collection Object Types',
    'de-ch': 'Sammlungsobjekttypen',
    'es-es': 'Tipos de objetos de colección',
    'fr-fr': "Types d'objets de collection",
    'hr-hr': 'Vrste objekata kolekcija',
    nb: 'Samlingsobjekttyper',
    'pt-br': 'Tipos de objetos de coleção',
    'ru-ru': 'Типы объектов коллекций',
    'uk-ua': "Типи об'єктів колекції",
  },
  invalidRecordSetTitle: {
    'en-us': 'Mixed Record Set',
    'de-ch': 'Gemischtes Schallplattenset',
    'es-es': 'Conjunto de récords mixtos',
    'fr-fr': "Groupe d'enregistrements mixte",
    'hr-hr': 'Mješoviti set ploča',
    nb: 'Blandet platesett',
    'pt-br': 'Conjunto de discos variados',
    'ru-ru': 'Смешанный набор записей',
    'uk-ua': 'Змішаний набір записів',
  },
  invalidRecordSetMessage: {
    'en-us':
      'The selected record set contains collection objects from more than one taxon tree.',
    'de-ch':
      'Der ausgewählte Datensatz enthält Sammlungsobjekte aus mehr als einem Taxonbaum.',
    'es-es':
      'El conjunto de registros seleccionado contiene objetos de colección de más de un árbol taxonómico.',
    'fr-fr':
      "Le groupe d'enregistrements sélectionné contient des objets de collection provenant de plusieurs arbres taxonomiques.",
    'hr-hr':
      'Odabrani skup zapisa sadrži objekte kolekcije iz više od jednog taksonskog stabla.',
    nb: 'Den valgte databasepost-lista inneholder samlingsobjekter fra mer enn ett taksontre.',
    'pt-br':
      'O conjunto de registros selecionado contém objetos de coleção de mais de uma árvore taxonômica.',
    'ru-ru':
      'Выбранный набор записей содержит объекты коллекции из более чем одного таксономического дерева.',
    'uk-ua':
      "Вибраний набір записів містить об'єкти колекції з кількох таксонних дерев.",
  },
  invalidRecordSetInstructions: {
    'en-us':
      'Choose a different record set, or edit the query used to create this record set so all collection objects use the same taxon tree.',
    'de-ch':
      'Wählen Sie einen anderen Datensatz aus oder bearbeiten Sie die Abfrage, die zum Erstellen dieses Datensatzes verwendet wurde, so dass alle Sammlungsobjekte denselben Taxonbaum verwenden.',
    'es-es':
      'Seleccione un conjunto de registros diferente o edite la consulta utilizada para crear este conjunto de registros para que todos los objetos de la colección utilicen el mismo árbol taxonómico.',
    'fr-fr':
      "Choisissez un autre groupe d'enregistrements, ou modifiez la requête utilisée pour créer ce groupe d'enregistrements afin que tous les objets de la collection utilisent le même arbre taxonomique.",
    'hr-hr':
      'Odaberite drugi skup zapisa ili uredite upit korišten za stvaranje ovog skupa zapisa tako da svi objekti kolekcije koriste isto stablo taksona.',
    nb: 'Velg en annen databasepost-liste, eller rediger søket som ble brukt til å opprette denne listen, slik at alle samlingsobjekter bruker samme taksontre.',
    'pt-br':
      'Escolha um conjunto de registros diferente ou edite a consulta usada para criar este conjunto de registros para que todos os objetos da coleção usem a mesma árvore taxonômica.',
    'ru-ru':
      'Выберите другой набор записей или отредактируйте запрос, использованный для создания этого набора записей, чтобы все объекты коллекции использовали одно и то же таксономическое дерево.',
    'uk-ua':
      "Виберіть інший набір записів або відредагуйте запит, який використовувався для створення цього набору записів, щоб усі об'єкти колекції використовували одне й те саме дерево таксонів.",
  },
} as const);
