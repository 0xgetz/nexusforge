# Changesets

NexusForge uses [Changesets](https://github.com/changesets/changesets) for versioning and publishing our packages.

## What is a Changeset?

A changeset is a markdown file that describes the changes being made to a package. It specifies:
- Which packages are affected
- What type of version bump is needed (major, minor, or patch)
- A description of the changes

## Adding a Changeset

When making changes to any package, you **must** add a changeset:

```bash
bun run changeset
```

This will prompt you to:
1. Select which packages you want to include in the changeset
2. Choose the type of version bump (major/minor/patch)
3. Write a brief description of the change

### Version Bump Guidelines

- **patch** - Bug fixes, minor improvements, no breaking changes
- **minor** - New features, backwards compatible
- **major** - Breaking changes

## Versioning and Publishing Flow

### 1. Create a Changeset
```bash
bun run changeset
```

Commit the generated file in `.changeset/` along with your code changes.

### 2. Version Packages
When ready to release, run:
```bash
bun run changeset:version
```

This will:
- Update package versions based on changesets
- Update changelogs
- Generate a PR with the version bump

### 3. Review and Merge
Review the version PR, ensure changelogs are accurate, then merge to main.

### 4. Publish
The release workflow will automatically publish to npm when the version PR is merged.

Alternatively, manually publish with:
```bash
bun run changeset:publish
```

## Manual Publishing

For emergency hotfixes or manual releases:

```bash
# Version all packages
bun run changeset:version

# Publish to npm
bun run changeset:publish
```

## Configuration

See `.changeset/config.json` for:
- Base branch (main)
- Access level (public)
- Version bump behavior

## Tips

- Add a changeset for every PR that changes package behavior
- Be descriptive in your changeset messages
- For changes affecting multiple packages, add changesets for each
- Documentation-only changes don't need changesets
