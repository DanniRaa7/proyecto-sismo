const HTML_ESCAPE_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

const FEEDBACK_CLASS_MAP = {
  error: 'status-banner status-error',
  success: 'status-banner status-ok',
};

const VIEW_ELEMENT_IDS = {
  cityBadge: 'city-light-badge',
  cityText: 'city-light-text',
  sectorGrid: 'sector-grid',
  propertySummary: 'property-summary',
  propertyList: 'property-list',
  populationSummary: 'population-summary',
  priorityList: 'priority-list',
  statusBanner: 'status-banner',
};

const EMPTY_LIST_MESSAGES = {
  properties: 'No buildings checked yet. Add one above or load the practice drill.',
  triages: 'No people registered yet. Add one above or load the practice drill.',
};

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (char) => HTML_ESCAPE_MAP[char]);
}

function buildEmptyNotice(message) {
  return `<p class="empty-note">${escapeHtml(message)}</p>`;
}

function buildRecordHeader(title, lightKey, badgeText) {
  const safeTitle = escapeHtml(title);
  const safeBadge = escapeHtml(badgeText);
  return `<div class="record-head"><strong>${safeTitle}</strong><span class="pill light-${lightKey}">${safeBadge}</span></div>`;
}

function buildSectorBody(sector, lightLabel) {
  const counts = `Red: ${sector.redCount} | Yellow: ${sector.yellowCount} | Green: ${sector.greenCount}`;
  return [
    `<p class="sector-desc">${escapeHtml(sector.description)}</p>`,
    `<p class="sector-status">${escapeHtml(lightLabel)}</p>`,
    `<p class="sector-counts">${counts}</p>`,
  ].join('');
}

function buildSectorCard(sector, lightRules) {
  const lightLabel = lightRules[sector.trafficLight].label;
  const top = `<div class="sector-top"><span class="light-dot light-${sector.trafficLight}"></span><strong>${escapeHtml(sector.label)}</strong></div>`;
  const body = buildSectorBody(sector, lightLabel);
  return `<article class="sector-card light-${sector.trafficLight}">${top}${body}</article>`;
}

function buildPropertyDetail(item) {
  const plan = item.insurancePlan;
  const route = `<strong>${escapeHtml(plan.claimRoute)}</strong> (${escapeHtml(plan.responsibleAgency)})`;
  return [
    `<p class="record-note">${escapeHtml(item.guidance)}</p>`,
    `<p class="record-action">${route}: ${escapeHtml(plan.nextStep)}</p>`,
  ].join('');
}

function buildPropertyCard(item, rules) {
  const sectorLabel = rules.sectors[item.sector].label;
  const lightLabel = rules.trafficLights[item.trafficLight].label;
  const head = buildRecordHeader(item.propertyName, item.trafficLight, lightLabel);
  const meta = `<p class="record-meta">${escapeHtml(sectorLabel)} | ${escapeHtml(item.propertyType)} | Damage: ${escapeHtml(item.damageLevel)}</p>`;
  const detail = buildPropertyDetail(item);
  return `<article class="record-card light-${item.trafficLight}">${head}${meta}${detail}</article>`;
}

function buildCareFlagText(activeFlags, flagRules) {
  const labels = activeFlags.map((flagKey) => flagRules[flagKey].label);
  return labels.length ? labels.join(', ') : 'None';
}

function buildTriageDetail(item, flagRules) {
  const flagsText = buildCareFlagText(item.activeFlags, flagRules);
  const protocol = `<strong>${escapeHtml(item.groupProtocol.protocol)}</strong>`;
  const authority = escapeHtml(item.groupProtocol.authority);
  return [
    `<p class="record-note">Care flags: ${escapeHtml(flagsText)}</p>`,
    `<p class="record-action">${protocol} - ${authority}</p>`,
  ].join('');
}

function buildTriageCard(item, rules) {
  const sectorLabel = rules.sectors[item.sector].label;
  const badgeText = `${rules.trafficLights[item.trafficLight].label} (Score ${item.priorityScore})`;
  const head = buildRecordHeader(item.fullName, item.trafficLight, badgeText);
  const meta = `<p class="record-meta">${escapeHtml(sectorLabel)} | Age ${item.age} (${escapeHtml(item.ageBracket.ruleTag)}) | Group: ${escapeHtml(item.groupProtocol.label)}</p>`;
  const detail = buildTriageDetail(item, rules.vulnerabilityFlags);
  return `<article class="record-card light-${item.trafficLight}">${head}${meta}${detail}</article>`;
}

function buildPropertyStats(report) {
  const insuranceCounts = report.insuranceStatus;
  return [
    `Total: ${report.total}`,
    `Evacuate: ${report.evacuationCount}`,
    `Insured: ${insuranceCounts.insured}`,
    `Mortgage: ${insuranceCounts.mortgage}`,
    `Leasing: ${insuranceCounts.leasing}`,
    `Uninsured: ${insuranceCounts.uninsured}`,
  ].join(' | ');
}

function buildPopulationStats(report) {
  const ageCounts = report.ageBracket;
  const groupCounts = report.group;
  return [
    `Total: ${report.total}`,
    `<10: ${ageCounts.underTen} | >10: ${ageCounts.youth} | >=18: ${ageCounts.adult} | >=60: ${ageCounts.senior}`,
    `Civilian: ${groupCounts.civilian} | Military: ${groupCounts.military} | Prison: ${groupCounts.prison}`,
  ].join(' | ');
}

export class TrafficLightView {
  constructor(documentRef, rules) {
    this.documentRef = documentRef;
    this.rules = rules;
  }

  getElement(elementId) {
    return this.documentRef.getElementById(elementId);
  }

  renderCityLight(lightKey) {
    const lightRule = this.rules.trafficLights[lightKey];
    const badge = this.getElement(VIEW_ELEMENT_IDS.cityBadge);
    const text = this.getElement(VIEW_ELEMENT_IDS.cityText);
    badge.className = `city-badge light-${lightKey}`;
    badge.textContent = lightRule.label;
    text.textContent = `${lightRule.meaning}. ${lightRule.action}.`;
  }

  renderSectors(sectors) {
    const grid = this.getElement(VIEW_ELEMENT_IDS.sectorGrid);
    grid.innerHTML = sectors
      .map((sector) => buildSectorCard(sector, this.rules.trafficLights))
      .join('');
  }

  renderCardList(elementId, items, buildCard, emptyMessage) {
    const listElement = this.getElement(elementId);
    listElement.innerHTML = items.length
      ? items.map(buildCard).join('')
      : buildEmptyNotice(emptyMessage);
  }

  renderProperties(inspections, report) {
    this.getElement(VIEW_ELEMENT_IDS.propertySummary).textContent = buildPropertyStats(report);
    this.renderCardList(
      VIEW_ELEMENT_IDS.propertyList,
      inspections,
      (item) => buildPropertyCard(item, this.rules),
      EMPTY_LIST_MESSAGES.properties
    );
  }

  renderTriages(queue, report) {
    this.getElement(VIEW_ELEMENT_IDS.populationSummary).textContent = buildPopulationStats(report);
    this.renderCardList(
      VIEW_ELEMENT_IDS.priorityList,
      queue,
      (item) => buildTriageCard(item, this.rules),
      EMPTY_LIST_MESSAGES.triages
    );
  }

  renderSnapshot(snapshot) {
    this.renderCityLight(snapshot.cityTrafficLight);
    this.renderSectors(snapshot.sectors);
    this.renderProperties(snapshot.inspections, snapshot.propertyReport);
    this.renderTriages(snapshot.priorityQueue, snapshot.populationReport);
  }

  renderFeedback(message, isError = false) {
    const banner = this.getElement(VIEW_ELEMENT_IDS.statusBanner);
    const statusKey = isError ? 'error' : 'success';
    banner.className = FEEDBACK_CLASS_MAP[statusKey];
    banner.textContent = message;
  }
}
