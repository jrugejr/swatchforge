import { ownedItems, findItem } from './itemLogic.js';

function matchesRule(item, rule = {}) {
  const typeOk = !rule.productType || rule.productType === 'Any' || item.productType === rule.productType;
  const familyOk = !rule.colorFamily || rule.colorFamily === 'Any' || item.colorFamily === rule.colorFamily;
  const finishOk = !rule.finish || rule.finish === 'Any' || item.finish === rule.finish;
  const opacityOk = !rule.opacity || rule.opacity === 'Any' || item.opacity === rule.opacity;
  const tagRules = Array.isArray(rule.tags) ? rule.tags : [];
  const itemTags = new Set((item.tags || []).map(tag => String(tag).toLowerCase()));
  const tagsOk = !tagRules.length || tagRules.some(tag => itemTags.has(String(tag).toLowerCase()));
  return typeOk && familyOk && finishOk && opacityOk && tagsOk;
}

export function stepsForLook(data, lookId) {
  return data.lookSteps.filter(step => step.lookId === lookId).sort((a, b) => a.stepNumber - b.stepNumber);
}

export function evaluateLook(data, lookId) {
  const steps = stepsForLook(data, lookId);
  const owned = ownedItems(data);
  const results = steps.map(step => {
    const linked = (step.linkedItemIds || []).map(id => findItem(data, id)).filter(Boolean);
    const exactOwned = linked.filter(item => owned.some(ownedItem => ownedItem.id === item.id));
    const substitutions = owned.filter(item => matchesRule(item, step.replacementRule) && !exactOwned.some(exact => exact.id === item.id));
    let status = 'ok';
    let message = 'Covered';

    if (step.requirementType === 'Exact Required' || step.requirementType === 'Tool Required') {
      status = exactOwned.length ? 'ok' : 'missing';
      message = exactOwned.length ? 'Exact item owned' : 'Missing required item';
    } else if (step.requirementType === 'Similar Allowed') {
      status = exactOwned.length || substitutions.length ? 'ok' : 'missing';
      message = exactOwned.length ? 'Exact item owned' : substitutions.length ? 'Substitution available' : 'No matching item found';
    } else if (step.requirementType === 'Any Color Works') {
      status = substitutions.length || exactOwned.length ? 'ok' : 'missing';
      message = status === 'ok' ? 'Matching item available' : 'No matching item found';
    } else if (step.requirementType === 'Optional') {
      status = exactOwned.length || substitutions.length ? 'optional-owned' : 'optional-missing';
      message = exactOwned.length || substitutions.length ? 'Optional item available' : 'Optional item missing';
    }

    return { step, linked, exactOwned, substitutions, status, message };
  });
  const blockingMissing = results.filter(result => result.status === 'missing');
  return {
    ready: blockingMissing.length === 0,
    label: blockingMissing.length === 0 ? 'Ready to make' : `Missing ${blockingMissing.length}`,
    steps: results,
    missing: blockingMissing
  };
}

export function possibleVariations(data, lookId) {
  const evaluation = evaluateLook(data, lookId);
  const variableSteps = evaluation.steps.filter(result => ['Similar Allowed', 'Any Color Works'].includes(result.step.requirementType));
  const variationMap = new Map();
  variableSteps.forEach(result => {
    [...result.exactOwned, ...result.substitutions].forEach(item => {
      if (item.colorFamily && item.colorFamily !== 'Clear') variationMap.set(item.colorFamily, item);
    });
  });
  return Array.from(variationMap.entries()).map(([colorFamily, item]) => ({ colorFamily, item }));
}
