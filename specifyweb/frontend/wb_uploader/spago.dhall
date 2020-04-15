{-
Welcome to a Spago project!
You can edit this file as you like.
-}

{ name =
    "purescript-concur-react-examples"
, dependencies =
    [ "affjax", "argonaut", "concur-core", "concur-react", "routing", "simple-json", "generics-rep" ]
, sources =
    [ "src/**/*.purs" ]
, packages =
    ./packages.dhall
}
