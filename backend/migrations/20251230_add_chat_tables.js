// Chat antar mentee-mentor
export async function up(knex) {
  await knex.schema.createTable('chat_threads', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('mentor_id').notNullable().references('users.id').onDelete('CASCADE');
    t.uuid('mentee_id').notNullable().references('users.id').onDelete('CASCADE');
    t.timestamp('last_message_at').nullable();
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.timestamp('updated_at').defaultTo(knex.fn.now());
    t.unique(['mentor_id', 'mentee_id']);
  });

  await knex.schema.createTable('chat_messages', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('thread_id').notNullable().references('chat_threads.id').onDelete('CASCADE');
    t.uuid('sender_id').notNullable().references('users.id').onDelete('CASCADE');
    t.uuid('recipient_id').notNullable().references('users.id').onDelete('CASCADE');
    t.text('body').notNullable();
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.timestamp('read_at').nullable();

    t.index(['thread_id', 'created_at']);
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('chat_messages');
  await knex.schema.dropTableIfExists('chat_threads');
}
