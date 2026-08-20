module.exports = {
  async up(db) {
    await db.collection('users').createIndex(
      { email: 1 },
      // email = null when user is anonymized/deleted -> no unique index conflict
      { unique: true, partialFilterExpression: { email: { $type: 'string' } } },
    );
  },

  async down(db) {
    await db.collection('users').dropIndex('email_1');
  },
};
