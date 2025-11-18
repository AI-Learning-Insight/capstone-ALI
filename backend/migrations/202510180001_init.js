/**
 * Tables:
 * users, assessments, todos, student_subject_progress, recommendations, materials_progress
 */
export async function up(knex) {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

  await knex.schema.createTable('users', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.string('name').notNullable();
    t.string('email').notNullable().unique();
    t.string('password_hash').notNullable();
    t.string('role').notNullable().defaultTo('student'); // student|teacher|admin (opsional)
    t.string('avatar_url');
    t.string('phone');
    t.date('dob');
    t.text('address');
    t.text('bio');
    t.string('nisn');
    t.string('grade'); // '10' untuk project ini
    t.string('school_id');
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('assessments', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('student_id').notNullable().references('users.id').onDelete('CASCADE');
    t.jsonb('scores').notNullable(); // {math, biology, history, economics}
    t.jsonb('psych').notNullable();  // {openness, conscientiousness, analytical}
    t.enu('learning_style', ['fast', 'consistent', 'reflective']).notNullable();
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('todos', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('student_id').notNullable().references('users.id').onDelete('CASCADE');
    t.string('title').notNullable();
    t.string('subject').nullable();
    t.date('due_date').nullable();
    t.string('status').notNullable().defaultTo('pending'); // pending|doing|done
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('student_subject_progress', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('student_id').notNullable().references('users.id').onDelete('CASCADE');
    t.string('subject').notNullable(); // Matematika, Biologi, Fisika, Bahasa Indonesia
    t.integer('percent').notNullable().defaultTo(0); // 0-100
    t.integer('score').notNullable().defaultTo(0);   // 0-100
    t.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('recommendations', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('student_id').notNullable().references('users.id').onDelete('CASCADE');
    t.enu('track', ['IPA', 'IPS']).notNullable();
    t.jsonb('top_programs').notNullable(); // ["Desain Komunikasi Visual", ...]
    t.float('confidence').notNullable();   // 0-1
    t.jsonb('explanations').defaultTo('[]'); // [{feature, contribution}]
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('materials_progress', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('student_id').notNullable().references('users.id').onDelete('CASCADE');
    t.string('subject').notNullable();
    t.string('topic').notNullable();
    t.string('status').notNullable().defaultTo('reading'); // reading|done
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.timestamp('completed_at').nullable();
  });
}

export async function down(knex) {
  await knex.schema
    .dropTableIfExists('materials_progress')
    .dropTableIfExists('recommendations')
    .dropTableIfExists('student_subject_progress')
    .dropTableIfExists('todos')
    .dropTableIfExists('assessments')
    .dropTableIfExists('users');
}
