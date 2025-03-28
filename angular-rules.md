# Angular Standards

This document outlines a comprehensive set of Angular best practices, aimed at building scalable, maintainable, and high-performance applications. These practices are based on industry standards followed by top engineering teams.


## Project Architecture

### 1. Modular and Maintainable Design

- Structure the application using a feature-based modular architecture.
- Each feature should be self-contained with its own components, views, models, and helpers.
- Apply the Single Responsibility Principle to components, services, and modules.

### 2. Recommended Folder Structure

```
/src/app/
├── core/                      # Application-wide singletons and global logic
│   ├── enums/                 # Enums grouped by module
│   ├── interfaces/            # Interfaces grouped by module
│   ├── services/              # Flat structure, one service per feature
│   │   ├── user-api.service.ts
│   │   ├── mapbox-api.service.ts
│   │   └── index.ts
│   ├── guards/
│   ├── interceptors/
│   └── utils/                 # Generic, app-wide reusable logic
│       ├── constants.ts
│       ├── helpers.ts
│       ├── mocks.ts
│       ├── validators.ts
│       └── index.ts

├── layout/                    # Structural UI components
│   ├── app-footer/
│   ├── app-header/
│   ├── app-sidebar/
│   ├── app-layouts/
│   │   ├── full-layouts/
│   │   ├── header-footer-layouts/
│   │   └── sidebar-layouts/
│   └── layout.module.ts

├── shared/                    # Reusable, stateless UI modules
│   ├── components/
│   ├── directives/
│   ├── models/
│   ├── pipes/
│   ├── tables/
│   ├── material.module.ts
│   ├── shared.module.ts

├── modules/                   # Feature-specific business logic
│   ├── user/
│   │   ├── components/
│   │   ├── views/
│   │   ├── models/
│   │   ├── helper/
│   │   └── user.module.ts
│   └── dashboard/
│       └── dashboard.module.ts

├── mapbox/                    # Dedicated domain logic for Mapbox
│   ├── components/
│   ├── mapbox/
│   ├── helper/
│   ├── plugins/
│   └── mapbox.module.ts

```

---

## Code Ownership & Layering

### 3. Service Layer

- Each module must have its own dedicated service.
- All services are placed in `core/services/` without subdirectories.
- Services should be prefixed with the module name (e.g., `user-api.service.ts`).
- Export all services via `core/services/index.ts`.

### 4. Interfaces and Enums

- Place all interfaces and enums inside `core/interfaces/` and `core/enums/`, grouped by module.
- Each module folder has its own `index.ts`.
- The root `index.ts` aggregates all module-level exports for ease of use across the app.

Example:
```ts
// core/interfaces/user/index.ts
export * from './user-profile.interface';

// core/interfaces/index.ts
export * from './user';
export * from './mapbox';
```

### 5. Utility Layer

- Generic, app-wide utility logic goes into `core/utils/`.
- Organize utilities into specific files: `constants.ts`, `helpers.ts`, `validators.ts`, `mocks.ts`.
- Ensure all utility functions are stateless, reusable, and pure.

---

## Naming and Code Style

### 6. Naming Conventions

| Item         | Convention             | Example                      |
|--------------|------------------------|------------------------------|
| Component    | kebab-case             | user-profile.component.ts    |
| Service      | kebab-case             | user-api.service.ts          |
| Module       | kebab-case             | user.module.ts               |
| Folders/Files| lowercase + kebab-case | chat-screen/                 |
| Variables    | camelCase              | userProfileData              |

- Use clear, descriptive names for variables, components, and services.
- Use `index.ts` files to re-export items for clean and concise imports.

### 7. Destructuring

- Use object destructuring where appropriate for cleaner and more readable code.
```ts
const { id, name } = user;
```

---

## Type Safety and Code Quality

### 8. TypeScript Strictness

- Enable strict mode in `tsconfig.json`:
```json
{
  "compilerOptions": {
    "strict": true
  }
}
```

### 9. Avoid `any`

- Never use `any` unless absolutely necessary.
- Define and use well-structured interfaces throughout the application.

---

## Angular-Specific Best Practices

### 10. Change Detection

- Use `ChangeDetectionStrategy.OnPush` in stateless and high-performance components.

### 11. Async Handling

- Prefer the `async` pipe over manual subscription.
- When manual subscriptions are needed, always unsubscribe using `takeUntil`, `untilDestroyed`, or `.unsubscribe()`.

### 12. Lazy Loading

- Lazy load all feature modules to optimize initial load time.

### 13. Template Simplicity

- Avoid placing logic inside templates.
- Keep templates clean and delegate logic to component classes.

---

## Security Guidelines

### 14. Safe Bindings

- Avoid directly binding user-generated content to `[innerHTML]`.
- Use Angular’s `DomSanitizer` when absolutely necessary.

### 15. DOM Access

- Do not manipulate the DOM directly.
- Use Angular’s `Renderer2` or custom directives.

---

## Performance Optimization

### 17. Input Debouncing

- Apply debouncing to input events like search and filters to reduce API load.

### 18. Efficient Rendering

- Use `trackBy` in `*ngFor` loops to avoid unnecessary DOM re-renders.
- Memoize expensive operations in templates.

---

## Summary of Core Rules

- Use consistent naming across all layers.
- Each module owns its related services, interfaces, and enums.
- Services are flat and centralized in `core/services/` with index exports.
- Use `index.ts` for shared exports in `interfaces/`, `enums/`, `utils/`, and `shared/`.
- Use strict typing throughout the app and avoid `any`.
- Keep logic modular, reactive, and testable.
- Organize utility logic into pure, stateless helper files.
