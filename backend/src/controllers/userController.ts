import { Request, Response } from 'express';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import db from '../services/databaseService';
import { User } from '../models/user';

export const createUser = async (req: Request, res: Response) => {
  const { username, password, role } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  if (!['Admin', 'Operator', 'Viewer'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  db.run('INSERT INTO users (username, password, role, status) VALUES (?, ?, ?, ?)', [username, hashedPassword, role || 'Operator', 'active'], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(409).json({ message: 'Username already exists' });
      }
      return res.status(500).json({ message: 'Error creating user', error: err.message });
    }
    res.status(201).json({ message: 'User created', userId: this.lastID });
  });
};

export const login = (req: Request, res: Response) => {
  const { username, password } = req.body;

  console.log('Login attempt for username:', username);

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, row: User) => {
    if (err) {
      console.error('Database error during login:', err.message);
      return res.status(500).json({ message: 'Error logging in', error: err.message });
    }

    if (!row) {
      console.log('User not found:', username);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('User found. Stored password hash:', row.password);
    console.log('Password received from request:', password);

    const isPasswordValid = await bcrypt.compare(password, row.password);

    console.log('Bcrypt comparison result (isPasswordValid):', isPasswordValid);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: row.id, username: row.username, role: row.role, status: row.status }, process.env.JWT_SECRET || 'your_jwt_secret');

    res.json({ message: 'Logged in successfully', token });
  });
};

export const getUsers = (req: Request, res: Response) => {
  db.all('SELECT id, username, role, status, created_at FROM users', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching users', error: err.message });
    }
    res.json(rows);
  });
};

export const updateUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { username, password, role } = req.body;

  // @ts-ignore
  console.log('req.user:', req.user);

  console.log(`Updating user ${id} with:`, { username, password, role });

  if (!username && !password && !role) {
    return res.status(400).json({ message: 'No fields to update' });
  }

  let updateQuery = 'UPDATE users SET ';
  const params: any[] = [];

  if (username) {
    updateQuery += 'username = ?, ';
    params.push(username);
  }

  if (password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    updateQuery += 'password = ?, ';
    params.push(hashedPassword);
  }

  if (role) {
    if (!['Admin', 'Operator', 'Viewer'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
    }
    updateQuery += 'role = ?, ';
    params.push(role);
  }

  updateQuery = updateQuery.slice(0, -2); // Remove trailing comma and space
  updateQuery += ' WHERE id = ?';
  params.push(id);

  console.log('Executing query:', updateQuery, params);

  db.run(updateQuery, params, function(err) {
    if (err) {
      console.error('Error updating user:', err.message);
      return res.status(500).json({ message: 'Error updating user', error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User updated successfully' });
  });
};

export const updateUserStatus = (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['active', 'disabled'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }

    db.run('UPDATE users SET status = ? WHERE id = ?', [status, id], function(err) {
        if (err) {
            return res.status(500).json({ message: 'Error updating user status', error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ message: 'User status updated successfully' });
    });
};