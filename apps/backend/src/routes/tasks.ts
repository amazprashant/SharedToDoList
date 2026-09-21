import { Router } from 'express';
import { pool } from '../db/pool';
import { requireAuth, AuthedRequest } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

function mapTask(row: any) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    ownerId: row.owner_id,
    ownerEmail: row.owner_email,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

router.get('/', async (req: AuthedRequest, res) => {
  const filter = (req.query.filter as string) ?? 'all';
  const userId = req.user!.id;

  let query = `
    SELECT DISTINCT t.*, u.email AS owner_email
    FROM tasks t
    JOIN users u ON u.id = t.owner_id
    LEFT JOIN task_shares ts ON ts.task_id = t.id
    WHERE `;
  const params: any[] = [userId];

  if (filter === 'mine') {
    query += `t.owner_id = $1`;
  } else if (filter === 'shared') {
    query += `ts.shared_with = $1`;
  } else {
    query += `(t.owner_id = $1 OR ts.shared_with = $1)`;
  }
  query += ` ORDER BY t.created_at DESC`;

  const { rows } = await pool.query(query, params);
  res.json(rows.map(mapTask));
});

async function canAccessTask(taskId: string, userId: string) {
  const { rows } = await pool.query(
    `SELECT t.*, u.email AS owner_email FROM tasks t
     JOIN users u ON u.id = t.owner_id
     LEFT JOIN task_shares ts ON ts.task_id = t.id AND ts.shared_with = $2
     WHERE t.id = $1 AND (t.owner_id = $2 OR ts.shared_with = $2)`,
    [taskId, userId],
  );
  return rows[0] ?? null;
}

router.get('/:id', async (req: AuthedRequest, res) => {
  const task = await canAccessTask(req.params.id, req.user!.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(mapTask(task));
});

router.post('/', async (req: AuthedRequest, res) => {
  const { title, description, status } = req.body ?? {};
  if (!title) return res.status(400).json({ error: 'title is required' });

  const { rows } = await pool.query(
    `INSERT INTO tasks (title, description, status, owner_id)
     VALUES ($1, $2, COALESCE($3, 'pending'), $4)
     RETURNING *`,
    [title, description ?? null, status ?? null, req.user!.id],
  );
  const task = { ...rows[0], owner_email: req.user!.email };
  res.status(201).json(mapTask(task));
});

router.put('/:id', async (req: AuthedRequest, res) => {
  const { title, description, status } = req.body ?? {};
  const { rows } = await pool.query(
    `UPDATE tasks SET
       title = COALESCE($1, title),
       description = COALESCE($2, description),
       status = COALESCE($3, status),
       updated_at = now()
     WHERE id = $4 AND owner_id = $5
     RETURNING *`,
    [title ?? null, description ?? null, status ?? null, req.params.id, req.user!.id],
  );
  if (!rows[0]) return res.status(404).json({ error: 'Task not found or not owned by you' });
  const task = { ...rows[0], owner_email: req.user!.email };
  res.json(mapTask(task));
});

router.delete('/:id', async (req: AuthedRequest, res) => {
  const { rowCount } = await pool.query(
    `DELETE FROM tasks WHERE id = $1 AND owner_id = $2`,
    [req.params.id, req.user!.id],
  );
  if (!rowCount) return res.status(404).json({ error: 'Task not found or not owned by you' });
  res.status(204).send();
});

router.post('/:id/share', async (req: AuthedRequest, res) => {
  const { email } = req.body ?? {};
  if (!email) return res.status(400).json({ error: 'email is required' });

  const owned = await pool.query(`SELECT id FROM tasks WHERE id = $1 AND owner_id = $2`, [
    req.params.id,
    req.user!.id,
  ]);
  if (!owned.rows[0]) return res.status(404).json({ error: 'Task not found or not owned by you' });

  const target = await pool.query(`SELECT id, email, display_name FROM users WHERE email = $1`, [email]);
  if (!target.rows[0]) return res.status(404).json({ error: 'No user with that email' });

  await pool.query(
    `INSERT INTO task_shares (task_id, shared_with) VALUES ($1, $2)
     ON CONFLICT (task_id, shared_with) DO NOTHING`,
    [req.params.id, target.rows[0].id],
  );

  res.status(201).json({
    id: target.rows[0].id,
    email: target.rows[0].email,
    displayName: target.rows[0].display_name,
  });
});

router.delete('/:id/share/:userId', async (req: AuthedRequest, res) => {
  const owned = await pool.query(`SELECT id FROM tasks WHERE id = $1 AND owner_id = $2`, [
    req.params.id,
    req.user!.id,
  ]);
  if (!owned.rows[0]) return res.status(404).json({ error: 'Task not found or not owned by you' });

  await pool.query(`DELETE FROM task_shares WHERE task_id = $1 AND shared_with = $2`, [
    req.params.id,
    req.params.userId,
  ]);
  res.status(204).send();
});

router.get('/:id/shares', async (req: AuthedRequest, res) => {
  const owned = await pool.query(`SELECT id FROM tasks WHERE id = $1 AND owner_id = $2`, [
    req.params.id,
    req.user!.id,
  ]);
  if (!owned.rows[0]) return res.status(404).json({ error: 'Task not found or not owned by you' });

  const { rows } = await pool.query(
    `SELECT u.id, u.email, u.display_name FROM task_shares ts
     JOIN users u ON u.id = ts.shared_with
     WHERE ts.task_id = $1`,
    [req.params.id],
  );
  res.json(rows.map((r) => ({ id: r.id, email: r.email, displayName: r.display_name })));
});

export default router;
