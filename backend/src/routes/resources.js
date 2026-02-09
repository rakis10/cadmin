import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../index.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();

const createSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED', 'DRAFT']).default('DRAFT'),
  category: z.string().max(50).default('General'),
  metadata: z.record(z.unknown()).optional(),
});

const updateSchema = createSchema.partial();

// List resources
router.get('/', async (req, res) => {
  const { search, status, category, page = '1', limit = '20' } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {};

  // Regular users see only their own resources
  if (req.user.role === 'USER') {
    where.createdById = req.user.id;
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (status) where.status = status;
  if (category) where.category = category;

  const [resources, total] = await Promise.all([
    prisma.resource.findMany({
      where,
      include: { createdBy: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit),
    }),
    prisma.resource.count({ where }),
  ]);

  res.json({ resources, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
});

// Get single resource
router.get('/:id', async (req, res) => {
  const resource = await prisma.resource.findUnique({
    where: { id: req.params.id },
    include: { createdBy: { select: { id: true, name: true, email: true } } },
  });
  if (!resource) return res.status(404).json({ error: 'Resource not found' });

  // Users can only see their own
  if (req.user.role === 'USER' && resource.createdById !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  res.json({ resource });
});

// Create resource
router.post('/', async (req, res) => {
  try {
    const data = createSchema.parse(req.body);
    const resource = await prisma.resource.create({
      data: { ...data, createdById: req.user.id },
      include: { createdBy: { select: { id: true, name: true, email: true } } },
    });
    res.status(201).json({ resource });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: err.errors });
    }
    throw err;
  }
});

// Update resource
router.patch('/:id', async (req, res) => {
  try {
    const data = updateSchema.parse(req.body);
    const resource = await prisma.resource.findUnique({ where: { id: req.params.id } });
    if (!resource) return res.status(404).json({ error: 'Resource not found' });

    if (req.user.role === 'USER' && resource.createdById !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updated = await prisma.resource.update({
      where: { id: req.params.id },
      data,
      include: { createdBy: { select: { id: true, name: true, email: true } } },
    });
    res.json({ resource: updated });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: err.errors });
    }
    throw err;
  }
});

// Delete resource
router.delete('/:id', async (req, res) => {
  const resource = await prisma.resource.findUnique({ where: { id: req.params.id } });
  if (!resource) return res.status(404).json({ error: 'Resource not found' });

  if (req.user.role === 'USER' && resource.createdById !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  await prisma.resource.delete({ where: { id: req.params.id } });
  res.json({ message: 'Resource deleted' });
});

// Get categories
router.get('/meta/categories', async (req, res) => {
  const categories = await prisma.resource.groupBy({
    by: ['category'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
  });
  res.json({ categories: categories.map(c => ({ name: c.category, count: c._count.id })) });
});

export default router;
