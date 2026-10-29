import crypto from 'crypto';
import {
  createInquiryRow,
  findDuplicateWithinWindow,
  listInquiries as repoListInquiries,
  findInquiryById,
  updateInquiryStatus as repoUpdateStatus,
} from '../repositories/inquiries.repo.js';
import { logActivity, listActivityByInquiryId } from '../repositories/activity.repo.js';
import { createNote, listNotesByInquiryId } from '../repositories/notes.repo.js';
import { normalizePhone } from '../utils/phone.js';
import { HttpError } from '../utils/httpError.js';
import { buildPaginationMeta } from '../utils/pagination.js';

export async function submitPublicInquiry({
  userType,
  category,
  name,
  email,
  phone,
  message,
  website, // honeypot
  honeypot,
  clientIp,
}) {
  // 1. Bot Honeypot Defense: if filled, return benign fake 201 without saving
  const botTrap = website || honeypot;
  if (botTrap && botTrap.trim().length > 0) {
    return {
      isBot: true,
      data: {
        id: crypto.randomUUID(),
        referenceCode: 'KH-88888888',
        createdAt: new Date().toISOString(),
      },
      message: 'Thank you for your inquiry. Our team will review your submission soon.',
    };
  }

  const normalizedEmail = email.toLowerCase().trim();
  const normalizedPhone = normalizePhone(phone);
  const cleanMessage = message.trim();
  const cleanName = name.trim();
  const sourceIpHash = clientIp ? crypto.createHash('sha256').update(clientIp).digest('hex') : null;

  // 2. Idempotency Check: if submitted within 10 mins with same email + category + message
  const duplicate = await findDuplicateWithinWindow(normalizedEmail, category, cleanMessage, 10);
  if (duplicate) {
    return {
      isDuplicate: true,
      data: {
        id: duplicate.id,
        referenceCode: duplicate.reference_code,
        createdAt: duplicate.created_at,
      },
      message: 'Thank you! Your inquiry was already received and is in our processing queue.',
    };
  }

  // 3. Insert Inquiry
  const row = await createInquiryRow({
    userType,
    category,
    name: cleanName,
    email: normalizedEmail,
    phone: normalizedPhone,
    message: cleanMessage,
    sourceIpHash,
  });

  // 4. Log Creation Activity
  await logActivity({
    inquiryId: row.id,
    adminId: null,
    action: 'created',
    fromValue: null,
    toValue: 'New',
  });

  return {
    isSuccess: true,
    data: {
      id: row.id,
      referenceCode: row.reference_code,
      createdAt: row.created_at,
    },
    message: 'Thank you! Your inquiry has been received. Our team will get back to you soon.',
  };
}

export async function getInquiriesList(queryParams) {
  const { data, total } = await repoListInquiries(queryParams);
  const pagination = buildPaginationMeta(queryParams.page, queryParams.limit, total);

  return {
    data,
    pagination,
    appliedFilters: {
      category: queryParams.category || null,
      userType: queryParams.userType || null,
      status: queryParams.status || null,
      search: queryParams.search || null,
      from: queryParams.from || null,
      to: queryParams.to || null,
      sort: queryParams.sort || 'createdAt',
      order: queryParams.order || 'desc',
    },
  };
}

export async function getInquiryDetails(id) {
  const inquiry = await findInquiryById(id);
  if (!inquiry) {
    throw HttpError.notFound('Inquiry record not found');
  }

  const notes = await listNotesByInquiryId(id);
  const activity = await listActivityByInquiryId(id);

  return {
    ...inquiry,
    notes,
    activity,
  };
}

export async function changeInquiryStatus(id, newStatus, adminId) {
  const current = await findInquiryById(id);
  if (!current) {
    throw HttpError.notFound('Inquiry record not found');
  }

  // No-op if status is unchanged
  if (current.status === newStatus) {
    return current;
  }

  const updated = await repoUpdateStatus(id, newStatus);

  // Log status transition in activity log
  await logActivity({
    inquiryId: id,
    adminId,
    action: 'status_changed',
    fromValue: current.status,
    toValue: newStatus,
  });

  return updated;
}

export async function addInquiryNote(inquiryId, adminId, noteText) {
  const inquiry = await findInquiryById(inquiryId);
  if (!inquiry) {
    throw HttpError.notFound('Inquiry record not found');
  }

  const created = await createNote({ inquiryId, adminId, note: noteText });

  await logActivity({
    inquiryId,
    adminId,
    action: 'note_added',
    fromValue: null,
    toValue: noteText.length > 50 ? `${noteText.slice(0, 47)}...` : noteText,
  });

  return created;
}

export default {
  submitPublicInquiry,
  getInquiriesList,
  getInquiryDetails,
  changeInquiryStatus,
  addInquiryNote,
};
