[![ECR Sync](https://github.com/osiris-sg/adh/actions/workflows/ecr-deploy.yml/badge.svg)](https://github.com/osiris-sg/adh/actions/workflows/ecr-deploy.yml)

[![CI](https://github.com/osiris-sg/adh/actions/workflows/ci.yml/badge.svg)](https://github.com/osiris-sg/adh/actions/workflows/ci.yml)

# Project Documentation

## Folder Structure

```
.
├── apps/
│ ├── api/                # API Application
│ └── expert/             # Expert application
├── packages/
│ ├── db/                 # Database package
│ ├── logger/             # Logging utilities
│ └── ui/                 # UI component library
├── infra/
│ ├── cdk/                # AWS CDK infrastructure code
│ └── kubernetes/         # Kubernetes Configuration
├── .github/
│ └── workflows/          # CI/CD pipelines
│     ├── ci.yml          # Continuous Integration
│     └── ecr-deploy.yml  # ECR deployment
├── .env.example          # Environment variables
└── .gitignore            # Git ignore rules
```

## Package Overview

### UI Package

A React component library containing reusable UI components and hooks:

- **Components**: Card, Dialog, Input, Table, Toast notifications, etc.
- **Hooks**: Copy to clipboard, mobile detection, sidebar management
- **Theme**: Customizable theming system

### Database Package

Database integration and models

### Logger Package

Logging utilities for the application

### Expert App

Main application using the shared packages

## Infrastructure

- AWS CDK for infrastructure as code
- GitHub Actions for CI/CD:
  - Continuous Integration pipeline
  - ECR deployment workflow

## Environment Configuration

Multiple environment configurations are supported:

- `.env` - Base environment variables
- `.env.production` - Production overrides
- `.env.local` - Local development overrides

## Getting Started

[Add installation and setup instructions here based on your project's requirements]

## Development

[Add development workflow instructions here]

## Deployment

[Add deployment instructions here]
