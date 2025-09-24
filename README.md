# Short Storytelling - Author Guide

This project renders a multi-page text from `pages.txt`. Pages are separated by a line that contains only `*`.

Open `main.html?p=1` to start. Use the arrow keys or the navbar to navigate.

## Page structure in `pages.txt`

Each page can begin with optional metadata lines in square brackets. Examples:

```
[page=29]
[title=Jimmy and Bitsy]
[bg=#111]
[bg-image=url(images/grain.jpg)]
[img=url(images/photo.jpg)]
[img-alt=A quiet room]
[hl=bath:#8B5CF6|size=24px|underline; water:#0EA5E9|weight=700; towel:#F59E0B]

Your page text starts here. Use blank lines to separate paragraphs.
```

- `bg`: CSS color for the page background (e.g., `#111`, `antiquewhite`, `rgb(0,0,0)`).
- `bg-image`: background image for the page, accepts `url(...)` or a bare path.
- `img`: inline image shown above the text container; accepts `url(...)` or a bare path.
- `img-alt`: alt text for the inline image.
- `hl`: per-word highlight rules. Format is `word:color` pairs separated by `;` or `,`. Add optional style modifiers after `|`:
  - `size=24px` or `size=1.25em`
  - `weight=700` (or `bold`)
  - `underline`
  - `bg=#ff0` or `background=#ff0`

Examples:
```
[hl=night:#3498db; scream:#ef4444|weight=700|underline; water:#0aa|size=1.2em|bg=#ddf]
```
- Matching is whole-word and case-insensitive.

## Author-only tags and comments

These are parsed and stripped from display (for your reference only):
- `page`, `title`, `label`, `note`
- Lines beginning with `//` or `;;` are treated as comments and removed.

## Images and backgrounds

- Background images are applied to the page body and are set to `cover`, centered, no-repeat.
- Inline images scale to the container width and keep aspect ratio.

## Content warning overlay

On first load (per tab session), a full-screen content warning appears. Click CONTINUE to proceed.

## Exporting a tagged copy

Visit `main.html?p=1&export=tags` to download a copy of `pages.txt` with `[page=N]` tags added to each page (site display unaffected).

## Typography

Body text uses Merriweather via Adobe Fonts. Adjust text styling in `styles.css` under the `.Text` rules.

## Notes

- The site reads from `pages.txt`. You can also paste content into the hidden `<script id="pagesData" type="text/plain">` block in `main.html` for quick tests.
- If something doesn’t render as expected, check for missing separators (`*`) or malformed metadata lines.
