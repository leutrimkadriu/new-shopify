import { index, sqliteTable, text } from 'drizzle-orm/sqlite-core';
export const supportRequests=sqliteTable('support_requests',{
  id:text('id').primaryKey().notNull(),name:text('name').notNull(),email:text('email').notNull(),storeUrl:text('store_url').notNull(),subject:text('subject').notNull(),message:text('message').notNull(),status:text('status').notNull().default('new'),createdAt:text('created_at').notNull(),
},table=>[index('idx_support_requests_status_created_at').on(table.status,table.createdAt)]);
