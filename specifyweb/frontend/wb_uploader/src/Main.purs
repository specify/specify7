module Main where

import Prelude

import Affjax as AX
import Affjax.ResponseFormat as ResponseFormat
import Concur.Core (Widget)
import Concur.React (HTML)
import Concur.React.DOM as D
import Concur.React.Props as P
import Concur.React.Run (runWidgetInDom)
import Concur.React.Widgets (textInputEnter)
import Control.Alt ((<|>))
import Data.Array (filter)
import Data.Either (Either(..))
import Data.Foldable (find)
import Data.Map as M
import Data.Maybe (Maybe(..), isNothing)
import Data.SpDataModel (SpDataModel, SpField, SpRelType(..), SpRelationship, SpTable, getRelatedTable)
import Data.String (split)
import Data.String.Pattern (Pattern(..))
import Data.Tuple (Tuple(..), lookup)
import Effect (Effect)
import Effect.Aff.Class (liftAff)
import Simple.JSON (readJSON)

newtype UploadTable = UploadTable
  { table :: SpTable
  , fieldDefs :: Array (Tuple String FieldSource)
  , toOneDefs :: M.Map String ToOneSource
  }

data ToOneSource = FromUploadTable UploadTable

data FieldSource = FromDataSet String | StaticValue String

newtype WBField = WBField String

wbFields :: Array WBField
wbFields = WBField <$> split (Pattern ",")
  "BMSM No.,Class,Superfamily,Family,Genus,Subgenus,Species,Subspecies,Species Author,Subspecies Author,Who ID First Name,Determiner 1 Title,Determiner 1 First Name,Determiner 1 Middle Initial,Determiner 1 Last Name,ID Date Verbatim,ID Date,ID Status,Country,State/Prov/Pref,Region,Site,Sea Basin,Continent/Ocean,Date Collected,Start Date Collected,End Date Collected,Collection Method,Verbatim Collecting method,No. of Specimens,Live?,W/Operc,Lot Description,Prep Type 1,- Paired valves,for bivalves - Single valves,Habitat,Min Depth (M),Max Depth (M),Fossil?,Stratum,Sex / Age,Lot Status,Accession No.,Original Label,Remarks,Processed by,Cataloged by,DateCataloged,Latitude1,Latitude2,Longitude1,Longitude2,Lat Long Type,Station No.,Checked by,Label Printed,Not for publication on Web,Realm,Estimated,Collected Verbatim,Collector 1 Title,Collector 1 First Name,Collector 1 Middle Initial,Collector 1 Last Name,Collector 2 Title,Collector 2 First Name,Collector 2 Middle Initial,Collector 2 Last name,Collector 3 Title,Collector 3 First Name,Collector 3 Middle Initial,Collector 3 Last Name,Collector 4 Title,Collector 4 First Name,Collector 4 Middle Initial,Collector 4 Last Name"

main :: Effect Unit
main = do
    runWidgetInDom "main" planWidget


planWidget :: forall a. Widget HTML a
planWidget = D.div' [fetchDataModel]

fetchDataModel :: forall a. Widget HTML a
fetchDataModel = do
  let url = "/context/datamodel.json"
  result <- (liftAff (AX.get ResponseFormat.string url)) <|> (D.text "Loading...")
  datamodel <- case result of
    Left err -> D.text $ "GET " <> url <> " response failed to decode: " <> AX.printError err
    Right response -> case readJSON response.body of
      Left e -> D.text $ show e
      Right (r :: SpDataModel) -> pure r
  t <- chooseTable datamodel
  editTable datamodel t $ UploadTable {table: t, fieldDefs: [], toOneDefs: M.empty}
  where
    editTable tables t ut = do
      newUt <- tableWidget tables t ut
      editTable tables t newUt

chooseTable :: SpDataModel -> Widget HTML SpTable
chooseTable tables = D.ul' $ (\t -> t <$ D.li [P.onClick] [D.text t.table]) <$> tables

tableWidget :: SpDataModel -> SpTable -> UploadTable -> Widget HTML UploadTable
tableWidget tables  spTable ut@(UploadTable {table}) =
  D.div'[ D.h4' [ D.text table.table ]
        , fieldsWidget spTable ut
        , D.h4' [D.text "Many-to-one"]
        , toOnesWidget tables spTable ut
        ]

toOnesWidget :: SpDataModel -> SpTable -> UploadTable -> Widget HTML UploadTable
toOnesWidget tables spTable ut@(UploadTable {toOneDefs}) =
  D.ul' $ (toOneWidget tables ut <$> M.toUnfoldable toOneDefs) <> [D.li' [addToOneWidget tables spTable ut]]

addToOneWidget :: SpDataModel -> SpTable -> UploadTable -> Widget HTML UploadTable
addToOneWidget tables spTable (UploadTable ut) = do
  let
    undefinedRels =
      filter (\r -> r.type == SpManyToOne && (isNothing $ M.lookup r.name ut.toOneDefs)) spTable.relationships
  selected <- selectRelWidget undefinedRels
  case getRelatedTable tables selected of
    Nothing -> D.text $ "bad relationship: " <> selected.name
    Just relatedTable -> do
      let toOneSource = FromUploadTable $ UploadTable {table: relatedTable, fieldDefs: [], toOneDefs: M.empty}
      pure $ UploadTable $ ut {toOneDefs = M.insert selected.name toOneSource ut.toOneDefs}

toOneWidget :: SpDataModel -> UploadTable -> Tuple String ToOneSource -> Widget HTML UploadTable
toOneWidget tables (UploadTable parent) (Tuple relName (FromUploadTable related@(UploadTable {table}))) = do
  related' <- D.li' [ D.h4' [ D.text $ "upload " <> relName <> " from:" ]
                    , FromUploadTable <$> tableWidget tables table related
                    ]
  pure $ UploadTable $ parent {toOneDefs = M.insert relName related' parent.toOneDefs}


selectRelWidget :: Array SpRelationship -> Widget HTML SpRelationship
selectRelWidget fields = do
  let options =
        [ D.option [] [D.text "Choose field to map"]] <>
        ((\f -> D.option [P.value f.name] [D.text f.name]) <$> fields)

  selected <- D.select [P.unsafeTargetValue <$> P.onChange] options
  case find (_.name >>> ((==) selected)) fields of
    Just field -> pure field
    Nothing -> selectRelWidget fields

fieldsWidget ::  SpTable -> UploadTable -> Widget HTML UploadTable
fieldsWidget spTable ut@(UploadTable {fieldDefs}) =
  D.ul' $ (showField <$> fieldDefs) <> [D.li' [addFieldWidget spTable ut]]
  where showField (Tuple name source) = case source of
          (FromDataSet column) -> D.li' [D.text $ name <> " from data set column: " <> column]
          (StaticValue value) -> D.li' [D.text $ name <> " from static value: " <> value]

addFieldWidget :: SpTable -> UploadTable -> Widget HTML UploadTable
addFieldWidget spTable (UploadTable ut) = do
  let unassignedFields = filter (\f -> isNothing $ lookup f.name ut.fieldDefs) spTable.fields
  selected <- selectFieldWidget unassignedFields
  fieldDef <- fieldWidget selected
  pure $ UploadTable $ ut { fieldDefs = ut.fieldDefs <> [fieldDef] }

selectFieldWidget :: Array SpField -> Widget HTML SpField
selectFieldWidget fields = do
  let options =
        [ D.option [] [D.text "Choose field to map"]] <>
        ((\f -> D.option [P.value f.name] [D.text f.name]) <$> fields)

  selected <- D.select [P.unsafeTargetValue <$> P.onChange] options
  case find (_.name >>> ((==) selected)) fields of
    Just field -> pure field
    Nothing -> selectFieldWidget fields

fieldWidget :: SpField -> Widget HTML (Tuple String FieldSource)
fieldWidget f = do
  newVal <- D.div [] [D.text f.name, wbFieldWidget]
  pure $ Tuple f.name newVal

wbFieldWidget :: Widget HTML FieldSource
wbFieldWidget = do
  selected <- D.select [P.unsafeTargetValue <$> P.onChange] $ options
  case selected of
    "" -> StaticValue <$> textInputEnter "" false []
    wbField -> pure $ FromDataSet wbField

  where options =
          [ D.option [] [D.text "Choose source for field"]
          , D.option [P.value ""] [D.text "Static value"]
          ] <> ((\(WBField f) -> D.option [P.value f] [D.text f]) <$> wbFields)
