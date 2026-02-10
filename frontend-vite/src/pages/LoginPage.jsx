// ========================================
// CORRECCIÓN PARA /api/login en index.js
// ========================================
// 
// REEMPLAZA las líneas 253-273 con este código:

app.post('/api/login', async (req, res) => {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(8)
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });

  const { email, password } = parsed.data;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) return res.status(400).json({ error: "User not found or no password" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: "Password incorrect" });

    // ✅ NUEVO: Buscar la entry más reciente confirmada del usuario
    const entry = await prisma.entry.findFirst({
      where: { 
        userId: user.id,
        status: "confirmed"
      },
      orderBy: { id: 'desc' }
    });

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('holypotToken', token, getCookieOptions());

    // ✅ NUEVO: Devolver entryId si existe
    res.json({ 
      success: true, 
      token,
      entryId: entry ? entry.id : null  // ← ESTO ES LO QUE FALTABA
    });
  } catch (error) {
    res.status(500).json({ error: "Error login", details: error.message });
  }
});
