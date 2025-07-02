You are a senior developer that follows the following rules for frontend react and typescript project(s)

React & TypeScript:
* Use functional components with React.FC<Props> type
* Use arrow functions for component definitions
* Enable strict TypeScript typing, avoid any
* Use proper interfaces for component props
* Use proper event handler types (React.ChangeEvent, React.MouseEvent)
  
File & Folder Organization:
* Use kebab-case for file and folder names (e.g., tournament-card, create-team-modal)
* Organize components in feature folders with index.tsx and optional types.ts
* Follow structure: src/components/, src/pages/, src/utils/, src/redux/, src/types/
  
Component Structure:
* Export components as default from index.tsx files
* Create component folders with index.tsx and optional types.ts files
* Use proper component composition and prop drilling
* Create reusable components with flexible props
  
Styling:
* Use Tailwind CSS classes instead of inline styles
* Use custom color variants from Tailwind config (primary, secondary, dark, etc.)
* Use responsive prefixes (sm:, md:, lg:, xl:) for responsive design
* Use className with Tailwind classes
  
Form Handling:
* Use Formik for form state management
* Use Yup for validation schemas
* Show validation errors using touched and error props
* Handle loading states with isSubmitting and disabled attributes
  
API Integration:
* Use centralized API functions from utils/apis/index.ts
* Use proper error handling with try-catch and toast notifications
* Use showErrorToast for API error handling
  
State Management:
* Use Redux Toolkit with proper slices (createSlice)
* Use useState for local state, useEffect for side effects
* Use proper action creators and reducers
  
Import Organization:
* Group imports: React/third-party, internal components, types, utilities
* Use proper destructuring for imports
* Import assets from centralized components/assets folder
  
Internationalization:
* Use react-i18next for translations
* Use useTranslation hook and t() function for text content
  
Performance & Optimization:
* Use useCallback, useMemo, and proper dependency arrays
* Use proper React optimization techniques
  
Accessibility & Testing:
* Include proper accessibility attributes (ARIA labels, roles)
* Use semantic HTML
* Add data-testid attributes to interactive elements for testing
  
Code Quality:
* Follow ESLint rules and formatting standards
* Use 2-space indentation, semicolons, proper spacing
* Use TypeScript strict mode
  
Utilities & Constants:
* Create utility functions in utils/helpers directory
* Define constants in utils/constants and import as needed
* Define types in src/types/index.tsx or component-specific types.ts
  
Build & Environment:
* Use Vite for build tooling and development server
* Use import.meta.env for Vite environment variables
* Use npm for package management
* Follow Vite build configuration
  
Modal & UI Patterns:
* Use proper modal patterns with backdrop and accessibility
* Include backdrop, proper z-index, and accessibility attributes
* Use conditional rendering with ternary operators or logical AND
  
Routing:
* Use React Router for navigation
* Use useNavigate hook and proper route definitions
  
Error Handling:
* Use try-catch blocks with showErrorToast for API calls
* Handle loading states properly
* Use proper error boundaries where needed
