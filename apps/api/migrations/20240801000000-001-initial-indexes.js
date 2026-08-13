module.exports = {
  async up(db) {
    await db.collection('users').createIndex({ clerkId: 1 }, { unique: true });
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
  },
  async down(db) {
    await db.collection('users').dropIndex('clerkId_1');
    await db.collection('users').dropIndex('email_1');
  },
};
