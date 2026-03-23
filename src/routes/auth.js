const router = require('express').Router();
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { authenticate } = require('../middleware/auth');

const sign = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

router.post('/register', async (req, res) => {
  try {
    const { username, email, password, fullName } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ thông tin' });
    if (await User.findOne({ where: { email } }))
      return res.status(400).json({ success: false, message: 'Email đã tồn tại' });

    const user = await User.create({ username, email, password, fullName });
    res.status(201).json({ success: true, data: { user, token: sign(user.id) } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng' });
    res.json({ success: true, data: { user, token: sign(user.id) } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.get('/me', authenticate, (req, res) => {
  res.json({ success: true, data: { user: req.user } });
});

module.exports = router;
