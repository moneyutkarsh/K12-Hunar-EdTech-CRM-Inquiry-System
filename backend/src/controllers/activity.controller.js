import { listActivityFeed } from '../repositories/activity.repo.js';

export async function getActivityFeed(req, res) {
  const { cursor, limit, action, inquiryId } = req.query;

  const result = await listActivityFeed({
    cursor: cursor ? String(cursor) : null,
    limit: limit ? parseInt(limit, 10) : 20,
    action: action ? String(action) : null,
    inquiryId: inquiryId ? String(inquiryId) : null,
  });

  return res.status(200).json({
    data: result.items,
    pagination: {
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
    },
  });
}

export default { getActivityFeed };
