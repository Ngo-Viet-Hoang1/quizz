/* eslint-disable */
module.exports = {
  async up(db) {
    // 1. Compound index for tenant pagination and soft-delete queries
    await db
      .collection('quizzes')
      .createIndex(
        { organizationId: 1, deletedAt: 1, createdAt: -1 },
        { name: 'org_deleted_created_idx' },
      );

    // 2. Compound index for tenant status filtering (avoiding standalone low-cardinality index)
    await db
      .collection('quizzes')
      .createIndex({ organizationId: 1, status: 1 }, { name: 'org_status_idx' });

    // 3. Compound index for owner filtering within organization
    await db
      .collection('quizzes')
      .createIndex({ organizationId: 1, ownerId: 1 }, { name: 'org_owner_idx' });

    // 4. Text index for title and description search
    await db.collection('quizzes').createIndex(
      { title: 'text', description: 'text' },
      {
        weights: { title: 10, description: 5 },
        name: 'quiz_text_search_idx',
      },
    );

    // 5. Sparse unique index for shareCode
    await db.collection('quizzes').createIndex(
      { shareCode: 1 },
      {
        unique: true,
        sparse: true,
        name: 'share_code_unique_sparse_idx',
      },
    );
  },

  async down(db) {
    await db.collection('quizzes').dropIndex('org_deleted_created_idx');
    await db.collection('quizzes').dropIndex('org_status_idx');
    await db.collection('quizzes').dropIndex('org_owner_idx');
    await db.collection('quizzes').dropIndex('quiz_text_search_idx');
    await db.collection('quizzes').dropIndex('share_code_unique_sparse_idx');
  },
};
