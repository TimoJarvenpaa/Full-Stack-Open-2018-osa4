const supertest = require('supertest')
const {
  app,
  server
} = require('../index')
const api = supertest(app)
const Blog = require('../models/blog')
const {
  format,
  initialBlogs,
  nonExistingId,
  blogsInDb
} = require('./test_helper')

describe('when there are some blogs saved already', () => {

  beforeAll(async () => {
    await Blog.deleteMany({})

    const blogObjects = initialBlogs.map(blog => new Blog(blog))
    const promiseArray = blogObjects.map(blog => blog.save())
    await Promise.all(promiseArray)
  })


  test('all blogs are returned as json by GET /api/blogs', async () => {
    const blogsInDatabase = await blogsInDb()

    const response = await api
      .get('/api/blogs')
      .expect(200)
      .expect('Content-Type', /application\/json/)

    expect(response.body.length).toBe(blogsInDatabase.length)

    const returnedTitles = response.body.map(b => b.title)
    blogsInDatabase.forEach(blog => {
      expect(returnedTitles).toContain(blog.title)
    })
  })
})

describe('addition of a new blog', () => {

  test('POST /api/blogs succeeds with valid data', async () => {
    const blogsAtStart = await blogsInDb()

    const newBlog = {
      title: 'Type wars',
      author: 'Robert C. Martin',
      url: 'http://blog.cleancoder.com/uncle-bob/2016/05/01/TypeWars.html',
      likes: 2
    }

    await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const blogsAfterOperation = await blogsInDb()

    expect(blogsAfterOperation.length).toBe(blogsAtStart.length + 1)
    expect(blogsAfterOperation).toContainEqual(newBlog)
  })

  test('POST /api/blogs fails if title is missing', async () => {
    const newBlog = {
      author: 'somebody',
      url: 'example.com',
      likes: 2
    }

    const blogsAtStart = await blogsInDb()

    await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(400)

    const blogsAfterOperation = await blogsInDb()

    expect(blogsAfterOperation.length).toBe(blogsAtStart.length)
  })

  test('a blog with missing likes is added with 0 likes', async () => {
    const newBlog = {
      title: 'TDD harms architecture',
      author: 'Robert C. Martin',
      url: 'http://blog.cleancoder.com/uncle-bob/2017/03/03/TDD-Harms-Architecture.html'
    }

    const blogsAtStart = await blogsInDb()

    const response = await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const blogsAfterOperation = await blogsInDb()

    expect(response.body.likes).toBe(0)
    expect(blogsAfterOperation.length).toBe(blogsAtStart.length + 1)
  })

  test('POST /api/blogs fails if url is missing', async () => {
    const newBlog = {
      title: 'A blog without an url',
      author: 'Unknown',
      likes: 1
    }

    const blogsAtStart = await blogsInDb()

    await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(400)

    const blogsAfterOperation = await blogsInDb()

    expect(blogsAfterOperation.length).toBe(blogsAtStart.length)
  })
})

afterAll(() => {
  server.close()
})