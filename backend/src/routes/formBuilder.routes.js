import express from 'express';
import {
  listForms,
  getForm,
  createForm,
  updateForm,
  deleteForm,
  listFields,
  createField,
  updateField,
  deleteField,
  reorderFields,
} from '../controllers/formBuilder.controller.js';
import { protect, requireModule } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public route for getting form (for public lead form)
router.get('/forms/public/:formId', getForm);

// All other routes require authentication
router.use(protect);

// Form routes
router.route('/forms')
  .get(requireModule('formBuilder'), listForms)
  .post(requireModule('formBuilder', 'write'), createForm);

router.route('/forms/:formId')
  .get(requireModule('formBuilder'), getForm)
  .put(requireModule('formBuilder', 'write'), updateForm)
  .delete(requireModule('formBuilder', 'write'), deleteForm);

// Field routes
router.route('/forms/:formId/fields')
  .get(requireModule('formBuilder'), listFields)
  .post(requireModule('formBuilder', 'write'), createField);

router.route('/forms/:formId/fields/reorder')
  .put(requireModule('formBuilder', 'write'), reorderFields);

router.route('/fields/:fieldId')
  .put(requireModule('formBuilder', 'write'), updateField)
  .delete(requireModule('formBuilder', 'write'), deleteField);

export default router;
