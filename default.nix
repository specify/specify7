with import <nixpkgs> {};
let
  easyPS = import (pkgs.fetchFromGitHub {
    owner = "justinwoo";
    repo = "easy-purescript-nix";
    rev = "aa3e608608232f4a009b5c132ae763fdabfb4aba";
    sha256 = "0y6jikncxs9l2zgngbd1775f1zy5s1hdc5rhkyzsyaalcl5cajk8";
  }) {};
in stdenv.mkDerivation rec {
  name = "env";
  env = buildEnv { name = name; paths = buildInputs; };
  buildInputs = [
    python36
    python36Packages.virtualenv
    python36Packages.pip
    libmysqlclient
    libzip
    openssl
    openldap
    cyrus_sasl
    nodejs
    easyPS.spago
    easyPS.purs
  ];
}
