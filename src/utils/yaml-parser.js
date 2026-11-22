const BOOLEAN_MAP = {
  true: true,
  false: false,
};

const QUOTE_PATTERN = /^["'](.*)["']$/;
const NUMBER_PATTERN = /^-?\d+(\.\d+)?$/;

function isActiveYamlLine(line) {
  const trimmed = line.trim();
  return Boolean(trimmed) && !trimmed.startsWith('#');
}

function parseScalarValue(rawValue) {
  const quotedMatch = rawValue.match(QUOTE_PATTERN);
  if (quotedMatch) return quotedMatch[1];
  if (Object.hasOwn(BOOLEAN_MAP, rawValue)) return BOOLEAN_MAP[rawValue];
  if (NUMBER_PATTERN.test(rawValue)) return Number(rawValue);
  return rawValue;
}

function splitYamlEntry(line) {
  const indent = line.search(/\S/);
  const trimmed = line.trim();
  const colonIndex = trimmed.indexOf(':');
  const key = trimmed.slice(0, colonIndex).trim();
  const rawValue = trimmed.slice(colonIndex + 1).trim();
  return { indent, key, rawValue };
}

function unwindStack(stack, indent) {
  while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
    stack.pop();
  }
  return stack[stack.length - 1].node;
}

function applyYamlLine(stack, line) {
  const { indent, key, rawValue } = splitYamlEntry(line);
  const parent = unwindStack(stack, indent);
  if (rawValue) {
    parent[key] = parseScalarValue(rawValue);
    return;
  }
  parent[key] = {};
  stack.push({ indent, node: parent[key] });
}

export function parseYaml(yamlText) {
  const root = {};
  const stack = [{ indent: -1, node: root }];
  yamlText
    .split(/\r?\n/)
    .filter(isActiveYamlLine)
    .forEach((line) => applyYamlLine(stack, line));
  return root;
}
