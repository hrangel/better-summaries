var readyStateCheckInterval = setInterval(function() {
	if (document.readyState === "complete" && hasAlreadyLoadedReactContent()) {
		clearInterval(readyStateCheckInterval);
		setTimeout(() => {
			doInit();
		}, 300);
	}
}, 10);

function hasAlreadyLoadedReactContent() {
	return $('h4').length > 0;
}

function listenScores(callback) {
	var port = chrome.runtime.connect({name: "listenScores"});
	port.postMessage('listenScores');
	port.onMessage.addListener(function(msg) {
		callback(msg);
	});
}


function doInit() {
	reloadScores();
	setInterval(() => {
		console.log('reloading');
		reloadScores();
	}, 600000);
	listenScores(function(response) {
		console.log('response', response);
		if (response) {
			reloadScores();
		}
	});
}

const colors = {
	pending: 'rgb(0,0,0)',
	started: 'rgb(0, 53, 69)',
	merged: 'rgb(238, 193, 7)',
	tested: 'rgb(243, 147, 0)', 
	approved: 'rgb(98, 146, 0)',
}

function isPending(col, svg) {
	return !svg || svg.length === 0;
}
function isStarted(col, svg) {
	return $(svg).css('color') === colors.started;
}
function isMerged(col, svg) {
	return $(svg).css('color') === colors.merged;
}
function isTested(col, svg) {
	return $(svg).css('color') === colors.tested;
}
function isApproved(col, svg) {
	return $(svg).css('color') === colors.approved;
}

function getValue(col) {
	const value = $(col).text().trim();
	if (value === '-') {
		return 0;
	}
	
	try {
		const floatVal = parseFloat(value);
		if (!isNaN(floatVal))
			return floatVal;
	} catch (ex) {
		console.error(ex);
		return 0;
	}
}

function checkColumn(col, totals) {
	const hours = getValue(col);
	if (hours === 0) {
		return;
	}
	totals.total = totals.total + hours;
	const svg = $(col).children('svg:first');
	if (isPending(col, svg)) {
		totals.pending = totals.pending + hours;
	} else if (isStarted(col, svg)) {
		totals.started = totals.started + hours;
	} else if (isMerged(col, svg)) {
		totals.merged = totals.merged + hours;
	} else if (isTested(col, svg)) {
		totals.tested = totals.tested + hours;
	} else if (isApproved(col, svg)) {
		totals.approved = totals.approved + hours;
	}
}

function reloadScores() {
	console.log('reloadScores');
	const tables = $('table');
	const initialTable = $("h4:contains('Urgent')").length > 0 ? 1 : 0;
	const maxTables = initialTable + ($("h4:contains('Urgent')").length > 0 ? 1 : 1);
	for (let t = initialTable; t < Math.min(tables.length, maxTables); t++) {
		const designTotals = { pending: 0, started: 0, merged: 0, tested: 0, approved: 0, total: 0 };
		const backTotals = { pending: 0, started: 0, merged: 0, tested: 0, approved: 0, total: 0 };
		const frontTotals = { pending: 0, started: 0, merged: 0, tested: 0, approved: 0, total: 0 };
		const table = tables[t];
		const rows = $(table).find('> tbody > tr');
		const headersLen = $(table).find('> thead > tr > th').length;
		const designIdx = headersLen - 5;
		for (let r = 0; r < rows.length; r++) {
			const row = rows[r];
			const columns = $(row).children('td');
			checkColumn(columns[designIdx], designTotals);
			checkColumn(columns[designIdx + 1], backTotals);
			checkColumn(columns[designIdx + 2], frontTotals);
		}

		addOrUpdateTotalsRow(table, headersLen, designTotals, backTotals, frontTotals, 'pending', 'Pending');
		addOrUpdateTotalsRow(table, headersLen, designTotals, backTotals, frontTotals, 'started', 'Started');
		addOrUpdateTotalsRow(table, headersLen, designTotals, backTotals, frontTotals, 'merged', 'Merged');
		addOrUpdateTotalsRow(table, headersLen, designTotals, backTotals, frontTotals, 'tested', 'Tested');
		addOrUpdateTotalsRow(table, headersLen, designTotals, backTotals, frontTotals, 'approved', 'Approved');
	}
}

function addOrUpdateTotalsRow(table, colCount, design, back, front, property, name) {
	const className = 'ext-total-' + property;
	let row =  $(table).find('> tfoot > tr.' + className);
	if (!row || row.length === 0) {
		const style = `style="color: ${colors[property]} !important;"`;
		$(table).children('tfoot').append(`<tr class='MuiTableRow-root MuiTableRow-footer ${className}'>
			<td class="MuiTableCell-root MuiTableCell-footer"></td>
			<td class="MuiTableCell-root MuiTableCell-footer"></td>
			${colCount === 9 ? '<td class="MuiTableCell-root MuiTableCell-footer"></td>' : ''}
			<td class="MuiTableCell-root MuiTableCell-footer MuiTableCell-alignRight dynamic-label" ${style}></td>
			<td class="MuiTableCell-root MuiTableCell-footer MuiTableCell-alignRight design" ${style}></td>
			<td class="MuiTableCell-root MuiTableCell-footer MuiTableCell-alignRight back" ${style}></td>
			<td class="MuiTableCell-root MuiTableCell-footer MuiTableCell-alignRight front" ${style}></td>
			<td class="MuiTableCell-root MuiTableCell-footer MuiTableCell-alignRight"></td>
			<td class="MuiTableCell-root MuiTableCell-footer MuiTableCell-alignRight"></td>
		</tr>`);
		
		row =  $(table).find('> tfoot > tr.' + className);
	}

	$(row).children('td.dynamic-label').text(name);
	setValue(row, design, property, 'design');
	setValue(row, back, property, 'back');
	setValue(row, front, property, 'front');
}

function setValue(row, totals, property, keyColumn) {
	if (totals.total > 0) {
		const rounded = round(totals[property]);
		const pct = Math.round((rounded / totals.total) * 100);
		$(row).children('td.' + keyColumn).text(rounded + ' ('+pct+'%)');
	} else {
		$(row).children('td.' + keyColumn).text("");
	}
}

function round(val) { return Math.round(val * 10) / 10; }

