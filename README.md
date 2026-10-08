# Letter Match

A small game for learning to tell similar letters apart. A black letter starts in the middle. Slide it onto the grey copy of the same letter. Works with arrow keys or swipes, on desktop and phone.

## Files

- `index.html`: page layout and styles.
- `game.js`: game logic and difficulty settings. Shared by all languages.
- `languages/kn.js`, `hi.js`, `ta.js`: one file per script. Each holds the letters, the Google font, and the distractors for each letter.

## Running it

Open `index.html` in a browser, or use the GitHub Pages URL. Pick a language from the menu at the top, or add `?lang=hi` (or `kn`, `ta`) to the URL.

## Adding a language

1. Copy `languages/kn.js` to `languages/<code>.js`.
2. Set `code`, `name`, and `font`. The font must be a Google Fonts family.
3. List the target letters in `letters`.
4. For each letter, list at least three look-alike letters in `distractors`. The game warns in the browser console if a letter has fewer than three.
5. Add a `<script src="languages/<code>.js"></script>` line to `index.html`, before `game.js`.

## Notes

- The Kannada, Hindi and Tamil distractor lists are drafts based on letter shape. They need review by a reader of each script before use with learners.
- Difficulty settings are at the top of `game.js`: untimed rounds, the timer start, step and floor, and the round where left and right arms appear.
