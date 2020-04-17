module Data.SpDataModel
       ( SpDataModel
       , SpTable
       , SpRelationship
       , SpField
       , SpRelType(..)
       , SpFieldType(..)
       , getTableByName
       , getFieldByName
       , getRelationshipByName
       , getRelatedTable
       ) where

import Prelude

import Data.Array (find)
import Data.Generic.Rep (class Generic)
import Data.Generic.Rep.Show (genericShow)
import Data.Maybe (Maybe)
import Data.String (toLower)
import Foreign (Foreign, F, ForeignError(..), readString, fail)
import Simple.JSON (class ReadForeign)

type SpTable =
  { classname :: String
  , table :: String
  , tableId :: Int
  , view :: Maybe String
  , searchDialog :: Maybe String
  , system :: Boolean
  , idColumn :: String
  , idFieldName :: String
  , fields :: Array SpField
  , relationships :: Array SpRelationship
  }

data SpFieldType
  = SpString
  | SpText
  | SpBoolean
  | SpInteger
  | SpByte
  | SpShort
  | SpLong
  | SpCalendar
  | SpDate
  | SpTimeStamp
  | SpFloat
  | SpDouble
  | SpDecimal

derive instance genericSpFieldTye :: Generic SpFieldType _

instance showSpFieldType :: Show SpFieldType where
  show = genericShow

instance spFieldTypeReadForeign :: ReadForeign SpFieldType where
    readImpl :: Foreign -> F SpFieldType
    readImpl f = readString f >>=
      case _ of
        "java.lang.String" -> pure SpString
        "text" -> pure SpText
        "java.util.Calendar" -> pure SpCalendar
        "java.util.Date" -> pure SpDate
        "java.sql.Timestamp" -> pure SpTimeStamp
        "java.lang.Boolean" -> pure SpBoolean
        "java.lang.Integer" -> pure SpInteger
        "java.lang.Byte" -> pure SpByte
        "java.lang.Short" -> pure SpShort
        "java.lang.Long" -> pure SpLong
        "java.lang.Float" -> pure SpFloat
        "java.lang.Double" -> pure SpDouble
        "java.math.BigDecimal" -> pure SpDecimal
        s -> fail $ ForeignError $ "bad field type: " <> s

type SpField =
  { name :: String
  , column :: String
  , indexed :: Boolean
  , unique :: Boolean
  , required :: Boolean
  , type :: SpFieldType
  , length :: Maybe Int
  }

data SpRelType
  = SpManyToOne
  | SpOneToMany
  | SpOneToOne
  | SpManyToMany
  | SpZeroToOne

derive instance eqSpRelType :: Eq SpRelType
derive instance genericSpRelTye :: Generic SpRelType _

instance showSpRelType :: Show SpRelType where
  show = genericShow

instance spRelTypeReadForeign :: ReadForeign SpRelType where
    readImpl :: Foreign -> F SpRelType
    readImpl f = readString f >>=
      case _ of
        "many-to-one" -> pure SpManyToOne
        "one-to-many" -> pure SpOneToMany
        "one-to-one" -> pure SpOneToOne
        "many-to-many" -> pure SpManyToMany
        "zero-to-one" -> pure SpZeroToOne
        s -> fail $ ForeignError $ "bad relationship type: " <> s


type SpRelationship =
  { name :: String
  , type :: SpRelType
  , required :: Boolean
  , dependent :: Boolean
  , relatedModelName :: String
  , otherSideName :: Maybe String
  }

type SpDataModel = Array SpTable

getTableByName :: SpDataModel -> String -> Maybe SpTable
getTableByName tables name = find (_.table >>> toLower >>> ((==) $ toLower name)) tables

getFieldByName :: SpTable -> String -> Maybe SpField
getFieldByName {fields} fieldName = find (_.name >>> toLower >>> ((==) $ toLower fieldName)) fields

getRelationshipByName :: SpTable -> String -> Maybe SpRelationship
getRelationshipByName {relationships} relName = find (_.name >>> toLower >>> ((==) $ toLower relName)) relationships

getRelatedTable :: SpDataModel -> SpRelationship -> Maybe SpTable
getRelatedTable tables rel = getTableByName tables rel.relatedModelName
