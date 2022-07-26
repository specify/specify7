with import <nixpkgs> {};
stdenv.mkDerivation rec {
  name = "env";
  env = buildEnv { name = name; paths = buildInputs; };
  buildInputs = [
    python38
    python38Packages.virtualenv
    python38Packages.pip
    libmysqlclient
    libzip
    openssl
    openldap
    cyrus_sasl
    gettext
    nodejs
  ];
}
