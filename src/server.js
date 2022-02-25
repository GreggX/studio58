import express from "express"
import bodyParser from "body-parser"
import cors from "cors"
import components from "../src/routes/components.route"
import log from "npmlog"

const app = express()

app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.use((err, req, res, next) => {
	if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
		log.error("api", `bodyError: ${err}`)
		return res.sendStatus(400)
	}
})
app.use("/api/v1/components", components)
app.use("*", (req, res) => res.status(404).json({ error: "not found" }))

export default app