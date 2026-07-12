import sampleBank from "./data/sample-passages.json";
import type { PassageBank } from "./types/passage";

const bank = sampleBank as PassageBank;

export default function App() {
  return (
    <main className="app-shell">
      <h1>Spot the Bot</h1>
      <p>
        Ten passages are coming. Tap human or AI on each, then see who fooled
        you. ({bank.passages.length} sample passages loaded for week of{" "}
        {bank.weekOf}.)
      </p>
    </main>
  );
}
