const BOOLEAN_MAP = {
  true: true,
  false: false,
};

const QUOTE_PATTERN = /^["'](.*)["']$/;
const NUMBER_PATTERN = /^-?\d+(\.\d+)?$/;

const SCALAR_STRATEGIES = [
  {
    isMatch: (value) => QUOTE_PATTERN.test(value),
    parse: (value) => value.match(QUOTE_PATTERN)[1],
  },
  {
    isMatch: (value) => Object.hasOwn(BOOLEAN_MAP, value),
    parse: (value) => BOOLEAN_MAP[value],
  },
  {
    isMatch: (value) => NUMBER_PATTERN.test(value),
    parse: (value) => Number(value),
  },
];

function isActiveYamlLine(line) {
  const trimmed = line.trim();
  const hasText = trimmed.length > 0;
  const isComment = trimmed.startsWith('#');
  return hasText && !isComment;
}

function parseScalarValue(rawValue) {
  const strategy = SCALAR_STRATEGIES.find((item) => item.isMatch(rawValue));
  return strategy ? strategy.parse(rawValue) : rawValue;
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
  const hasInlineValue = rawValue.length > 0;
  if (hasInlineValue) {
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
