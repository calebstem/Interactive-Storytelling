/* Pagination that supports content split by lines with a single '*' */
(function () {
	// Content Warning handling
	(function initContentWarning() {
		const cw = document.getElementById('cw');
		const btn = document.getElementById('cwContinue');
		if (!cw || !btn) return;
		
		const key = 'cw-dismissed-v1';
		const dismissed = localStorage.getItem(key) === '1';
		
		// Hide immediately if already dismissed
		if (dismissed) {
			cw.style.display = 'none';
			cw.setAttribute('hidden', '');
			return;
		}
		
		// Show warning and set up click handler
		cw.style.display = 'flex';
		btn.addEventListener('click', () => {
			localStorage.setItem(key, '1');
			cw.style.display = 'none';
			cw.setAttribute('hidden', '');
		});
	})();
	function getPageFromQuery() {
		const params = new URLSearchParams(window.location.search);
		const raw = parseInt(params.get('p') || '1', 10);
		if (Number.isNaN(raw) || raw < 1) return 1;
		return raw;
	}

	function setHref(el, page, disabled) {
		if (!el) return;
		if (disabled) {
			el.setAttribute('aria-disabled', 'true');
			el.setAttribute('tabindex', '-1');
			el.href = '#';
		} else {
			el.removeAttribute('aria-disabled');
			el.removeAttribute('tabindex');
			el.href = `index.html?p=${page}`;
		}
	}

	function splitPages(rawText) {
		if (!rawText) return [];
		// Normalize line endings and split on lines containing only '*'
		const normalized = String(rawText).replace(/\r\n?/g, '\n');
		const parts = normalized.split(/\n\s*\*\s*\n/g).map(s => s.trim());
		return parts.filter(Boolean);
	}

	// Simple image preloader cache
	const __preloaded = new Set();
	function preloadImage(url) {
		if (!url) return;
		try {
			const u = String(url);
			if (__preloaded.has(u)) return;
			__preloaded.add(u);
			const img = new Image();
			img.decoding = 'async';
			img.loading = 'eager';
			img.src = u;
		} catch (_) { /* ignore */ }
	}

	// Aggressive preloading of all background images
	function preloadAllBackgroundImages() {
		const backgroundImages = [
			'images/Kitchen.png',
			'images/bedroom.jpeg', 
			'images/pinball.jpeg',
			'images/Living_Room.jpeg',
			'images/drive.jpeg',
			'images/Bathroom.jpeg',
			'images/party.png',
			'images/outside.jpeg'
		];
		
		backgroundImages.forEach(url => {
			preloadImage(url);
		});
	}

	function preloadNeighborAssets(pages, currentIndex, radius = 2) {
		const len = pages.length;
		for (let d = 1; d <= radius; d++) {
			for (const sign of [-1, 1]) {
				const i = currentIndex + d * sign;
				if (i < 0 || i >= len) continue;
				const { meta } = parsePageMeta(pages[i]);
				if (meta.bgImage) preloadImage(meta.bgImage);
				if (meta.img) preloadImage(meta.img);
			}
		}
	}

	function renderContent(page, pages) {
		const contentRoot = document.getElementById('pageContent');
		if (!contentRoot) return;
		contentRoot.innerHTML = '';
		if (pages.length === 0) {
			const p = document.createElement('p');
			p.textContent = 'Paste your content into the hidden pagesData block (each * on its own line separates pages).';
			contentRoot.appendChild(p);
			return;
		}

		const index = Math.min(Math.max(page, 1), pages.length) - 1;

		// Parse optional page-level metadata like [bg=#112233], [bg-image=url(...)], [img=url(...)] at the top
		const { text: pageText, meta } = parsePageMeta(pages[index]);

		applyBackgroundMeta(meta);

		// Add inline image inside the container when [img=...] is provided
		if (meta.img) {
			const img = document.createElement('img');
			img.className = 'page-image';
			img.src = meta.img;
			if (meta.imgAlt) img.alt = meta.imgAlt; else img.alt = '';
			contentRoot.appendChild(img);
		}

		const highlightedText = applyHighlights(pageText, meta);
		const pageHtml = highlightedText
			.split('\n\n')
			.map(par => `<p>${par}</p>`) // simple paragraph split on double newlines
			.join('');
		contentRoot.innerHTML = pageHtml;

		// Preload neighbor pages' assets for smoother navigation
		preloadNeighborAssets(pages, index, 2);
	}

	function parsePageMeta(raw) {
		let text = raw || '';
		const meta = {};
		// Consume multiple leading [key=value] lines
		// Supported keys: bg, bg-image, img, img-alt, hl (word:color;word:color), page, title, label, note (the latter four are ignored in UI)
		// Example: [bg=#112233]\n[bg-image=url(img.jpg)]\n[img=url(img2.jpg)]\n
		while (true) {
			const m = text.match(/^\s*\[([a-zA-Z-]+)=([^\]]+)\]\s*\n?/);
			if (!m) break;
			const key = m[1].toLowerCase();
			let val = m[2].trim();
			// Strip optional url(...) wrapper
			const urlMatch = val.match(/^url\((.*)\)$/i);
			if (urlMatch) val = urlMatch[1].trim().replace(/^['"]|['"]$/g, '');
			if (key === 'bg' || key === 'bg-color') meta.bg = val;
			else if (key === 'bg-image') meta.bgImage = val;
			else if (key === 'img') meta.img = val;
			else if (key === 'img-alt') meta.imgAlt = val;
			else if (key === 'hl' || key === 'highlight') meta.hl = val; // e.g., hl=word:#f00;another:#00f
			// The following keys are kept only for author reference and not used in UI
			else if (key === 'page' || key === 'title' || key === 'label' || key === 'note') meta[key] = val;
			text = text.slice(m[0].length);
		}

		// Strip leading comment lines starting with // or ;; for author-only notes
		while (true) {
			const cm = text.match(/^\s*(?:\/\/|;;)\s.*\n/);
			if (!cm) break;
			text = text.slice(cm[0].length);
		}
		return { text: text.trim(), meta };
	}

	function applyBackgroundMeta(meta = {}) {
		const hostA = document.getElementById('bgA');
		const hostB = document.getElementById('bgB');
		if (!hostA || !hostB) {
			// Fallback to body background if layers not present
			if (meta.bg) document.body.style.backgroundColor = meta.bg;
			if (meta.bgImage) {
				document.body.style.backgroundImage = `url("${meta.bgImage}")`;
				document.body.style.backgroundSize = 'cover';
				document.body.style.backgroundPosition = 'center';
				document.body.style.backgroundRepeat = 'no-repeat';
			} else {
				document.body.style.backgroundImage = '';
			}
			return;
		}

		// Determine which layer is currently visible
		const aVisible = hostA.classList.contains('show');
		const current = aVisible ? hostA : hostB;
		const next = aVisible ? hostB : hostA;

		// Apply base color immediately to page
		if (meta.bg) document.body.style.backgroundColor = meta.bg;

		// If no image, just hide both layers
		if (!meta.bgImage) {
			current.style.backgroundImage = '';
			next.style.backgroundImage = '';
			return;
		}

		// Since images are preloaded, show immediately with cross-fade
		const url = String(meta.bgImage);
		next.style.backgroundImage = `url("${url}")`;
		next.classList.add('show');
		current.classList.remove('show');
	}

	function applyHighlights(text, meta = {}) {
		if (!meta.hl) return text;
		const rules = parseHighlightRules(meta.hl);
		if (!rules.length) return text;
		let output = text;
		for (const rule of rules) {
			const { word, color, size, weight, underline, background } = rule;
			const safeWord = escapeRegExp(word);
			if (!safeWord) continue;
			const re = new RegExp(`\\b(${safeWord})\\b`, 'gi');
			const styles = [];
			if (color) styles.push(`color:${color}`);
			if (size) styles.push(`font-size:${size}`);
			if (weight) styles.push(`font-weight:${weight}`);
			if (underline) styles.push('text-decoration:underline');
			if (background) styles.push(`background:${background}`);
			const styleAttr = styles.length ? ` style="${styles.join(';')}"` : '';
			output = output.replace(re, `<span class="hl"${styleAttr}>$1</span>`);
		}
		return output;
	}

	function parseHighlightRules(spec) {
		const parts = String(spec).split(/\s*[;,]\s*/);
		const rules = [];
		for (const part of parts) {
			// Support formats:
			//  word:#f00
			//  word:#f00|size=24px|weight=700|underline|bg=#ff0
			const [left, ...mods] = part.split('|').map(s => s.trim());
			if (!left) continue;
			const m = left.match(/^(.*?):\s*(.+)$/);
			if (!m) continue;
			const word = m[1].trim();
			const color = m[2].trim();
			if (!word) continue;
			const rule = { word, color };
			for (const mod of mods) {
				const mm = mod.match(/^(size|weight|bg|background)=([^=]+)$/i);
				if (mm) {
					const key = mm[1].toLowerCase();
					const val = mm[2].trim();
					if (key === 'size') rule.size = val; else if (key === 'weight') rule.weight = val; else if (key === 'bg' || key === 'background') rule.background = val;
					continue;
				}
				if (/^underline$/i.test(mod)) rule.underline = true;
			}
			rules.push(rule);
		}
		return rules;
	}

	function escapeRegExp(str) {
		return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}

	async function loadPages() {
		// Priority 1: inline block with id="pagesData" and type text/plain
		const inline = document.getElementById('pagesData');
		if (inline && inline.textContent.trim().length > 0) {
			return splitPages(inline.textContent);
		}
		// Priority 2: optional pages.txt file (best when served via http)
		try {
			const res = await fetch('pages.txt', { cache: 'no-store' });
			if (res.ok) {
				const txt = await res.text();
				const pages = splitPages(txt);
				if (pages.length > 0) return pages;
			}
		} catch (e) { /* ignore fetch errors for file:// */ }
		// Fallback: 100 placeholder pages
		return Array.from({ length: 100 }, (_, i) => `Placeholder content for page ${i + 1}.`);
	}

	loadPages().then((pages) => {
		// Start preloading all background images immediately
		preloadAllBackgroundImages();
		
		const currentPage = getPageFromQuery();
		const totalPages = pages.length > 0 ? pages.length : 1;
		const backLink = document.getElementById('backLink');
		const nextLink = document.getElementById('nextLink');

		// On first page, left arrow links to last page; otherwise previous page
		if (currentPage <= 1) {
			setHref(backLink, totalPages, false); // Link to last page
		} else {
			setHref(backLink, currentPage - 1, false);
		}
		
		// On last page, right arrow links to first page; otherwise next page
		if (currentPage >= totalPages) {
			setHref(nextLink, 1, false); // Link to first page
		} else {
			setHref(nextLink, currentPage + 1, false);
		}

		renderContent(currentPage, pages);

		// Keyboard navigation with ArrowLeft / ArrowRight
		document.addEventListener('keydown', (ev) => {
			// Do not navigate if content warning is active
			const cw = document.getElementById('cw');
			const cwVisible = cw && !cw.hasAttribute('hidden');
			if (cwVisible) return;

			if (ev.key === 'ArrowLeft' && currentPage > 1) {
				ev.preventDefault();
				window.location.href = `index.html?p=${currentPage - 1}`;
			} else if (ev.key === 'ArrowRight' && currentPage < totalPages) {
				ev.preventDefault();
				window.location.href = `index.html?p=${currentPage + 1}`;
			}
		});

		// Optional exporter: add [page=N] tags and download a copy
		(function maybeExportWithTags() {
			const params = new URLSearchParams(window.location.search);
			if (params.get('export') !== 'tags') return;
			const withTags = pages.map((p, idx) => {
				const n = idx + 1;
				// If a [page=] already exists at the top, keep it; otherwise prepend it
				const hasPage = /^\s*\[page=/.test(p);
				return (hasPage ? p : `[page=${n}]\n` + p).trim();
			}).join('\n*\n');
			const blob = new Blob([withTags], { type: 'text/plain;charset=utf-8' });
			const a = document.createElement('a');
			a.href = URL.createObjectURL(blob);
			a.download = 'pages.txt';
			document.body.appendChild(a);
			a.click();
			setTimeout(() => URL.revokeObjectURL(a.href), 1000);
			console.info('Downloaded pages.txt with [page=N] tags added.');
		})();
	});
})();


