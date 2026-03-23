const router = require('express').Router();
const { Op } = require('sequelize');
const { Project, User } = require('../models');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const { status, search } = req.query;
    const where = {};
    if (status) where.status = status;
    if (search) where.name = { [Op.iLike]: `%${search}%` };

    const projects = await Project.findAll({
      where,
      include: [{ model: User, as: 'manager', attributes: ['id', 'fullName', 'username'] }],
      order: [['created_at', 'DESC']]
    });
    res.json({ success: true, data: { projects } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id, {
      include: [{ model: User, as: 'manager', attributes: ['id', 'fullName'] }]
    });
    if (!project) return res.status(404).json({ success: false, message: 'Không tìm thấy dự án' });
    res.json({ success: true, data: { project } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const project = await Project.create({ ...req.body, managerId: req.body.managerId || req.user.id });
    res.status(201).json({ success: true, message: 'Tạo dự án thành công', data: { project } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Không tìm thấy dự án' });
    await project.update(req.body);
    res.json({ success: true, message: 'Cập nhật thành công', data: { project } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Không tìm thấy dự án' });
    await project.destroy();
    res.json({ success: true, message: 'Đã xóa dự án' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
