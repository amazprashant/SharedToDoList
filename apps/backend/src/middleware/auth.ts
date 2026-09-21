import { NextFunction, Request, Response } from 'express';
import admin from '../firebase';
import { pool } from '../db/pool';

export interface AuthedRequest extends Request {
  user?: {
    id: string;
    firebaseUid: string;
    email: string;
    displayName: string | null;
  };
}

export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }

  const token = header.slice('Bearer '.length);

  try {
    const decoded = await admin.auth().verifyIdToken(token);

    const { rows } = await pool.query(
      `INSERT INTO users (firebase_uid, email, display_name)
       VALUES ($1, $2, $3)
       ON CONFLICT (firebase_uid)
       DO UPDATE SET email = EXCLUDED.email
       RETURNING id, firebase_uid, email, display_name`,
      [decoded.uid, decoded.email, decoded.name ?? null],
    );

    const row = rows[0];
    req.user = {
      id: row.id,
      firebaseUid: row.firebase_uid,
      email: row.email,
      displayName: row.display_name,
    };
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
