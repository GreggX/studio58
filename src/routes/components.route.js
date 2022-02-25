import { Router } from "express"
import ComponentsCtrl from "../api/components.controller"

const router = new Router()

router.route("/")
	.get(ComponentsCtrl.getComponents)
	.post(ComponentsCtrl.postComponent)
	.put(ComponentsCtrl.setComponentState)

export default router