---
name: migrate-class-to-hooks
description: Convert React class components to function components with hooks one component at a time - characterization tests first, then map state to useState/useReducer, lifecycle methods to useEffect with correct dependencies and cleanup (or to event handlers and derived values where an effect isn't needed), refs to useRef, context to useContext, connect() to useSelector/useDispatch, keep error boundaries as classes, and verify behavior is unchanged. Use when asked to modernize class components or when touching a class component substantially in legacy/react-class-cra code.
license: MIT
metadata:
  owner: "@Phaedra-Solutions/maintainers"
  last_reviewed: "2026-10-30"
  sources: "https://react.dev/reference/react/Component https://react.dev/reference/react/useEffect https://react.dev/learn/you-might-not-need-an-effect https://react.dev/reference/react/useReducer https://react-redux.js.org/api/hooks https://react.dev/learn/react-compiler"
---

# Migrate class components → hooks

## When to use

- The user asks to convert class components, or a class component needs substantial changes anyway.
- React is 16.8 or newer (hooks exist). Error boundaries stay classes (there's no hook equivalent).

## Before you start

- Pick the scope with the user: one component (default), a feature folder, or leaf components first across the app. Never the whole app in one change.
- Read the component, its parents and tests. Note lifecycle methods, `setState` callbacks, instance fields, refs, context (`contextType`, `Consumer`), HOCs (`connect`, `withRouter`) and `getDerivedStateFromProps`.
- Working tree clean; new branch.

## Steps

1. **Characterization tests:** if the component lacks tests, add Testing Library tests for its visible behavior (render output, user interactions, calls to props and APIs) and make them pass on the class version first.
2. **Convert the shell:** `class X extends Component` → `function X(props)` (or a typed arrow function per house style); destructure props; move `defaultProps` to default parameter values.
3. **State:** each independent `this.state` field → `useState`; related fields or complex transitions → `useReducer`. Replace `this.setState(prev => …)` with functional updates. `setState(…, callback)` → do the follow-up in the event handler or an effect keyed on that state.
4. **Lifecycle:**
   - work that responds to a user action → the event handler, not an effect;
   - derived data → compute during render (`useMemo` only if measured slow, or let React Compiler handle it);
   - subscriptions, timers, DOM integrations: `componentDidMount` + `componentWillUnmount` → one `useEffect` with cleanup;
   - `componentDidUpdate(prevProps)` comparisons → `useEffect` with those values as dependencies;
   - `getDerivedStateFromProps` → derive during render, or reset state with a `key` on the component;
   - `shouldComponentUpdate`/`PureComponent` → `memo()` only if needed.
   Include every value the effect uses in its dependency array; don't silence `react-hooks/exhaustive-deps`.
5. **Instance fields and refs:** mutable instance fields (`this.timer`) → `useRef`; `createRef` → `useRef`; callback refs stay callback refs; `forwardRef` only on React < 19 (19 passes `ref` as a prop).
6. **Context and HOCs:** `static contextType`/`Consumer` → `useContext`; `connect(mapState, mapDispatch)` → `useSelector`/`useDispatch` (keep selectors memoized); `withRouter` → the router's hooks (`useNavigate`, `useParams`).
7. **Run the tests**, fix differences, and check effects don't run twice incorrectly under `StrictMode` (cleanup must undo setup).
8. **Verify** (next section); show the diff and results; commit only when asked (`git-commit` skill).

## Verify

```sh
npx tsc --noEmit                    # TypeScript projects
npx eslint <changed files>          # with eslint-plugin-react-hooks
npm test -- <component test files>  # or: npx vitest run <files>
npm run build
```

Then exercise the component in the app with the console open: same output, no extra requests on re-render, no warnings about missing dependencies or updates on unmounted components, subscriptions cleaned up when navigating away.

## Safety

- Never convert without tests that pin current behavior; never change behavior and structure in the same commit.
- Never silence the hooks lint rules or add `// eslint-disable-next-line react-hooks/exhaustive-deps` to make a conversion pass.
- Never convert error boundaries to function components.
- Never auto-commit, push or deploy.
