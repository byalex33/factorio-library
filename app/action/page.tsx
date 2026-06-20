import { revalidatePath } from 'next/cache';

import { getSql } from '@/app/lib/db';

export const dynamic = 'force-dynamic';

export default async function ActionPage() {
  async function createComment(formData: FormData) {
    'use server';

    const comment = formData.get('comment') as string;
    const sql = getSql();
    await sql`INSERT INTO comments (comment) VALUES (${comment})`;
    revalidatePath('/action');
  }

  async function getComments() {
    const sql = getSql();
    await sql`CREATE TABLE IF NOT EXISTS comments (id SERIAL PRIMARY KEY, comment TEXT)`;
    return sql`SELECT id, comment FROM comments ORDER BY id DESC`;
  }

  const comments = await getComments();

  return (
    <div>
      <h2>Server Action Example</h2>
      <form action={createComment}>
        <input type="text" name="comment" placeholder="Add a comment" />
        <button type="submit">Submit</button>
      </form>
      <h3>Comments:</h3>
      <ul>
        {comments.map((comment) => (
          <li key={comment.id as number}>{comment.comment as string}</li>
        ))}
      </ul>
    </div>
  );
}
