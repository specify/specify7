/**
 * Localization strings used by the WbPlanView (workbench upload plan mapper)
 *
 * @module
 */

import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

export const wbPlanText = createDictionary({
  dataMapper: {
    'en-us': 'Data Mapper',
    'ru-ru': 'Data Mapper',
    'es-es': 'Mapeador de datos',
    'fr-fr': 'Mappeur de données',
    'uk-ua': 'Мапер даних',
    'de-ch': 'Datenzuordnung',
    'pt-br': 'Mapeador de Dados',
    'hr-hr': 'Maper podataka',
    nb: 'Datakartlegger',
  },
  importExportMapping: {
    'en-us': 'Import/Export Mapping',
    'de-ch': 'Import-/Export-Zuordnung',
    'es-es': 'Mapeo de importación/exportación',
    'fr-fr': "Mapping d'import/export",
    'hr-hr': 'Mapiranje uvoza/izvoza',
    nb: 'Importer/eksporter kartlegging',
    'pt-br': 'Mapeamento de Importação/Exportação',
    'ru-ru': 'Сопоставление импорта/экспорта',
    'uk-ua': 'Зіставлення імпорту/експорту',
  },
  importExportMappingDescription: {
    'en-us':
      'You can export the current data set mapping as a JSON file or import an existing data set mapping.',
    'de-ch':
      'Sie können die aktuelle Datensatzzuordnung als JSON-Datei exportieren oder eine bestehende Datensatzzuordnung importieren.',
    'es-es':
      'Puede exportar la asignación del conjunto de datos actual como un archivo JSON o importar una asignación de conjunto de datos existente.',
    'fr-fr':
      'Vous pouvez exporter le mappage de jeu de données actuel sous forme de fichier JSON ou importer un mappage de jeu de données existant.',
    'hr-hr':
      'Možete izvesti trenutno mapiranje skupa podataka kao JSON datoteku ili uvesti postojeće mapiranje skupa podataka.',
    nb: 'Du kan eksportere den gjeldende datasetttilordningen som en JSON-fil eller importere en eksisterende datasetttilordning.',
    'pt-br':
      'Você pode exportar o mapeamento do conjunto de dados atual como um arquivo JSON ou importar um mapeamento de conjunto de dados existente.',
    'ru-ru':
      'Вы можете экспортировать текущее сопоставление наборов данных в файл JSON или импортировать существующее сопоставление наборов данных.',
    'uk-ua':
      'Ви можете експортувати поточне зіставлення набору даних як файл JSON або імпортувати існуюче зіставлення набору даних.',
  },
  noUploadPlan: {
    'en-us': 'No Data Set Mapping is Defined',
    'ru-ru': 'Сопоставление наборов данных не определено.',
    'es-es': 'No se ha definido ninguna asignación de conjuntos de datos.',
    'fr-fr': "Aucun mappage de jeu de données n'est défini.",
    'uk-ua': 'Відображення набору даних не визначено',
    'de-ch': 'Es ist keine Datensatzzuordnung definiert.',
    'pt-br': 'Nenhum mapeamento de conjunto de dados foi definido.',
    'hr-hr': 'Nije definirano mapiranje skupa podataka',
    nb: 'Ingen datasetttilordning er definert',
  },
  noUploadPlanDescription: {
    'en-us':
      'No mapping has been defined for this data set. Please choose an existing mapping or create a new one.',
    'ru-ru':
      'Для этого набора данных не определено сопоставление. Пожалуйста, выберите существующее сопоставление или создайте новое.',
    'es-es':
      'No se ha definido ninguna asignación para este conjunto de datos. Por favor, seleccione una asignación existente o cree una nueva.',
    'fr-fr':
      "Aucun mappage n'a été défini pour cet ensemble de données. Veuillez choisir un mappage existant ou en créer un nouveau.",
    'uk-ua':
      'Для цього набору даних не визначено жодного зіставлення. Виберіть існуюче зіставлення або створіть нове.',
    'de-ch':
      'Für diesen Datensatz ist keine Zuordnung definiert. Bitte wählen Sie eine vorhandene Zuordnung aus oder erstellen Sie eine neue.',
    'pt-br':
      'Não existe um mapeamento definido para este conjunto de dados. Por favor, escolha um mapeamento existente ou crie um novo.',
    'hr-hr':
      'Za ovaj skup podataka nije definirano mapiranje. Odaberite postojeće mapiranje ili stvorite novo.',
    nb: 'Ingen kartlegging er definert for dette datasettet. Vennligst velg en eksisterende kartlegging eller opprett en ny.',
  },
  unmappedColumn: {
    'en-us': 'Unmapped Column',
    'ru-ru': 'Неотображенный столбец',
    'es-es': 'Columna no asignada',
    'fr-fr': 'Colonne non mappée',
    'uk-ua': 'Невідображений стовпець',
    'de-ch': 'Nicht gemappte Spalte',
    'pt-br': 'Coluna não mapeada',
    'hr-hr': 'Nemapirani stupac',
    nb: 'Ukartlagt kolonne',
  },
  notSelected: {
    comment: 'Show in pick list in Data Mapper when column is not mapped',
    'en-us': 'NONE SELECTED',
    'ru-ru': 'НИ ОДИН НЕ ВЫБРАН',
    'es-es': 'NINGUNO SELECCIONADO',
    'fr-fr': 'AUCUN SÉLECTIONNÉ',
    'uk-ua': 'НЕ ВИБРАНО',
    'de-ch': 'Nicht kartiert',
    'pt-br': 'NENHUM SELECIONADO',
    'hr-hr': 'NIJE ODABRANO',
    nb: 'INGEN VALGT',
  },
  unmapped: {
    'en-us': 'Unmapped',
    'ru-ru': 'Не нанесено на карту',
    'es-es': 'No cartografiado',
    'fr-fr': 'Non mappé',
    'uk-ua': 'Не нанесено на карту',
    'de-ch': 'Zuordnung ist erforderlich',
    'pt-br': 'Não mapeado',
    'hr-hr': 'Bez plana',
    nb: 'Ikke kartlagt',
  },
  mapped: {
    'en-us': 'Mapped',
    'ru-ru': 'На карте',
    'es-es': 'Mapeado',
    'fr-fr': 'Mappé',
    'uk-ua': 'Нанесено на карту',
    'de-ch': 'Kartiert',
    'pt-br': 'Mapeado',
    'hr-hr': 'Mapirano',
    nb: 'Kartlagt',
  },
  matchBehavior: {
    'en-us': 'Match Behavior:',
    'ru-ru': 'Соответствие поведения:',
    'es-es': 'Comportamiento de coincidencia:',
    'fr-fr': 'Comportement quand correspondance :',
    'uk-ua': 'Поведінка на матчі:',
    'de-ch': 'Übereinstimmungsverhalten:',
    'pt-br': 'Comportamento de correspondência:',
    'hr-hr': 'Ponašanje pri podudaranju:',
    nb: 'Matchatferd:',
  },
  columnMapping: {
    'en-us': 'Column Mapping',
    'ru-ru': 'Сопоставление столбцов',
    'es-es': 'Mapeo de columnas',
    'fr-fr': 'Correspondance des colonnes',
    'uk-ua': 'Зіставлення стовпців',
    'de-ch': 'Spaltenzuordnung',
    'pt-br': 'Mapeamento de colunas',
    'hr-hr': 'Mapiranje stupaca',
    nb: 'Kolonnekartlegging',
  },
  suggestedMappings: {
    'en-us': 'Suggested Mappings:',
    'ru-ru': 'Рекомендуемые варианты сопоставления:',
    'es-es': 'Mapeos sugeridos:',
    'fr-fr': 'Suggestions de mappage :',
    'uk-ua': 'Пропоновані зіставлення:',
    'de-ch': 'Vorgeschlagene Zuordnungen:',
    'pt-br': 'Mapeamentos sugeridos:',
    'hr-hr': 'Predložena mapiranja:',
    nb: 'Foreslåtte kartlegginger:',
  },
  requiredFields: {
    'en-us': 'Required Fields',
    'ru-ru': 'Обязательные поля',
    'es-es': 'Campos obligatorios',
    'fr-fr': 'Champs obligatoires',
    'uk-ua': "Обов'язкові поля",
    'de-ch': 'Erforderliche Felder',
    'pt-br': 'Campos obrigatórios',
    'hr-hr': 'Obavezna polja',
    nb: 'Obligatoriske felt',
  },
  optionalFields: {
    'en-us': 'Optional Fields',
    'ru-ru': 'Необязательные поля',
    'es-es': 'Campos opcionales',
    'fr-fr': 'Champs facultatifs',
    'uk-ua': 'Додаткові поля',
    'de-ch': 'Optionale Felder',
    'pt-br': 'Campos opcionais',
    'hr-hr': 'Neobavezna polja',
    nb: 'Valgfrie felt',
  },
  hiddenFields: {
    'en-us': 'Hidden Fields',
    'ru-ru': 'Скрытые поля',
    'es-es': 'Campos ocultos',
    'fr-fr': 'Champs cachés',
    'uk-ua': 'Приховані поля',
    'de-ch': 'Versteckte Felder',
    'pt-br': 'Campos Ocultos',
    'hr-hr': 'Skrivena polja',
    nb: 'Skjulte felt',
  },
  revealHiddenFormFields: {
    'en-us': 'Reveal Hidden Form Fields',
    'ru-ru': 'Показать скрытые поля формы',
    'es-es': 'Mostrar campos de formulario ocultos',
    'de-ch': 'Versteckte Formularfelder anzeigen',
    'fr-fr': 'Afficher les champs de formulaire cachés',
    'uk-ua': 'Показати приховані поля форми',
    'pt-br': 'Revelar campos ocultos do formulário',
    'hr-hr': 'Otkrij skrivena polja obrasca',
    nb: 'Vis skjulte skjemafelt',
  },
  mappingOptions: {
    'en-us': 'Mapping Options',
    'ru-ru': 'Параметры сопоставления',
    'es-es': 'Opciones de mapeo',
    'fr-fr': 'Options de mappage',
    'uk-ua': 'Параметри відображення',
    'de-ch': 'Zuordnungsoptionen',
    'pt-br': 'Opções de mapeamento',
    'hr-hr': 'Opcije mapiranja',
    nb: 'Kartleggingsalternativer',
  },
  ignoreWhenBlank: {
    'en-us': 'Ignore when Blank',
    'ru-ru': 'Игнорировать, когда пусто',
    'es-es': 'Ignorar cuando esté en blanco',
    'fr-fr': 'Ignorer lorsque vide',
    'uk-ua': 'Ігнорувати, коли пусто',
    'de-ch': 'Bei leer ignorieren',
    'pt-br': 'Ignorar quando estiver em branco',
    'hr-hr': 'Zanemari kada je prazno',
    nb: 'Ignorer når blank',
  },
  ignoreWhenBlankDescription: {
    'en-us':
      'When set to "Ignore when Blank" blank values in this column will not be considered for matching purposes. Blank values are ignored when matching even if a default value is provided',
    'ru-ru':
      'Если установлено значение «Игнорировать, если пустое», пустые значения в этом столбце не будут учитываться при сопоставлении. Пустые значения игнорируются при сопоставлении, даже если указано значение по умолчанию.',
    'es-es':
      'Cuando se establece en "Ignorar cuando esté en blanco", los valores en blanco de esta columna no se tendrán en cuenta para la coincidencia. Los valores en blanco se ignoran al realizar la coincidencia, incluso si se proporciona un valor predeterminado.',
    'fr-fr':
      "Si l'option « Ignorer les valeurs vides » est activée, les valeurs vides dans cette colonne ne seront pas prises en compte pour la mise en correspondance. Les valeurs vides sont ignorées même si une valeur par défaut est fournie.",
    'uk-ua':
      'Якщо встановлено значення «Ігнорувати, якщо пусто», пусті значення в цьому стовпці не враховуватимуться для зіставлення. Пусті значення ігноруються під час зіставлення, навіть якщо вказано значення за замовчуванням.',
    'de-ch':
      'Bei der Einstellung "Bei leer ignorieren" werden leere Werte in dieser Spalte beim Abgleich nicht berücksichtigt. Leere Werte werden beim Abgleich ignoriert, auch wenn ein Standardwert angegeben ist',
    'pt-br':
      'Quando definida como "Ignorar quando em branco", os valores em branco nesta coluna não serão considerados para fins de correspondência. Os valores em branco são ignorados na correspondência, mesmo que um valor padrão seja fornecido.',
    'hr-hr':
      'Kada je postavljeno na "Zanemari kada je prazno", prazne vrijednosti u ovom stupcu neće se uzimati u obzir za potrebe podudaranja. Prazne vrijednosti se zanemaruju prilikom podudaranja čak i ako je navedena zadana vrijednost.',
    nb: 'Når den er satt til «Ignorer når tom», vil ikke tomme verdier i denne kolonnen bli vurdert for samsvarsformål. Tomme verdier ignoreres ved samsvar selv om en standardverdi er oppgitt.',
  },
  ignoreAlways: {
    'en-us': 'Always Ignore',
    'ru-ru': 'Всегда игнорируйте',
    'es-es': 'Ignora siempre',
    'fr-fr': 'Ignorer toujours',
    'uk-ua': 'Завжди ігнорувати',
    'de-ch': 'Immer ignorieren',
    'pt-br': 'Ignore sempre',
    'hr-hr': 'Uvijek ignoriraj',
    nb: 'Ignorer alltid',
  },
  ignoreAlwaysDescription: {
    'en-us':
      'When set to "Always Ignore," the value in this column will not be used for matching purposes, only for uploading.',
    'ru-ru':
      'Если установлено значение "Всегда игнорировать", значение в этом столбце не будет использоваться для сопоставления, а только для загрузки.',
    'es-es':
      'Cuando se selecciona "Ignorar siempre", el valor de esta columna no se utilizará para fines de comparación, sino únicamente para la carga de archivos.',
    'fr-fr':
      "Si l'option « Toujours ignorer » est sélectionnée, la valeur de cette colonne ne sera pas utilisée à des fins de correspondance, mais uniquement pour le chargement.",
    'uk-ua':
      'Якщо встановлено значення «Завжди ігнорувати», значення в цьому стовпці не використовуватиметься для зіставлення, а лише для завантаження.',
    'de-ch':
      'Wenn die Option „Immer ignorieren“ ausgewählt ist, wird der Wert in dieser Spalte nicht für Abgleichzwecke, sondern nur für den Upload verwendet.',
    'pt-br':
      'Quando definida como "Ignorar sempre", o valor nesta coluna não será usado para fins de correspondência, apenas para carregamento.',
    'hr-hr':
      'Kada je postavljeno na "Uvijek zanemari", vrijednost u ovom stupcu neće se koristiti za potrebe podudaranja, već samo za prijenos.',
    nb: 'Når den er satt til «Ignorer alltid», vil verdien i denne kolonnen ikke bli brukt til samsvarsformål, kun til opplasting.',
  },
  ignoreNever: {
    'en-us': 'Never Ignore',
    'ru-ru': 'Никогда не игнорируйте',
    'es-es': 'Nunca lo ignores',
    'de-ch': 'Nie ignorieren',
    'fr-fr': 'Ne jamais ignorer',
    'uk-ua': 'Ніколи не ігноруйте',
    'pt-br': 'Nunca ignore',
    'hr-hr': 'Nikad ne ignoriraj',
    nb: 'Aldri ignorer',
  },
  ignoreNeverDescription: {
    'en-us':
      "This column would always be considered for matching purposes, regardless of it's value",
    'ru-ru':
      'Этот столбец всегда будет учитываться при сопоставлении данных, независимо от его значения.',
    'es-es':
      'Esta columna siempre se tendrá en cuenta para fines de coincidencia, independientemente de su valor.',
    'fr-fr':
      'Cette colonne serait toujours prise en compte à des fins de correspondance, quelle que soit sa valeur.',
    'uk-ua':
      'Цей стовпець завжди враховуватиметься для зіставлення, незалежно від його значення',
    'de-ch':
      'Diese Spalte wird immer für den Abgleich berücksichtigt, unabhängig von ihrem Wert',
    'pt-br':
      'Esta coluna será sempre considerada para fins de correspondência, independentemente do seu valor.',
    'hr-hr':
      'Ovaj stupac bi se uvijek uzimao u obzir za potrebe podudaranja, bez obzira na njegovu vrijednost',
    nb: 'Denne kolonnen vil alltid bli vurdert for samsvarsformål, uavhengig av verdien.',
  },
  allowNullValues: {
    'en-us': 'Allow Null Values',
    'ru-ru': 'Разрешить значения NULL',
    'es-es': 'Permitir valores nulos',
    'fr-fr': 'Autoriser les valeurs nulles',
    'uk-ua': 'Дозволити нульові значення',
    'de-ch': 'Nullwerte erlauben',
    'pt-br': 'Permitir valores nulos',
    'hr-hr': 'Dopusti null vrijednosti',
    nb: 'Tillat nullverdier',
  },
  useDefaultValue: {
    'en-us': 'Use Default Value',
    'ru-ru': 'Использовать значение по умолчанию',
    'es-es': 'Usar valor predeterminado',
    'fr-fr': 'Utiliser la valeur par défaut',
    'uk-ua': 'Використовувати значення за замовчуванням',
    'de-ch': 'Verwende den Standardwert',
    'pt-br': 'Usar valor padrão',
    'hr-hr': 'Koristi zadanu vrijednost',
    nb: 'Bruk standardverdi',
  },
  defaultValue: {
    'en-us': 'Default Value',
    'ru-ru': 'Значение по умолчанию',
    'es-es': 'Valor predeterminado',
    'fr-fr': 'Valeur par défaut',
    'uk-ua': 'Значення за замовчуванням',
    'de-ch': 'Standardwert',
    'pt-br': 'Valor padrão',
    'hr-hr': 'Zadana vrijednost',
    nb: 'Standardverdi',
  },
  defaultValueDescription: {
    'en-us': 'This value would be used in place of empty cells',
    'ru-ru': 'Это значение будет использоваться вместо пустых ячеек.',
    'es-es': 'Este valor se utilizaría en lugar de celdas vacías.',
    'fr-fr': 'Cette valeur serait utilisée à la place des cellules vides.',
    'uk-ua': 'Це значення буде використано замість порожніх комірок',
    'de-ch': 'Dieser Wert wird anstelle von leeren Zellen verwendet',
    'pt-br': 'Esse valor seria usado no lugar de células vazias.',
    'hr-hr': 'Ova vrijednost bi se koristila umjesto praznih ćelija',
    nb: 'Denne verdien ville blitt brukt i stedet for tomme celler',
  },
  addNewColumn: {
    'en-us': 'Add New Column',
    'ru-ru': 'Добавить новый столбец',
    'es-es': 'Agregar nueva columna',
    'fr-fr': 'Ajouter une nouvelle colonne',
    'uk-ua': 'Додати новий стовпець',
    'de-ch': 'Neue Spalte hinzufügen',
    'pt-br': 'Adicionar nova coluna',
    'hr-hr': 'Dodaj novi stupac',
    nb: 'Legg til ny kolonne',
  },
  validationFailed: {
    'en-us': 'Validation found missing mappings:',
    'ru-ru': 'В ходе проверки были обнаружены отсутствующие сопоставления:',
    'es-es': 'La validación detectó asignaciones faltantes:',
    'fr-fr': 'La validation a détecté des correspondances manquantes :',
    'uk-ua': 'Під час перевірки виявлено відсутні зіставлення:',
    'de-ch': 'Die Validierung hat fehlende Zuordnungen gefunden:',
    'pt-br': 'A validação encontrou mapeamentos ausentes:',
    'hr-hr': 'Validacija je pronašla nedostajuća mapiranja:',
    nb: 'Validering fant manglende tilordninger:',
  },
  validationFailedDescription: {
    'en-us':
      'This data mapping is missing one or more data fields required for uploading by your Specify configuration. Add the missing mappings shown or save this mapping as unfinished.',
    'ru-ru':
      'В этом сопоставлении данных отсутствует одно или несколько полей, необходимых для загрузки в соответствии с вашей конфигурацией Specify. Добавьте недостающие сопоставления, показанные на изображении, или сохраните это сопоставление как незавершенное.',
    'es-es':
      'A esta asignación de datos le faltan uno o más campos de datos necesarios para la carga según su configuración de Specify. Agregue las asignaciones faltantes que se muestran o guarde esta asignación como incompleta.',
    'fr-fr':
      'Il manque un ou plusieurs champs de données requis pour le chargement selon votre configuration. Ajoutez les correspondances manquantes indiquées ou enregistrez cette correspondance comme inachevée.',
    'uk-ua':
      'У цьому зіставленні даних відсутнє одне або кілька полів даних, необхідних для завантаження згідно з вашою конфігурацією Specify. Додайте відсутні зіставлення або збережіть це зіставлення як незавершене.',
    'de-ch':
      'Diese Datenzuordnung weist ein oder mehrere fehlende Datenfelder auf, die gemäß Ihrer Specify-Konfiguration für den Upload erforderlich sind. Fügen Sie die fehlenden Zuordnungen hinzu oder speichern Sie diese Zuordnung als unvollständig.',
    'pt-br':
      'Este mapeamento de dados está incompleto, faltando um ou mais campos de dados necessários para o carregamento de acordo com a sua configuração. Adicione os mapeamentos ausentes mostrados ou salve este mapeamento como incompleto.',
    'hr-hr':
      'U ovom mapiranju podataka nedostaje jedno ili više podatkovnih polja potrebnih za učitavanje prema vašoj konfiguraciji Navedite. Dodajte prikazana mapiranja koja nedostaju ili spremite ovo mapiranje kao nedovršeno.',
    nb: 'Denne datatilordningen mangler ett eller flere datafelt som kreves for opplasting av din Spesifiser-konfigurasjon. Legg til de manglende tilordningene som vises, eller lagre denne tilordningen som uferdig.',
  },
  mappingIsRequired: {
    comment: 'I.e, this field must be mapped before you can continue',
    'en-us': 'Mapping is required',
    'ru-ru': 'Требуется составление карты.',
    'es-es': 'Se requiere mapeo',
    'fr-fr': 'Un mappage est nécessaire',
    'uk-ua': 'Потрібне картографування',
    'de-ch': 'Kartierung erforderlich',
    'pt-br': 'É necessário fazer mapeamento.',
    'hr-hr': 'Mapiranje je potrebno',
    nb: 'Kartlegging er nødvendig',
  },
  continueEditing: {
    'en-us': 'Continue Editing',
    'ru-ru': 'Продолжить редактирование',
    'es-es': 'Continuar editando',
    'fr-fr': 'Continuer la modification',
    'uk-ua': 'Продовжити редагування',
    'de-ch': 'Bearbeitung fortsetzen',
    'pt-br': 'Continuar a edição',
    'hr-hr': 'Nastavi uređivanje',
    nb: 'Fortsett redigeringen',
  },
  saveUnfinished: {
    'en-us': 'Save Unfinished',
    'ru-ru': 'Сохранить незавершенное',
    'es-es': 'Guardar Sin terminar',
    'fr-fr': 'Enregistrer les éléments inachevés',
    'uk-ua': 'Зберегти незавершене',
    'de-ch': 'Unvollendet speichern',
    'pt-br': 'Salvar Inacabado',
    'hr-hr': 'Spremi nedovršeno',
    nb: 'Lagre uferdig',
  },
  map: {
    'en-us': 'Map',
    'ru-ru': 'Карта',
    'es-es': 'Mapa',
    'de-ch': 'Datenzuordnung erstellen',
    'fr-fr': 'Mappage',
    'uk-ua': 'Карта',
    'pt-br': 'Mapa',
    'hr-hr': 'Karta',
    nb: 'Kart',
  },
  unmap: {
    'en-us': 'Unmap',
    'ru-ru': 'Удалить карту',
    'es-es': 'Desmapear',
    'fr-fr': 'Démap',
    'uk-ua': 'Зняти з карти',
    'de-ch': 'Datenzuordnung auflösen',
    'pt-br': 'Desmapear',
    'hr-hr': 'Ukloni s mape',
    nb: 'Fjern kartlegging',
  },
  mapButtonDescription: {
    'en-us': 'Map selected field to selected header',
    'ru-ru': 'Сопоставьте выбранное поле с выбранным заголовком',
    'es-es': 'Asignar el campo seleccionado al encabezado seleccionado',
    'de-ch': 'Ausgewähltes Feld der ausgewählten Feldüberschrift zuordnen',
    'fr-fr': "Associer le champ sélectionné à l'en-tête sélectionné",
    'uk-ua': 'Зіставити вибране поле з вибраним заголовком',
    'pt-br': 'Mapear o campo selecionado para o cabeçalho selecionado',
    'hr-hr': 'Mapirajte odabrano polje na odabrano zaglavlje',
    nb: 'Tilordne valgt felt til valgt overskrift',
  },
  relationshipWithTable: {
    'en-us': 'Relationship to the {tableName:string} table',
    'ru-ru': 'Связь с таблицей {tableName:string}',
    'es-es': 'Relación con la tabla {tableName:string}',
    'fr-fr': 'Relation avec la table {tableName:string}',
    'uk-ua': "Зв'язок з таблицею {tableName:string}",
    'de-ch': 'Beziehung zur Tabelle {tableName:string}',
    'pt-br': 'Relação com a tabela {tableName:string}',
    'hr-hr': 'Odnos prema tablici {tableName:string}',
    nb: 'Forholdet til tabellen {tableName:string}',
  },
  selectBaseTable: {
    'en-us': 'Select a Base Table',
    'ru-ru': 'Выберите базовую таблицу',
    'es-es': 'Seleccione una tabla base',
    'fr-fr': 'Sélectionnez une table de base',
    'uk-ua': 'Виберіть базову таблицю',
    'de-ch': 'Basistabelle auswählen',
    'pt-br': 'Selecione uma tabela base',
    'hr-hr': 'Odaberite osnovnu tablicu',
    nb: 'Velg en basistabell',
  },
  chooseExistingPlan: {
    'en-us': 'Choose Existing Mapping',
    'ru-ru': 'Выберите существующее сопоставление',
    'es-es': 'Seleccionar un mapa existente',
    'fr-fr': 'Choisir un mappage existant',
    'uk-ua': 'Виберіть існуюче відображення',
    'de-ch': 'Vorhandene Zuordnung auswählen',
    'pt-br': 'Selecionar mapeamento existente',
    'hr-hr': 'Odaberite postojeće mapiranje',
    nb: 'Velg eksisterende kartlegging',
  },
  showAllTables: {
    'en-us': 'Show All Tables',
    'ru-ru': 'Показать все таблицы',
    'es-es': 'Mostrar todas las tablas',
    'fr-fr': 'Afficher toutes les tables',
    'uk-ua': 'Показати всі таблиці',
    'de-ch': 'Erweiterte Tabellen anzeigen',
    'pt-br': 'Mostrar todas as tabelas',
    'hr-hr': 'Prikaži sve tablice',
    nb: 'Vis alle tabeller',
  },
  baseTableDescription: {
    'en-us':
      "A 'base table' is the table that serves as the starting point for column-to-data field mappings. Once uploaded, each row in your data set will result in a new record in Specify in the base table you select. Click on a base table in the list to get started.",
    'de-ch':
      'Eine „Basistabelle“ dient als Ausgangspunkt für die Zuordnung von Spalten zu Datenfeldern. Nach dem Hochladen wird jede Zeile Ihres Datensatzes in der von Ihnen ausgewählten Basistabelle als neuer Datensatz angelegt. Klicken Sie in der Liste auf eine Basistabelle, um zu beginnen.',
    'es-es':
      'Una «tabla base» es la tabla que sirve como punto de partida para la asignación de columnas a campos de datos. Una vez cargada, cada fila de su conjunto de datos generará un nuevo registro en la tabla base que seleccione. Haga clic en una tabla base de la lista para comenzar.',
    'fr-fr':
      'Une « table de base » sert de point de départ pour la correspondance entre les colonnes et les champs de données. Une fois importée, chaque ligne de votre jeu de données créera un nouvel enregistrement dans la table de base sélectionnée. Cliquez sur une table de base dans la liste pour commencer.',
    'hr-hr':
      "'Osnovna tablica' je tablica koja služi kao početna točka za mapiranje stupaca u podatkovna polja. Nakon prijenosa, svaki redak u vašem skupu podataka rezultirat će novim zapisom u . Navedite u odabranoj osnovnoj tablici. Kliknite na osnovnu tablicu na popisu da biste započeli.",
    nb: 'En «basistabell» er tabellen som fungerer som utgangspunkt for tilordninger mellom kolonner og datafelt. Når den er lastet opp, vil hver rad i datasettet resultere i en ny post i Spesifiser i basistabellen du velger. Klikk på en basistabell i listen for å komme i gang.',
    'pt-br':
      "Uma 'tabela base' é a tabela que serve como ponto de partida para o mapeamento de colunas para campos de dados. Após o carregamento, cada linha do seu conjunto de dados resultará em um novo registro na tabela base que você selecionar. Clique em uma tabela base na lista para começar.",
    'ru-ru':
      '«Базовая таблица» — это таблица, которая служит отправной точкой для сопоставления столбцов с полями данных. После загрузки каждая строка в вашем наборе данных будет приводить к созданию новой записи в указанной вами базовой таблице. Щелкните по базовой таблице в списке, чтобы начать.',
    'uk-ua':
      '«Базова таблиця» – це таблиця, яка слугує відправною точкою для зіставлення стовпців із полями даних. Після завантаження кожен рядок у вашому наборі даних призведе до створення нового запису в . Укажіть у вибраній базовій таблиці. Натисніть на базову таблицю у списку, щоб розпочати.',
  },
  baseTableWithAttachmentsDescription: {
    'en-us':
      "A 'base table' is the table that serves as the starting point for column-to-data field mappings. Each imported attachment record will be added as a new row in the base table you select. Click on a base table in the list to get started.",
    'de-ch':
      'Eine „Basistabelle“ dient als Ausgangspunkt für die Zuordnung von Spalten zu Datenfeldern. Jeder importierte Anhangsdatensatz wird als neue Zeile in die ausgewählte Basistabelle eingefügt. Klicken Sie in der Liste auf eine Basistabelle, um zu beginnen.',
    'es-es':
      'Una tabla base sirve como punto de partida para la asignación de columnas a campos de datos. Cada registro de archivo adjunto importado se añadirá como una nueva fila en la tabla base que seleccione. Haga clic en una tabla base de la lista para comenzar.',
    'fr-fr':
      'Une « table de base » sert de point de départ pour la correspondance entre les colonnes et les champs de données. Chaque enregistrement de pièce jointe importée sera ajouté comme une nouvelle ligne dans la table de base sélectionnée. Cliquez sur une table de base dans la liste pour commencer.',
    'hr-hr':
      "'Osnovna tablica' je tablica koja služi kao početna točka za mapiranje stupaca u podatkovna polja. Svaki uvezeni zapis privitka bit će dodan kao novi redak u odabranoj osnovnoj tablici. Kliknite na osnovnu tablicu na popisu da biste započeli.",
    nb: 'En «basistabell» er tabellen som fungerer som utgangspunkt for tilordninger mellom kolonner og datafelt. Hver importerte vedleggspost legges til som en ny rad i basistabellen du velger. Klikk på en basistabell i listen for å komme i gang.',
    'pt-br':
      "Uma 'tabela base' é a tabela que serve como ponto de partida para o mapeamento de colunas para campos de dados. Cada registro de anexo importado será adicionado como uma nova linha na tabela base selecionada. Clique em uma tabela base na lista para começar.",
    'ru-ru':
      '«Базовая таблица» — это таблица, которая служит отправной точкой для сопоставления столбцов с полями данных. Каждая импортированная запись вложения будет добавлена в выбранную вами базовую таблицу в виде новой строки. Щелкните по базовой таблице в списке, чтобы начать.',
    'uk-ua':
      '«Базова таблиця» – це таблиця, яка слугує відправною точкою для зіставлення стовпців із полями даних. Кожен імпортований вкладений запис буде додано як новий рядок у вибрану вами базову таблицю. Щоб розпочати, натисніть на базову таблицю у списку.',
  },
  selectBaseTableWithAttachments: {
    'en-us': 'Select a Base Table with Attachments',
    'de-ch': 'Wählen Sie eine Basistabelle mit Anhängen aus',
    'es-es': 'Seleccione una mesa base con accesorios.',
    'fr-fr': 'Sélectionnez une table de base avec pièces jointes',
    'pt-br': 'Selecione uma mesa base com anexos.',
    'ru-ru': 'Выберите базовую таблицу с вложениями.',
    'uk-ua': 'Виберіть базову таблицю з вкладеннями',
    'hr-hr': 'Odaberite osnovnu tablicu s prilozima',
    nb: 'Velg en basistabell med vedlegg',
  },
  dataSetUploaded: {
    'en-us': 'Data Set uploaded. This mapping cannot be changed',
    'ru-ru': 'Набор данных загружен. Это сопоставление изменить нельзя.',
    'es-es': 'Conjunto de datos cargado. Este mapeo no se puede modificar.',
    'fr-fr': 'Jeu de données téléchargé. Ce mappage ne peut pas être modifié.',
    'uk-ua': 'Набір даних завантажено. Це зіставлення не можна змінити.',
    'de-ch':
      'Datensatz hochgeladen. Diese Zuordnung kann nicht geändert werden.',
    'pt-br':
      'Conjunto de dados carregado. Este mapeamento não pode ser alterado.',
    'hr-hr': 'Skup podataka prenesen. Ovo mapiranje se ne može promijeniti.',
    nb: 'Datasettet er lastet opp. Denne kartleggingen kan ikke endres.',
  },
  dataSetUploadedDescription: {
    'en-us':
      'You are viewing the mappings for an uploaded dataset.\n\nTo edit the mappings, rollback the uploaded data or create a new dataset',
    'ru-ru':
      'Вы просматриваете сопоставления для загруженного набора данных.\n\nЧтобы отредактировать сопоставления, откатите загруженные данные или создайте новый набор данных.',
    'es-es':
      'Estás viendo las asignaciones de un conjunto de datos cargado.\n\n\n\n\n\nPara editar las asignaciones, revertir los datos cargados o crear un nuevo conjunto de datos, puedes editar las asignaciones, restaurar los datos originales o crear un nuevo conjunto de datos.',
    'fr-fr':
      "Vous visualisez les correspondances d'un jeu de données importé.\n\n\n\n\n\nPour modifier les correspondances, annulez l'importation des données ou créez un nouveau jeu de données.",
    'uk-ua':
      'Ви переглядаєте зіставлення для завантаженого набору даних.\n\nЩоб редагувати зіставлення, відкотіть завантажені дані або створіть новий набір даних.',
    'de-ch':
      'Sie betrachten gerade die Datenzuordnungen für einen hochgeladenen Datensatz.\n\nUm die Zuordnungen zu bearbeiten, die hochgeladenen Daten zurückzusetzen oder einen neuen Datensatz erstellen',
    'pt-br':
      'Você está visualizando os mapeamentos de um conjunto de dados carregado.\n\nPara editar os mapeamentos, reverta os dados carregados ou crie um novo conjunto de dados.',
    'hr-hr':
      'Pregledavate mapiranja za preneseni skup podataka.\n\nDa biste uredili mapiranja, vratite prenesene podatke ili stvorite novi skup podataka.',
    nb: 'Du ser på kartleggingene for et opplastet datasett.\n\nFor å redigere kartleggingene, tilbakestill de opplastede dataene eller opprett et nytt datasett.',
  },
  baseTable: {
    'en-us': 'Base Table',
    'ru-ru': 'Базовая таблица',
    'es-es': 'Mesa base',
    'fr-fr': 'Table de base',
    'uk-ua': 'Базова таблиця',
    'de-ch': 'Basistabelle',
    'pt-br': 'Tabela Base',
    'hr-hr': 'Osnovna tablica',
    nb: 'Basisbord',
  },
  goToBaseTable: {
    'en-us': 'Change the Base Table for Mapping Data Set Columns?',
    'ru-ru':
      'Изменить базовую таблицу для сопоставления столбцов набора данных?',
    'es-es':
      '¿Cambiar la tabla base para asignar las columnas del conjunto de datos?',
    'fr-fr':
      "Modifier la table de base pour le mappage des colonnes de l'ensemble de données ?",
    'uk-ua': 'Змінити базову таблицю для зіставлення стовпців набору даних?',
    'de-ch': 'Die Basistabelle für die Zuordnung von Datensatzspalten ändern?',
    'pt-br':
      'Alterar a tabela base para mapear as colunas do conjunto de dados?',
    'hr-hr':
      'Promijeniti osnovnu tablicu za stupce skupa podataka za mapiranje?',
    nb: 'Endre basistabellen for tilordning av datasettkolonner?',
  },
  goToBaseTableDescription: {
    'en-us':
      'Choosing a different base table for a data set will make that table the new starting point for column-to-data field mappings and will erase existing mappings. The AutoMapper will attempt to map columns to the new base table fields.',
    'ru-ru':
      'Выбор другой базовой таблицы для набора данных сделает эту таблицу новой отправной точкой для сопоставления столбцов с полями данных и удалит существующие сопоставления. AutoMapper попытается сопоставить столбцы с полями новой базовой таблицы.',
    'es-es':
      'Al seleccionar una tabla base diferente para un conjunto de datos, dicha tabla se convertirá en el nuevo punto de partida para la asignación de columnas a campos de datos y se borrarán las asignaciones existentes. El AutoMapper intentará asignar las columnas a los campos de la nueva tabla base.',
    'fr-fr':
      "Choisir une autre table de base pour un ensemble de données définira cette table comme nouveau point de départ pour la correspondance entre les colonnes et les champs de données, et effacera les correspondances existantes. L'outil de mappage automatique tentera d'associer les colonnes aux champs de la nouvelle table de base.",
    'uk-ua':
      'Вибір іншої базової таблиці для набору даних зробить цю таблицю новою відправною точкою для зіставлення стовпців з полями даних та видалить існуючі зіставлення. AutoMapper спробує зіставити стовпці з новими полями базової таблиці.',
    'de-ch':
      'Wenn Sie eine andere Basistabelle für einen Datensatz auswählen, wird diese Tabelle zum neuen Ausgangspunkt für die Zuordnung von Spalten zu Datenfeldern und die bestehenden Zuordnungen werden gelöscht. Der AutoMapper versucht dann, die Spalten den Feldern der neuen Basistabelle zuzuordnen.',
    'pt-br':
      'Escolher uma tabela base diferente para um conjunto de dados fará com que essa tabela se torne o novo ponto de partida para o mapeamento de colunas para campos de dados e apagará os mapeamentos existentes. O AutoMapper tentará mapear as colunas para os campos da nova tabela base.',
    'hr-hr':
      'Odabirom druge osnovne tablice za skup podataka ta će tablica postati nova početna točka za mapiranja stupaca u podatkovna polja i izbrisat će se postojeća mapiranja. AutoMapper će pokušati mapirati stupce na nova polja osnovne tablice.',
    nb: 'Hvis du velger en annen basistabell for et datasett, blir den tabellen det nye startpunktet for tilordninger mellom kolonner og datafelt, og eksisterende tilordninger slettes. AutoMapper vil forsøke å tilordne kolonner til de nye basistabellfeltene.',
  },
  clearMapping: {
    'en-us': 'Clear Mapping',
    'ru-ru': 'Четкое картографирование',
    'es-es': 'Mapeo claro',
    'fr-fr': 'Réinitialiser le mappage',
    'uk-ua': 'Очистити мапування',
    'de-ch': 'Datenzuordnung zurücksetzen',
    'pt-br': 'Mapeamento claro',
    'hr-hr': 'Očisti mapiranje',
    nb: 'Tydelig kartlegging',
  },
  reRunAutoMapper: {
    'en-us': 'Rerun AutoMapper',
    'ru-ru': 'Повторный запуск AutoMapper',
    'es-es': 'Vuelva a ejecutar AutoMapper',
    'fr-fr': "Relancer l'auto-mappeur",
    'uk-ua': 'Перезапустіть AutoMapper',
    'de-ch': 'AutoMapper erneut ausführen',
    'pt-br': 'Executar novamente o AutoMapper',
    'hr-hr': 'Ponovno pokrenite AutoMapper',
    nb: 'Kjør AutoMapper på nytt',
  },
  autoMapper: {
    'en-us': 'AutoMapper',
    'ru-ru': 'АвтоКартер',
    'es-es': 'Mapeador automático',
    'fr-fr': 'Auto-mappeur',
    'uk-ua': 'Автомаппер',
    'de-ch': 'AutoMapper',
    'pt-br': 'AutoMapper',
    'hr-hr': 'AutoMapper',
    nb: 'AutoMap',
  },
  mappingEditor: {
    'en-us': 'Map Explorer',
    'ru-ru': 'Исследователь карт',
    'es-es': 'Explorador de mapas',
    'fr-fr': 'Explorateur de mappage',
    'uk-ua': 'Оглядач карти',
    'de-ch': 'Karten-Explorer',
    'pt-br': 'Explorador de mapas',
    'hr-hr': 'Istraživač karte',
    nb: 'Kartutforsker',
  },
  hideFieldMapper: {
    'en-us': 'Hide Field Mapper',
    'ru-ru': 'Скрыть карту поля',
    'es-es': 'Ocultar el mapeador de campos',
    'fr-fr': 'Masquer le mappeur de champs',
    'uk-ua': 'Приховати картографа полів',
    'de-ch': 'Field Mapper ausblenden',
    'pt-br': 'Ocultar mapeador de campos',
    'hr-hr': 'Sakrij alat za mapiranje polja',
    nb: 'Skjul feltkartlegger',
  },
  showFieldMapper: {
    'en-us': 'Show Field Mapper',
    'ru-ru': 'Показать карту поля',
    'es-es': 'Mostrar mapa de campo',
    'fr-fr': 'Afficher le mappeur de champs',
    'uk-ua': 'Показати картографічний пристрій для полів',
    'de-ch': 'Field Mapper einblenden',
    'pt-br': 'Mostrar Mapeador de Campos',
    'hr-hr': 'Prikaži terenski maper',
    nb: 'Vis feltkartlegger',
  },
  mappings: {
    'en-us': 'Mappings',
    'ru-ru': 'Сопоставления',
    'es-es': 'Mapeos',
    'fr-fr': 'Mappages',
    'uk-ua': 'Відображення',
    'de-ch': 'Zuordnungen',
    'pt-br': 'Mapeamentos',
    'hr-hr': 'Mapiranje',
    nb: 'Kartlegginger',
  },
  clearMappings: {
    'en-us': 'Clear Mappings',
    'ru-ru': 'Четкое отображение карт',
    'es-es': 'Mapeos claros',
    'fr-fr': 'Nettoyer les mappages',
    'uk-ua': 'Очистити зіставлення',
    'de-ch': 'Zuordnungen zurückstellen',
    'pt-br': 'Mapeamentos claros',
    'hr-hr': 'Očisti mapiranja',
    nb: 'Tydelige kartlegginger',
  },
  emptyDataSet: {
    'en-us': 'Empty Data Set',
    'ru-ru': 'Пустой набор данных',
    'es-es': 'Conjunto de datos vacío',
    'fr-fr': 'Ensemble de données vide',
    'uk-ua': 'Порожній набір даних',
    'de-ch': 'Datenset leeren',
    'pt-br': 'Conjunto de dados vazio',
    'hr-hr': 'Prazan skup podataka',
    nb: 'Tomt datasett',
  },
  emptyDataSetDescription: {
    'en-us': "This Data Set doesn't have any columns.",
    'ru-ru': 'В этом наборе данных отсутствуют столбцы.',
    'es-es': 'Este conjunto de datos no tiene ninguna columna.',
    'fr-fr': 'Cet ensemble de données ne comporte aucune colonne.',
    'uk-ua': 'Цей набір даних не містить жодних стовпців.',
    'de-ch': 'Dieser Datensatz hat keine Spalten.',
    'pt-br': 'Este conjunto de dados não possui colunas.',
    'hr-hr': 'Ovaj skup podataka nema stupaca.',
    nb: 'Dette datasettet har ingen kolonner.',
  },
  emptyDataSetSecondDescription: {
    'en-us':
      'Press the "Add New Column" button below the mapping lines to add new columns.',
    'ru-ru':
      'Чтобы добавить новые столбцы, нажмите кнопку «Добавить новый столбец» под линиями сопоставления.',
    'es-es':
      'Pulse el botón "Añadir nueva columna" que aparece debajo de las líneas de asignación para añadir nuevas columnas.',
    'fr-fr':
      'Appuyez sur le bouton « Ajouter une nouvelle colonne » situé sous les lignes de mappage pour ajouter de nouvelles colonnes.',
    'uk-ua':
      'Натисніть кнопку «Додати новий стовпець» під лініями відображення, щоб додати нові стовпці.',
    'de-ch':
      'Klicken Sie auf die Schaltfläche "Neue Spalte hinzufügen" unterhalb der Zuordnungszeilen, um neue Spalten hinzuzufügen.',
    'pt-br':
      'Pressione o botão "Adicionar nova coluna" abaixo das linhas de mapeamento para adicionar novas colunas.',
    'hr-hr':
      'Pritisnite gumb "Dodaj novi stupac" ispod linija mapiranja da biste dodali nove stupce.',
    nb: 'Trykk på knappen «Legg til ny kolonne» under kartleggingslinjene for å legge til nye kolonner.',
  },
  reRunAutoMapperConfirmation: {
    'en-us': 'Automap to start a new mapping?',
    'ru-ru': 'Чтобы начать создание новой карты с помощью функции Automap?',
    'es-es': '¿Automap inicia un nuevo mapeo?',
    'de-ch': 'Automap soll eine neue Kartierung starten?',
    'fr-fr': 'Auto-mapper pour recommencer ?',
    'uk-ua': 'Автоматичне створення карти, щоб розпочати нове відображення?',
    'pt-br': 'Automapa para iniciar um novo mapeamento?',
    'hr-hr': 'Automatsko mapiranje za početak novog mapiranja?',
    nb: 'For å starte en ny kartlegging med Automap?',
  },
  reRunAutoMapperConfirmationDescription: {
    'en-us': 'This will erase existing data field mappings.',
    'ru-ru': 'Это приведет к удалению существующих сопоставлений полей данных.',
    'es-es': 'Esto borrará las asignaciones de campos de datos existentes.',
    'fr-fr': 'Cela effacera les mappages de champs de données existants.',
    'uk-ua': 'Це видалить існуючі зіставлення полів даних.',
    'de-ch': 'Damit werden bestehende Zuordnungen von Datenfeldern gelöscht.',
    'pt-br': 'Isso apagará os mapeamentos de campos de dados existentes.',
    'hr-hr': 'Ovo će izbrisati postojeća mapiranja podatkovnih polja.',
    nb: 'Dette vil slette eksisterende datafelttilordninger.',
  },
  clearMappingsConfirmation: {
    'en-us': 'Clear all existing mappings?',
    'ru-ru': 'Очистить все существующие сопоставления?',
    'es-es': '¿Borrar todas las asignaciones existentes?',
    'fr-fr': 'Effacer tous les mappages existants ?',
    'uk-ua': 'Очистити всі наявні зіставлення?',
    'de-ch': 'Alle bestehenden Zuordnungen löschen?',
    'pt-br': 'Limpar todos os mapeamentos existentes?',
    'hr-hr': 'Izbrisati sva postojeća mapiranja?',
    nb: 'Fjern alle eksisterende tilordninger?',
  },
  clearMappingsConfirmationDescription: {
    'en-us': 'This will erase existing data field mappings.',
    'ru-ru': 'Это приведет к удалению существующих сопоставлений полей данных.',
    'es-es': 'Esto borrará las asignaciones de campos de datos existentes.',
    'fr-fr': 'Cela effacera les mappages de champs de données existants.',
    'uk-ua': 'Це видалить існуючі зіставлення полів даних.',
    'de-ch': 'Damit werden bestehende Zuordnungen von Datenfeldern gelöscht.',
    'pt-br': 'Isso apagará os mapeamentos de campos de dados existentes.',
    'hr-hr': 'Ovo će izbrisati postojeća mapiranja podatkovnih polja.',
    nb: 'Dette vil slette eksisterende datafelttilordninger.',
  },
  changeMatchingLogic: {
    'en-us': 'Change Matching Logic',
    'ru-ru': 'Изменение логики сопоставления',
    'es-es': 'Lógica de coincidencia de cambios',
    'fr-fr': 'Change la logique de correspondance',
    'uk-ua': 'Зміна логіки зіставлення',
    'de-ch': 'Abgleichslogik ändern',
    'pt-br': 'Alterar a lógica de correspondência',
    'hr-hr': 'Logika podudaranja promjena',
    nb: 'Endre samsvarslogikk',
  },
  matchingLogicDescription: {
    'en-us': 'Require Data to Match Existing Records',
    'ru-ru': 'Необходимо, чтобы данные соответствовали существующим записям.',
    'es-es': 'Requerir que los datos coincidan con los registros existentes.',
    'fr-fr':
      'Exiger que les données correspondent aux enregistrements existants',
    'uk-ua': 'Вимагати збіг даних з існуючими записами',
    'de-ch': 'Benötigt Daten um vorhandene Datensätze vergleichen zu können',
    'pt-br': 'Exigir que os dados correspondam aos registros existentes',
    'hr-hr': 'Zahtijevajte podatke koji odgovaraju postojećim zapisima',
    nb: 'Krev at data samsvarer med eksisterende poster',
  },
  matchingLogicUnavailable: {
    'en-us': 'Matching logic is unavailable for current mappings',
    'ru-ru': 'Для текущих сопоставлений логика сопоставления недоступна.',
    'es-es':
      'La lógica de coincidencia no está disponible para las asignaciones actuales.',
    'fr-fr':
      'La logique de correspondance est indisponible pour les mappages actuels.',
    'uk-ua': 'Логіка зіставлення недоступна для поточних зіставлень',
    'de-ch': 'Die Vergleichslogik ist für aktuelle Mappings nicht verfügbar',
    'pt-br':
      'A lógica de correspondência não está disponível para os mapeamentos atuais.',
    'hr-hr': 'Logika podudaranja nije dostupna za trenutna mapiranja',
    nb: 'Samsvarslogikk er ikke tilgjengelig for gjeldende tilordninger',
  },
  mustMatch: {
    'en-us': 'Must Match',
    'ru-ru': 'Обязательное соответствие',
    'es-es': 'Debe coincidir',
    'fr-fr': 'Doit correspondre',
    'uk-ua': "Обов'язковий збіг",
    'de-ch': 'Muss übereinstimmen',
    'pt-br': 'Deve corresponder',
    'hr-hr': 'Mora se podudarati',
    nb: 'Må samsvare',
  },
  unloadProtectMessage: {
    'en-us': 'This mapping has not been saved.',
    'ru-ru': 'Данная схема сопоставления не сохранена.',
    'es-es': 'Este mapa no se ha guardado.',
    'fr-fr': "Ce mappage n'a pas été enregistré.",
    'uk-ua': 'Це зіставлення не збережено.',
    'de-ch': 'Dieses Mapping wurde nicht gespeichert.',
    'pt-br': 'Este mapeamento não foi salvo.',
    'hr-hr': 'Ovo mapiranje nije spremljeno.',
    nb: 'Denne kartleggingen er ikke lagret.',
  },
  newHeaderName: {
    'en-us': 'New Column {index:number}',
    'ru-ru': 'Новый столбец {index:number}',
    'es-es': 'Nueva columna {index:number}',
    'fr-fr': 'Nouvelle colonne {index:number}',
    'uk-ua': 'Новий стовпець {index:number}',
    'de-ch': 'Neue Spalte {index:number}',
    'pt-br': 'Nova coluna {index:number}',
    'hr-hr': 'Novi stupac {index:number}',
    nb: 'Ny kolonne {index:number}',
  },
  noHeader: {
    'en-us': '(no header)',
    'ru-ru': '(без заголовка)',
    'es-es': '(sin encabezado)',
    'fr-fr': '(sans en-tête)',
    'uk-ua': '(без заголовка)',
    'de-ch': '(keine Kopfzeile)',
    'pt-br': '(sem cabeçalho)',
    'hr-hr': '(bez zaglavlja)',
    nb: '(ingen overskrift)',
  },
  copyPlan: {
    'en-us': 'Copy plan from existing Data Set',
    'ru-ru': 'Скопировать план из существующего набора данных',
    'es-es': 'Copiar plan desde un conjunto de datos existente',
    'fr-fr': "Copier le plan à partir de l'ensemble de données existant",
    'uk-ua': 'Копіювати план з існуючого набору даних',
    'de-ch': 'Plan aus vorhandenem Datenset kopieren',
    'pt-br': 'Copiar plano de um conjunto de dados existente',
    'hr-hr': 'Kopiraj plan iz postojećeg skupa podataka',
    nb: 'Kopier plan fra eksisterende datasett',
  },
  noPlansToCopyFrom: {
    'en-us':
      'There are no plans available, please continue to create an upload plan.',
    'ru-ru':
      'Доступных тарифных планов нет, пожалуйста, продолжайте создавать план загрузки.',
    'es-es':
      'No hay planes disponibles, por favor continúe creando un plan de carga.',
    'fr-fr':
      "Aucun plan n'est disponible pour le moment. Veuillez continuer à créer un plan de téléchargement.",
    'uk-ua':
      'Немає доступних планів, будь ласка, продовжте створення плану завантаження.',
    'de-ch':
      'Es sind keine Pläne verfügbar, bitte erstellen Sie einen Upload-Plan.',
    'pt-br':
      'Não há planos disponíveis. Por favor, continue para criar um plano de upload.',
    'hr-hr': 'Nema dostupnih planova, nastavite s izradom plana prijenosa.',
    nb: 'Det finnes ingen tilgjengelige planer. Fortsett med å opprette en opplastingsplan.',
  },
  invalidTemplatePlan: {
    'en-us': 'Selected data set has no mapping. Please select a different one.',
    'ru-ru':
      'Для выбранного набора данных отсутствует сопоставление. Пожалуйста, выберите другой набор.',
    'es-es':
      'El conjunto de datos seleccionado no tiene correspondencia. Seleccione otro.',
    'fr-fr':
      "L'ensemble de données sélectionné ne possède aucun mappage. Veuillez en sélectionner un autre.",
    'uk-ua': 'Вибраний набір даних не має зіставлення. Виберіть інший.',
    'de-ch':
      'Der ausgewählte Datensatz hat keine Zuordnung. Bitte wählen Sie einen anderen aus.',
    'pt-br':
      'O conjunto de dados selecionado não possui mapeamento. Selecione outro.',
    'hr-hr': 'Odabrani skup podataka nema mapiranje. Odaberite drugi.',
    nb: 'Det valgte datasettet har ingen kartlegging. Vennligst velg et annet.',
  },
  invalidJsonFile: {
    'en-us': 'The selected file is not valid JSON.',
    'ru-ru': 'Выбранный файл не является допустимым JSON-файлом.',
    'es-es': 'El archivo seleccionado no es un JSON válido.',
    'fr-fr': "Le fichier sélectionné n'est pas un JSON valide.",
    'uk-ua': 'Вибраний файл не є дійсним JSON.',
    'de-ch': 'Die ausgewählte Datei ist kein gültiges JSON.',
    'pt-br': 'O arquivo selecionado não é um JSON válido.',
    'hr-hr': 'Odabrana datoteka nije valjani JSON.',
    nb: 'Den valgte filen er ikke gyldig JSON.',
  },
  invalidJsonFileDescription: {
    'en-us': 'Please select a valid JSON data set mapping file.',
    'ru-ru':
      'Пожалуйста, выберите допустимый файл сопоставления набора данных в формате JSON.',
    'es-es': 'Seleccione un archivo de mapeo de conjunto de datos JSON válido.',
    'fr-fr':
      'Veuillez sélectionner un fichier de mappage de données JSON valide.',
    'uk-ua': 'Будь ласка, виберіть дійсний файл зіставлення набору даних JSON.',
    'de-ch': 'Bitte wählen Sie eine gültige JSON-Datei aus.',
    'pt-br':
      'Selecione um arquivo de mapeamento de conjunto de dados JSON válido.',
    'hr-hr': 'Odaberite valjani JSON file.',
    nb: 'Velg en gyldig JSON-datasetttilordningsfil.',
  },
  disambiguationBehavior: {
    'en-us': 'Disambiguation Behavior:',
    'de-ch': 'Disambiguierungsverhalten:',
    'fr-fr': 'Comportement de désambiguïsation :',
    'hr-hr': 'Ponašanje pri razdvajanju:',
    'es-es': 'Comportamiento de desambiguación:',
    'pt-br': 'Comportamento de desambiguação:',
    'ru-ru': 'Поведение при разрешении неоднозначностей:',
    'uk-ua': 'Поведінка у визначенні неоднозначностей:',
    nb: 'Flertydighetsatferd:',
  },
  ask: {
    'en-us': 'Ask',
    'de-ch': 'Fragen',
    'fr-fr': 'Demander',
    'hr-hr': 'Pitajte',
    'es-es': 'Preguntar',
    'pt-br': 'Perguntar',
    'ru-ru': 'Просить',
    'uk-ua': 'Запитайте',
    nb: 'Spørre',
  },
  askDescription: {
    'en-us':
      'You will be prompted to pick a record out of all the records matched to this field.',
    'de-ch':
      'Sie werden aufgefordert, einen Datensatz aus allen Datensätzen auszuwählen, die diesem Feld zugeordnet sind.',
    'fr-fr':
      'Vous serez invité à sélectionner un enregistrement parmi tous ceux correspondant à ce champ.',
    'hr-hr':
      'Bit ćete upitani da odaberete zapis između svih zapisa koji odgovaraju ovom polju.',
    'es-es':
      'Se le pedirá que seleccione un registro de entre todos los registros que coincidan con este campo.',
    'pt-br':
      'Você será solicitado a selecionar um registro dentre todos os registros correspondentes a este campo.',
    'ru-ru':
      'Вам будет предложено выбрать запись из всех записей, соответствующих этому полю.',
    'uk-ua':
      'Вам буде запропоновано вибрати запис з усіх записів, що відповідають цьому полю.',
    nb: 'Du vil bli bedt om å velge en post blant alle postene som samsvarer med dette feltet.',
  },
  pickFirst: {
    'en-us': 'Pick first',
    'de-ch': 'Wähle zuerst',
    'fr-fr': 'Choisissez en premier',
    'hr-hr': 'Prvo odaberi',
    'es-es': 'Elige primero',
    'pt-br': 'Escolha primeiro',
    'ru-ru': 'Выберите первый',
    'uk-ua': 'Виберіть перший',
    nb: 'Velg først',
  },
  pickFirstDescription: {
    'en-us':
      'When multiple records are matched to this field, the first record will be picked automatically.',
    'de-ch':
      'Wenn mehrere Datensätze mit diesem Feld übereinstimmen, wird automatisch der erste Datensatz ausgewählt.',
    'fr-fr':
      'Si plusieurs enregistrements correspondent à ce champ, le premier sera sélectionné automatiquement.',
    'hr-hr':
      'Kada se više zapisa podudara s ovim poljem, prvi zapis će se automatski odabrati.',
    'es-es':
      'Cuando se encuentren varios registros que coincidan con este campo, se seleccionará automáticamente el primero.',
    'pt-br':
      'Quando vários registros corresponderem a este campo, o primeiro registro será selecionado automaticamente.',
    'ru-ru':
      'Если по этому полю найдено несколько записей, первая запись будет выбрана автоматически.',
    'uk-ua':
      'Коли цьому полю відповідає кілька записів, перший запис буде вибрано автоматично.',
    nb: 'Når flere poster samsvarer med dette feltet, vil den første posten bli plukket automatisk.',
  },
} as const);
