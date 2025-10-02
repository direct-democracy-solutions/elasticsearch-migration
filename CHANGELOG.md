# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- New command `es-migrate forget`, an advanced command that can help
  repair a corrupted migration index. `forget` will remove an applied
  migration from the index without running its rollback script.

## [1.1.2] - 2025-10-15

### Fixed

- The default Elasticsearch host, `localhost`, is not properly resolved
  on Node 18. Changed it to `127.0.0.1` so it should work now.

## [1.1.1] - 2025-10-14

### Changed

- An auto-formatter has been applied to all source code. This will
  probably modify every file in the bundle, but should have no effect semantically.

### Removed

- Stray AI output in README
- Unused dependency on `@ahmetkasap/elasticsearch-migrate`

## [1.1.0]

Improves support for CommonJS projects

### Added

- Changelog
- Example invocation and usage notes for CJS projects in README

### Changed

- `es-migrate` now loads .mts and .mjs migration files in addition to .ts and .js
- `es-migrate create` generates .mts migrations instead of .ts

## [1.0.1]

### Added

- Near-exact copy of [@ahmetkasap/elasticsearch-migration](https://www.npmjs.com/package/@ahmetkasap/elasticsearch-migration) v1.0.1, except as listed below.
- LICENSE.txt with copyright attribution

### Changed

- Package renamed from `@ahmetkasap/elasticsearch-migration` to `@direct-democracy-solutions/elasticsearch-migration`
- Contact names and urls
- Generated migration scripts and example migration scripts use the new package name

[1.1.2]: https://github.com/direct-democracy-solutions/elasticsearch-migration/compare/1.1.1...1.1.2
[1.1.1]: https://github.com/direct-democracy-solutions/elasticsearch-migration/compare/1.1.0...1.1.1
[1.1.0]: https://github.com/direct-democracy-solutions/elasticsearch-migration/compare/1.0.1...1.1.0
[1.0.1]: https://github.com/direct-democracy-solutions/elasticsearch-migration/releases/tag/1.0.1
[unreleased]: https://github.com/direct-democracy-solutions/elasticsearch-migration/compare/1.1.2...HEAD
