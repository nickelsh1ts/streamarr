## [1.6.0](https://github.com/nickelsh1ts/streamarr/compare/v1.5.0...v1.6.0) (2026-05-08)

### ✨ Features

* add live tv menu item with per user access ([#233](https://github.com/nickelsh1ts/streamarr/issues/233)) ([bbdc87d](https://github.com/nickelsh1ts/streamarr/commit/bbdc87d57cf7a03a3652f289e6034db0ae04d00c))
* add Plex image cache support in settings and image proxy ([04e2229](https://github.com/nickelsh1ts/streamarr/commit/04e22295c2ce4d3bd269c7fadaa2adb752c0f5df))
* Add Recently Watched and Recent Request components; enhance Recent Notification and Invite with in-view loading and consistent styling; Improve loading state of userProfile components ([e712c0a](https://github.com/nickelsh1ts/streamarr/commit/e712c0a76175e8fa2ea7206f0dcb1e15d2250304))
* enhance Seerr & Tautulli APIs with user requests and watch history ([9207f8c](https://github.com/nickelsh1ts/streamarr/commit/9207f8c4d812c23f73755165a0deb4291f692d4c))
* profile enhancements with seerr, plex, tautulli and image proxy integrations ([#229](https://github.com/nickelsh1ts/streamarr/issues/229)) ([b1ebcbb](https://github.com/nickelsh1ts/streamarr/commit/b1ebcbbd047a5cafdf0fdd68becce1fbcfd35db3))

### 🐛 Bug Fixes

* **actions:** updated label to correct format ([#219](https://github.com/nickelsh1ts/streamarr/issues/219)) ([10d135e](https://github.com/nickelsh1ts/streamarr/commit/10d135e336182e410638ffda77c78765df29ce2d))
* add optional summary field to PlexMetadata and improve error handling in getMetadata ([e34e8f7](https://github.com/nickelsh1ts/streamarr/commit/e34e8f7170a1775c1bbaae0c2de0765f3f9d7819))
* enable iframe URL handling and support for query strings ([#231](https://github.com/nickelsh1ts/streamarr/issues/231)) ([5259524](https://github.com/nickelsh1ts/streamarr/commit/5259524e5ed389ec3358f9fa3265a8c783fd6497))
* enhance Plex API error handling and improve plex deleted detection and poster recovery ([#232](https://github.com/nickelsh1ts/streamarr/issues/232)) ([b5f1b7f](https://github.com/nickelsh1ts/streamarr/commit/b5f1b7f986492efa9718fcfffb126d574201a7c0))
* enhance Request component to include search parameters in URL handling ([b67a765](https://github.com/nickelsh1ts/streamarr/commit/b67a76560bcbde24b82cffb15cf1d6a10413dcef))
* enhance useClickOutside hook with generic type and consistent event listener removal ([39d216e](https://github.com/nickelsh1ts/streamarr/commit/39d216e4432d420e1d83dcfa1ec06e8c9869ba07))
* ignore scripts missing from dockerfile & cypress ([b0679da](https://github.com/nickelsh1ts/streamarr/commit/b0679da095fd07b89e9d6e65c1e9d17f89737884))
* improved plex token retrieval & image proxy validation ([#235](https://github.com/nickelsh1ts/streamarr/issues/235)) ([f16bf9e](https://github.com/nickelsh1ts/streamarr/commit/f16bf9ef250655b71923b1c3eab564fe7e979061))
* update excluded colors to new naming conventions ([#220](https://github.com/nickelsh1ts/streamarr/issues/220)) ([6ab4f3c](https://github.com/nickelsh1ts/streamarr/commit/6ab4f3c23b30015d2aa66dcbded43298371f25eb))

### ♻️ Refactoring

* replace legacy plex-api with external api ([#227](https://github.com/nickelsh1ts/streamarr/issues/227)) ([1b0fa7e](https://github.com/nickelsh1ts/streamarr/commit/1b0fa7e52e2b2da0316e961295c74d664483d206))
* replace legacy plex-api with internally built using external api ([3d9eb1b](https://github.com/nickelsh1ts/streamarr/commit/3d9eb1bc86851ae3a6e2626ad1d1c9a83298620b))

### 📦 Build System

* **deps:** bump node from `ad82eca` to `bdf2cca` ([#216](https://github.com/nickelsh1ts/streamarr/issues/216)) ([d5b3bdb](https://github.com/nickelsh1ts/streamarr/commit/d5b3bdbf79a81553edce39338e91390de9a31ce4))
* **deps:** bump the npm_and_yarn group across 1 directory with 6 updates ([#211](https://github.com/nickelsh1ts/streamarr/issues/211)) ([dbeaaaf](https://github.com/nickelsh1ts/streamarr/commit/dbeaaaf4cc8d735892df926e2b58288e59ef721c))
* migrate from yarn to pnpm ([#226](https://github.com/nickelsh1ts/streamarr/issues/226)) ([8f1d60e](https://github.com/nickelsh1ts/streamarr/commit/8f1d60e5ffd82fab2d18eb0ef03279e20b98ddf7))

### 🤖 CI/CD

* **deps-dev:** bump postcss in the npm_and_yarn group across 1 directory ([#217](https://github.com/nickelsh1ts/streamarr/issues/217)) ([9fcacd2](https://github.com/nickelsh1ts/streamarr/commit/9fcacd2697ad3bbbf1854198b20e644361b7fddc))
* **deps:** bump axios from 1.15.0 to 1.15.2 ([#221](https://github.com/nickelsh1ts/streamarr/issues/221)) ([3e58889](https://github.com/nickelsh1ts/streamarr/commit/3e5888955c404aa2ba9a82a6437cbcb4af7f3465))
* **deps:** bump the github-actions group across 1 directory with 5 updates ([#230](https://github.com/nickelsh1ts/streamarr/issues/230)) ([6ca022d](https://github.com/nickelsh1ts/streamarr/commit/6ca022d4425c2b69d3e4eade44e5f3ffcb5a6103))
* **deps:** bump the github-actions group with 2 updates ([#215](https://github.com/nickelsh1ts/streamarr/issues/215)) ([a1b71ca](https://github.com/nickelsh1ts/streamarr/commit/a1b71ca06f7396ab93cf359654baec614cdb3f93))

## [1.5.0](https://github.com/nickelsh1ts/streamarr/compare/v1.4.0...v1.5.0) (2026-04-15)

### ✨ Features

* Enhanced help centre & home page with improved calendar caching ([#191](https://github.com/nickelsh1ts/streamarr/issues/191)) ([3471e24](https://github.com/nickelsh1ts/streamarr/commit/3471e2464b2abf9ffcc31c2ab96f10349fa7cb57))
* implement Plex health check and library revalidation functionality ([#190](https://github.com/nickelsh1ts/streamarr/issues/190)) ([7732193](https://github.com/nickelsh1ts/streamarr/commit/7732193f51eac5713692c869fdd74090526d2a56))
* updated workflows, templates, docker build and refactored changelog ([#198](https://github.com/nickelsh1ts/streamarr/issues/198)) ([a240cc5](https://github.com/nickelsh1ts/streamarr/commit/a240cc52f76b7edd628ad01fc2582ec2f8cf3075))

### 🐛 Bug Fixes

* added missing i18n for legal routes; fixed misleading redirect; untyped error message ([0076244](https://github.com/nickelsh1ts/streamarr/commit/0076244a24d7566d562bde51aeae2e183b3e70b0))
* moved metadata for legal to layouts for server rendering; added missing package permission ([032d0f8](https://github.com/nickelsh1ts/streamarr/commit/032d0f861aad8493cc85f9b7fb663659304ea580))
* release workflow bug ([#188](https://github.com/nickelsh1ts/streamarr/issues/188)) ([06f3c34](https://github.com/nickelsh1ts/streamarr/commit/06f3c34e2a90ae97bb08d32b1673850a4df2fcf7))
* update release workflow for concurrency, permissions, and semantic-release action version ([4b28847](https://github.com/nickelsh1ts/streamarr/commit/4b28847d859bf4ff37aef20fbc6cb86b4cbeb5e6))
* updated api spec and security improvements ([#203](https://github.com/nickelsh1ts/streamarr/issues/203)) ([ffd9011](https://github.com/nickelsh1ts/streamarr/commit/ffd90113fbbe94ffcac58831b80d2607e15f10f7))
* updated workflow release ([3141eaa](https://github.com/nickelsh1ts/streamarr/commit/3141eaa8a018a032f977f2fea145a43e355b1108))

### 🤖 CI/CD

* **deps:** bump the github-actions group with 6 updates ([#199](https://github.com/nickelsh1ts/streamarr/issues/199)) ([75942bd](https://github.com/nickelsh1ts/streamarr/commit/75942bdeebe35e8e767a0015c3445c6289a452cf))
