import express from 'express';
import {
  protect,
  isSuperAdmin,
  requireModule,
  requireJoiningEditAdmission,
} from '../middleware/auth.middleware.js';
import {
  listJoinings,
  getJoining,
  saveJoiningDraft,
  patchJoiningStepTwo,
  submitJoiningForApproval,
  approveJoining,
  deleteSelfRegistrationJoining,
} from '../controllers/joining.controller.js';
import {
  createJoiningPublicEditLink,
  createJoiningDraftAndPublicLink,
  checkExistingLeadByPhones,
  createSelfRegistrationLink,
  getSelfRegistrationLink,
  regenerateSelfRegistrationLink,
} from '../controllers/joiningPublic.controller.js';

const router = express.Router();

router.use(protect);

router.get('/', listJoinings);
router.get('/check-existing-lead', checkExistingLeadByPhones);
router.post('/send-public-link', createJoiningDraftAndPublicLink);
router.get('/self-registration-link', getSelfRegistrationLink);
router.post('/self-registration-link', createSelfRegistrationLink);
router.post('/self-registration-link/regenerate', regenerateSelfRegistrationLink);
router.post('/:leadId/public-edit-link', createJoiningPublicEditLink);
router.get('/:leadId', getJoining);
router.patch('/:leadId/step-two', requireJoiningEditAdmission, patchJoiningStepTwo);
router.post('/:leadId', saveJoiningDraft);
router.post('/:leadId/submit', submitJoiningForApproval);
router.post('/:leadId/approve', requireModule('joining', 'write'), approveJoining);
router.delete('/:leadId', requireModule('joining', 'write'), deleteSelfRegistrationJoining);

export default router;


