with import <nixpkgs> {};
stdenv.mkDerivation rec {
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
    gettext
    nodejs
  ];
}
