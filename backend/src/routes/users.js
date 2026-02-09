import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../index.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  password: z.string().min(6),
  role: z.enum(['ADMIN', 'USER']).default('USER'),
});

const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  role: z.enum(['ADMIN', 'USER']).optional(),
  active: z.boolean().optional(),
});

// List users — admins and super admins only
router.get('/', requireRole('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  const { search, role, page = '1', limit = '20' } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (role) where.role = role;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: { id: true, email: true, name: true, role: true, active: true, createdAt: true, _count: { select: { resources: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit),
    }),
    prisma.user.count({ where }),
  ]);

  res.json({ users, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
});

// Create user — super admin only
router.post('/', requireRole('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const data = createUserSchema.parse(req.body);

    // Only super admins can create admins
    if (data.role === 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Only super admins can create admin users' });
    }

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    const hashed = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: { ...data, password: hashed },
      select: { id: true, email: true, name: true, role: true, active: true, createdAt: true },
    });
    res.status(201).json({ user });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: err.errors });
    }
    throw err;
  }
});

// Update user
router.patch('/:id', requireRole('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const data = updateUserSchema.parse(req.body);
    const target = await prisma.user.findUnique({ where: { id: req.params.id } });

    if (!target) return res.status(404).json({ error: 'User not found' });
    if (target.role === 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Cannot modify super admin' });
    }
    if (data.role === 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Only super admins can promote to admin' });
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
      select: { id: true, email: true, name: true, role: true, active: true, createdAt: true },
    });
    res.json({ user });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: err.errors });
    }
    throw err;
  }
});

// Delete user — super admin only
router.delete('/:id', requireRole('SUPER_ADMIN'), async (req, res) => {
  const target = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!target) return res.status(404).json({ error: 'User not found' });
  if (target.role === 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Cannot delete super admin' });
  }

  await prisma.user.delete({ where: { id: req.params.id } });
  res.json({ message: 'User deleted' });
});

export default router;
