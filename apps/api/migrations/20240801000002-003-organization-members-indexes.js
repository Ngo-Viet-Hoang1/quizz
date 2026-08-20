module.exports = {
  async up(db) {
    await db
      .collection('organization_members')
      .createIndex({ organizationId: 1, userId: 1 }, { unique: true });
    await db.collection('organization_members').createIndex({ userId: 1, status: 1 });
  },

  async down(db) {
    await db.collection('organization_members').dropIndex('organizationId_1_userId_1');
    await db.collection('organization_members').dropIndex('userId_1_status_1');
  },
};
