import { ObjectId } from "bson"
import componentSchema from "../models/components.schema.json"
import log from "npmlog"

let components
let studio58
const DEFAULT_SORT = [["name", -1]]

export default class ComponentsDAO {
	static async injectDB(conn) {
		if (components) {
			return
		}
		try {
			const collections = await conn.db(process.env.STUDIO58_NS).collections()
			if (collections[0]) {
				studio58 = await conn.db(process.env.STUDIO58_NS)
				components = await conn.db(process.env.STUDIO58_NS).collection("components")
			} else {
				const collectionName = "components"
				components = await conn.db(process.env.STUDIO58_NS).createCollection(collectionName, componentSchema)
				log.info("db", `Creating new ${collectionName} collection with rules: ${JSON.stringify(componentSchema)}`)
			}

			this.components = components // this is only for testing
		} catch(e) {
			log.error("db",
				`Unable to establish a collection handle in componentsDAO: ${e}`
			)
		}
	}

	/**
	 * Retrieves the connection pool size, write concern and user roles on the
	 * current client.
	 * @returns {Promise<ConfigurationResult>} An object with configuration details.
	 */
	static async getConfiguration() {
		const roleInfo = await studio58.command({ connectionStatus: 1 })
		const authInfo = roleInfo.authInfo.authenticatedUserRoles[0]
		const { poolSize, wtimeout } = components.s.db.serverConfig.s.options
		let response = {
			poolSize,
			wtimeout,
			authInfo
		}
		return response
	}

	static async addComponent(pin, mode, name, type) {
		try {
			const newComponent = {
				pin,
				mode,
				name,
				type
			}
			await components.insertOne(newComponent)
			log.info("db", `Succefull component added: ${JSON.stringify(newComponent)}`)
			return { success: true }
		} catch(e) {
			log.error("db",
				`Unable to add a component: ${e}`
			)
			return { error: e }
		}
	}

	static async updateComponent(name, state) {
		try {
			const query = { name: { "$eq": name } }
			const update = {
				"$set": {
					state
				}
			}
			const options = { "upsert": false }

			const updateResponse = await components.updateOne(query, update, options)

			return updateResponse
		} catch (e) {
			log.error("db",
				`Unable to update component: ${e}`
			)
			return { error: e }
		}
	}

	static async getComponentByName(name) {
		try {
			const query = { name: { "$eq": name } }
			const projection = {
				"name": 1,
				"pin": 1,
				"mode": 1,
				"type": 1,
				"state": 1
			}

			return await components.findOne(query, projection)
		} catch (e) {
			log.error("db",
				`Failed to find component: ${e}`
			)
			return { error: e }
		}
	}

	static async getComponents({
		filters = null,
		page = 0,
		componentsPerPage = 20
	} = {}) {
		let queryParams = {}
		if (filters) {
			log.info("db", "There is no filters supported")
		}

		let { query = {}, project = {}, sort = DEFAULT_SORT } = queryParams
		let cursor
		try {
			cursor = await components
				.find()
				.project(project)
				.sort(sort)
		} catch(e) {
			log.error("db",
				`Unable to issue find command, ${e}`
			)
			return { componentsList: [], totalComponents: 0 }
		}

		const displayCursor = cursor.limit(componentsPerPage)

		try {
			const componentsList = await displayCursor.toArray()
			const totalComponents = page === 0 ? await components.countDocuments(query) : 0

			return { componentsList, totalComponents }
		} catch (e) {
			log.error("db",
				`Unable to convert cursor to array or problem counting documents, ${e}`
			)
			return { componentsList: [], totalComponents: 0 }
		}
	}

}
