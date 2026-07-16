const REPO_URL = "https://github.com/ctkrug/spot-the-bot";
const PORTFOLIO_URL = "https://apps.charliekrug.com";

interface AboutProps {
  /** ISO date of the bank currently in play, surfaced in the copy. */
  weekOf: string;
}

/**
 * Below-the-fold explainer + FAQ. Lives under the game so the page answers
 * "is this an AI or human text game" for a first-time visitor (and a search
 * engine) without cluttering the round itself.
 */
export function About({ weekOf }: AboutProps) {
  return (
    <section className="about" aria-labelledby="about-title">
      <div className="about__inner">
        <h1 id="about-title" className="about__title">
          The daily AI-or-human test that scores your AIQ
        </h1>
        <p className="about__lede">
          Spot the Bot deals you a fresh Daily Case: ten short passages, one verdict each —
          human or AI. It starts almost insultingly easy (if you can spot an em dash and a
          &ldquo;delve,&rdquo; you&rsquo;ll feel like a genius) and climbs to expert-tier
          fakes; the final exhibit is always the machine&rsquo;s best work. Your score
          becomes an <strong>AIQ</strong> on a real IQ curve — 100 is dead average, 160 is
          perfect detection. And the labels are real on both sides: every human passage is
          genuine, attributed writing (Scott&rsquo;s Antarctic diary, Darwin&rsquo;s
          crankiest letter, a 1924 sports lede), and every AI passage was actually written
          by the model it names.
        </p>

        <h2 className="about__heading">The Daily Case</h2>
        <p>
          Everyone who plays on the same day gets the same ten passages, so scores are
          comparable — share your result grid without spoiling a single answer. Miss a day
          and your streak resets; the next case lands at midnight, your time. Finished
          today&rsquo;s case? There&rsquo;s an unlimited practice mode, dealt at random from
          the same bank (currently the week of <strong>{weekOf}</strong>).
        </p>

        <h2 className="about__heading">Where the passages come from</h2>
        <ul className="about__features">
          <li>
            <strong>Human passages are real and attributed.</strong> They&rsquo;re drawn from
            public-domain writing — diaries, letters, dispatches, cookbooks — and the reveal
            names the author and year. Where spelling was modernized or an excerpt condensed,
            the attribution says &ldquo;adapted.&rdquo;
          </li>
          <li>
            <strong>AI passages are really AI.</strong> Each one names the model that
            actually produced it — including the hard tier, written by a model told to pass
            as human. No fabricated attributions, ever: if a passage says a model wrote it,
            that model wrote it.
          </li>
          <li>
            <strong>Every card teaches you a tell.</strong> Right or wrong, you get the
            attribution and a one-line read on what gives the passage away.
          </li>
          <li>
            <strong>Runs entirely in your browser.</strong> No account and no tracking of
            your play; streaks and stats live in localStorage.
          </li>
        </ul>

        <h2 className="about__heading">FAQ</h2>
        <dl className="about__faq">
          <dt>Is this an AI or human text game?</dt>
          <dd>
            Yes. Ten short passages a day, and your only job is to judge each one human or
            AI, then see how many you got right — and which model fooled you.
          </dd>

          <dt>How do you tell if writing is AI or human?</dt>
          <dd>
            Look for the tells. Classic AI writing reaches for tidy summary sentences, even
            sentiment, and stock phrases. But modern models can fake mess and specificity,
            which is exactly what the hard tier here does — the reveal explains the subtler
            tells, like punchlines that land a beat too cleanly or a lede with no checkable
            facts in it.
          </dd>

          <dt>Are the quotes really from Scott, Twain, and Keats?</dt>
          <dd>
            Yes — the human side is public-domain writing with the author, work, and year
            shown after you guess. Attributions marked &ldquo;adapted&rdquo; mean modernized
            spelling or a condensed excerpt, never changed substance.
          </dd>

          <dt>When do new passages arrive?</dt>
          <dd>
            A new case is dealt daily from the current bank, and the bank itself refreshes
            weekly — with fresh model-written passages when the live generation pipeline
            runs.
          </dd>

          <dt>Do I need an account?</dt>
          <dd>No. Open the link and play. Your streaks and stats stay in your browser.</dd>
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
