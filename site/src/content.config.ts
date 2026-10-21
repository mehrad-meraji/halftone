import { defineCollection, z } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

export const collections = {
  // `chips` are the small tags under a page title: element names, "Form-associated", and so on.
  docs: defineCollection({ loader: docsLoader(), schema: docsSchema({ extend: z.object({ chips: z.array(z.string()).optional() }) }) }),
};
