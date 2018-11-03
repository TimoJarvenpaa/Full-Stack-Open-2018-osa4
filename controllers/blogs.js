const blogsRouter = require('express').Router()
const Blog = require('../models/blog')

blogsRouter.get('/', async (request, response) => {
  try {
    const blogs = await Blog.find({})
    response.json(blogs)
  } catch (exception) {
    console.log(exception)
    response.status(500).json({
      error: 'something went wrong...'
    })
  }
})


blogsRouter.post('/', async (request, response) => {
  try {
    const body = request.body

    if (body.title === undefined) {
      return response.status(400).json({
        error: 'content missing'
      })
    }
    const blog = new Blog({
      title: body.title,
      author: body.author,
      url: body.url,
      likes: body.likes ? body.likes : 0
    })

    const savedBlog = await blog.save()
    response.json(savedBlog)
  } catch (exception) {
    console.log(exception)
    response.status(500).json({
      error: 'something went wrong...'
    })
  }
})

module.exports = blogsRouter