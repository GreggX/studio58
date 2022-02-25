import app from "./server"
import { MongoClient } from "mongodb"
import ComponentsDAO from "./dao/componentsDAO"
import log from "npmlog"

const port = process.env.PORT || 8080


MongoClient.connect(
	process.env.STUDIO58_DB_URI,
	{ 
		useNewUrlParser: true,
		connectTimeoutMS: 2500,
		maxPoolSize: 50
	}
)
	.catch(err => {
		console.error(err.stack)
		process.exit(1)
	})
	.then(async client => {
		await ComponentsDAO.injectDB(client)
		app.listen(port, () => {
			log.info("api" ,`listening on port ${port}`)
			log.info("system", `running on platform ${process.platform}`)
		})
	})
