import { parseProductCard, type ProductCard } from './product.js';
import { fail, isRecord, ok, readString, type ParseResult } from './result.js';

export type FormField =
  | { name: string; kind: 'text'; label: string; required: boolean }
  | { name: string; kind: 'select'; label: string; required: boolean; options: string[] }
  | { name: string; kind: 'checkbox'; label: string; required: boolean };

export type Block =
  | { id: string; type: 'hero'; props: { title: string; subtitle: string } }
  | { id: string; type: 'richText'; props: { paragraphs: string[] } }
  | { id: string; type: 'keyFacts'; props: { title: string; items: { label: string; value: string }[] } }
  | { id: string; type: 'stats'; props: { items: { label: string; value: string }[] } }
  | { id: string; type: 'productCards'; props: { cards: ProductCard[] } }
  | { id: string; type: 'applicationForm'; props: { title: string; fields: FormField[] } };

export type BlockType = Block['type'];

export const blockTypes = [
  'hero',
  'richText',
  'keyFacts',
  'stats',
  'productCards',
  'applicationForm',
] as const satisfies readonly BlockType[];

export type PageDocument = {
  slug: string;
  title: string;
  description: string;
  blocks: Block[];
};

type ReadMode = 'strict' | 'skip-unknown';

export function parsePageDocument(input: unknown): ParseResult<PageDocument> {
  return readDocument(input, 'strict');
}

export function readPageDocument(input: unknown): ParseResult<PageDocument> {
  return readDocument(input, 'skip-unknown');
}

function readDocument(input: unknown, mode: ReadMode): ParseResult<PageDocument> {
  if (!isRecord(input)) {
    return fail('page must be an object');
  }

  const slug = readString(input.slug, 'slug');
  const title = readString(input.title, 'title');
  const description = readString(input.description, 'description');
  if (!slug.ok) return slug;
  if (!title.ok) return title;
  if (!description.ok) return description;
  if (!Array.isArray(input.blocks)) {
    return fail('blocks must be an array');
  }

  const blocks: Block[] = [];
  for (const [index, candidate] of input.blocks.entries()) {
    const parsed = parseBlock(candidate, index, mode);
    if (parsed === 'skip') continue;
    if (!parsed.ok) return parsed;
    blocks.push(parsed.value);
  }

  return ok({
    slug: slug.value,
    title: title.value,
    description: description.value,
    blocks,
  });
}

function parseBlock(input: unknown, index: number, mode: ReadMode): ParseResult<Block> | 'skip' {
  if (!isRecord(input)) {
    return fail(`blocks[${index}] must be an object`);
  }

  const id = readString(input.id, `blocks[${index}].id`);
  if (!id.ok) return id;
  if (typeof input.type !== 'string') {
    return fail(`blocks[${index}].type must be a string`);
  }
  if (!isBlockType(input.type)) {
    return mode === 'skip-unknown' ? 'skip' : fail(`blocks[${index}].type is not in the block catalog`);
  }

  const props = parseProps(input.type, input.props, index);
  if (!props.ok) return props;
  return ok({ id: id.value, type: input.type, props: props.value } as Block);
}

function isBlockType(value: string): value is BlockType {
  return blockTypes.some((type) => type === value);
}

function parseProps(type: BlockType, input: unknown, index: number): ParseResult<Block['props']> {
  if (!isRecord(input)) {
    return fail(`blocks[${index}].props must be an object`);
  }

  switch (type) {
    case 'hero':
      return parseHero(input, index);
    case 'richText':
      return parseRichText(input, index);
    case 'keyFacts':
      return parseLabeledItems(input, index, true);
    case 'stats':
      return parseLabeledItems(input, index, false);
    case 'productCards':
      return parseProductCards(input, index);
    case 'applicationForm':
      return parseApplicationForm(input, index);
  }
}

function parseHero(input: Record<string, unknown>, index: number): ParseResult<{ title: string; subtitle: string }> {
  const title = readString(input.title, `blocks[${index}].props.title`);
  const subtitle = readString(input.subtitle, `blocks[${index}].props.subtitle`);
  if (!title.ok) return title;
  if (!subtitle.ok) return subtitle;
  return ok({ title: title.value, subtitle: subtitle.value });
}

function parseRichText(input: Record<string, unknown>, index: number): ParseResult<{ paragraphs: string[] }> {
  if (!Array.isArray(input.paragraphs) || input.paragraphs.length === 0) {
    return fail(`blocks[${index}].props.paragraphs must be a non-empty array`);
  }
  const paragraphs: string[] = [];
  for (const paragraph of input.paragraphs) {
    const parsed = readString(paragraph, `blocks[${index}].props.paragraphs`);
    if (!parsed.ok) return parsed;
    paragraphs.push(parsed.value);
  }
  return ok({ paragraphs });
}

function parseLabeledItems(
  input: Record<string, unknown>,
  index: number,
  withTitle: boolean,
): ParseResult<{ title: string; items: { label: string; value: string }[] } | { items: { label: string; value: string }[] }> {
  const items = parseItems(input.items, index);
  if (!items.ok) return items;
  if (!withTitle) return ok({ items: items.value });

  const title = readString(input.title, `blocks[${index}].props.title`);
  if (!title.ok) return title;
  return ok({ title: title.value, items: items.value });
}

function parseItems(input: unknown, index: number): ParseResult<{ label: string; value: string }[]> {
  if (!Array.isArray(input) || input.length === 0) {
    return fail(`blocks[${index}].props.items must be a non-empty array`);
  }
  const items: { label: string; value: string }[] = [];
  for (const item of input) {
    if (!isRecord(item)) return fail(`blocks[${index}].props.items must contain objects`);
    const label = readString(item.label, `blocks[${index}].props.items.label`);
    const value = readString(item.value, `blocks[${index}].props.items.value`);
    if (!label.ok) return label;
    if (!value.ok) return value;
    items.push({ label: label.value, value: value.value });
  }
  return ok(items);
}

function parseProductCards(input: Record<string, unknown>, index: number): ParseResult<{ cards: ProductCard[] }> {
  if (!Array.isArray(input.cards)) {
    return fail(`blocks[${index}].props.cards must be an array`);
  }
  const cards: ProductCard[] = [];
  for (const card of input.cards) {
    const parsed = parseProductCard(card);
    if (!parsed.ok) return fail(`blocks[${index}].${parsed.error}`);
    cards.push(parsed.value);
  }
  return ok({ cards });
}

function parseApplicationForm(
  input: Record<string, unknown>,
  index: number,
): ParseResult<{ title: string; fields: FormField[] }> {
  const title = readString(input.title, `blocks[${index}].props.title`);
  if (!title.ok) return title;
  if (!Array.isArray(input.fields) || input.fields.length === 0) {
    return fail(`blocks[${index}].props.fields must be a non-empty array`);
  }

  const fields: FormField[] = [];
  for (const field of input.fields) {
    const parsed = parseFormField(field, index);
    if (!parsed.ok) return parsed;
    fields.push(parsed.value);
  }
  return ok({ title: title.value, fields });
}

function parseFormField(input: unknown, index: number): ParseResult<FormField> {
  if (!isRecord(input)) return fail(`blocks[${index}].props.fields must contain objects`);
  const name = readString(input.name, `blocks[${index}].props.fields.name`);
  const label = readString(input.label, `blocks[${index}].props.fields.label`);
  if (!name.ok) return name;
  if (!label.ok) return label;
  if (typeof input.required !== 'boolean') {
    return fail(`blocks[${index}].props.fields.required must be a boolean`);
  }
  if (input.kind === 'text' || input.kind === 'checkbox') {
    return ok({ name: name.value, kind: input.kind, label: label.value, required: input.required });
  }
  if (input.kind === 'select') {
    if (!Array.isArray(input.options) || input.options.length === 0) {
      return fail(`blocks[${index}].props.fields.options must be a non-empty array`);
    }
    const options: string[] = [];
    for (const option of input.options) {
      const parsed = readString(option, `blocks[${index}].props.fields.options`);
      if (!parsed.ok) return parsed;
      options.push(parsed.value);
    }
    return ok({ name: name.value, kind: 'select', label: label.value, required: input.required, options });
  }
  return fail(`blocks[${index}].props.fields.kind is not supported`);
}
