# Fix Login Page Padding and Title

## Problem Analysis

- Login page title is being cut off (same issue as collection/cart/page templates)
- Title currently says "Login" but should say "Log in"
- Need to add the same ::before padding fix to login page
- Need to update the translation string

## Recommended Solution

1. **Add login template to padding fix**: Include `template.name == 'customers/login'` in the CSS rule
2. **Update title translation**: Change "Login" to "Log in" in the locale file

## Implementation

### File 1: layout/theme.liquid

Add login template to the ::before padding rule:

```liquid
{%- if template.name == 'collection' or template.name == 'cart' or template.name == 'customers/login' or (template.name == 'page' and template != 'index') -%}
```

Also need to target the login section. The login page uses `.customer.login` class, so we can target:
- `.shopify-section:has(.customer.login)` or
- `.shopify-section:has(#login)` (the h1 has id="login")

### File 2: locales/en.default.json

Change line 446:
```json
"title": "Login",
```
To:
```json
"title": "Log in",
```

## Benefits

- Login page gets same padding fix as other pages
- Title spelling is corrected to "Log in" (two words)
- Consistent spacing across all main pages


