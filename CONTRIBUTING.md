# Contributing to Prismify

Thank you for your interest in contributing to Prismify! This document provides guidelines and instructions for contributing.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Branch & Commit Guidelines](#branch--commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Documentation](#documentation)

## 🤝 Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Follow the project's technical standards

## 🚀 Getting Started

1. **Fork and Clone**

   ```bash
   git clone https://github.com/YOUR_USERNAME/Prismify.git
   cd Prismify
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Set Up Environment**

   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

4. **Run Database Migrations**

   ```bash
   npm run migrate
   npm run verify
   ```

5. **Test Your Setup**
   ```bash
   npm run test:agent
   npm run test:db
   ```

## 💻 Development Workflow

### Before You Start

1. Check `.agents/PROJECT_TODO.md` for available tasks
2. Find an unclaimed task or propose a new one
3. Comment on related issues or create a new one
4. Wait for approval before starting major work

### While Working

1. Mark task as `[🔲]` in `PROJECT_TODO.md`
2. Create a feature branch (see naming below)
3. Make small, focused commits
4. Write tests for new functionality
5. Update documentation as needed

### When Complete

1. Mark task as `[✓]` in `PROJECT_TODO.md`
2. Add completion notes (branch, PR link, tests run)
3. Submit PR using the template
4. Address review feedback

## 🌿 Branch & Commit Guidelines

### Branch Naming

```
phase-{X}.{Y}-{short-description}
```

Examples:

- `phase-1.2-environment-secrets`
- `phase-2.1-jwt-auth`
- `phase-3.1-seo-agent-hardening`

### Commit Messages

```
[PHASE-X.Y] Short description - P{0|1|2|3}

Longer explanation if needed:
- What changed
- Why it changed
- Any breaking changes or migrations
```

Example:

```
[PHASE-2.1] Implement JWT auth with refresh tokens - P0

- Added JWT creation and verification
- Implemented refresh token rotation
- Added auth middleware for protected routes

Breaking: Requires JWT_SECRET and JWT_REFRESH_SECRET in .env
```

## 🔄 Pull Request Process

1. **Create PR** using the template in `.github/PULL_REQUEST_TEMPLATE.md`
2. **Title Format**: `[PHASE-X.Y] Description - P{0|1|2|3}`
3. **Link Task**: Reference the task in `.agents/PROJECT_TODO.md`
4. **Include**:
   - Summary of changes
   - Acceptance criteria met
   - How to test
   - Screenshots/logs (if applicable)
5. **Ensure**:
   - CI passes (lint, test, build)
   - No merge conflicts
   - Documentation updated
   - `.agents/PROJECT_TODO.md` updated

### Review Process

- At least one approval required
- Address all feedback or explain why not
- Keep discussion focused and respectful
- Update PR description if scope changes

## 🧪 Testing

### Run Tests

```bash
# All tests
npm test

# Specific tests
npm run test:db
npm run test:agent

# With coverage
npm run test:coverage
```

### Writing Tests

- Write tests for all new features
- Update tests for modified features
- Aim for >80% coverage on new code
- Include edge cases and error scenarios

### Test Structure

```javascript
describe('Feature Name', () => {
  beforeEach(() => {
    // Setup
  });

  it('should do expected behavior', async () => {
    // Test implementation
  });

  it('should handle error case', async () => {
    // Error test
  });
});
```

## 📚 Documentation

### What to Document

- Public APIs and endpoints
- Agent capabilities and usage
- Configuration options
- Environment variables
- Database schema changes
- Breaking changes

### Where to Document

- Code: JSDoc comments for functions/classes
- `docs/`: User-facing guides and tutorials
- `README.md`: Quick start and overview
- `.agents/`: Agent-specific documentation
- `CHANGELOG.md`: Version history

### Documentation Standards

- Clear, concise language
- Include examples
- Keep up to date with code changes
- Link related documents

## 🏷️ Task Priorities

- **P0 (Critical)**: Security, data integrity, blocking bugs
- **P1 (High)**: Core features, MVP requirements
- **P2 (Medium)**: Important improvements, UX enhancements
- **P3 (Low)**: Nice-to-have, polish, future work

## 🐛 Bug Reports

Include:

- Expected behavior
- Actual behavior
- Steps to reproduce
- Environment (OS, Node version, etc.)
- Error messages and logs
- Screenshots if applicable

## 💡 Feature Requests

Include:

- Problem statement
- Proposed solution
- Alternative solutions considered
- Impact and priority
- Acceptance criteria

## ❓ Questions?

- Check existing documentation in `docs/`
- Search closed issues and PRs
- Ask in discussions or issues
- Tag maintainers if urgent

## 🎉 Recognition

Contributors will be:

- Listed in `CONTRIBUTORS.md`
- Credited in release notes
- Thanked in the community

---

Thank you for contributing to Prismify! 🚀
