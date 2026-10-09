module.exports = {
  async up(db) {
    // 1. Compound index for tenant user notifications query and unread filtering
    await db
      .collection('notifications')
      .createIndex(
        { organizationId: 1, userId: 1, readAt: 1, deletedAt: 1 },
        { name: 'org_user_read_deleted_idx' },
      );

    // 2. Compound index for tenant user notifications list sorting
    await db
      .collection('notifications')
      .createIndex(
        { organizationId: 1, userId: 1, createdAt: -1 },
        { name: 'org_user_created_idx' },
      );
  },

  async down(db) {
    await db.collection('notifications').dropIndex('org_user_read_deleted_idx');
    await db.collection('notifications').dropIndex('org_user_created_idx');
  },
};
