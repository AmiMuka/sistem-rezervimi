require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const app = express();
app.use(cors());
app.use(express.json());

// Test bazë
app.get('/', (req, res) => {
  res.send('Backend po punon!');
});

// Merr të gjitha vendet (për hartën)
app.get('/api/vende', async (req, res) => {
  try {
    const vendet = await prisma.vend.findMany({
      orderBy: { kodi: 'asc' },
    });
    res.json(vendet);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gabim në marrjen e vendeve' });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Serveri po punon te http://localhost:${PORT}`);
});