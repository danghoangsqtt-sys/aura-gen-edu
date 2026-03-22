/// <reference types="vite/client" />

// Allow Vite '?url' suffix imports
declare module '*?url' {
  const src: string;
  export default src;
}
