/**
 * Average shelf life (in days) by food category, used to auto-assign an expiry
 * date when an ingredient is scanned. Mirrors `emoji.ts` lookup style: exact
 * match first, then longest substring match, then a sensible default.
 */

const SHELF_LIFE: Record<string, number> = {
  // dairy & eggs
  egg: 30,
  eggs: 30,
  milk: 14,
  yogurt: 14,
  cheese: 30,
  butter: 90,
  cream: 10,

  // vegetables
  carrot: 14,
  potato: 30,
  onion: 30,
  "green onion": 7,
  scallion: 7,
  "spring onion": 7,
  garlic: 60,
  ginger: 30,
  cucumber: 7,
  tomato: 7,
  lettuce: 5,
  cabbage: 14,
  spinach: 5,
  broccoli: 7,
  mushroom: 7,
  pepper: 10,
  "bell pepper": 10,
  chili: 14,
  eggplant: 7,
  pumpkin: 30,
  corn: 5,
  bean: 10,
  beans: 10,
  pea: 7,
  peas: 7,

  // fermented / prepared
  kimchi: 30,
  tofu: 7,
  // meat & seafood
  pork: 4,
  beef: 4,
  steak: 4,
  meat: 4,
  chicken: 3,
  fish: 2,
  salmon: 2,
  tuna: 2,
  shrimp: 2,
  prawn: 2,
  squid: 2,
  octopus: 2,
  crab: 2,
  bacon: 7,
  ham: 7,
  sausage: 14,

  // pantry / grains
  ramen: 180,
  noodle: 180,
  noodles: 180,
  pasta: 365,
  spaghetti: 365,
  rice: 365,
  bread: 5,
  baguette: 3,
  flour: 180,
  cereal: 120,

  // fruits
  apple: 21,
  banana: 5,
  orange: 21,
  lemon: 21,
  lime: 21,
  strawberry: 4,
  grape: 7,
  grapes: 7,
  watermelon: 7,
  peach: 5,
  pear: 14,
  pineapple: 5,
  mango: 7,
  avocado: 4,
  coconut: 14,
  kiwi: 14,
  blueberry: 7,

  // condiments (long-lived)
  honey: 365,
  jam: 180,
  sugar: 730,
  salt: 730,
  oil: 365,
  "olive oil": 365,
  "soy sauce": 365,
  sauce: 120,
  ketchup: 180,
  mayo: 60,
  mayonnaise: 60,
  gochujang: 365,
  gochugaru: 365,
};

const SORTED_KEYS = Object.keys(SHELF_LIFE).sort((a, b) => b.length - a.length);

export const DEFAULT_SHELF_LIFE = 14;

export function shelfLifeFor(name: string): number {
  const n = name.toLowerCase().trim();
  if (SHELF_LIFE[n]) return SHELF_LIFE[n];
  for (const key of SORTED_KEYS) {
    if (n.includes(key)) return SHELF_LIFE[key];
  }
  return DEFAULT_SHELF_LIFE;
}
