const fs = require('fs');
const path = require('path');

const specPath = path.resolve(process.cwd(), 'dist', 'swagger.json');
if (!fs.existsSync(specPath)) {
  console.error('Swagger spec not found at dist/swagger.json. Run `npm run tsoa:spec` first.');
  process.exit(1);
}

const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
const lines = [];

lines.push('# API Quick Reference', '');
if (spec.info?.description) {
  lines.push(spec.info.description, '');
}

const describeRef = (ref) => ref.split('/').pop();

const describeSchema = (schema) => {
  if (!schema) {
    return 'None';
  }
  if (schema.$ref) {
    return describeRef(schema.$ref);
  }
  const type = schema.type ?? 'object';
  const props = schema.properties ? Object.keys(schema.properties) : [];
  if (props.length) {
    return `${type} (${props.join(', ')})`;
  }
  return type;
};

const describeParameters = (parameters = []) => {
  if (!parameters.length) {
    return 'None';
  }
  return parameters
    .map((param) => `${param.name} (${param.in}${param.required ? ', required' : ''})`)
    .join(', ');
};

const flattenedOps = [];
for (const [route, verbs] of Object.entries(spec.paths || {})) {
  for (const [rawMethod, operation] of Object.entries(verbs || {})) {
    flattenedOps.push({ route, method: rawMethod.toUpperCase(), operation });
  }
}

flattenedOps.sort((a, b) => {
  if (a.route === b.route) {
    return a.method.localeCompare(b.method);
  }
  return a.route.localeCompare(b.route);
});

for (const { route, method, operation } of flattenedOps) {
  lines.push(`## ${method} ${route}`);
  if (operation.summary) {
    lines.push(`- Summary: ${operation.summary}`);
  }

  const parameters = ([]).concat(operation.parameters ?? [], spec.paths?.[route]?.parameters ?? []);
  const uniqueParams = parameters.filter((param, index) =>
    parameters.findIndex((search) => search.name === param.name && search.in === param.in) === index
  );
  const requestBodySchema = operation.requestBody?.content?.['application/json']?.schema;

  lines.push(`- Parameters: ${describeParameters(uniqueParams)}`);
  lines.push(`- Input object: ${requestBodySchema ? describeSchema(requestBodySchema) : 'None'}`);

  const responseEntries = Object.entries(operation.responses || {}).sort(([a], [b]) => a.localeCompare(b));
  if (responseEntries.length) {
    lines.push('- Output:');
    for (const [status, response] of responseEntries) {
      const schema = response.content?.['application/json']?.schema;
      lines.push(`  - ${status}: ${schema ? describeSchema(schema) : 'no schema'}`);
    }
  } else {
    lines.push('- Output: None');
  }

  lines.push('');
}

const schemas = spec.components?.schemas ?? {};
if (Object.keys(schemas).length) {
  lines.push('## Schemas', '');
  const schemaEntries = Object.entries(schemas).sort(([a], [b]) => a.localeCompare(b));
  for (const [schemaName, schemaDef] of schemaEntries) {
    lines.push(`### ${schemaName}`);
    const props = schemaDef.properties ? Object.entries(schemaDef.properties) : [];
    if (!props.length) {
      lines.push(`- ${schemaDef.type ?? 'object'}`);
      lines.push('');
      continue;
    }
    for (const [propName, propSchema] of props) {
      const required = schemaDef.required?.includes(propName) ? ' (required)' : '';
      lines.push(`- ${propName}: ${describeSchema(propSchema)}${required}`);
    }
    lines.push('');
  }
}

const outputPath = path.resolve(process.cwd(), 'API_QUICKREF.md');
fs.writeFileSync(outputPath, lines.join('\n') + '\n');
console.log(`Wrote ${outputPath}`);