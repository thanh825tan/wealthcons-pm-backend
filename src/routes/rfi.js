const router = require('express').Router();
const { RFI, EmailNote, Project, User } = require('../models');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const { projectId, status, priority } = req.query;
    const where = {};
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const rfis = await RFI.findAll({
      where,
      include: [
        { model: Project, as: 'project', attributes: ['id', 'name', 'code'] },
        { model: User, as: 'submitter', attributes: ['id', 'fullName'] },
        { model: User, as: 'assignee', attributes: ['id', 'fullName'] }
      ],
      order: [['created_at', 'DESC']]
    });
    res.json({ success: true, data: { rfis } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const rfi = await RFI.findByPk(req.params.id, {
      include: [
        { model: Project, as: 'project' },
        { model: User, as: 'submitter', attributes: ['id', 'fullName'] },
        { model: User, as: 'assignee', attributes: ['id', 'fullName'] },
        { model: EmailNote, as: 'emails', include: [{ model: User, as: 'sender', attributes: ['id', 'fullName'] }], order: [['created_at', 'ASC']] }
      ]
    });
    if (!rfi) return res.status(404).json({ success: false, message: 'Không tìm thấy RFI' });
    res.json({ success: true, data: { rfi } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const count = await RFI.count({ where: { projectId: req.body.projectId } });
    const rfiNumber = `RFI-${String(req.body.projectId).padStart(3,'0')}-${String(count+1).padStart(3,'0')}`;
    const rfi = await RFI.create({ ...req.body, rfiNumber, submittedBy: req.user.id });
    res.status(201).json({ success: true, message: 'Tạo RFI thành công', data: { rfi } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const rfi = await RFI.findByPk(req.params.id);
    if (!rfi) return res.status(404).json({ success: false, message: 'Không tìm thấy RFI' });
    if (req.body.status === 'answered') req.body.answeredDate = new Date();
    await rfi.update(req.body);
    res.json({ success: true, message: 'Cập nhật thành công', data: { rfi } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const rfi = await RFI.findByPk(req.params.id);
    if (!rfi) return res.status(404).json({ success: false, message: 'Không tìm thấy RFI' });
    await rfi.destroy();
    res.json({ success: true, message: 'Đã xóa RFI' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Email/ghi chú theo RFI
router.get('/:id/emails', async (req, res) => {
  try {
    const emails = await EmailNote.findAll({
      where: { rfiId: req.params.id },
      include: [{ model: User, as: 'sender', attributes: ['id', 'fullName'] }],
      order: [['created_at', 'ASC']]
    });
    res.json({ success: true, data: { emails } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/:id/emails', async (req, res) => {
  try {
    const email = await EmailNote.create({ ...req.body, rfiId: req.params.id, fromUser: req.user.id, sentAt: new Date() });
    res.status(201).json({ success: true, message: 'Đã thêm ghi chú', data: { email } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.delete('/:rfiId/emails/:emailId', async (req, res) => {
  try {
    await EmailNote.destroy({ where: { id: req.params.emailId, rfiId: req.params.rfiId } });
    res.json({ success: true, message: 'Đã xóa ghi chú' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
