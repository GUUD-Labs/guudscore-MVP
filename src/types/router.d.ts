// Router type declarations
import '@tanstack/react-router';

import type { RouterContext } from '@/lib/router-context';

declare module '@tanstack/react-router' {
  interface Register {
    router: any; // This will be properly typed by the generated route tree
  }

  interface AnyContext extends RouterContext {}
}
