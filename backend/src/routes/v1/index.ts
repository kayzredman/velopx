import { Router } from 'express'
import partsRouter from './parts'
import quotesRouter from './quotes'
import ordersRouter from './orders'
import paymentsRouter from './payments'
import deliveriesRouter from './deliveries'
import claimsRouter from './claims'
import jobCardsRouter from './job-cards'
import usersRouter from './users'
import webhooksRouter from './webhooks'
import analyticsRouter from './analytics'
import disputesRouter from './disputes'
import benchmarkRouter from './benchmark'
import vehiclesRouter from './vehicles'

const router = Router()

router.use('/parts', partsRouter)
router.use('/quotes', quotesRouter)
router.use('/orders', ordersRouter)
router.use('/payments', paymentsRouter)
router.use('/deliveries', deliveriesRouter)
router.use('/claims', claimsRouter)
router.use('/job-cards', jobCardsRouter)
router.use('/users', usersRouter)
router.use('/webhooks', webhooksRouter)
router.use('/analytics', analyticsRouter)
router.use('/disputes', disputesRouter)
router.use('/benchmark', benchmarkRouter)
router.use('/vehicles', vehiclesRouter)

export default router
