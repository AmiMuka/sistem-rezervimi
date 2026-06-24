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
const QRCode = require('qrcode');

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

    // Kontrollo: maksimum 1 rezervim aktiv në çdo moment
    const rezervimAktiv = await prisma.rezervim.findFirst({
      where: { anetarId, status: 'aktiv' },
    });
    if (rezervimAktiv) {
      return res.status(409).json({ error: 'Ke tashmë një rezervim aktiv. Anuloje atë para se të bësh një të re.' });
    }

    // Kontrollo: maksimum 5 orë në ditë
    const fillimi = new Date(oraFillimit);
    const mbarimi = new Date(oraMbarimit);
    const oret = (mbarimi - fillimi) / (1000 * 60 * 60);

    const fillimDite = new Date(data);
    fillimDite.setHours(0, 0, 0, 0);
    const fundDite = new Date(fillimDite);
    fundDite.setHours(23, 59, 59, 999);

    const rezervimetDites = await prisma.rezervim.findMany({
      where: { anetarId, data: { gte: fillimDite, lte: fundDite }, status: { not: 'anuluar' } },
    });
    const oretEkzistuese = rezervimetDites.reduce(
      (sum, r) => sum + (new Date(r.oraMbarimit) - new Date(r.oraFillimit)) / (1000 * 60 * 60), 0
    );
    if (oretEkzistuese + oret > 5) {
      return res.status(409).json({ error: `Limiti ditor i 5 orëve do tejkalohej (ke ${oretEkzistuese}h, kjo do shtonte ${oret}h).` });
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

    // Gjenero QR kod (string unik bazuar te ID e rezervimit)
    const qrText = `BKSH-REZ-${rezervim.id}-${vendId}-${anetarId}`;
    const qrImage = await QRCode.toDataURL(qrText);

    // Ruaj QR kodin te rezervimi
    const rezervimMeQR = await prisma.rezervim.update({
      where: { id: rezervim.id },
      data: { kodiQR: qrText },
    });

    // Ndrysho statusin e vendit
    await prisma.vend.update({
      where: { id: vendId },
      data: { status: 'rezervuar' },
    });

    res.json({ ...rezervimMeQR, qrImage });
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

// Anulo një rezervim
app.post('/api/rezervime/:id/anulo', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const rezervim = await prisma.rezervim.findUnique({ where: { id } });
    if (!rezervim) return res.status(404).json({ error: 'Rezervimi nuk ekziston' });
    if (rezervim.status !== 'aktiv') return res.status(400).json({ error: 'Ky rezervim nuk është aktiv' });

    const tani = new Date();
    const minutaParaFillimit = (new Date(rezervim.oraFillimit) - tani) / (1000 * 60);
    let penalitetShtese = 0;
    if (minutaParaFillimit < 30) penalitetShtese = 0.5;

    await prisma.rezervim.update({ where: { id }, data: { status: 'anuluar' } });
    await prisma.vend.update({ where: { id: rezervim.vendId }, data: { status: 'i_lire' } });

    if (penalitetShtese > 0) {
      await prisma.anetar.update({
        where: { id: rezervim.anetarId },
        data: { penalitete: { increment: penalitetShtese } },
      });
    }

    res.json({ mesazh: 'Rezervimi u anulua', penalitet: penalitetShtese });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gabim në anulim' });
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