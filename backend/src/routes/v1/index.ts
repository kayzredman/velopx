import { Router } from 'express'
import partsRouter from './parts'
import quotesRouter from './quotes'
import ordersRouter from './orders'
import deliveriesRouter from './deliveries'
import webhooksRouter from './webhooks'

const router = Router()

router.use('/parts', partsRouter)
router.use('/quotes', quotesRouter)
router.use('/orders', ordersRouter)
router.use('/deliveries', deliveriesRouter)
router.use('/webhooks', webhooksRouter)

export default router
