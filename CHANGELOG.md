# [1.4.0](https://github.com/nickelsh1ts/streamarr/compare/v1.3.0...v1.4.0) (2026-03-23)


### Bug Fixes

* add 'incomplete' status to TorrentStatus schema and update filter query ([29f8fb0](https://github.com/nickelsh1ts/streamarr/commit/29f8fb05d33f9e7ea90ba8b24de1d8c6da9d14a2))
* add React type imports, add resetDismiss for delete failure recovery ([e4f69b6](https://github.com/nickelsh1ts/streamarr/commit/e4f69b60a93c3d71ccbcfdb2a3b059156e7f54a2))
* added missing enabled flag ([a01ed65](https://github.com/nickelsh1ts/streamarr/commit/a01ed654fe571873093e24bd2cc57215af9c174f))
* adjust margin for Page class and clean up hover styles ([78d8c3b](https://github.com/nickelsh1ts/streamarr/commit/78d8c3bf814875c400072babea795eef7f9651ab))
* adjust swipe gesture details ([8f0de08](https://github.com/nickelsh1ts/streamarr/commit/8f0de08bf53dfba9f41def84c6e78ceafd0c93df))
* await onDelete in non-touch dropdown handler to prevent unhandled rejections ([0e49e1f](https://github.com/nickelsh1ts/streamarr/commit/0e49e1f53dcf77c071c033b212f41882396fcfcc))
* broken array status for discord message ([be0ce70](https://github.com/nickelsh1ts/streamarr/commit/be0ce7063c844dc22fe1f718f4d6e0540454005d))
* broken array status for release notification ([8dc657f](https://github.com/nickelsh1ts/streamarr/commit/8dc657f8c1ce17e8fb8389a9f6ef1f26e332f90f))
* constrain resolution versions ([4707acf](https://github.com/nickelsh1ts/streamarr/commit/4707acf6ee5d5799ece366ead363a698abc9f567))
* correct CSS selector; return libraries without count; added error handling to releases endpoint; removed incorrect error throw ([e93d19b](https://github.com/nickelsh1ts/streamarr/commit/e93d19b05ccf7deb6861b63dfca7d6d9e8dcfc07))
* **deps:** update ajv and related dependencies for compatibility ([e496401](https://github.com/nickelsh1ts/streamarr/commit/e496401324d50ec281730275c7fb56cbedb4abd7))
* **deps:** update undici dependency and add resolutions for compatibility ([3401184](https://github.com/nickelsh1ts/streamarr/commit/34011841890d2fcb7365313bd035664b37dafe2f))
* formatting ([5952499](https://github.com/nickelsh1ts/streamarr/commit/5952499de6d744566e454ddb5967eb65eee11c98))
* gate /api/v1/libraries endpoint by libraryCounts setting ([6be4c1e](https://github.com/nickelsh1ts/streamarr/commit/6be4c1e23fd84f18102afb0b1fb0c6e60c319b23))
* incorrect ajv dep version ([2627806](https://github.com/nickelsh1ts/streamarr/commit/2627806002cd797a027b5bc55193d3e3e253d0a7))
* minor code and bug fixes from review ([#187](https://github.com/nickelsh1ts/streamarr/issues/187)) ([47bb4a1](https://github.com/nickelsh1ts/streamarr/commit/47bb4a1dc6f466bdce22bedf81b233c1a0e6282c))
* optimize tag management by batch-fetching labels and applying changes in parallel ([e4f7cfe](https://github.com/nickelsh1ts/streamarr/commit/e4f7cfe6ad4557908548f0eb2cbcf6fbcd013e77))
* reset transient state in TorrentDetailsModal on close or torrent change; added aria-label ([65aeb31](https://github.com/nickelsh1ts/streamarr/commit/65aeb31786152d4ffcbec4a617a2ad56ecf464c0))
* update yarn.lock for resolution changes ([12d4b95](https://github.com/nickelsh1ts/streamarr/commit/12d4b951d231d9f319f0cf8af59e86dd4328d6a4))
* validate clientId in download routes to prevent errors ([9224a30](https://github.com/nickelsh1ts/streamarr/commit/9224a300a16807f1569dc2fd175cce3762a8f25b))


### Features

* add comprehensive Cypress tests for API, authentication, navigation, and UI components ([1be663b](https://github.com/nickelsh1ts/streamarr/commit/1be663b2e9b0225e404ebd64f9a07840f42b0a9e))
* add GitHub releases endpoint and integrate with settings reducing api calls ([#170](https://github.com/nickelsh1ts/streamarr/issues/170)) ([2ace21e](https://github.com/nickelsh1ts/streamarr/commit/2ace21ef102fa4f9aa547267761fc5eeb6d7581d))
* add library counts option to settings and UI components ([a46e8e2](https://github.com/nickelsh1ts/streamarr/commit/a46e8e2e5c6666dec1bc1db191a89add7abc0bd6))
* add playlist support and pivot options in Plex settings ([136425b](https://github.com/nickelsh1ts/streamarr/commit/136425bcb24665f9353e9c61318cba5abdc493f3))
* added library count toggle setting for homepage ([#172](https://github.com/nickelsh1ts/streamarr/issues/172)) ([0f483a1](https://github.com/nickelsh1ts/streamarr/commit/0f483a19afa392f189c5fc98b0e8735002ec67b4))
* download tag management ([#185](https://github.com/nickelsh1ts/streamarr/issues/185)) ([6af66c3](https://github.com/nickelsh1ts/streamarr/commit/6af66c34b6e94398d975714cfc1cd26b3983b398))
* implement swipe-to-dismiss functionality for notifications ([5fba853](https://github.com/nickelsh1ts/streamarr/commit/5fba853674609579764b3fea73579afba59dd5a3))
* implement swipe-to-dismiss functionality for notifications ([#171](https://github.com/nickelsh1ts/streamarr/issues/171)) ([f16211e](https://github.com/nickelsh1ts/streamarr/commit/f16211eb274e544eabdff36089818273ce1ccf17))
* implement tag management functionality; extend numberHelper and it's use; added inactive downloads filter ([707d3f0](https://github.com/nickelsh1ts/streamarr/commit/707d3f0b99b0b43e9fd341ad83bccc9ded0dd3d3))
* plex playlists and pivot options ([#169](https://github.com/nickelsh1ts/streamarr/issues/169)) ([b0e25ac](https://github.com/nickelsh1ts/streamarr/commit/b0e25acb4b5dd24111f5705c54892f34f7bd28a8))
* updated cypress test suite ([#184](https://github.com/nickelsh1ts/streamarr/issues/184)) ([24c16fc](https://github.com/nickelsh1ts/streamarr/commit/24c16fcfcd66001bb0a1b04374f01eac9653aebe))

# [1.3.0](https://github.com/nickelsh1ts/streamarr/compare/v1.2.1...v1.3.0) (2026-02-20)


### Bug Fixes

* add error handling for Plex API operations and optimize UserSubscriber logic ([#148](https://github.com/nickelsh1ts/streamarr/issues/148)) ([344ac8e](https://github.com/nickelsh1ts/streamarr/commit/344ac8e9b6ec8591edec6e64fc8fe5ec4e77141f))
* add inviteCountRedeemed and InvitedBy to profile and update invite counting logic ([c4224ec](https://github.com/nickelsh1ts/streamarr/commit/c4224ecf14d167424e439167f20e56462f455c44))
* added cache check to image jobs ([593ce4e](https://github.com/nickelsh1ts/streamarr/commit/593ce4e611c5e647a91aba6867679caa97d8c904))
* address PR review comments for onboarding feature ([06dbfc4](https://github.com/nickelsh1ts/streamarr/commit/06dbfc4b605542547c73fe2f3a68330cb7305cb2))
* address security and consistency issues in onboarding feature ([#153](https://github.com/nickelsh1ts/streamarr/issues/153)) ([495d2a2](https://github.com/nickelsh1ts/streamarr/commit/495d2a25311a72545c4cc60419b043986d6285c0))
* adjust alignment of alert icon in Alert component ([ceb8ea1](https://github.com/nickelsh1ts/streamarr/commit/ceb8ea157407e81383fb83e3d6ee37f15df2594a))
* **i18n:** refactored dynamic formatMessage ids to dynamic render ([8960e52](https://github.com/nickelsh1ts/streamarr/commit/8960e52f64d12bb7edef6efbb2b0f88248864d02))
* implement caching for Plex metadata retrieval and flush cache after scan ([48091d6](https://github.com/nickelsh1ts/streamarr/commit/48091d670e94b3e055c2e1d38581bd5a652beb46))
* Improve error handling in getStatus method for Plex API ([4a7413b](https://github.com/nickelsh1ts/streamarr/commit/4a7413b8a3d51891095efae5d79935950af56f17))
* improve error handling in UserSubscriber and plex_invite.py ([af5a93c](https://github.com/nickelsh1ts/streamarr/commit/af5a93cd4804babc9a939f78be26cc341adb6108))
* minor style fix ([c02d036](https://github.com/nickelsh1ts/streamarr/commit/c02d03638997fe0875e733267f9473b68095d3ad))
* moved RestartRequiredAlert for Radarr and Sonarr services into layout ([2ec4671](https://github.com/nickelsh1ts/streamarr/commit/2ec4671319286669420595d9b6b9caf0866fbb68))
* optimize expired invites handling ([69ade20](https://github.com/nickelsh1ts/streamarr/commit/69ade20d5f66629b3c05a99676cf65baaf132884))
* preserve root slash in client-side normalization ([74f6841](https://github.com/nickelsh1ts/streamarr/commit/74f6841958196fa3b592e28dc0c7a8d857340ab2))
* Resolve issue preventing server admin/owner from pinning libraries ([37f1fb3](https://github.com/nickelsh1ts/streamarr/commit/37f1fb3906cdfddd3f7f641320af55c847e21571))
* return normalized path and add client-side normalization ([be2a0ed](https://github.com/nickelsh1ts/streamarr/commit/be2a0edb935d231a6e5059d719debca50a73e160))
* unsafe type casts on partial users ([75ec9f1](https://github.com/nickelsh1ts/streamarr/commit/75ec9f18c3dae0417dcd8162f208c56a0890ed14))
* update gunicorn command with PID and control socket options ([dd3103a](https://github.com/nickelsh1ts/streamarr/commit/dd3103ac6dcb5841cabd3757fb9d16c3a7854572))
* Update PID file path for Python service to use dynamic resolution ([9c1a8b7](https://github.com/nickelsh1ts/streamarr/commit/9c1a8b74967c31580abccbfeda97e3c9e9e2d242))
* Update process spawning logic to satisfy no shell injection ([e713941](https://github.com/nickelsh1ts/streamarr/commit/e7139419f224bda28d5f183cc7a2523b5b1dcb95))
* Update Python service management and improve process handling ([c03b494](https://github.com/nickelsh1ts/streamarr/commit/c03b494ac3a613bcdf77f24e1e9d4e6ecb90f636))
* update warning message to reflect BETA status and remove Discord support link ([5e94241](https://github.com/nickelsh1ts/streamarr/commit/5e94241a36e09afe6341883587d528dffafe03b1))


### Features

* add connection testing on initial load for download client instances ([0b6b202](https://github.com/nickelsh1ts/streamarr/commit/0b6b202b283cbc04d34ebdfc25fb5af48c3a03eb))
* add GitHub Actions workflow for deploying API documentation ([afd365b](https://github.com/nickelsh1ts/streamarr/commit/afd365b2a0ae728b285c0d097c88da58a3c7c86e))
* add loading state for cache data in JobsCacheSettings and improve event loading in Schedule ([37f670e](https://github.com/nickelsh1ts/streamarr/commit/37f670ed3158b938c6a3e8aaf7062d414b61ebad))
* added services to setup & plex api fixes & service proxy error handling ([#147](https://github.com/nickelsh1ts/streamarr/issues/147)) ([a1a8cb4](https://github.com/nickelsh1ts/streamarr/commit/a1a8cb4702cc86384b5a2b3000e96a7019618f34))
* backend implementation for user onboarding ([d0d5537](https://github.com/nickelsh1ts/streamarr/commit/d0d55372903c0e735b708bca129ba45fc14ec8bf))
* **ConfirmButton:** allow onClick to return a promise and manage loading state ([28f89f9](https://github.com/nickelsh1ts/streamarr/commit/28f89f926dcb9136550614c5b819d85a1d766245))
* Enhance service error handling and loading states with custom components ([bbd2f4a](https://github.com/nickelsh1ts/streamarr/commit/bbd2f4aa0b10cc9d84327cc0bf81300bcb3f714f))
* enhance setup process by adding support for additional services and style fixes for steps ([4c8a6a6](https://github.com/nickelsh1ts/streamarr/commit/4c8a6a6969ec6a26cb0da279a96d9b6a66d57e0d))
* enhance user settings and Plex integration ([497e657](https://github.com/nickelsh1ts/streamarr/commit/497e657eb8f0aecc4ad12a45ad2e7a3856712d0b))
* expanded onboarding process to admin first time setup ([f79256b](https://github.com/nickelsh1ts/streamarr/commit/f79256b36b356a1e990067086dd292d38f99f019))
* Implement Python service health check and restart functionality & refactored about to system / added health section ([bf33380](https://github.com/nickelsh1ts/streamarr/commit/bf33380c1bf698ee133448c5c9f521b2fa50b6b5))
* implement server restart functionality with alert and modal support ([621f4d9](https://github.com/nickelsh1ts/streamarr/commit/621f4d9d33ca27a463b8aaad0485381ad9838eb8))
* improve loading state handling in InviteList and InviteModal components ([ed3abec](https://github.com/nickelsh1ts/streamarr/commit/ed3abec6a303ee3ee86d6beba25d081eb077a7fe))
* initial docs ([709eccc](https://github.com/nickelsh1ts/streamarr/commit/709eccc42579e7d006fdc964cee98035e54114c7))
* Initial docs deploy and minor bug fixes ([#150](https://github.com/nickelsh1ts/streamarr/issues/150)) ([b36f703](https://github.com/nickelsh1ts/streamarr/commit/b36f7037ab7f0316d027523f6280a8684d0267af))
* **onboarding:** implement onboarding context, welcome modal, and tutorial slides ([896010d](https://github.com/nickelsh1ts/streamarr/commit/896010dc5d24814531f0da441d715981b0d4958c))
* update TypeScript target to ES2020 for improved compatibility ([96b4468](https://github.com/nickelsh1ts/streamarr/commit/96b44688d41b3034924a4d7b3b328910b9d0c6eb))
* user onboarding with welcome modal & interactive spotlight tutorial ([#152](https://github.com/nickelsh1ts/streamarr/issues/152)) ([7846f2a](https://github.com/nickelsh1ts/streamarr/commit/7846f2ac5fc69d5ecfaa825960b0e2e0053cefc5)), closes [#153](https://github.com/nickelsh1ts/streamarr/issues/153)


### Performance Improvements

* optimize ConfirmButton with useCallback for click outside handler ([7a77e93](https://github.com/nickelsh1ts/streamarr/commit/7a77e93634dc4d6c052a3559f557eebb1cdb632a))

## [1.2.1](https://github.com/nickelsh1ts/streamarr/compare/v1.2.0...v1.2.1) (2026-01-29)


### Bug Fixes

* missing write permission ([01e45d1](https://github.com/nickelsh1ts/streamarr/commit/01e45d1b6bcdc2dfb3d5d30bd8cf23156f9b1f47))

# [1.2.0](https://github.com/nickelsh1ts/streamarr/compare/v1.1.0...v1.2.0) (2026-01-29)


### Bug Fixes

* added missing default tautulli baseUrl ([abf96d5](https://github.com/nickelsh1ts/streamarr/commit/abf96d542cba2d4f2f7e7ed87120f9bcb4c38127))
* compute invite counts for users and update filter settings storage key ([55b65e3](https://github.com/nickelsh1ts/streamarr/commit/55b65e3167d7ad09f9f1bb27b4b052c18d1eae7f))
* correct URL base key in validation messages and remove unnecessary required asterisks ([6c72587](https://github.com/nickelsh1ts/streamarr/commit/6c725874446f499187aa2e4a8bd5d684bde1af23))
* disable conflicting WebSocket in createTdarrProxy ([b11df67](https://github.com/nickelsh1ts/streamarr/commit/b11df6700d00c6f8dced90d6f8a02d6718cd8e28))
* formatting ([3af631a](https://github.com/nickelsh1ts/streamarr/commit/3af631afd1a724ff7e72ef7da468166c4592f06c))
* formatting ([8013657](https://github.com/nickelsh1ts/streamarr/commit/801365791033d21302a41bb09149e3af5e477e8e))
* formatting ([3434997](https://github.com/nickelsh1ts/streamarr/commit/3434997a21111d582a125fce15c4924608160a50))
* implement dynamic imports for download clients & null results fix ([3a75228](https://github.com/nickelsh1ts/streamarr/commit/3a752280a634cad47c45ceabdc093508b63fc88f))
* improve alignment of Alert component title and icon ([6df9b7a](https://github.com/nickelsh1ts/streamarr/commit/6df9b7a96a5e92cbf08587b9342589cc4fab13b0))
* re-release ([8d942d6](https://github.com/nickelsh1ts/streamarr/commit/8d942d65a59156402f20722ad386da8248a148d5))
* update default URL base paths for Bazarr, Prowlarr, and Lidarr settings ([6fe6ae1](https://github.com/nickelsh1ts/streamarr/commit/6fe6ae1d40407cfaf1b63bfabc32ebe67ae6f394))


### Features

* add additional translations and descriptions for settings and downloads ([3067923](https://github.com/nickelsh1ts/streamarr/commit/3067923f8636e35b99759cb12320d233fdc8157a))
* add ARR proxy support and improve proxy path handling ([148320f](https://github.com/nickelsh1ts/streamarr/commit/148320fc68ce0ca6fee28fd9b1bd2eff28382669))
* add base URL validation for Bazarr, Prowlarr, Lidarr, and Radarr services ([768775a](https://github.com/nickelsh1ts/streamarr/commit/768775ad70139770479f4b64c42b3ee01e7dea03))
* Add rate limiting for authentication routes in Prowlarr, Radarr, and Sonarr ([d86d07e](https://github.com/nickelsh1ts/streamarr/commit/d86d07ec8f381780dcf15a772c81c2b9adf36864))
* added size and type to buttons & fixed inviteList filter localstorage bug ([3ce5195](https://github.com/nickelsh1ts/streamarr/commit/3ce51955ccf4c55350f159cd285d6794dc6e7c34))
* added ui components for downloads & updated existing w/ api calls ([6a469a1](https://github.com/nickelsh1ts/streamarr/commit/6a469a186b4a74969b06da7b11c5b0e5846861c5))
* downloads service integration ([#140](https://github.com/nickelsh1ts/streamarr/issues/140)) ([1f43d7a](https://github.com/nickelsh1ts/streamarr/commit/1f43d7a7af474143d8ac4272678ed855da7a360e))
* **downloads:** downloads api setup & add api routes for managing download clients and testing connections ([776c175](https://github.com/nickelsh1ts/streamarr/commit/776c175221878781f5c62b89fe3e4d2897cfe604))
* **downloads:** enhance health check and client management features ([e335eb5](https://github.com/nickelsh1ts/streamarr/commit/e335eb59a8fb61040ebaa29ee037a66747e6b9da))
* **downloads:** Extended download clients to deluge and transmission and added error handling ([b7459b0](https://github.com/nickelsh1ts/streamarr/commit/b7459b06a7465e91b15b0e4797f952c69ae1a2e0))
* **downloads:** implement health check system for download clients with retry functionality ([d81425b](https://github.com/nickelsh1ts/streamarr/commit/d81425bba1c20e50b1f2b1bf2c24ba0daeb68be7))
* enhance ARR proxy configuration and add support for single-instance services ([54b3965](https://github.com/nickelsh1ts/streamarr/commit/54b39652b8ef72d3ae5446fd22a4214d2504d52f))
* Enhance arr services with authentication management and extended service test functionality ([a30e84a](https://github.com/nickelsh1ts/streamarr/commit/a30e84a3aeddff3bc6f9723d4f9ab7706e8aff6b))
* **i18n:** added new translations and cleaned up duplicates ([cfd47e4](https://github.com/nickelsh1ts/streamarr/commit/cfd47e4688c447526999b7014b6ac60a0ac312e8))
* implement migration ([4b4ebda](https://github.com/nickelsh1ts/streamarr/commit/4b4ebda3260c1976b69fb62abd33abddb5081b6f))
* implement service frame container and enhance admin layout with loading states ([fbfe89e](https://github.com/nickelsh1ts/streamarr/commit/fbfe89e31e5d46898705a5ab6b63a0ad4fca04d2))
* implement service proxy with Plex integration and add http-proxy-middleware ([c812cfc](https://github.com/nickelsh1ts/streamarr/commit/c812cfc807bd64817ee9ade8e6bb704e218ca365))
* implement Tautulli proxy and stats page with settings integration ([1bf0273](https://github.com/nickelsh1ts/streamarr/commit/1bf02735a76b22fc22f72649874146d16fb29029))
* implement Tdarr proxy support and remove urlBase configuration ([f721ab3](https://github.com/nickelsh1ts/streamarr/commit/f721ab3bcdf0f287f8dcd65820e7e1224c942c0d))
* Internal service proxy and support ([#137](https://github.com/nickelsh1ts/streamarr/issues/137)) ([fcf753f](https://github.com/nickelsh1ts/streamarr/commit/fcf753f3374078befa10fc009bb2bf83e8e651fa))
* remove SSL support for Bazarr and Tdarr services, update related configurations ([d0d3c14](https://github.com/nickelsh1ts/streamarr/commit/d0d3c14d4d55ed0d007ceb05d9d7e45197b1556b))
* simplify Uptime settings form by removing unnecessary fields ([a95ee4a](https://github.com/nickelsh1ts/streamarr/commit/a95ee4a701b1ed7152e181843123498083ba4b29))
* update download settings to mutli-instance and prepare download route for refactor ([9a2946e](https://github.com/nickelsh1ts/streamarr/commit/9a2946e9619ea933b92c42ad9d8f96f2227f8d9f))
* update labels in invite logging to match ([33998fe](https://github.com/nickelsh1ts/streamarr/commit/33998fedbef5eb731e420eae9023ca33db1a03ae))
* updated overseerr integration settings and warnings ([096dedd](https://github.com/nickelsh1ts/streamarr/commit/096dedd180f9c70b78d59d3122175c94f06b3d2f))

# [1.2.0](https://github.com/nickelsh1ts/streamarr/compare/v1.1.0...v1.2.0) (2026-01-29)


### Bug Fixes

* added missing default tautulli baseUrl ([abf96d5](https://github.com/nickelsh1ts/streamarr/commit/abf96d542cba2d4f2f7e7ed87120f9bcb4c38127))
* compute invite counts for users and update filter settings storage key ([55b65e3](https://github.com/nickelsh1ts/streamarr/commit/55b65e3167d7ad09f9f1bb27b4b052c18d1eae7f))
* correct URL base key in validation messages and remove unnecessary required asterisks ([6c72587](https://github.com/nickelsh1ts/streamarr/commit/6c725874446f499187aa2e4a8bd5d684bde1af23))
* disable conflicting WebSocket in createTdarrProxy ([b11df67](https://github.com/nickelsh1ts/streamarr/commit/b11df6700d00c6f8dced90d6f8a02d6718cd8e28))
* formatting ([3af631a](https://github.com/nickelsh1ts/streamarr/commit/3af631afd1a724ff7e72ef7da468166c4592f06c))
* formatting ([8013657](https://github.com/nickelsh1ts/streamarr/commit/801365791033d21302a41bb09149e3af5e477e8e))
* formatting ([3434997](https://github.com/nickelsh1ts/streamarr/commit/3434997a21111d582a125fce15c4924608160a50))
* implement dynamic imports for download clients & null results fix ([3a75228](https://github.com/nickelsh1ts/streamarr/commit/3a752280a634cad47c45ceabdc093508b63fc88f))
* improve alignment of Alert component title and icon ([6df9b7a](https://github.com/nickelsh1ts/streamarr/commit/6df9b7a96a5e92cbf08587b9342589cc4fab13b0))
* update default URL base paths for Bazarr, Prowlarr, and Lidarr settings ([6fe6ae1](https://github.com/nickelsh1ts/streamarr/commit/6fe6ae1d40407cfaf1b63bfabc32ebe67ae6f394))


### Features

* add additional translations and descriptions for settings and downloads ([3067923](https://github.com/nickelsh1ts/streamarr/commit/3067923f8636e35b99759cb12320d233fdc8157a))
* add ARR proxy support and improve proxy path handling ([148320f](https://github.com/nickelsh1ts/streamarr/commit/148320fc68ce0ca6fee28fd9b1bd2eff28382669))
* add base URL validation for Bazarr, Prowlarr, Lidarr, and Radarr services ([768775a](https://github.com/nickelsh1ts/streamarr/commit/768775ad70139770479f4b64c42b3ee01e7dea03))
* Add rate limiting for authentication routes in Prowlarr, Radarr, and Sonarr ([d86d07e](https://github.com/nickelsh1ts/streamarr/commit/d86d07ec8f381780dcf15a772c81c2b9adf36864))
* added size and type to buttons & fixed inviteList filter localstorage bug ([3ce5195](https://github.com/nickelsh1ts/streamarr/commit/3ce51955ccf4c55350f159cd285d6794dc6e7c34))
* added ui components for downloads & updated existing w/ api calls ([6a469a1](https://github.com/nickelsh1ts/streamarr/commit/6a469a186b4a74969b06da7b11c5b0e5846861c5))
* downloads service integration ([#140](https://github.com/nickelsh1ts/streamarr/issues/140)) ([1f43d7a](https://github.com/nickelsh1ts/streamarr/commit/1f43d7a7af474143d8ac4272678ed855da7a360e))
* **downloads:** downloads api setup & add api routes for managing download clients and testing connections ([776c175](https://github.com/nickelsh1ts/streamarr/commit/776c175221878781f5c62b89fe3e4d2897cfe604))
* **downloads:** enhance health check and client management features ([e335eb5](https://github.com/nickelsh1ts/streamarr/commit/e335eb59a8fb61040ebaa29ee037a66747e6b9da))
* **downloads:** Extended download clients to deluge and transmission and added error handling ([b7459b0](https://github.com/nickelsh1ts/streamarr/commit/b7459b06a7465e91b15b0e4797f952c69ae1a2e0))
* **downloads:** implement health check system for download clients with retry functionality ([d81425b](https://github.com/nickelsh1ts/streamarr/commit/d81425bba1c20e50b1f2b1bf2c24ba0daeb68be7))
* enhance ARR proxy configuration and add support for single-instance services ([54b3965](https://github.com/nickelsh1ts/streamarr/commit/54b39652b8ef72d3ae5446fd22a4214d2504d52f))
* Enhance arr services with authentication management and extended service test functionality ([a30e84a](https://github.com/nickelsh1ts/streamarr/commit/a30e84a3aeddff3bc6f9723d4f9ab7706e8aff6b))
* **i18n:** added new translations and cleaned up duplicates ([cfd47e4](https://github.com/nickelsh1ts/streamarr/commit/cfd47e4688c447526999b7014b6ac60a0ac312e8))
* implement migration ([4b4ebda](https://github.com/nickelsh1ts/streamarr/commit/4b4ebda3260c1976b69fb62abd33abddb5081b6f))
* implement service frame container and enhance admin layout with loading states ([fbfe89e](https://github.com/nickelsh1ts/streamarr/commit/fbfe89e31e5d46898705a5ab6b63a0ad4fca04d2))
* implement service proxy with Plex integration and add http-proxy-middleware ([c812cfc](https://github.com/nickelsh1ts/streamarr/commit/c812cfc807bd64817ee9ade8e6bb704e218ca365))
* implement Tautulli proxy and stats page with settings integration ([1bf0273](https://github.com/nickelsh1ts/streamarr/commit/1bf02735a76b22fc22f72649874146d16fb29029))
* implement Tdarr proxy support and remove urlBase configuration ([f721ab3](https://github.com/nickelsh1ts/streamarr/commit/f721ab3bcdf0f287f8dcd65820e7e1224c942c0d))
* Internal service proxy and support ([#137](https://github.com/nickelsh1ts/streamarr/issues/137)) ([fcf753f](https://github.com/nickelsh1ts/streamarr/commit/fcf753f3374078befa10fc009bb2bf83e8e651fa))
* remove SSL support for Bazarr and Tdarr services, update related configurations ([d0d3c14](https://github.com/nickelsh1ts/streamarr/commit/d0d3c14d4d55ed0d007ceb05d9d7e45197b1556b))
* simplify Uptime settings form by removing unnecessary fields ([a95ee4a](https://github.com/nickelsh1ts/streamarr/commit/a95ee4a701b1ed7152e181843123498083ba4b29))
* update download settings to mutli-instance and prepare download route for refactor ([9a2946e](https://github.com/nickelsh1ts/streamarr/commit/9a2946e9619ea933b92c42ad9d8f96f2227f8d9f))
* update labels in invite logging to match ([33998fe](https://github.com/nickelsh1ts/streamarr/commit/33998fedbef5eb731e420eae9023ca33db1a03ae))
* updated overseerr integration settings and warnings ([096dedd](https://github.com/nickelsh1ts/streamarr/commit/096dedd180f9c70b78d59d3122175c94f06b3d2f))
