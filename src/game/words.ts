export const WORD_BANK: Record<string, string[]> = {
  animals: [
    'cat', 'dog', 'elephant', 'giraffe', 'lion', 'tiger', 'penguin', 'monkey',
    'dolphin', 'shark', 'butterfly', 'kangaroo', 'rabbit', 'zebra', 'panda',
    'owl', 'crocodile', 'turtle', 'snake', 'fox', 'bear', 'whale', 'octopus',
    'hamster', 'flamingo', 'camel', 'parrot', 'squirrel', 'hedgehog', 'cheetah'
  ],
  food: [
    'pizza', 'burger', 'ice cream', 'banana', 'apple', 'sandwich', 'pancake',
    'sushi', 'taco', 'cookie', 'spaghetti', 'watermelon', 'chocolate', 'donut',
    'popcorn', 'pineapple', 'cheese', 'hotdog', 'french fries', 'cupcake',
    'avocado', 'strawberry', 'carrot', 'broccoli', 'mushroom', 'waffle', 'steak'
  ],
  objects: [
    'guitar', 'clock', 'camera', 'umbrella', 'sunglasses', 'backpack', 'laptop',
    'bicycle', 'telescope', 'candle', 'key', 'scissors', 'telephone', 'crown',
    'paintbrush', 'trophy', 'skateboard', 'compass', 'flashlight', 'book',
    'chair', 'mirror', 'lamp', 'hammer', 'violin', 'teapot', 'pillow'
  ],
  actions: [
    'swimming', 'dancing', 'cooking', 'sleeping', 'reading', 'flying', 'running',
    'fishing', 'skating', 'singing', 'painting', 'climbing', 'jumping', 'laughing',
    'diving', 'juggling', 'sneezing', 'whispering', 'dreaming', 'gardening'
  ],
  nature: [
    'rainbow', 'volcano', 'waterfall', 'mountain', 'tornado', 'campfire', 'island',
    'sunflower', 'lightning', 'forest', 'desert', 'glacier', 'cave', 'ocean',
    'snowflake', 'sunset', 'river', 'planet', 'moon', 'star'
  ]
};

export function getRandomWords(count: number = 3, category: string = 'all', customWords: string[] = []): string[] {
  let pool: string[] = [];
  
  if (customWords && customWords.length > 0) {
    pool = [...customWords];
  }

  if (category === 'all' || !WORD_BANK[category]) {
    for (const cat of Object.keys(WORD_BANK)) {
      pool.push(...WORD_BANK[cat]);
    }
  } else {
    pool.push(...WORD_BANK[category]);
  }

  // Deduplicate and filter out empty
  pool = Array.from(new Set(pool.map(w => w.trim()).filter(Boolean)));
  if (pool.length === 0) {
    pool = ['cat', 'pizza', 'guitar', 'tree', 'house'];
  }

  // Shuffle pool
  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
