import express from "express"
import cors from "cors"
import { z } from "zod"
import fs from "fs/promises"

const app = express()

app.use(cors())
app.use(express.json())

type Movie = {
  id: number
  title: string
  year: number
}

const loadDB = async (filename: string) => {
  try {
    const rawData = await fs.readFile(`${__dirname}/../database/${filename}.json`, 'utf-8')
    const data = JSON.parse(rawData)
    return data as Movie[]
  } catch (error) {
    return null
  }
}

const saveDB = async (filename: string, data: any) => {
  try {
    const fileContent = JSON.stringify(data)
    await fs.writeFile(`${__dirname}/../database/${filename}.json`, fileContent)
    return true
  } catch (error) {
    return false
  }
}

const QueryParams = z.object({
  after: z.coerce.number()
})
// /api/movies?after=2000&startswith=tita
app.get("/api/movies", async (req, res) => {

  const result = QueryParams.safeParse(req.query)
  if (!result.success)
    return res.status(400).json(result.error.issues)
  const queryParams = result.data

  const movies = await loadDB("movies")
  if (!movies)
    return res.sendStatus(500)

  const filterMovies = movies.filter(movie => movie.year > queryParams.after)

  res.json(filterMovies)
})

// /api/movies/123    - not /api/movies?id=123 (REST!!!)
app.get("/api/movies/:id", async (req, res) => {

  const result = z.coerce.number().safeParse(req.params.id)
  if (!result.success)
    return res.status(400).json(result.error.issues)

  const id = result.data

  const movies = await loadDB("movies")
  if (!movies)
    return res.sendStatus(500)

  const movie = movies.find(movie => movie.id === id)
  if (!movie)
    return res.sendStatus(404)

  res.json(movie)
})

const PostRequest = z.object({
  title: z.string(),
  year: z.number(),
})
// /api/movies - body { title..., year... }
app.post("/api/movies", async (req, res) => {

  const result = PostRequest.safeParse(req.body)
  if (!result.success)
    return res.status(400).json(result.error.issues)
  const newCountry = result.data

  const movies = await loadDB("movies")
  if (!movies)
    return res.sendStatus(500)

  const id = Math.random()
  const isSuccessful = await saveDB("movies", [ ...movies, { ...newCountry, id } ])

  if (!isSuccessful)
    return res.sendStatus(500)

  res.json({ ...newCountry, id })
})

// /api/movies/123 - body { title..., year... }
app.patch("/api/movies/:id", async (req, res) => {
  const result1 = z.coerce.number().safeParse(req.params.id)
  if (!result1.success)
    return res.status(400).json(result1.error.issues)
  const id = result1.data

  const result2 = PostRequest.safeParse(req.body)
  if (!result2.success)
    return res.status(400).json(result2.error.issues)
  const newData = result2.data

  const movies = await loadDB("movies")
  if (!movies)
    return res.sendStatus(500)

  const movie = movies.find(movie => movie.id === id)
  if (!movie)
    return res.sendStatus(404)

  const isSuccessful = await saveDB("movies", movies
    .map(movie => movie.id !== id ? movie : { ...newData, id }))

  if (!isSuccessful)
    return res.sendStatus(500)

  res.sendStatus(200)
})

app.delete("/api/movies/:id", async (req, res) => {
  const result = z.coerce.number().safeParse(req.params.id)
  if (!result.success)
    return res.status(400).json(result.error.issues)
  const id = result.data

  const movies = await loadDB("movies")
  if (!movies)
    return res.sendStatus(500)

  const isSuccessful = await saveDB("movies", movies
    .filter(movie => movie.id !== id))

  if (!isSuccessful)
    return res.sendStatus(500)

  res.sendStatus(200)
})

app.listen(3000)
