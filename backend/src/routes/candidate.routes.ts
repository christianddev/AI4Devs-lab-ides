import { Router } from 'express';
import { CandidateController } from '../controllers/candidate.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { upload } from '../middlewares/file.middleware';

const router = Router();
const candidateController = new CandidateController();

/**
 * @swagger
 * components:
 *   schemas:
 *     Candidate:
 *       type: object
 *       required:
 *         - firstName
 *         - lastName
 *         - email
 *         - phone
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único del candidato
 *         firstName:
 *           type: string
 *           description: Nombre del candidato
 *         lastName:
 *           type: string
 *           description: Apellidos del candidato
 *         email:
 *           type: string
 *           format: email
 *           description: Email del candidato
 *         phone:
 *           type: string
 *           description: Teléfono del candidato
 *         status:
 *           type: string
 *           enum: [NEW, REVIEWING, INTERVIEWING, OFFERED, HIRED, REJECTED]
 *           description: Estado actual del candidato
 */

/**
 * @swagger
 * /api/v1/candidates:
 *   post:
 *     summary: Crear un nuevo candidato
 *     tags: [Candidates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Candidate'
 *     responses:
 *       201:
 *         description: Candidato creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Candidate'
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 */
router.post('/',
  authenticate,
  authorize(['ADMIN', 'RECRUITER']),
  candidateController.create
);

/**
 * @swagger
 * /api/v1/candidates:
 *   get:
 *     summary: Obtener lista de candidatos
 *     tags: [Candidates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filtrar por estado
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Búsqueda por nombre o email
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Límite de resultados por página
 *     responses:
 *       200:
 *         description: Lista de candidatos
 *       401:
 *         description: No autorizado
 */
router.get('/',
  authenticate,
  authorize(['ADMIN', 'RECRUITER']),
  candidateController.findAll
);

router
  .route('/:id')
  .get(authorize(['ADMIN', 'RECRUITER']), candidateController.findById)
  .put(authorize(['ADMIN', 'RECRUITER']), candidateController.update)
  .delete(authorize(['ADMIN']), candidateController.delete);

export default router;