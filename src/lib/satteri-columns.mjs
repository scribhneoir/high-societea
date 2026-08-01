/** Splits a page into side-by-side tracks at an author-placed marker.
 *
 *  Write `<div class="column-break"></div>` in the Markdown; everything above it
 *  becomes the first track and everything below the second:
 *
 *    <div class="columns">
 *      <div class="column"> …before… </div>
 *      <div class="column"> …after…  </div>
 *    </div>
 *
 *  The obvious tool is `break-before: column` in a CSS multi-column layout, and
 *  that is what this replaced: Firefox implements neither `break-before` nor
 *  `break-after: column` in multicol, so the break was quietly ignored and the
 *  heading stayed at the foot of the first column. (Forced breaks appear to work
 *  in small test cases only because the balancer happens to break in the same
 *  place.) Real boxes fragment nothing, so a grid lays them out identically in
 *  every engine.
 *
 *  Markdown emits a flat run of siblings, which is why this is a build step and
 *  not a stylesheet: there is nothing in the document to group the two halves
 *  with, so the grouping has to be made.
 *
 *  One split per document — the first marker wins, and any later one is left
 *  alone rather than nesting a second grid inside the second track. */

/** The marker as it reaches us: raw HTML, so this matches source text rather
 *  than a parsed element. Attribute quoting and inner whitespace vary with how
 *  it was typed; the tag name and class do not. */
const MARKER = /^<div\s+class=["']?column-break["']?\s*>\s*<\/div>$/;

/** Nodes handed to a new parent are rebuilt rather than reused, so the arena's
 *  internal fields don't travel with them into a subtree the compiler treats as
 *  new. Properties are shared — they hold no such fields. */
function clone(node) {
	switch (node.type) {
		case 'element':
			return {
				type: 'element',
				tagName: node.tagName,
				properties: node.properties,
				children: (node.children ?? []).map(clone),
			};
		case 'text':
		case 'raw':
		case 'comment':
			return { type: node.type, value: node.value };
		default:
			return node;
	}
}

const track = (children) => ({
	type: 'element',
	tagName: 'div',
	properties: { className: ['column'] },
	children: children.map(clone),
});

/** A factory rather than a plain definition: Sätteri calls it once per compile,
 *  which is what resets `handled` between documents. */
export default function satteriColumns() {
	let handled = false;

	return {
		name: 'columns',
		raw(node, ctx) {
			if (handled) return;
			if (!MARKER.test(node.value.trim())) return;

			// Top level only. A marker nested in a list or a blockquote would split
			// that element's children rather than the page, which is never what it
			// was written for.
			const parent = ctx.parent(node);
			if (parent?.type !== 'root') return;

			const index = ctx.indexOf(node);
			if (index === undefined) return;
			handled = true;

			const before = parent.children.slice(0, index);
			const after = parent.children.slice(index + 1);

			// The two tracks are returned in the marker's place, so the originals
			// have to go — they now live inside the wrapper as rebuilt copies.
			for (const sibling of before) ctx.removeNode(sibling);
			for (const sibling of after) ctx.removeNode(sibling);

			return {
				type: 'element',
				tagName: 'div',
				properties: { className: ['columns'] },
				children: [track(before), track(after)],
			};
		},
	};
}
