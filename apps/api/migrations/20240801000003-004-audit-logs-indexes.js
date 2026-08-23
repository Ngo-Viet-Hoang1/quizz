module.exports = {
  async up(db) {
    await db.collection('audit_logs').createIndex({ orgId: 1, timestamp: -1 });
    await db.collection('audit_logs').createIndex({ userId: 1, timestamp: -1 });
    await db
      .collection('audit_logs')
      .createIndex({ timestamp: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });
  },

  async down(db) {
    await db.collection('audit_logs').dropIndex('orgId_1_timestamp_-1');
    await db.collection('audit_logs').dropIndex('userId_1_timestamp_-1');
    await db.collection('audit_logs').dropIndex('timestamp_1');
  },
};
