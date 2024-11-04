{
  # Override nixpkgs to use the latest set of node packages
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/master";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    { nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = import nixpkgs { inherit system; };
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            onefetch

            nodejs_22
            nodejs.pkgs.pnpm

            nodePackages.typescript
            nodePackages.typescript-language-server
          ];
          shellHook = ''
            onefetch --number-of-authors 5
          '';
        };
      }
    );
}
