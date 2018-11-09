const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const mongoose = require('mongoose')
const User = require('../models/user')
const jwt = require('jsonwebtoken')

blogsRouter.get('/', async (request, response) => {
  try {
    const blogs = await Blog
      .find({})
      .populate('user', {
        username: 1,
        name: 1
      })

    response.json(blogs.map(Blog.format))
  } catch (exception) {
    console.log(exception)
    response.status(500).json({
      error: 'something went wrong...'
    })
  }
})

blogsRouter.post('/', async (request, response) => {
  const body = request.body

  try {
    const decodedToken = jwt.verify(request.token, process.env.SECRET)

    if (!request.token || !decodedToken.id) {
      return response.status(401).json({
        error: 'token missing or invalid'
      })
    }

    if (body.title === undefined || body.url === undefined) {
      return response.status(400).json({
        error: 'content missing'
      })
    }

    const user = await User.findById(decodedToken.id)

    const blog = new Blog({
      title: body.title,
      author: body.author,
      url: body.url,
      likes: body.likes ? body.likes : 0,
      user: user._id
    })

    const savedBlog = await blog.save()

    user.blogs = user.blogs.concat(savedBlog._id)
    await user.save()

    response.status(201).json(Blog.format(savedBlog))
  } catch (exception) {
    if (exception.name === 'JsonWebTokenError') {
      response.status(401).json({
        error: exception.message
      })
    } else {
      console.log(exception)
      response.status(500).json({
        error: 'something went wrong...'
      })
    }
  }
})

blogsRouter.delete('/:id', async (request, response) => {
  try {
    const decodedToken = jwt.verify(request.token, process.env.SECRET)

    if (!request.token || !decodedToken.id) {
      return response.status(401).json({
        error: 'token missing or invalid'
      })
    }

    const blog = await Blog.findById(request.params.id)

    if (blog.user._id.toString() === decodedToken.id.toString()) {
      await Blog.findByIdAndDelete(request.params.id)

      response.status(204).end()
    } else {
      response.status(401).json({ error: 'only the user who posted the blog has the permission to delete it' })
    }
  } catch (exception) {
    if (exception.name === 'JsonWebTokenError') {
      response.status(401).json({
        error: exception.message
      })
    } else {
      console.log(exception)
      response.status(400).send({
        error: 'malformed id'
      })
    }
  }
})

blogsRouter.put('/:id', async (request, response) => {
  try {
    const body = request.body

    const blog = {
      title: body.title,
      author: body.author,
      url: body.url,
      likes: body.likes
    }

    if (!mongoose.Types.ObjectId.isValid(request.params.id)) {
      return response.status(400).send({
        error: 'invalid id'
      })
    }

    const updatedBlog = await Blog.findByIdAndUpdate(request.params.id, blog, {
      new: true
    })
    if (updatedBlog) {
      response.status(200).json(updatedBlog)
    } else {
      response.status(404).end()
    }
  } catch (exception) {
    console.log(exception)
    response.status(400).send({
      error: 'malformed id'
    })
  }
})

module.exports = blogsRouter