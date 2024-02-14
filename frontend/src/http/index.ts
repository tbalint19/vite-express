import { z } from "zod"
// network error
// client error (4xx)
// server error (5xx)
// validation error (2xx)

type Response<Type> = {
  success: true
  status: number
  data: Type
} | {
  success: false
  status: number | null
}

type Methods = "GET" | "POST" | "PATCH" | "DELETE"

export const safeFetch = async <Schema extends z.ZodTypeAny>(
  method: Methods,
  url: string,
  schema: Schema,
  payload?: any
): Promise<Response<z.infer<typeof schema>>> => {
  try {
    const response = await fetch(url, {
      method,
      headers: payload ? {
        'Content-Type': "application/JSON"
      } : { },
      body: payload ? JSON.stringify(payload) : undefined
    })

    if (response.status >= 500)
      return { success: false, status: response.status }
    
    if (response.status >= 400)
      return { success: false, status: response.status }
    
    const data = await response.json()

    const result = schema.safeParse(data)
    if (!result.success)
      return { success: false, status: response.status }

    return { data: result.data, success: true, status: response.status }
  } catch (error) {
    return { success: false, status: null }
  }
}

const MovieSchema = z.object({
  id: z.number(), title: z.string(), year: z.number()
})

export const getMovies = (after: number) =>
  safeFetch("GET", `http://localhost:3000/api/movies?after=${after}`, MovieSchema.array())


export const postMovie = async (movie: { title: string, year: number }) =>
  safeFetch("POST", `http://localhost:3000/api/movies`, MovieSchema, movie)

/* export const patchMovie = async (id: number, movie: { title: string, year: number }) =>
  safeFetch("PATCH", `http://localhost:3000/api/movies/${id}`, 3, movie)

export const deleteMovie = async (id: number) =>
  safeFetch("DELETE", `http://localhost:3000/api/movies/${id}`, "alma") */