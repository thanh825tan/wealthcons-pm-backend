const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer '))
      return res.status(401).json({ success: false, message: 'Chưa xác thực' });

    const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    if (!user || !user.isActive)
      return res.status(401).json({ success: false, message: 'Token không hợp lệ' });

    req.user = user;
    next();
  } catch (e) {
    return res.status(401).json({ success: false, message: 'Token không hợp lệ hoặc hết hạn' });
  }
};

module.exports = { authenticate };
