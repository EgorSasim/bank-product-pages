import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { readPageDocument, validateAnswers, type SubmitApplicationResult } from '@bank/contract';
import { DATABASE } from '../database.js';
import { insertSubmission, rowsOf, selectBlock, selectSession, type Sql } from '../sql.js';

export type SubmitResponse =
  | { httpStatus: 201 | 401 | 404 | 422; body: SubmitApplicationResult }
  | { httpStatus: 500 };

type BlockRow = { id: string; type: string; props: unknown };

@Injectable()
export class ApplicationsService {
  constructor(@Inject(DATABASE) private readonly db: Sql) {}

  async submit(input: { sessionId: string | undefined; body: unknown }): Promise<SubmitResponse> {
    if (!input.sessionId) {
      return { httpStatus: 401, body: { status: 'authentication_required' } };
    }

    const session = await this.db.query(selectSession, [input.sessionId]);
    const userId = rowsOf<{ user_id: string }>(session)[0]?.user_id;
    if (!userId) {
      return { httpStatus: 401, body: { status: 'authentication_required' } };
    }

    const blockId = readBlockId(input.body);
    if (!blockId) {
      return {
        httpStatus: 422,
        body: { status: 'invalid', fieldErrors: [{ name: 'blockId', message: 'required' }] },
      };
    }

    const found = await this.db.query(selectBlock, [blockId]);
    const block = rowsOf<BlockRow>(found)[0];
    if (!block) {
      return {
        httpStatus: 404,
        body: { status: 'invalid', fieldErrors: [{ name: 'blockId', message: 'not found' }] },
      };
    }
    if (block.type !== 'applicationForm') {
      return {
        httpStatus: 422,
        body: { status: 'invalid', fieldErrors: [{ name: 'blockId', message: 'not an application form' }] },
      };
    }

    const form = readForm(block);
    if (!form) return { httpStatus: 500 };

    const answers = isRecord(input.body) ? input.body.answers : undefined;
    const checked = validateAnswers(form.fields, answers);
    if (!checked.ok) {
      return { httpStatus: 422, body: { status: 'invalid', fieldErrors: checked.fieldErrors } };
    }

    const submissionId = randomUUID();
    await this.db.query(insertSubmission, [submissionId, block.id, userId, JSON.stringify(checked.value)]);
    return { httpStatus: 201, body: { status: 'accepted', submissionId } };
  }
}

function readBlockId(body: unknown): string | undefined {
  if (!isRecord(body) || typeof body.blockId !== 'string' || body.blockId.trim() === '') return undefined;
  return body.blockId;
}

function readForm(block: BlockRow): { fields: Parameters<typeof validateAnswers>[0] } | undefined {
  const parsed = readPageDocument({
    slug: 'application',
    title: 'application',
    description: 'application',
    blocks: [{ id: block.id, type: 'applicationForm', props: block.props }],
  });
  if (!parsed.ok) return undefined;
  const form = parsed.value.blocks[0];
  if (form?.type !== 'applicationForm') return undefined;
  return form.props;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
