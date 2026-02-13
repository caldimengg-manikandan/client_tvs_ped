# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Deployment to Vercel

To deploy this frontend application to Vercel:

1.  **Push your code to GitHub/GitLab/Bitbucket.**
2.  **Import the project in Vercel.**
3.  **Configure Project Settings:**
    -   **Root Directory:** `frontend` (Since this is a monorepo, you must specify the frontend folder).
    -   **Framework Preset:** Vite (Vercel should detect this automatically).
    -   **Build Command:** `vite build` (Default).
    -   **Output Directory:** `dist` (Default).
4.  **Environment Variables:**
    -   Add a new environment variable named `VITE_API_BASE_URL`.
    -   Set its value to your backend URL: `https://client-tvs-ped.onrender.com` (Do not include `/api` at the end, the code handles it).
5.  **Deploy.**

### Note on Backend Connection
The application is configured to append `/api` to the base URL automatically.
-   Local Development: Defaults to `http://localhost:5000` (or uses proxy).
-   Production: Uses `VITE_API_BASE_URL` from environment variables.
