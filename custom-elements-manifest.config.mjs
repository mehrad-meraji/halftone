const HIDDEN_STATICS = ['formAssociated', 'shadowRootOptions', 'styles', 'properties'];

// Keep the manifest to the public API: no private members, Lit statics or form lifecycle callbacks.
const publicApiOnly = {
  name: 'public-api-only',
  packageLinkPhase({ customElementsManifest }) {
    // Deterministic order, so the committed manifest does not churn between machines.
    customElementsManifest.modules.sort((a, b) => a.path.localeCompare(b.path));
    for (const mod of customElementsManifest.modules) {
      for (const decl of mod.declarations ?? []) {
        if (decl.attributes) decl.attributes = decl.attributes.filter((a) => !a.name.startsWith('_'));
      if (!decl.members) continue;
        decl.members = decl.members.filter(
          (m) =>
            m.privacy !== 'private' &&
            m.privacy !== 'protected' &&
            !m.name.startsWith('#') &&
            !m.name.startsWith('_') &&
            !(m.static && HIDDEN_STATICS.includes(m.name)) &&
            !m.name.endsWith('Callback') &&
            m.name !== 'render',
        );
      }
    }
  },
};

export default {
  globs: ['src/components/**/*.ts'],
  exclude: ['**/*.stories.ts'],
  outdir: '.',
  litelement: true,
  plugins: [publicApiOnly],
};
