import { Router } from 'express';
import { prisma } from '../index.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', requireRole('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  const [totalUsers, totalResources, activeResources, recentUsers, resourcesByStatus, resourcesByCategory] = await Promise.all([
    prisma.user.count(),
    prisma.resource.count(),
    prisma.resource.count({ where: { status: 'ACTIVE' } }),
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    }),
    prisma.resource.groupBy({
      by: ['status'],
      _count: { id: true },
    }),
    prisma.resource.groupBy({
      by: ['category'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    }),
  ]);

  res.json({
    totalUsers,
    totalResources,
    activeResources,
    draftResources: resourcesByStatus.find(r => r.status === 'DRAFT')?._count?.id || 0,
    archivedResources: resourcesByStatus.find(r => r.status === 'ARCHIVED')?._count?.id || 0,
    recentUsers,
    resourcesByCategory: resourcesByCategory.map(c => ({ name: c.category, count: c._count.id })),
  });
});

export default router;
