const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

// ─── USER ───────────────────────────────────────────────
const User = sequelize.define('User', {
  id:       { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  username: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  email:    { type: DataTypes.STRING(100), allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  fullName: { type: DataTypes.STRING(100), field: 'full_name' },
  role:     { type: DataTypes.ENUM('admin','manager','engineer','viewer'), defaultValue: 'engineer' },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' }
}, {
  tableName: 'users', underscored: true,
  hooks: {
    beforeCreate: async (u) => { u.password = await bcrypt.hash(u.password, 12); },
    beforeUpdate: async (u) => { if (u.changed('password')) u.password = await bcrypt.hash(u.password, 12); }
  }
});
User.prototype.comparePassword = function(p) { return bcrypt.compare(p, this.password); };
User.prototype.toJSON = function() { const v = { ...this.get() }; delete v.password; return v; };

// ─── PROJECT ─────────────────────────────────────────────
const Project = sequelize.define('Project', {
  id:          { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  code:        { type: DataTypes.STRING(20), allowNull: false, unique: true },
  name:        { type: DataTypes.STRING(200), allowNull: false },
  description: { type: DataTypes.TEXT },
  location:    { type: DataTypes.STRING(300) },
  startDate:   { type: DataTypes.DATEONLY, field: 'start_date' },
  endDate:     { type: DataTypes.DATEONLY, field: 'end_date' },
  status:      { type: DataTypes.ENUM('planning','active','on_hold','completed','cancelled'), defaultValue: 'planning' },
  managerId:   { type: DataTypes.INTEGER, field: 'manager_id' },
  progress:    { type: DataTypes.DECIMAL(5,2), defaultValue: 0 }
}, { tableName: 'projects', underscored: true });

// ─── SHOPDRAWING ──────────────────────────────────────────
const Shopdrawing = sequelize.define('Shopdrawing', {
  id:             { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  projectId:      { type: DataTypes.INTEGER, allowNull: false, field: 'project_id' },
  drawingNumber:  { type: DataTypes.STRING(50), field: 'drawing_number' },
  title:          { type: DataTypes.STRING(200), allowNull: false },
  revision:       { type: DataTypes.STRING(10), defaultValue: 'A' },
  discipline:     { type: DataTypes.ENUM('architectural','structural','mep','interior','other'), defaultValue: 'other' },
  filePath:       { type: DataTypes.STRING(500), field: 'file_path' },
  fileName:       { type: DataTypes.STRING(200), field: 'file_name' },
  submittedDate:  { type: DataTypes.DATEONLY, field: 'submitted_date' },
  approvedDate:   { type: DataTypes.DATEONLY, field: 'approved_date' },
  status:         { type: DataTypes.ENUM('draft','submitted','under_review','approved','rejected'), defaultValue: 'draft' },
  submittedBy:    { type: DataTypes.INTEGER, field: 'submitted_by' },
  comments:       { type: DataTypes.TEXT }
}, { tableName: 'shopdrawings', underscored: true });

// ─── RFI ─────────────────────────────────────────────────
const RFI = sequelize.define('RFI', {
  id:           { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  projectId:    { type: DataTypes.INTEGER, allowNull: false, field: 'project_id' },
  rfiNumber:    { type: DataTypes.STRING(30), field: 'rfi_number' },
  title:        { type: DataTypes.STRING(200), allowNull: false },
  description:  { type: DataTypes.TEXT, allowNull: false },
  discipline:   { type: DataTypes.ENUM('architectural','structural','mep','interior','other'), defaultValue: 'other' },
  priority:     { type: DataTypes.ENUM('low','medium','high','urgent'), defaultValue: 'medium' },
  status:       { type: DataTypes.ENUM('open','pending','answered','closed'), defaultValue: 'open' },
  submittedBy:  { type: DataTypes.INTEGER, field: 'submitted_by' },
  assignedTo:   { type: DataTypes.INTEGER, field: 'assigned_to' },
  dueDate:      { type: DataTypes.DATEONLY, field: 'due_date' },
  answeredDate: { type: DataTypes.DATEONLY, field: 'answered_date' },
  answer:       { type: DataTypes.TEXT }
}, { tableName: 'rfis', underscored: true });

// ─── EMAIL NOTE ───────────────────────────────────────────
const EmailNote = sequelize.define('EmailNote', {
  id:       { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  rfiId:    { type: DataTypes.INTEGER, allowNull: false, field: 'rfi_id' },
  type:     { type: DataTypes.ENUM('email','note','comment'), defaultValue: 'note' },
  subject:  { type: DataTypes.STRING(200) },
  content:  { type: DataTypes.TEXT, allowNull: false },
  fromUser: { type: DataTypes.INTEGER, field: 'from_user' },
  toEmails: { type: DataTypes.TEXT, field: 'to_emails' },
  sentAt:   { type: DataTypes.DATE, field: 'sent_at' }
}, { tableName: 'email_notes', underscored: true });

// ─── ASSOCIATIONS ─────────────────────────────────────────
Project.belongsTo(User,       { foreignKey: 'manager_id', as: 'manager' });
Project.hasMany(Shopdrawing,  { foreignKey: 'project_id', as: 'shopdrawings' });
Project.hasMany(RFI,          { foreignKey: 'project_id', as: 'rfis' });

Shopdrawing.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });
Shopdrawing.belongsTo(User,    { foreignKey: 'submitted_by', as: 'submitter' });

RFI.belongsTo(Project,  { foreignKey: 'project_id', as: 'project' });
RFI.belongsTo(User,     { foreignKey: 'submitted_by', as: 'submitter' });
RFI.belongsTo(User,     { foreignKey: 'assigned_to', as: 'assignee' });
RFI.hasMany(EmailNote,  { foreignKey: 'rfi_id', as: 'emails' });

EmailNote.belongsTo(RFI,  { foreignKey: 'rfi_id', as: 'rfi' });
EmailNote.belongsTo(User, { foreignKey: 'from_user', as: 'sender' });

module.exports = { sequelize, User, Project, Shopdrawing, RFI, EmailNote };
