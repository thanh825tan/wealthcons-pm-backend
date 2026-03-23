const router = require('express').Router();
const { Shopdrawing, Project, User } = require('../models');
const { authenticate } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

router.use(authenticate);

const uploadDir = 'uploads/shopdrawings';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

router.get('/', async (req, res) => {
  try {
    const { projectId, status, discipline } = req.query;
    const where = {};
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;
    if (discipline) where.discipline = discipline;

    const shopdrawings = await Shopdrawing.findAll({
      where,
      include: [
        { model: Project, as: 'project', attributes: ['id', 'name', 'code'] },
        { model: User, as: 'submitter', attributes: ['id', 'fullName'] }
      ],
      order: [['created_at', 'DESC']]
    });
    res.json({ success: true, data: { shopdrawings } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const sd = await Shopdrawing.findByPk(req.params.id, {
      include: [
        { model: Project, as: 'project' },
        { model: User, as: 'submitter', attributes: ['id', 'fullName'] }
      ]
    });
    if (!sd) return res.status(404).json({ success: false, message: 'Không tìm thấy bản vẽ' });
    res.json({ success: true, data: { shopdrawing: sd } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/', upload.single('file'), async (req, res) => {
  try {
    const data = { ...req.body, submittedBy: req.user.id };
    if (req.file) { data.filePath = req.file.path; data.fileName = req.file.originalname; }
    const sd = await Shopdrawing.create(data);
    res.status(201).json({ success: true, message: 'Thêm bản vẽ thành công', data: { shopdrawing: sd } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.put('/:id', upload.single('file'), async (req, res) => {
  try {
    const sd = await Shopdrawing.findByPk(req.params.id);
    if (!sd) return res.status(404).json({ success: false, message: 'Không tìm thấy bản vẽ' });
    const data = { ...req.body };
    if (req.file) { data.filePath = req.file.path; data.fileName = req.file.originalname; }
    await sd.update(data);
    res.json({ success: true, message: 'Cập nhật thành công', data: { shopdrawing: sd } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const sd = await Shopdrawing.findByPk(req.params.id);
    if (!sd) return res.status(404).json({ success: false, message: 'Không tìm thấy bản vẽ' });
    await sd.destroy();
    res.json({ success: true, message: 'Đã xóa bản vẽ' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
