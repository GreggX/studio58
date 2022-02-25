import { ObjectId } from "bson"
const configurePort = require("../gpio/config").configurePort
import ComponentsDAO from "../dao/componentsDAO"


export default class ComponentController {
	async launchComponent(config) {
		try {
			console.log(config)
			const { mode, pin, state } = await ComponentsDAO.getComponentByName(config)
			const component = configurePort(pin, mode)
			component.writeSync(state)
		} catch (e) {
			return { error: e }
		}
	}

	static async setComponentState(req, res) {
		try {
			const { name, state } = req.body
			let error
			let componentResponse 

			componentResponse = await ComponentsDAO.updateComponent(
				// ObjectId(componentId),
				name,
				state
			)

			error = componentResponse.error
			if (error) {
				res.status(400).json({ error })
				return
			}

			if (componentResponse.matchedCount === 0) {
				res.status(400).json({
					error: "unable to update component state"
				})
				return
			}

			componentResponse = await ComponentsDAO.getComponentByName(name)
			const component = configurePort(componentResponse.pin, componentResponse.mode)
			component.writeSync(state)
			// const launchResponse = await this.launchComponent(name)
			error = component.error
			if (error) {
				res.status(400).json({ error })
				return
			}

			res.json({
				status: "success", 
				message: `Your component state is ${state === 0 ? "on" : "off"}`
			})
		} catch (e) {
			console.log(e)
			res.status(500).json({ error: e })
		}
	}

	static async getComponents(req, res) {
		const COMPONENTS_PER_PAGE = 20
		const { componentsList, totalComponents } = await ComponentsDAO.getComponents()
		let response = {
			components: componentsList,
			page: 0,
			filters: {},
			entries_per_page: COMPONENTS_PER_PAGE,
			total_results: totalComponents
		}
		res.json(response)
	}

	static async postComponent(req, res) {
		try {
			const body = req.body
			const validModes = ["in", "out", "high", "low"]
			const validTypes = ["led", "pushbutton", "relay"]
			let errors = {}
			let checker

			if (!body.pin) { errors.pin = "pin is a required field" }
			if (!body.mode) { errors.mode = "mode is a required field" }
			if (!body.name) { errors.name = "name is a required field" }
			if (!body.type) { errors.type = "type is a required field" }

			if (Object.keys(errors).length > 0) {
				res.status(400).json(errors)
				return
			}

			checker = parseInt(body.pin)
			if (checker === "NaN") { 
				errors.pin = "pin must be an int" 
			}

			if (!validModes.includes(body.mode)) {
				errors.mode = "mode can only be in|out|high|low"
			}

			if (!validTypes.includes(body.type)) {
				errors.type = `type can only be ${
					validTypes.reduce((acc, curr) => acc + curr + "|", "")
				}`
			}

			if (Object.keys(errors).length > 0) {
				res.status(400).json(errors)
				return
			}

			const componentFromDB = await ComponentsDAO.addComponent(body.pin, body.mode, body.name, body.type)
			if (!componentFromDB.success) {
				res.status(400).send({ general: "Internal error, please try again later" })
				return
			}

			res.json({
				sucess: "Your component was added successfully"
			})
		} catch(e) {
			res.status(500).json({ error: e })
		}
	}
}
