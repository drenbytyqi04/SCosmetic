import type { Category } from '@/types';

/**
 * Seed catalogue taxonomy.
 *
 * Replace with a `category` table when the database lands — the repository in
 * `lib/products/repository.ts` is the only module that reads this directly.
 */
export const categories: Category[] = [
  {
    id: 'cat_skincare',
    slug: 'skincare',
    name: 'Skincare',
    tagline: 'Barrier first, always',
    description:
      'Cleansers, serums and creams selected for formulation quality rather than trend cycles. Built to layer into a routine you will actually keep.',
    image: '/images/categories/skincare.png',
    position: 1,
  },
  {
    id: 'cat_complexion',
    slug: 'complexion',
    name: 'Complexion',
    tagline: 'Skin, only better lit',
    description:
      'Foundations, primers and powders with a skin-like finish. Buildable coverage that looks like you on your best-lit day.',
    image: '/images/categories/complexion.png',
    position: 2,
  },
  {
    id: 'cat_lips',
    slug: 'lips',
    name: 'Lips',
    tagline: 'Nudes, done properly',
    description:
      'Oils, balms and long-wear colour in the warm neutral range our clients keep coming back for.',
    image: '/images/categories/lips.png',
    position: 3,
  },
  {
    id: 'cat_eyes',
    slug: 'eyes',
    name: 'Eyes',
    tagline: 'Definition without effort',
    description:
      'Brow, lash and liner essentials in wearable neutrals — the five-minute face, refined.',
    image: '/images/categories/eyes.png',
    position: 4,
  },
  {
    id: 'cat_fragrance',
    slug: 'fragrance',
    name: 'Fragrance',
    tagline: 'Quiet, expensive-smelling',
    description:
      'Small-house eaux de parfum built on amber, fig and white florals. Composed to sit close to the skin.',
    image: '/images/categories/fragrance.png',
    position: 5,
  },
  {
    id: 'cat_tools',
    slug: 'tools',
    name: 'Tools',
    tagline: 'The difference is the brush',
    description:
      'Brushes and rituals tools that make good formulas perform. Vegan fibres, weighted handles.',
    image: '/images/categories/tools.png',
    position: 6,
  },
  {
    id: 'cat_body',
    slug: 'body',
    name: 'Body & Hair',
    tagline: 'Head to toe, considered',
    description:
      'Lotions and hair oils with the same standard of formulation we hold the face range to.',
    image: '/images/categories/body.png',
    position: 7,
  },
];
