---
description: Rules file for cursor for cypress e2e testing
globs: 
alwaysApply: true
---

### Cypress testing rules

- Before creating configuration for cypress, Always check for existing cypress configuration
- Elements in the tests should be targeted by the ids. If ids are not found in the code, inform me and ask for my permission to create ids
- Cross verify the ids when you generate the code for interactable elements. The ids should be present in the code
- Whenever setting up interceptors, please always set them up after all the necessary ui elements have been interacted with. Do not setup interceptors before implementing the interactive functionalities
- Do not add responsive UI testing unless explicitly asked for
- Sometimes when you have to create interfaces or types, please always check where the existing types are. Do not jump to create new files unless necessary
