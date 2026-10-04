# Git Branching Strategy

## Overview

This project follows a Git branching strategy designed to separate feature
development, integration, and production-ready code.

## Branches

### main

The `main` branch represents production-ready code.

- Protected branch
- Changes must be made through Pull Requests
- Direct pushes are not permitted

### develop

The `develop` branch represents the integration environment.

- Protected branch
- Feature branches are merged into `develop` through Pull Requests
- Used to integrate and validate changes before production

### feature/*

Feature branches are created for individual development tasks.

Example:

`feature/project-documentation`

Feature branches are merged into `develop` through Pull Requests.

## Workflow

```text
feature/*
    |
    | Pull Request + Code Review
    v
 develop
    |
    | Pull Request + Code Review
    v
 main
