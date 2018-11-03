const supertest = require('supertest')
const {
  app,
  server
} = require('../index')
const api = supertest(app)
const Blog = require('../models/blog')
const {
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

describe('deletion of a blog', async () => {
  let addedBlog

  beforeAll(async () => {
    addedBlog = new Blog({
      title: 'To be removed',
      author: 'test',
      url: '404',
      likes: 2
    })
    await addedBlog.save()
  })

  test('DELETE /api/blogs/:id succeeds', async () => {
    const blogsAtStart = await blogsInDb()

    await api
      .delete(`/api/blogs/${addedBlog._id}`)
      .expect(204)

    const blogsAfterOperation = await blogsInDb()

    const titles = blogsAfterOperation.map(b => b.title)

    expect(titles).not.toContain(addedBlog.title)
    expect(blogsAfterOperation.length).toBe(blogsAtStart.length - 1)
  })
})

describe('updating a blog', async () => {
  let addedBlog

  beforeAll(async () => {
    addedBlog = new Blog({
      title: 'To be updated',
      author: 'test',
      url: '200',
      likes: 2
    })
    await addedBlog.save()
  })

  test('PUT /api/blogs/:id succeeds with valid id', async () => {
    const blogsAtStart = await blogsInDb()

    const updatedBlog = {
      title: 'Update was successful',
      author: 'test',
      url: '200',
      likes: 12
    }

    const response = await api
      .put(`/api/blogs/${addedBlog._id}`)
      .send(updatedBlog)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    const blogsAfterOperation = await blogsInDb()

    const titles = blogsAfterOperation.map(b => b.title)

    expect(response.body.likes).toBe(12)
    expect(titles).not.toContain(addedBlog.title)
    expect(titles).toContain(updatedBlog.title)
    expect(blogsAfterOperation.length).toBe(blogsAtStart.length)
  })

  test('404 is returned by PUT /api/blogs/:id with valid nonexistent id', async () => {
    const blogsAtStart = await blogsInDb()

    const validNonexistingId = await nonExistingId()

    const updatedBlog = {
      title: 'Nonexistent id',
      author: 'test',
      url: '200',
      likes: 12
    }

    await api
      .put(`/api/blogs/${validNonexistingId}`)
      .send(updatedBlog)
      .expect(404)

    const blogsAfterOperation = await blogsInDb()

    const titles = blogsAfterOperation.map(b => b.title)

    expect(titles).not.toContain(updatedBlog.title)
    expect(blogsAfterOperation.length).toBe(blogsAtStart.length)
  })

  test('400 is returned by PUT /api/blogs/:id with invalid id', async () => {
    const blogsAtStart = await blogsInDb()

    const invalidId = '5a3d5da59070081a82a3445'

    const updatedBlog = {
      title: 'Invalid id',
      author: 'test',
      url: '200',
      likes: 12
    }

    await api
      .put(`/api/blogs/${invalidId}`)
      .send(updatedBlog)
      .expect(400)

    const blogsAfterOperation = await blogsInDb()

    const titles = blogsAfterOperation.map(b => b.title)

    expect(titles).not.toContain(updatedBlog.title)
    expect(blogsAfterOperation.length).toBe(blogsAtStart.length)
  })
})

afterAll(() => {
  server.close()
})