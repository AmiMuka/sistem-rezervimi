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

// Krijo një rezervim
app.post('/api/rezervime', async (req, res) => {
  try {
    const { anetarId, vendId, data, oraFillimit, oraMbarimit } = req.body;

    if (!anetarId || !vendId || !data || !oraFillimit || !oraMbarimit) {
      return res.status(400).json({ error: 'Të gjitha fushat janë të detyrueshme' });
    }

    // Kontrollo që vendi ekziston dhe është i lirë
    const vend = await prisma.vend.findUnique({ where: { id: vendId } });
    if (!vend) {
      return res.status(404).json({ error: 'Vendi nuk ekziston' });
    }
    if (vend.status !== 'i_lire') {
      return res.status(409).json({ error: 'Vendi nuk është i lirë' });
    }

    // Krijo rezervimin
    const rezervim = await prisma.rezervim.create({
      data: {
        anetarId,
        vendId,
        data: new Date(data),
        oraFillimit: new Date(oraFillimit),
        oraMbarimit: new Date(oraMbarimit),
      },
    });

    // Ndrysho statusin e vendit
    await prisma.vend.update({
      where: { id: vendId },
      data: { status: 'rezervuar' },
    });

    res.json(rezervim);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gabim në krijimin e rezervimit', detaje: err.message });
  }
});

// Merr rezervimet e një anëtari
app.get('/api/rezervime/:anetarId', async (req, res) => {
  try {
    const rezervime = await prisma.rezervim.findMany({
      where: { anetarId: parseInt(req.params.anetarId) },
      include: { vend: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(rezervime);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gabim në marrjen e rezervimeve' });
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