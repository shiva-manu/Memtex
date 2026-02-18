import prisma from "../../db/prisma.js";

export async function memoryController(req, res) {
  try {
    const memories = await prisma.topicSummary.findMany({
      where: { userId: req.user.id },
      select: {
        topic: true,
        summary: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    res.json({ memories });
  } catch (err) {
    res.status(500).json({ error: "Failed to load memory" });
  }
}

