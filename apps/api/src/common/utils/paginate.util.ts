import { Model, QueryFilter, SortOrder } from 'mongoose';
import { PaginationQueryDto } from '../dto/pagination-query.dto';
import { PaginationMeta } from '../response/api-response';

export interface PaginateOptions<T> {
  /** Fields allowed for sorting — MANDATORY whitelist */
  allowedSortFields: readonly (keyof T & string)[];
  /** Fields to exclude/include in projection */
  projection?: Record<string, 0 | 1>;
  /** Fields to populate */
  populate?: string | string[];
}

export interface PaginateResult<T> {
  items: T[];
  meta: PaginationMeta;
}

/**
 * Generic Mongoose pagination helper with whitelist sort check and .lean() optimization
 */
export async function paginate<T, Doc>(
  model: Model<Doc>,
  filter: QueryFilter<Doc>,
  query: PaginationQueryDto,
  options: PaginateOptions<T>,
): Promise<PaginateResult<T>> {
  const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = query;
  const { allowedSortFields, projection, populate } = options;

  // Whitelist check — fallback to 'createdAt' if field is not whitelisted
  const safeSortField = allowedSortFields.includes(sortBy as keyof T & string)
    ? sortBy
    : 'createdAt';

  const sort: Record<string, SortOrder> = {
    [safeSortField]: sortOrder === 'desc' ? -1 : 1,
  };

  const skip = (page - 1) * limit;

  let findQuery = model.find(filter, projection).sort(sort).skip(skip).limit(limit);

  if (populate) {
    findQuery = findQuery.populate(populate as string);
  }

  const [items, total] = await Promise.all([
    findQuery.lean<T[]>().exec(),
    model.countDocuments(filter).exec(),
  ]);

  return {
    items,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}
