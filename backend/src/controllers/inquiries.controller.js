import {
  submitPublicInquiry,
  getInquiriesList,
  getInquiryDetails,
  changeInquiryStatus,
  changeInquiryPriority,
  changeInquiryAssignee,
  addInquiryNote,
} from '../services/inquiries.service.js';
import { listNotesByInquiryId } from '../repositories/notes.repo.js';
import { bulkUpdateInquiryStatus } from '../repositories/inquiries.repo.js';
import { getStats, getAnalytics, getKpis } from '../services/analytics.service.js';
import { formatCsv } from '../utils/csv.js';

export async function create(req, res) {
  const result = await submitPublicInquiry({
    ...req.body,
    clientIp: req.ip,
  });

  const statusCode = result.isDuplicate ? 200 : 201;
  return res.status(statusCode).json({
    data: result.data,
    message: result.message,
  });
}

export async function list(req, res) {
  const result = await getInquiriesList({
    ...req.query,
    currentAdminId: req.admin?.id,
  });
  return res.status(200).json(result);
}

export async function getById(req, res) {
  const result = await getInquiryDetails(req.params.id);
  return res.status(200).json({
    data: result,
  });
}

export async function updateStatus(req, res) {
  const result = await changeInquiryStatus(req.params.id, req.body.status, req.admin.id);
  return res.status(200).json({
    data: result,
    message: 'Status updated successfully',
  });
}

export async function updatePriority(req, res) {
  const result = await changeInquiryPriority(req.params.id, req.body.priority, req.admin.id);
  return res.status(200).json({
    data: result,
    message: 'Priority updated successfully',
  });
}

export async function updateAssignee(req, res) {
  const result = await changeInquiryAssignee(req.params.id, req.body.adminId, req.admin.id);
  return res.status(200).json({
    data: result,
    message: 'Assignee updated successfully',
  });
}

export async function bulkUpdateStatus(req, res) {
  const { ids, status } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: { message: 'Array of ids is required' } });
  }
  if (ids.length > 100) {
    return res.status(400).json({ error: { message: 'Maximum 100 ids allowed per bulk update' } });
  }
  const updatedCount = await bulkUpdateInquiryStatus(ids, status, req.admin.id);
  return res.status(200).json({
    message: `Successfully updated ${updatedCount} inquiries to ${status}`,
    updatedCount,
    status,
  });
}

export async function addNote(req, res) {
  const result = await addInquiryNote(req.params.id, req.admin.id, req.body.note);
  return res.status(201).json({
    data: result,
    message: 'Note added successfully',
  });
}

export async function getNotes(req, res) {
  const notes = await listNotesByInquiryId(req.params.id);
  return res.status(200).json({
    data: notes,
  });
}

export async function stats(req, res) {
  const range = req.query.range || '7d';
  const data = await getStats(range);
  return res.status(200).json({
    ...data,
    data,
  });
}

export async function kpis(req, res) {
  const data = await getKpis();
  return res.status(200).json({
    ...data,
    data,
  });
}

export async function analytics(req, res) {
  const range = req.query.range || '30d';
  const data = await getAnalytics(range);
  return res.status(200).json({
    ...data,
    data,
  });
}

export async function exportCsv(req, res) {
  // Fetch up to 1000 items matching active filters (or specific ids)
  const result = await getInquiriesList({
    ...req.query,
    limit: 1000,
    page: 1,
  });

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'phone', header: 'Phone' },
    { key: 'email', header: 'Email' },
    { key: 'userType', header: 'User Type' },
    { key: 'category', header: 'Category' },
    { key: 'status', header: 'Status' },
    { key: 'createdAt', header: 'Date Submitted' },
    { key: 'message', header: 'Message' },
  ];

  const csvData = formatCsv(columns, result.data);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="k12_hunar_inquiries_${timestamp}.csv"`);
  return res.status(200).send(csvData);
}

export default {
  create,
  list,
  getById,
  updateStatus,
  bulkUpdateStatus,
  addNote,
  getNotes,
  stats,
  kpis,
  analytics,
  exportCsv,
};
