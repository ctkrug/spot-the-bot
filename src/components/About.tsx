const REPO_URL = "https://github.com/ctkrug/spot-the-bot";
const PORTFOLIO_URL = "https://apps.charliekrug.com";

interface AboutProps {
  /** ISO date of the bank currently in play, surfaced in the copy. */
  weekOf: string;
}

/**
 * Below-the-fold explainer + FAQ. Lives under the game so the page answers
 * "is this an AI or human text game" for a first-time visitor (and a search
 * engine) without cluttering the round itself. Styled to match docs/DESIGN.md.
 */
export function About({ weekOf }: AboutProps) {
  return (
    <section className="about" aria-labelledby="about-title">
      <div className="about__inner">
        <h1 id="about-title" className="about__title">
          An AI or human text game that refreshes every week
        </h1>
        <p className="about__lede">
          Spot the Bot is a quick browser game: read ten short passages and guess, one at
          a time, whether each was written by a human or by AI. No login, no install,
          about two minutes a round. The catch is that the passages are not a fixed set. A
          new batch is generated every Monday against whatever AI model is topical that
          week, so the writing you judge keeps pace with the models people actually use.
        </p>

        <h2 className="about__heading">Why it stays fresh</h2>
        <p>
          Most guess-the-AI quizzes ship one hardcoded set of examples and never touch it
          again. They are fun for a week and then stale, because model writing moves
          faster than any hand-picked list. Spot the Bot regenerates its passage bank on a
          weekly schedule and keeps every past bank, so your round always draws from
          writing no older than the current week. The bank in play right now is the week
          of <strong>{weekOf}</strong>.
        </p>

        <h2 className="about__heading">What you get</h2>
        <ul className="about__features">
          <li>
            <strong>Ten passages, one verdict each.</strong> No back button and no
            second-guessing, the way you would actually skim text in the wild.
          </li>
          <li>
            <strong>The reveal names names.</strong> If the same model fooled you twice,
            it calls that model out by name, not just a shrug at &ldquo;AI.&rdquo;
          </li>
          <li>
            <strong>A spoiler-free score card.</strong> Copy your result and share it
            without giving away the week&rsquo;s answers.
          </li>
          <li>
            <strong>Runs entirely in your browser.</strong> No account and no tracking;
            your streak and best score are saved locally.
          </li>
        </ul>

        <h2 className="about__heading">FAQ</h2>
        <dl className="about__faq">
          <dt>Is this an AI or human text game?</dt>
          <dd>
            Yes. Every round is ten short passages, and your only job is to guess AI or
            human for each one, then see how many you got right.
          </dd>

          <dt>How do you guess if writing is AI or human?</dt>
          <dd>
            Look for the tells. AI writing often reaches for tidy summary sentences, even
            sentiment, and stock phrases like &ldquo;a testament to&rdquo; or &ldquo;in
            today&rsquo;s world.&rdquo; Human writing tends to be messier, more specific,
            and willing to leave a thought unfinished. Spot the Bot is a low-stakes way to
            practice guessing AI or human writing on fresh examples.
          </dd>

          <dt>Can you really spot AI generated text?</dt>
          <dd>
            Sometimes, and it depends on the style and the model. That is the whole point:
            to find out how good you actually are at spotting AI generated text this week,
            not last year.
          </dd>

          <dt>How often do the passages change?</dt>
          <dd>
            Every Monday. A new bank is generated against the model that is topical that
            week, and old banks are kept so the game never goes stale.
          </dd>

          <dt>Do I need an account?</dt>
          <dd>
            No. Open the link and play. Your streak and best score stay in your browser.
          </dd>
        </dl>

        <div className="about__cta">
          <a className="btn btn--primary" href={REPO_URL} rel="noreferrer">
            View on GitHub
          </a>
        </div>

        <p className="about__colophon">
          More by Charlie Krug &rarr;{" "}
          <a href={PORTFOLIO_URL} rel="noreferrer">
            apps.charliekrug.com
          </a>
        </p>
      </div>
    </section>
  );
}
