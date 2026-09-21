import { Router } from 'express';
import { pool } from '../db/pool';
import { requireAuth, AuthedRequest } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, async (req: AuthedRequest, res) => {
  const search = typeof req.query.search === 'string' ? req.query.search : '';
  const { rows } = await pool.query(
    `SELECT id, email, display_name FROM users
     WHERE id != $1 AND email ILIKE $2
     ORDER BY email
     LIMIT 20`,
    [req.user!.id, `%${search}%`],
  );
  res.json(rows.map((r) => ({ id: r.id, email: r.email, displayName: r.display_name })));
});

export default router;
