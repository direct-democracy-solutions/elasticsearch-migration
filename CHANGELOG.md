# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
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
-  contact names and urls
- Generated migration scripts and example migration scripts use the new package name

[unreleased]: https://github.com/direct-democracy-solutions/elasticsearch-migration/compare/v1.0.1...master
[1.0.1]: https://github.com/direct-democracy-solutions/releases/tag/v1.0.1