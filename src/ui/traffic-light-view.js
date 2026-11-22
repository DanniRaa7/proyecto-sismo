const HTML_ESCAPE_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

const FEEDBACK_CLASS_MAP = {
  true: 'status-banner status-error',
  false: 'status-banner status-ok',
};

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (char) => HTML_ESCAPE_MAP[char]);
}

function buildEmptyNotice(message) {
  return `<p class="empty-note">${escapeHtml(message)}</p>`;
}

function buildRecordHeader(title, lightKey, badgeText) {
  return `<div class="record-head"><strong>${escapeHtml(title)}</strong><span class="pill light-${lightKey}">${escapeHtml(badgeText)}</span></div>`;
}

function buildSectorCard(sector, lightRules) {
  const lightLabel = lightRules[sector.trafficLight].label;
  const counts = `Red: ${sector.redCount} | Yellow: ${sector.yellowCount} | Green: ${sector.greenCount}`;
  const top = `<div class="sector-top"><span class="light-dot light-${sector.trafficLight}"></span><strong>${escapeHtml(sector.label)}</strong></div>`;
  const body = `<p class="sector-desc">${escapeHtml(sector.description)}</p><p class="sector-status">${escapeHtml(lightLabel)}</p><p class="sector-counts">${counts}</p>`;
  return `<article class="sector-card light-${sector.trafficLight}">${top}${body}</article>`;
}

function buildPropertyCard(item, rules) {
  const sectorLabel = rules.sectors[item.sector].label;
  const lightLabel = rules.trafficLights[item.trafficLight].label;
  const plan = item.insurancePlan;
  const head = buildRecordHeader(item.propertyName, item.trafficLight, lightLabel);
  const meta = `<p class="record-meta">${escapeHtml(sectorLabel)} | ${escapeHtml(item.propertyType)} | Damage: ${escapeHtml(item.damageLevel)}</p>`;
  const detail = `<p class="record-note">${escapeHtml(item.guidance)}</p><p class="record-action"><strong>${escapeHtml(plan.claimRoute)}</strong> (${escapeHtml(plan.responsibleAgency)}): ${escapeHtml(plan.nextStep)}</p>`;
  return `<article class="record-card light-${item.trafficLight}">${head}${meta}${detail}</article>`;
}

function buildCareFlagText(activeFlags, flagRules) {
  const labels = activeFlags.map((flagKey) => flagRules[flagKey].label);
  return labels.length ? labels.join(', ') : 'None';
}

function buildTriageCard(item, rules) {
  const sectorLabel = rules.sectors[item.sector].label;
  const badgeText = `${rules.trafficLights[item.trafficLight].label} (Score ${item.priorityScore})`;
  const flagsText = buildCareFlagText(item.activeFlags, rules.vulnerabilityFlags);
  const head = buildRecordHeader(item.fullName, item.trafficLight, badgeText);
  const meta = `<p class="record-meta">${escapeHtml(sectorLabel)} | Age ${item.age} (${escapeHtml(item.ageBracket.ruleTag)}) | Group: ${escapeHtml(item.groupProtocol.label)}</p>`;
  const detail = `<p class="record-note">Care flags: ${escapeHtml(flagsText)}</p><p class="record-action"><strong>${escapeHtml(item.groupProtocol.protocol)}</strong> - ${escapeHtml(item.groupProtocol.authority)}</p>`;
  return `<article class="record-card light-${item.trafficLight}">${head}${meta}${detail}</article>`;
}

function buildPropertyStats(report) {
  const ins = report.insuranceStatus;
  return [
    `Total: ${report.total}`,
    `Evacuate: ${report.evacuationCount}`,
    `Insured: ${ins.insured}`,
    `Mortgage: ${ins.mortgage}`,
    `Leasing: ${ins.leasing}`,
    `Uninsured: ${ins.uninsured}`,
  ].join(' | ');
}

function buildPopulationStats(report) {
  const age = report.ageBracket;
  const grp = report.group;
  return [
    `Total: ${report.total}`,
    `<10: ${age.underTen} | >10: ${age.youth} | >=18: ${age.adult} | >=60: ${age.senior}`,
    `Civilian: ${grp.civilian} | Military: ${grp.military} | Prison: ${grp.prison}`,
  ].join(' | ');
}

export class TrafficLightView {
  constructor(documentRef, rules) {
    this.documentRef = documentRef;
    this.rules = rules;
  }

  getElement(id) {
    return this.documentRef.getElementById(id);
  }

  renderCityLight(lightKey) {
    const info = this.rules.trafficLights[lightKey];
    const badge = this.getElement('city-light-badge');
    const text = this.getElement('city-light-text');
    badge.className = `city-badge light-${lightKey}`;
    badge.textContent = info.label;
    text.textContent = `${info.meaning}. ${info.action}.`;
  }

  renderSectors(sectors) {
    const grid = this.getElement('sector-grid');
    grid.innerHTML = sectors
      .map((sector) => buildSectorCard(sector, this.rules.trafficLights))
      .join('');
  }

  renderProperties(inspections, report) {
    this.getElement('property-summary').textContent = buildPropertyStats(report);
    const list = this.getElement('property-list');
    list.innerHTML = inspections.length
      ? inspections.map((item) => buildPropertyCard(item, this.rules)).join('')
      : buildEmptyNotice('No buildings checked yet. Add one above or load the practice drill.');
  }

  renderTriages(queue, report) {
    this.getElement('population-summary').textContent = buildPopulationStats(report);
    const list = this.getElement('priority-list');
    list.innerHTML = queue.length
      ? queue.map((item) => buildTriageCard(item, this.rules)).join('')
      : buildEmptyNotice('No people registered yet. Add one above or load the practice drill.');
  }

  renderSnapshot(snapshot) {
    this.renderCityLight(snapshot.cityTrafficLight);
    this.renderSectors(snapshot.sectors);
    this.renderProperties(snapshot.inspections, snapshot.propertyReport);
    this.renderTriages(snapshot.priorityQueue, snapshot.populationReport);
  }

  renderFeedback(message, isError = false) {
    const banner = this.getElement('status-banner');
    banner.className = FEEDBACK_CLASS_MAP[Boolean(isError)];
    banner.textContent = message;
  }
}
