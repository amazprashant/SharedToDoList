import { Router } from 'express';
import admin from '../firebase';
import { pool } from '../db/pool';
import { requireAuth, AuthedRequest } from '../middleware/auth';

const router = Router();

router.post('/signup', async (req, res) => {
  const { email, password, displayName } = req.body ?? {};
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  try {
    const firebaseUser = await admin.auth().createUser({
      email,
      password,
      displayName,
    });

    const { rows } = await pool.query(
      `INSERT INTO users (firebase_uid, email, display_name)
       VALUES ($1, $2, $3)
       RETURNING id, firebase_uid, email, display_name, created_at`,
      [firebaseUser.uid, email, displayName ?? null],
    );

    res.status(201).json(rows[0]);
  } catch (err: any) {
    res.status(400).json({ error: err.message ?? 'Signup failed' });
  }
});

router.post('/login', requireAuth, async (req: AuthedRequest, res) => {
  res.json(req.user);
});

export default router;
