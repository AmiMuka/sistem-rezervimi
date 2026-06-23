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

const jwt = require('jsonwebtoken');

// Mock eAlbania login — simulon autentikimin
app.post('/api/auth/mock-login', async (req, res) => {
  try {
    const { emer, mbiemer, email, numriID } = req.body;

    if (!emer || !mbiemer || !email || !numriID) {
      return res.status(400).json({ error: 'Të gjitha fushat janë të detyrueshme' });
    }

    // Gjen anëtarin nëse ekziston, ose e krijon
    let anetar = await prisma.anetar.findUnique({ where: { email } });

    if (!anetar) {
      anetar = await prisma.anetar.create({
        data: { emer, mbiemer, email, numriID },
      });
    }

    // Krijon JWT token
    const token = jwt.sign(
      { id: anetar.id, email: anetar.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, anetar });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gabim në autentikim' });
  }
});

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