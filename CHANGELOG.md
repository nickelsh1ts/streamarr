## [1.8.0](https://github.com/nickelsh1ts/streamarr/compare/v1.7.0...v1.8.0) (2026-06-04)

### ✨ Features

* add disk space monitoring and versions in system settings ([#338](https://github.com/nickelsh1ts/streamarr/issues/338)) ([fc4c604](https://github.com/nickelsh1ts/streamarr/commit/fc4c60415c622d470d01703654ffba8a4a562f8f))
* add trial outcome, user active, access extension, better plex invites ([#341](https://github.com/nickelsh1ts/streamarr/issues/341)) ([7147239](https://github.com/nickelsh1ts/streamarr/commit/7147239838a94a0a203a2af96600e3469acf6b9e))
* **assets:** cache-bust hand-maintained public stylesheets ([5456132](https://github.com/nickelsh1ts/streamarr/commit/54561326247fe398a1451a9a4c6d5253d8eb7d4b))
* **i18n:** add LanguagePicker to Help Centre ([#279](https://github.com/nickelsh1ts/streamarr/issues/279)) ([7770d0e](https://github.com/nickelsh1ts/streamarr/commit/7770d0e35f1473d9b8545b3f8cef40c0bf56f53b))
* **jobs:** enhance job management with running status and cancellation support ([9e130e3](https://github.com/nickelsh1ts/streamarr/commit/9e130e3c9c3bba437aa351fe68ac27116c80ca08))
* linked accounts settings and improved Plex invite and localAuth ([#329](https://github.com/nickelsh1ts/streamarr/issues/329)) ([1430b6b](https://github.com/nickelsh1ts/streamarr/commit/1430b6b78c8b38457af0a16d33e9521fdcf56800))
* **linked-accounts:** add linked accounts management ([1f2bf67](https://github.com/nickelsh1ts/streamarr/commit/1f2bf670f7a573bc378547393728f2aac8c08537))
* **notifications:** extended agent support ([#343](https://github.com/nickelsh1ts/streamarr/issues/343)) ([27852ac](https://github.com/nickelsh1ts/streamarr/commit/27852ac553e208116808429f182e955165c32d49))

### 🐛 Bug Fixes

* adjust tabs for better overflow handling ([#287](https://github.com/nickelsh1ts/streamarr/issues/287)) ([c4a05c8](https://github.com/nickelsh1ts/streamarr/commit/c4a05c895740308ce3acbeaf43394ce94e94c0e9))
* enhance FAQs animation and improve header intersection ([#286](https://github.com/nickelsh1ts/streamarr/issues/286)) ([e665537](https://github.com/nickelsh1ts/streamarr/commit/e66553751467026dba931b1f331684c54f9c14d0))
* improve Alert component layout ([#281](https://github.com/nickelsh1ts/streamarr/issues/281)) ([b22b152](https://github.com/nickelsh1ts/streamarr/commit/b22b152b62a4f1d13afd362d3c656fc550c1c0e0))
* improve condition for displaying progress in RecentlyWatched ([#285](https://github.com/nickelsh1ts/streamarr/issues/285)) ([10203fd](https://github.com/nickelsh1ts/streamarr/commit/10203fd093df4c5da9245b788323b7951cff5aef))
* improve revalidation on localAuth ([cf69a09](https://github.com/nickelsh1ts/streamarr/commit/cf69a0989b37ffa539a8329c919213bd03b76c25))
* **onboarding:** prevent onboarding starting on signup prematurely ([#335](https://github.com/nickelsh1ts/streamarr/issues/335)) ([5e980a0](https://github.com/nickelsh1ts/streamarr/commit/5e980a0226dedffbd3d653722eb5cf115ef216c9))
* **python:** improve plex invite auto-accept with server matching ([9f11f66](https://github.com/nickelsh1ts/streamarr/commit/9f11f669fee86b0e1de92b3cf23d289524ca57ff))
* reduce excessive logging in service proxy registration ([#282](https://github.com/nickelsh1ts/streamarr/issues/282)) ([b318c74](https://github.com/nickelsh1ts/streamarr/commit/b318c74f3cf7f49ba04f60c1d3a55de604083f53))
* **theme:** support oklch colors and scope iframe theme injection ([b1b25ef](https://github.com/nickelsh1ts/streamarr/commit/b1b25ef485cecb8f9613c6526714a3c304c97cbe))
* update BackButton styling to ensure consistency ([#280](https://github.com/nickelsh1ts/streamarr/issues/280)) ([6b870a6](https://github.com/nickelsh1ts/streamarr/commit/6b870a64bb66289f512021e5b6ef5b26aeeef088))
* **websocket:** upgrade dispatcher & guarded Next.js HMR ([#348](https://github.com/nickelsh1ts/streamarr/issues/348)) ([316402a](https://github.com/nickelsh1ts/streamarr/commit/316402a864263242ff5af8421ec08298713c4530))

### 📚 Documentation

* note iframe theming and stylesheet cache-busting conventions ([4622f3b](https://github.com/nickelsh1ts/streamarr/commit/4622f3b023b0b5068479f940db86c2022782e82f))

### ♻️ Refactoring

* **stats:** rename tautulli stats to activity and rebuild route ([#337](https://github.com/nickelsh1ts/streamarr/issues/337)) ([6161d11](https://github.com/nickelsh1ts/streamarr/commit/6161d11295a231513dd2795d40c9dd06936243b2))
* **ui:** migrate component classes to daisyui v5 ([e371cb2](https://github.com/nickelsh1ts/streamarr/commit/e371cb2e3830bd88f0009bdd74dbb2ef2b990495))

### 📦 Build System

* **deps:** upgrade to tailwind css v4 and daisyui v5 ([71fa7e5](https://github.com/nickelsh1ts/streamarr/commit/71fa7e5da1425831434250b4bf08687c19958a83))
* **node:** update node.js runtime to v24 ([#333](https://github.com/nickelsh1ts/streamarr/issues/333)) ([6637453](https://github.com/nickelsh1ts/streamarr/commit/66374531c4bc5fc7268295d4784f79f3dbfa9853))

### 🤖 CI/CD

* **deps-dev:** bump eslint-config-next from 16.2.3 to 16.2.6 ([#224](https://github.com/nickelsh1ts/streamarr/issues/224)) ([4475811](https://github.com/nickelsh1ts/streamarr/commit/44758118a7254d92a03b980e38b31a1816a68fd6))
* **deps-dev:** bump typescript from 6.0.2 to 6.0.3 ([#225](https://github.com/nickelsh1ts/streamarr/issues/225)) ([b7843df](https://github.com/nickelsh1ts/streamarr/commit/b7843df5a043b48594150a773acb01dce071665f))
* **deps:** bump @babel/plugin-transform-modules-systemjs ([#238](https://github.com/nickelsh1ts/streamarr/issues/238)) ([e09179f](https://github.com/nickelsh1ts/streamarr/commit/e09179fc5c5ed553f0a5776db56b8e8231d6d7cd))
* **deps:** bump next in the npm_and_yarn group across 1 directory ([#284](https://github.com/nickelsh1ts/streamarr/issues/284)) ([706e4cf](https://github.com/nickelsh1ts/streamarr/commit/706e4cf42ab881e473516e09679bd04ae092c100))
* **deps:** bump node from 25-alpine to 26-alpine ([#239](https://github.com/nickelsh1ts/streamarr/issues/239)) ([1a4d486](https://github.com/nickelsh1ts/streamarr/commit/1a4d48677efa205ee81ef97044d54a924437bd74))
* **deps:** bump systeminformation from 5.31.5 to 5.31.6 ([#288](https://github.com/nickelsh1ts/streamarr/issues/288)) ([f6de0f6](https://github.com/nickelsh1ts/streamarr/commit/f6de0f6d3a7d3d4973c46f00629d4cd31461ca9a))

## [1.7.0](https://github.com/nickelsh1ts/streamarr/compare/v1.6.0...v1.7.0) (2026-05-12)

### ✨ Features

* **avatarproxy:** add server-side avatar caching and proxy ([#255](https://github.com/nickelsh1ts/streamarr/issues/255)) ([0cbf34e](https://github.com/nickelsh1ts/streamarr/commit/0cbf34e752ef927abb764ff943d2c0f2ab6a73de))
* **i18n:** add server-side i18n infrastructure and localise notifications ([#250](https://github.com/nickelsh1ts/streamarr/issues/250)) ([0accca3](https://github.com/nickelsh1ts/streamarr/commit/0accca36f950384fd0db9242d477287d22d839e7))
* **network:** add network settings with request timeout and robust URL/host validation ([#248](https://github.com/nickelsh1ts/streamarr/issues/248)) ([baa95cf](https://github.com/nickelsh1ts/streamarr/commit/baa95cf4e9dc5b19c3e42f3454192bbd5acc424a))

### 🐛 Bug Fixes

* **auth:** disable user revalidation on auth pages ([#246](https://github.com/nickelsh1ts/streamarr/issues/246)) ([8a27c85](https://github.com/nickelsh1ts/streamarr/commit/8a27c8560d2bc47a0d282b5ba950f29c9c53d207))
* **auth:** handle login boundary whitespace safely ([#262](https://github.com/nickelsh1ts/streamarr/issues/262)) ([d65735e](https://github.com/nickelsh1ts/streamarr/commit/d65735ea9434003b6c8136bd954c463df52394a4))
* **auth:** resolve Plex OAuth client ID mismatch ([#240](https://github.com/nickelsh1ts/streamarr/issues/240)) ([b694317](https://github.com/nickelsh1ts/streamarr/commit/b694317065777e48aa9d5b3d0c48a7ae2df096eb))
* **email:** preserve multiline PGP keys and allow non-TLD validation ([#244](https://github.com/nickelsh1ts/streamarr/issues/244)) ([cdd8c4e](https://github.com/nickelsh1ts/streamarr/commit/cdd8c4e9d6bd88bc50fb4c4a3249155d78df4702))
* **i18n:** align client messages with updated locale punctuation ([c733304](https://github.com/nickelsh1ts/streamarr/commit/c7333047bf12780d6165528f2fae8d4d58fd5b92))
* **plex:** harden OAuth polling and add image proxy path validation ([#243](https://github.com/nickelsh1ts/streamarr/issues/243)) ([2360075](https://github.com/nickelsh1ts/streamarr/commit/2360075b4db562c433713c065dcf8d257981bcac))
* **security:** harden avatar proxy and fix push subscription transaction ([#272](https://github.com/nickelsh1ts/streamarr/issues/272)) ([ef2b575](https://github.com/nickelsh1ts/streamarr/commit/ef2b57537e6cb5495361becc85f274b0bf0a6159))
* **settings:** prevent partial overwrite when merging & await notifications ([#241](https://github.com/nickelsh1ts/streamarr/issues/241)) ([268d8de](https://github.com/nickelsh1ts/streamarr/commit/268d8decd12b274ea5e02784ac278798b844ec09))
* **webpush:** add dataDevices to verifyWebPush useEffect deps ([#254](https://github.com/nickelsh1ts/streamarr/issues/254)) ([45c50d0](https://github.com/nickelsh1ts/streamarr/commit/45c50d0c72352b15db0f2af3e41ddbf2f84e9125))
* **webpush:** improve subscription endpoint cleanup and disable flow ([#242](https://github.com/nickelsh1ts/streamarr/issues/242)) ([1132bee](https://github.com/nickelsh1ts/streamarr/commit/1132beec414a8ae0f4699e0332a6b8fb44056041))

### ⚡ Performance

* **db:** add indexes on foreign key columns ([#251](https://github.com/nickelsh1ts/streamarr/issues/251)) ([3366939](https://github.com/nickelsh1ts/streamarr/commit/3366939ca84d47a42ca4ebdae8519d345e751272))
* **frontend:** use lodash sub-path imports for tree-shaking ([#252](https://github.com/nickelsh1ts/streamarr/issues/252)) ([7917227](https://github.com/nickelsh1ts/streamarr/commit/7917227e04021009967425b57cc5da86c292e501))

### 📚 Documentation

* **i18n:** add weblate translation docs ([#264](https://github.com/nickelsh1ts/streamarr/issues/264)) ([79face2](https://github.com/nickelsh1ts/streamarr/commit/79face2877b7602b0117a728c2247bd522b70b10))
* **security:** add fail2ban guide for auth hardening ([#263](https://github.com/nickelsh1ts/streamarr/issues/263)) ([8f923d6](https://github.com/nickelsh1ts/streamarr/commit/8f923d68f0acf238712ba1900f644250689e6c51))

### 🤖 CI/CD

* **deps:** bump fast-uri in the npm_and_yarn group across 1 directory ([#237](https://github.com/nickelsh1ts/streamarr/issues/237)) ([791bfe8](https://github.com/nickelsh1ts/streamarr/commit/791bfe8ef0d301687b7edc4caa0c5d717779f37c))

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
