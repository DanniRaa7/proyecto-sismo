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

const TAB_STYLE_MAP = {
  public: {
    publicPanel: 'tab-panel',
    privatePanel: 'tab-panel is-hidden',
    publicButton: 'tab-btn tab-active',
    privateButton: 'tab-btn',
  },
  private: {
    publicPanel: 'tab-panel is-hidden',
    privatePanel: 'tab-panel',
    publicButton: 'tab-btn',
    privateButton: 'tab-btn tab-active',
  },
};

const VIEW_ELEMENT_IDS = {
  cityBadge: 'city-light-badge',
  cityText: 'city-light-text',
  kpiGrid: 'bi-kpi-grid',
  sectorGrid: 'sector-grid',
  publicPanel: 'public-panel',
  privatePanel: 'private-panel',
  publicButton: 'tab-public-btn',
  privateButton: 'tab-private-btn',
  searchResults: 'claim-search-results',
  propertySummary: 'property-summary',
  propertyList: 'property-list',
  populationSummary: 'population-summary',
  priorityList: 'priority-list',
  statusBanner: 'status-banner',
};

const EMPTY_LIST_MESSAGES = {
  properties: 'No buildings inspected yet. Use the Private Inspector tab or load the practice drill.',
  triages: 'No citizens registered yet. Use the Private Inspector tab or load the practice drill.',
  search: 'No matching buildings found. Load the practice drill or add an inspection first.',
};

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (char) => HTML_ESCAPE_MAP[char]);
}

function buildEmptyNotice(message) {
  return `<p class="empty-note">${escapeHtml(message)}</p>`;
}

function buildKpiCard(label, value, toneClass) {
  return `<div class="kpi-card ${toneClass}"><span class="kpi-value">${value}</span><span class="kpi-label">${escapeHtml(label)}</span></div>`;
}

function buildKpiGrid({ propertyReport, populationReport }) {
  const { habitability } = propertyReport;
  return [
    buildKpiCard('Total Properties', propertyReport.total, 'kpi-neutral'),
    buildKpiCard('Uninhabitable (Red)', habitability.uninhabitable, 'light-red'),
    buildKpiCard('At Risk (Yellow)', habitability.atRisk, 'light-yellow'),
    buildKpiCard('Safe for Use (Green)', habitability.safe, 'light-green'),
    buildKpiCard('Uninsured High Risk', propertyReport.uninsuredHighRiskCount, 'light-red'),
    buildKpiCard('Ambulances Needed', populationReport.ambulanceCount, 'light-yellow'),
  ].join('');
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
    `<p class="sector-alert">${escapeHtml(sector.alert)}</p>`,
    `<p class="sector-status">${escapeHtml(lightLabel)} (${counts})</p>`,
  ].join('');
}

function buildSectorCard(sector, lightRules) {
  const lightLabel = lightRules[sector.trafficLight].label;
  const top = `<div class="sector-top"><span class="light-dot light-${sector.trafficLight}"></span><strong>${escapeHtml(sector.label)}</strong></div>`;
  const body = buildSectorBody(sector, lightLabel);
  return `<article class="sector-card light-${sector.trafficLight}">${top}${body}</article>`;
}

function buildPropertyEvidenceLine(item, rules) {
  const inspectorLabel = rules.inspectorRoles[item.inspectorRole].label;
  const photoText = item.hasPhotoEvidence ? item.evidencePhoto : 'No photo attached';
  const inventoryText = item.damageInventory || 'No inventory logged';
  return `<p class="record-note">${escapeHtml(inspectorLabel)} | Photo: ${escapeHtml(photoText)} | Inventory: ${escapeHtml(inventoryText)}</p>`;
}

function buildPropertyCard(item, rules) {
  const sectorLabel = rules.sectors[item.sector].label;
  const occupantLabel = rules.occupantRoles[item.occupantRole].label;
  const lightLabel = rules.trafficLights[item.trafficLight].label;
  const plan = item.insurancePlan;
  const head = buildRecordHeader(item.propertyName, item.trafficLight, lightLabel);
  const meta = `<p class="record-meta">${escapeHtml(sectorLabel)} | ${escapeHtml(item.propertyType)} (${escapeHtml(occupantLabel)}) | Damage: ${escapeHtml(item.damageLevel || 'pending')}</p>`;
  const evidence = buildPropertyEvidenceLine(item, rules);
  const action = `<p class="record-action"><strong>${escapeHtml(plan.claimRoute)}</strong> (${escapeHtml(plan.responsibleAgency)}): ${escapeHtml(plan.nextStep)}</p>`;
  return `<article class="record-card light-${item.trafficLight}">${head}${meta}${evidence}${action}</article>`;
}

function buildCareFlagText(activeFlags, flagRules) {
  const labels = activeFlags.map((flagKey) => flagRules[flagKey].label);
  return labels.length ? labels.join(', ') : 'None';
}

function buildTriageDetail(item, flagRules) {
  const flagsText = buildCareFlagText(item.activeFlags, flagRules);
  const ambulanceTag = item.needsAmbulance ? ' | AMBULANCE REQUIRED' : '';
  const protocol = `<strong>${escapeHtml(item.groupProtocol.protocol)}</strong>`;
  const authority = escapeHtml(item.groupProtocol.authority);
  return [
    `<p class="record-note">Care flags: ${escapeHtml(flagsText)}${ambulanceTag}</p>`,
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
  const { insured, mortgage, leasing, uninsured } = report.insuranceStatus;
  return [
    `Total: ${report.total} | Evacuate: ${report.evacuationCount}`,
    `Evidence Photos: ${report.withEvidenceCount}`,
    `Insured: ${insured} | Mortgage: ${mortgage} | Leasing: ${leasing} | Uninsured: ${uninsured}`,
  ].join(' | ');
}

function buildPopulationStats(report) {
  const ageCounts = report.ageBracket;
  const groupCounts = report.group;
  return [
    `Total: ${report.total}`,
    `Ambulances: ${report.ambulanceCount}`,
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

  setActiveTab(tabKey) {
    const styles = TAB_STYLE_MAP[tabKey] || TAB_STYLE_MAP.public;
    this.getElement(VIEW_ELEMENT_IDS.publicPanel).className = styles.publicPanel;
    this.getElement(VIEW_ELEMENT_IDS.privatePanel).className = styles.privatePanel;
    this.getElement(VIEW_ELEMENT_IDS.publicButton).className = styles.publicButton;
    this.getElement(VIEW_ELEMENT_IDS.privateButton).className = styles.privateButton;
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

  renderSearchResults(matches) {
    this.renderCardList(
      VIEW_ELEMENT_IDS.searchResults,
      matches,
      (item) => buildPropertyCard(item, this.rules),
      EMPTY_LIST_MESSAGES.search
    );
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
    this.getElement(VIEW_ELEMENT_IDS.kpiGrid).innerHTML = buildKpiGrid(snapshot);
    this.renderSectors(snapshot.sectors);
    this.renderProperties(snapshot.inspections, snapshot.propertyReport);
    this.renderTriages(snapshot.priorityQueue, snapshot.populationReport);
    this.renderSearchResults(snapshot.inspections);
  }

  renderFeedback(message, isError = false) {
    const banner = this.getElement(VIEW_ELEMENT_IDS.statusBanner);
    const statusKey = isError ? 'error' : 'success';
    banner.className = FEEDBACK_CLASS_MAP[statusKey];
    banner.textContent = message;
  }
}
