module.exports = {
  ci: {
    collect: {
      staticDistDir: './dist',
      numberOfRuns: 3,
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        // PWA requirements
        'installable-manifest': ['error', { minScore: 1 }],
        'service-worker': ['error', { minScore: 1 }],
        'works-offline': ['warn', { minScore: 0.8 }],

        // Performance
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'interactive': ['warn', { maxNumericValue: 3500 }],
        'speed-index': ['warn', { maxNumericValue: 3000 }],

        // Accessibility
        'categories:accessibility': ['error', { minScore: 0.9 }],

        // Best Practices
        'categories:best-practices': ['warn', { minScore: 0.85 }],

        // SEO
        'categories:seo': ['warn', { minScore: 0.85 }],

        // Relaxed for development
        'uses-http2': 'off',
        'uses-long-cache-ttl': 'off',
        'redirects-http': 'off',
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
