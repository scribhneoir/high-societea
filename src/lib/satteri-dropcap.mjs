/** Wraps the opening letter of a page's first paragraph in a span, so the sunk
 *  capital is a real element rather than ::first-letter.
 *
 *  The pseudo-element is the obvious tool and is what the stylesheet used, but
 *  engines only apply a subset of properties to it and `mask` is outside that
 *  subset — which left the cap as the one piece of display type on the page with
 *  no wear on it. A real element takes every declaration.
 *
 *  Two behaviours of ::first-letter are worth reproducing, because losing them
 *  would show:
 *
 *    - Opening punctuation travels with the letter, so a paragraph that starts
 *      on a quote sinks the quote and the letter together rather than leaving
 *      the quote stranded at body size.
 *    - A paragraph that opens inside an element (**bold**, *em*, a link) gets
 *      the span nested in there, so the cap inherits that element's styling the
 *      way the pseudo-element would have.
 *
 *  Markdown pages only — an .astro page using .prose would need its own wrapper.
 *  The span is emitted whether or not the page asked for a cap; with
 *  `dropcap: false` no rule matches it and it does nothing. */

/** Leading whitespace, then any opening punctuation, then the letter itself.
 *  The last group is \S rather than . so that a whitespace-only text node can't
 *  backtrack into matching a space as its "letter". */
const OPENING = /^(\s*)(["'“‘«¿¡(\[{]*)(\S)/u;

/** Returns a new children array with the first letter wrapped, or null if this
 *  subtree holds no letter to wrap. Depth-first, because the letter may sit
 *  inside an inline element. Untouched siblings are reused by reference — only
 *  the path down to the split is rebuilt. */
function wrapFirstLetter(children) {
	for (let i = 0; i < children.length; i++) {
		const child = children[i];

		if (child.type === 'text') {
			const match = OPENING.exec(child.value);
			if (!match) continue; // whitespace-only node — keep looking

			const [whole, lead, punctuation, letter] = match;
			const rest = child.value.slice(whole.length);
			const split = [];

			if (lead) split.push({ type: 'text', value: lead });
			split.push({
				type: 'element',
				tagName: 'span',
				properties: { className: ['dropcap-letter'] },
				children: [{ type: 'text', value: punctuation + letter }],
			});
			if (rest) split.push({ type: 'text', value: rest });

			return [...children.slice(0, i), ...split, ...children.slice(i + 1)];
		}

		if (child.type === 'element') {
			const inner = wrapFirstLetter(child.children ?? []);
			if (inner) {
				const rebuilt = {
					type: 'element',
					tagName: child.tagName,
					properties: child.properties,
					children: inner,
				};
				return [...children.slice(0, i), rebuilt, ...children.slice(i + 1)];
			}
		}
	}

	return null;
}

/** A factory rather than a plain definition: Sätteri calls it once per compile,
 *  which is what resets `handled` between documents. */
export default function satteriDropcap() {
	let handled = false;

	return {
		name: 'dropcap',
		element: {
			filter: ['p'],
			visit(node, ctx) {
				// Only the first top-level paragraph, matching the stylesheet's
				// `> p:first-of-type`. Set before the letter search so a first
				// paragraph with nothing to wrap doesn't hand the cap to the second.
				if (handled) return;
				if (ctx.parent(node)?.type !== 'root') return;
				handled = true;

				const children = wrapFirstLetter(node.children ?? []);
				if (!children) return;

				// Rebuilt rather than spread, to avoid carrying the arena's internal
				// fields across into a node the compiler treats as new.
				return {
					type: 'element',
					tagName: node.tagName,
					properties: node.properties,
					children,
				};
			},
		},
	};
}
