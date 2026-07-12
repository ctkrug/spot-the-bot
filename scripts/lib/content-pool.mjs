// Curated content pool for the offline generator. Human passages read like
// real people; AI passages carry the tell-tale even-handed, slightly hollow
// register of generated text. The generator stamps each AI passage with a
// topical model at build time. In a live pipeline the `ai` half would be
// replaced by prompted output from the current frontier model.

/** Models that are "topical this week" — edit before a weekly regeneration. */
export const TOPICAL_MODELS = ["Claude 5 Opus", "GPT-5.5", "Gemini 3 Ultra"];

export const CONTENT_POOL = {
  human: [
    {
      id: "pool-h-diary-1",
      text: "Forgot my umbrella so I just accepted the rain. Walked home slow on purpose. There's a version of a bad day that's actually kind of nice if you stop fighting it.",
      style: "diary entry",
    },
    {
      id: "pool-h-diary-2",
      text: "The upstairs neighbor got a treadmill. I know this because it is 6am and I can hear the exact rhythm of a man giving up on jogging.",
      style: "diary entry",
    },
    {
      id: "pool-h-review-1",
      text: "Zipper broke on day three. Emailed support, got a form reply, gave up. It's a fine bag if you never need the zipper, which, spoiler, is the entire point of a bag.",
      style: "product review",
    },
    {
      id: "pool-h-review-2",
      text: "My cat likes the box it came in more than the actual scratching post. Five stars for the box. Two for the post. Averaging to what you see here.",
      style: "product review",
    },
    {
      id: "pool-h-news-1",
      text: "The ferry was cancelled for the third straight day, stranding a knot of commuters who traded weather rumors and cold coffee on the dock before giving up around nine.",
      style: "news lede",
    },
    {
      id: "pool-h-news-2",
      text: "Someone painted the crosswalk on Fifth over the weekend — not the city, someone. It's slightly crooked and everyone seems to like it more than the official ones.",
      style: "news lede",
    },
    {
      id: "pool-h-recipe-1",
      text: "You'll want more garlic than feels reasonable, then double it. My uncle taught me this and my uncle was wrong about most things but not this.",
      style: "recipe intro",
    },
    {
      id: "pool-h-recipe-2",
      text: "This takes twenty minutes if you're honest and forty if you keep tasting the sauce, which you will, because the sauce is the whole reason you're here.",
      style: "recipe intro",
    },
    {
      id: "pool-h-social-1",
      text: "saw a guy at the gym curling in the squat rack and honestly at this point i respect the commitment to being the villain of everyone's story",
      style: "social post",
    },
    {
      id: "pool-h-travel-1",
      text: "The map said the temple was a ten minute walk. The map did not mention the ten minutes were vertical. Worth it, barely, mostly for the old woman selling oranges at the top.",
      style: "travel note",
    },
    {
      id: "pool-h-email-1",
      text: "quick one — did we ever hear back from the printer about the poster sizes? no rush, just don't want to be the reason it's late again lol",
      style: "email",
    },
    {
      id: "pool-h-review-3",
      text: "Bought it for the battery life everyone raves about. It's fine. It's a battery. It holds electricity and then it doesn't. I don't know what I expected to feel.",
      style: "product review",
    },
  ],
  ai: [
    {
      id: "pool-a-diary-1",
      text: "Today reminded me how important it is to slow down and cherish the present moment. Life is full of small blessings, and taking time to notice them makes all the difference.",
      style: "diary entry",
    },
    {
      id: "pool-a-diary-2",
      text: "Reflecting on the past week, I feel a deep sense of gratitude. Every challenge has been an opportunity for growth, and I am excited to continue this journey of self-improvement.",
      style: "diary entry",
    },
    {
      id: "pool-a-review-1",
      text: "This product truly delivers on its promises. The build quality is exceptional, the design is sleek and modern, and it has quickly become an essential part of my everyday life.",
      style: "product review",
    },
    {
      id: "pool-a-review-2",
      text: "I couldn't be happier with this purchase. It offers outstanding value for the price, performs reliably, and the customer service team was helpful and responsive throughout.",
      style: "product review",
    },
    {
      id: "pool-a-news-1",
      text: "Community leaders came together this week to celebrate a new initiative designed to foster growth and collaboration. The event was met with enthusiasm from residents and officials alike.",
      style: "news lede",
    },
    {
      id: "pool-a-news-2",
      text: "In a significant announcement, officials revealed plans that are expected to bring lasting benefits to the region. Experts believe the move marks an important milestone for the community.",
      style: "news lede",
    },
    {
      id: "pool-a-recipe-1",
      text: "This wholesome and satisfying dish is perfect for any occasion. Bursting with vibrant flavors and nutritious ingredients, it is sure to delight your family and impress your guests.",
      style: "recipe intro",
    },
    {
      id: "pool-a-recipe-2",
      text: "Whip up this quick and delicious meal in no time. With simple ingredients and easy steps, it's an ideal choice for busy weeknights when you want something both healthy and comforting.",
      style: "recipe intro",
    },
    {
      id: "pool-a-social-1",
      text: "Wishing everyone a wonderful day filled with positivity and joy! Remember, every small step forward is progress. Keep shining and never give up on your dreams! ✨ #inspiration",
      style: "social post",
    },
    {
      id: "pool-a-travel-1",
      text: "This destination is an absolute must-visit for any traveler. From breathtaking landscapes to rich cultural experiences, every moment here offers something truly unforgettable and inspiring.",
      style: "travel note",
    },
    {
      id: "pool-a-email-1",
      text: "I hope you are doing well. I am reaching out to kindly follow up on the status of our request. Please let me know if you require any further information from my side. Thank you.",
      style: "email",
    },
    {
      id: "pool-a-review-3",
      text: "After using this for several weeks, I can confidently say it exceeds expectations. It is versatile, dependable, and thoughtfully designed to make daily tasks easier and more enjoyable.",
      style: "product review",
    },
  ],
};
